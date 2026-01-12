package com.poscl.sales.application.service;

import com.poscl.sales.api.dto.*;
import com.poscl.sales.domain.entity.*;
import com.poscl.sales.domain.repository.*;
import com.poscl.shared.exception.BusinessConflictException;
import com.poscl.shared.exception.DomainException;
import com.poscl.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Servicio de ventas POS
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SaleService {

    private final SaleRepository saleRepository;
    private final CashSessionRepository sessionRepository;
    private final CashRegisterRepository registerRepository;

    /**
     * Crea una venta (idempotente por commandId)
     */
    @Transactional
    public SaleDto createSale(UUID tenantId, UUID userId, CreateSaleRequest request) {
        log.info("Creando venta - commandId: {}, sessionId: {}", request.getCommandId(), request.getSessionId());

        // Verificar idempotencia
        if (saleRepository.existsByCommandId(request.getCommandId())) {
            log.info("Venta ya existe con commandId: {}", request.getCommandId());
            Sale existing = saleRepository.findByCommandId(request.getCommandId())
                    .orElseThrow();
            return toDto(existing);
        }

        // Get or create cash session
        CashSession session = getOrCreateSession(tenantId, userId, request.getSessionId());

        // Generar número de venta
        String numero = generateSaleNumber(tenantId);

        // Crear venta
        Sale sale = Sale.builder()
                .tenantId(tenantId)
                .session(session)
                .commandId(request.getCommandId())
                .numero(numero)
                .customerId(request.getCustomerId())
                .customerNombre(request.getCustomerNombre())
                .descuento(request.getDescuento() != null ? request.getDescuento() : 0)
                .descuentoPorcentaje(request.getDescuentoPorcentaje())
                .estado(Sale.Estado.COMPLETADA)
                .createdBy(userId)
                .build();

        // Agregar items
        for (CreateSaleRequest.SaleItemRequest itemReq : request.getItems()) {
            SaleItem item = SaleItem.builder()
                    .variantId(itemReq.getVariantId())
                    .productSku(itemReq.getProductSku())
                    .productNombre(itemReq.getProductNombre())
                    .cantidad(itemReq.getCantidad())
                    .precioUnitario(itemReq.getPrecioUnitario())
                    .descuento(itemReq.getDescuento() != null ? itemReq.getDescuento() : 0)
                    .impuestoPorcentaje(
                            itemReq.getImpuestoPorcentaje() != null ? itemReq.getImpuestoPorcentaje() : BigDecimal.ZERO)
                    .build();
            item.calculateTotals();
            sale.addItem(item);
        }

        // Agregar pagos
        for (CreateSaleRequest.SalePaymentRequest payReq : request.getPayments()) {
            SalePayment payment = SalePayment.builder()
                    .medio(payReq.getMedio())
                    .monto(payReq.getMonto())
                    .referencia(payReq.getReferencia())
                    .build();
            sale.addPayment(payment);
        }

        // Calcular totales
        sale.calculateTotals();

        // Validar que los pagos cubran el total
        int totalPagos = sale.getPayments().stream()
                .mapToInt(SalePayment::getMonto)
                .sum();

        if (totalPagos < sale.getTotal()) {
            throw new DomainException("INSUFFICIENT_PAYMENT",
                    "El total de pagos (" + totalPagos + ") es menor al total de la venta (" + sale.getTotal() + ")");
        }

        sale = saleRepository.save(sale);
        log.info("Venta creada: {} - Total: ${}", sale.getNumero(), sale.getTotal());

        // TODO: Publicar evento SaleCreated para inventory-service

        return toDto(sale);
    }

    /**
     * Anula una venta
     */
    @Transactional
    public SaleDto cancelSale(UUID tenantId, UUID userId, UUID saleId, String motivo) {
        Sale sale = saleRepository.findByIdAndTenantIdWithDetails(saleId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Venta", saleId));

        if (sale.isCancelled()) {
            throw new BusinessConflictException("ALREADY_CANCELLED", "La venta ya está anulada");
        }

        sale.cancel(userId, motivo);
        sale = saleRepository.save(sale);

        log.info("Venta {} anulada por {}: {}", sale.getNumero(), userId, motivo);

        // TODO: Publicar evento SaleCancelled para revertir stock

        return toDto(sale);
    }

    /**
     * Lista ventas por sesión
     */
    @Transactional(readOnly = true)
    public Page<SaleDto> findBySession(UUID sessionId, Pageable pageable) {
        return saleRepository.findBySessionId(sessionId, pageable)
                .map(this::toDto);
    }

    /**
     * Obtiene una venta por ID
     */
    @Transactional(readOnly = true)
    public SaleDto findById(UUID tenantId, UUID id) {
        Sale sale = saleRepository.findByIdAndTenantIdWithDetails(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Venta", id));
        return toDto(sale);
    }

    /**
     * Genera número de venta único: V-YYYYMMDD-XXXXX
     */
    private String generateSaleNumber(UUID tenantId) {
        String prefix = "V" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        Integer maxNum = saleRepository.findMaxNumeroByPrefix(tenantId, prefix);
        int nextNum = (maxNum != null ? maxNum : 0) + 1;
        return prefix + String.format("%05d", nextNum);
    }

    /**
     * Obtiene o crea una sesión de caja para la venta.
     * Si el sessionId proporcionado es válido, lo usa.
     * Si no, busca una sesión abierta existente o crea una nueva automática.
     */
    private CashSession getOrCreateSession(UUID tenantId, UUID userId, UUID requestedSessionId) {
        // Try to find the requested session if provided
        if (requestedSessionId != null) {
            java.util.Optional<CashSession> existingSession = sessionRepository.findByIdAndTenantId(requestedSessionId,
                    tenantId);
            if (existingSession.isPresent() && existingSession.get().isOpen()) {
                return existingSession.get();
            }
        }

        // Find any open session for this tenant
        java.util.Optional<CashSession> openSession = sessionRepository
                .findFirstByTenantIdAndCierreAtIsNullOrderByAperturaAtDesc(tenantId);
        if (openSession.isPresent()) {
            log.info("Using existing open session: {}", openSession.get().getId());
            return openSession.get();
        }

        // Create a default "POS Auto" session
        log.info("Creating auto cash session for tenant: {}", tenantId);

        // Get or create default cash register
        CashRegister register = registerRepository.findFirstByTenantIdOrderByNombreAsc(tenantId)
                .orElseGet(() -> {
                    CashRegister newRegister = CashRegister.builder()
                            .tenantId(tenantId)
                            .branchId(tenantId) // Use tenantId as default branchId
                            .nombre("POS Principal")
                            .activa(true)
                            .build();
                    return registerRepository.save(newRegister);
                });

        CashSession newSession = CashSession.builder()
                .tenantId(tenantId)
                .register(register)
                .userId(userId)
                .montoInicial(0)
                .build();

        newSession = sessionRepository.save(newSession);
        log.info("Auto cash session created: {}", newSession.getId());

        return newSession;
    }

    // ====== MÉTODOS PARA APROBACIÓN DE VENTAS ======

    /**
     * Obtiene ventas pendientes de aprobación del tenant
     */
    @Transactional(readOnly = true)
    public List<SaleDto> getPendingSales(UUID tenantId) {
        log.info("Obteniendo ventas pendientes para tenant: {}", tenantId);
        return saleRepository.findByTenantIdAndEstado(tenantId, Sale.Estado.PENDIENTE)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Aprueba una venta pendiente (suma a ganancias diarias)
     */
    @Transactional
    public SaleDto approveSale(UUID tenantId, UUID userId, UUID saleId) {
        log.info("Aprobando venta {} por usuario {}", saleId, userId);

        Sale sale = saleRepository.findByIdAndTenantIdWithDetails(saleId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Venta", saleId));

        if (sale.getEstado() != Sale.Estado.PENDIENTE) {
            throw new BusinessConflictException("INVALID_STATE",
                    "Solo se pueden aprobar ventas pendientes. Estado actual: " + sale.getEstado());
        }

        sale.setEstado(Sale.Estado.COMPLETADA);
        sale.setAprobadaAt(java.time.Instant.now());
        sale.setAprobadaPor(userId);
        sale = saleRepository.save(sale);

        log.info("Venta {} aprobada. Total: ${}", sale.getNumero(), sale.getTotal());

        // TODO: Descontar stock
        // TODO: Publicar evento SaleApproved

        return toDto(sale);
    }

    /**
     * Rechaza una venta pendiente
     */
    @Transactional
    public SaleDto rejectSale(UUID tenantId, UUID userId, UUID saleId, String motivo) {
        log.info("Rechazando venta {} por usuario {}: {}", saleId, userId, motivo);

        Sale sale = saleRepository.findByIdAndTenantIdWithDetails(saleId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Venta", saleId));

        if (sale.getEstado() != Sale.Estado.PENDIENTE) {
            throw new BusinessConflictException("INVALID_STATE",
                    "Solo se pueden rechazar ventas pendientes. Estado actual: " + sale.getEstado());
        }

        sale.setEstado(Sale.Estado.ANULADA);
        sale.setAnuladaAt(java.time.Instant.now());
        sale.setAnuladaPor(userId);
        sale.setAnulacionMotivo(motivo);
        sale = saleRepository.save(sale);

        log.info("Venta {} rechazada: {}", sale.getNumero(), motivo);

        return toDto(sale);
    }

    // ====== MÉTODOS PARA ESTADÍSTICAS ======

    /**
     * Obtiene estadísticas de ventas de un día
     */
    @Transactional(readOnly = true)
    public DailyStatsDto getDailyStats(UUID tenantId, LocalDate date) {
        log.info("Obteniendo estadísticas del día {} para tenant {}", date, tenantId);

        // Use Chile timezone for date calculations (the business operates in Chile)
        java.time.ZoneId chileZone = java.time.ZoneId.of("America/Santiago");
        java.time.Instant startOfDay = date.atStartOfDay(chileZone).toInstant();
        java.time.Instant endOfDay = date.plusDays(1).atStartOfDay(chileZone).toInstant();

        log.info("Buscando ventas entre {} y {} (Chile timezone)", startOfDay, endOfDay);

        List<Sale> sales = saleRepository.findByTenantIdAndCreatedAtBetween(tenantId, startOfDay, endOfDay);
        log.info("Encontradas {} ventas para tenant {} en fecha {}", sales.size(), tenantId, date);

        // Calcular estadísticas
        int totalTransacciones = sales.size();
        BigDecimal totalVentas = BigDecimal.ZERO;
        int aprobadas = 0, pendientes = 0, rechazadas = 0, anuladas = 0;
        BigDecimal montoAprobado = BigDecimal.ZERO, montoPendiente = BigDecimal.ZERO;

        for (Sale sale : sales) {
            BigDecimal monto = BigDecimal.valueOf(sale.getTotal());
            totalVentas = totalVentas.add(monto);

            switch (sale.getEstado()) {
                case COMPLETADA:
                    aprobadas++;
                    montoAprobado = montoAprobado.add(monto);
                    break;
                case PENDIENTE:
                    pendientes++;
                    montoPendiente = montoPendiente.add(monto);
                    break;
                case ANULADA:
                    anuladas++;
                    rechazadas++;
                    break;
            }
        }

        BigDecimal ticketPromedio = totalTransacciones > 0
                ? totalVentas.divide(BigDecimal.valueOf(totalTransacciones), 0, java.math.RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Calculate top products
        java.util.Map<String, DailyStatsDto.TopProduct> productMap = new java.util.HashMap<>();
        for (Sale sale : sales) {
            if (sale.getEstado() == Sale.Estado.COMPLETADA) {
                for (SaleItem item : sale.getItems()) {
                    String key = item.getProductNombre();
                    DailyStatsDto.TopProduct existing = productMap.get(key);
                    if (existing == null) {
                        productMap.put(key, DailyStatsDto.TopProduct.builder()
                                .nombre(item.getProductNombre())
                                .sku(item.getProductSku())
                                .cantidad(item.getCantidad())
                                .total(BigDecimal.valueOf(item.getTotal()))
                                .build());
                    } else {
                        existing.setCantidad(existing.getCantidad() + item.getCantidad());
                        existing.setTotal(existing.getTotal().add(BigDecimal.valueOf(item.getTotal())));
                    }
                }
            }
        }

        List<DailyStatsDto.TopProduct> topProductos = productMap.values().stream()
                .sorted((a, b) -> b.getCantidad().compareTo(a.getCantidad()))
                .limit(10)
                .collect(Collectors.toList());

        return DailyStatsDto.builder()
                .fecha(date)
                .totalVentas(totalVentas)
                .totalTransacciones(totalTransacciones)
                .ticketPromedio(ticketPromedio)
                .ventasAprobadas(aprobadas)
                .ventasPendientes(pendientes)
                .ventasRechazadas(rechazadas)
                .ventasAnuladas(anuladas)
                .montoAprobado(montoAprobado)
                .montoPendiente(montoPendiente)
                .topProductos(topProductos)
                .build();
    }

    /**
     * Obtiene estadísticas en un rango de fechas
     */
    @Transactional(readOnly = true)
    public List<DailyStatsDto> getStatsRange(UUID tenantId, LocalDate from, LocalDate to) {
        log.info("Obteniendo estadísticas del {} al {} para tenant {}", from, to, tenantId);

        List<DailyStatsDto> stats = new java.util.ArrayList<>();
        LocalDate current = from;

        while (!current.isAfter(to)) {
            stats.add(getDailyStats(tenantId, current));
            current = current.plusDays(1);
        }

        return stats;
    }

    private SaleDto toDto(Sale sale) {
        List<SaleDto.SaleItemDto> items = sale.getItems().stream()
                .map(i -> SaleDto.SaleItemDto.builder()
                        .id(i.getId())
                        .variantId(i.getVariantId())
                        .productSku(i.getProductSku())
                        .productNombre(i.getProductNombre())
                        .cantidad(i.getCantidad())
                        .precioUnitario(i.getPrecioUnitario())
                        .descuento(i.getDescuento())
                        .impuestoPorcentaje(i.getImpuestoPorcentaje())
                        .impuestoMonto(i.getImpuestoMonto())
                        .subtotal(i.getSubtotal())
                        .total(i.getTotal())
                        .build())
                .collect(Collectors.toList());

        List<SaleDto.SalePaymentDto> payments = sale.getPayments().stream()
                .map(p -> SaleDto.SalePaymentDto.builder()
                        .id(p.getId())
                        .medio(p.getMedio())
                        .monto(p.getMonto())
                        .referencia(p.getReferencia())
                        .build())
                .collect(Collectors.toList());

        return SaleDto.builder()
                .id(sale.getId())
                .commandId(sale.getCommandId())
                .numero(sale.getNumero())
                .sessionId(sale.getSessionId())
                .customerId(sale.getCustomerId())
                .customerNombre(sale.getCustomerNombre())
                .subtotal(sale.getSubtotal())
                .descuento(sale.getDescuento())
                .descuentoPorcentaje(sale.getDescuentoPorcentaje())
                .impuestos(sale.getImpuestos())
                .total(sale.getTotal())
                .estado(sale.getEstado().name())
                .createdAt(sale.getCreatedAt())
                .createdBy(sale.getCreatedBy())
                .anuladaAt(sale.getAnuladaAt())
                .anulacionMotivo(sale.getAnulacionMotivo())
                .items(items)
                .payments(payments)
                .build();
    }
}
