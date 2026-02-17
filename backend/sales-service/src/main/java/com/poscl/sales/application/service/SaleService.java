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
import org.springframework.scheduling.annotation.Scheduled;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestTemplate;
import com.poscl.shared.event.SaleCompletedEvent;

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
    private final RestTemplate restTemplate;

    @Value("${services.billing.url:http://billing-service:8084}")
    private String billingServiceUrl;

    @Value("${services.inventory.url}")
    private String inventoryServiceUrl;

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

        // Generar nÃºmero de venta
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

        // Descontar stock inmediatamente
        // Propagamos la excepción para hacer rollback si falla el inventario
        deductStock(tenantId, userId, sale);

        // Marcar para envío diferido de boleta/factura
        // Por defecto para retail asumimos que todas las ventas completadas requieren
        // boleta
        // A menos que sea "Sin Documento" (que podría modelarse con DteStatus.NONE)
        sale.setDteStatus(Sale.DteStatus.PENDING);
        sale = saleRepository.save(sale); // Update status

        // NO emitimos boleta síncronamente aquí. El Scheduler se encarga.
        log.info("Venta {} guardada. Encolada para facturación (DteStatus=PENDING)", sale.getNumero());

        // TODO: Publicar evento SaleCreated para inventory-service
        publishSaleCompletedEvent(sale);

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
            throw new BusinessConflictException("ALREADY_CANCELLED", "La venta ya estÃ¡ anulada");
        }

        sale.cancel(userId, motivo);
        sale = saleRepository.save(sale);

        log.info("Venta {} anulada por {}: {}", sale.getNumero(), userId, motivo);

        // TODO: Publicar evento SaleCancelled para revertir stock

        return toDto(sale);
    }

    /**
     * Lista ventas por sesiÃ³n
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
     * Lista todas las ventas del tenant (paginado)
     */
    @Transactional(readOnly = true)
    public Page<SaleDto> findAll(UUID tenantId, Pageable pageable) {
        return saleRepository.findByTenantId(tenantId, pageable)
                .map(this::toDto);
    }

    /**
     * Genera nÃºmero de venta Ãºnico: V-YYYYMMDD-00001
     * El contador se reinicia diariamente
     */
    private String generateSaleNumber(UUID tenantId) {
        String prefix = "V-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-";
        String maxNumero = saleRepository.findMaxNumeroByPrefix(tenantId, prefix);

        int nextNum = 1;
        if (maxNumero != null && maxNumero.length() > prefix.length()) {
            try {
                String lastNumStr = maxNumero.substring(prefix.length());
                nextNum = Integer.parseInt(lastNumStr) + 1;
            } catch (NumberFormatException e) {
                log.warn("Could not parse sale number: {}, using 1", maxNumero);
                nextNum = 1;
            }
        }

        return prefix + String.format("%05d", nextNum);
    }

    /**
     * Obtiene o crea una sesiÃ³n de caja para la venta.
     * Si el sessionId proporcionado es un UUID vÃ¡lido, intenta usarlo.
     * Si no, busca una sesiÃ³n abierta existente o crea una nueva automÃ¡tica.
     */
    private CashSession getOrCreateSession(UUID tenantId, UUID userId, String sessionIdStr) {
        // Try to parse sessionId as UUID
        UUID requestedSessionId = null;
        if (sessionIdStr != null && !sessionIdStr.isEmpty()) {
            try {
                requestedSessionId = UUID.fromString(sessionIdStr);
            } catch (IllegalArgumentException e) {
                log.debug("sessionId '{}' is not a valid UUID, will auto-create session", sessionIdStr);
            }
        }

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

    // ====== MÃ‰TODOS PARA APROBACIÃ“N DE VENTAS ======

    /**
     * Obtiene ventas pendientes de aprobaciÃ³n del tenant
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

        // Descontar stock
        deductStock(tenantId, userId, sale);

        sale.setEstado(Sale.Estado.COMPLETADA);
        sale.setAprobadaAt(java.time.Instant.now());
        sale.setAprobadaPor(userId);
        sale = saleRepository.save(sale);

        log.info("Venta {} aprobada. Total: ${}", sale.getNumero(), sale.getTotal());

        // Emitir Boleta ElectrÃ³nica (IntegraciÃ³n Billing)
        try {
            emitirBoleta(tenantId, userId, sale);
        } catch (Exception e) {
            log.error("Failed to emit DTE for sale {}: {}", sale.getNumero(), e.getMessage());
        }

        return toDto(sale);
    }

    // ====== INTEGRACIÃ“N INVENTARIO & BILLING ======

    private void deductStock(UUID tenantId, UUID userId, Sale sale) {
        if (sale.getItems() == null || sale.getItems().isEmpty())
            return;

        // Assuming all items come from the session's register branch
        UUID branchId = sale.getSession().getRegister().getBranchId();

        List<Map<String, Object>> adjustments = new ArrayList<>();

        for (SaleItem item : sale.getItems()) {
            Map<String, Object> req = new HashMap<>();
            req.put("variantId", item.getVariantId());
            req.put("branchId", branchId);
            req.put("tipo", "SALIDA"); // Using String matching enum name
            req.put("cantidad", item.getCantidad().intValue());
            req.put("motivo", "Venta " + sale.getNumero());
            req.put("documentoReferencia", sale.getNumero());
            adjustments.add(req);
        }

        try {
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
            headers.set("X-Tenant-Id", tenantId.toString());
            headers.set("X-User-Id", userId.toString());

            org.springframework.http.HttpEntity<List<Map<String, Object>>> request = new org.springframework.http.HttpEntity<>(
                    adjustments, headers);

            // Use service discovery name if possible, otherwise rely on k8s/docker dns
            restTemplate.postForObject(inventoryServiceUrl + "/api/stock/adjust/batch", request, Object.class);
            log.info("Stock descontado para venta {}", sale.getNumero());

        } catch (Exception e) {
            log.error("Error al descontar stock para venta {}: {}", sale.getNumero(), e.getMessage());
            throw new BusinessConflictException("INVENTORY_ERROR",
                    "No se pudo actualizar el inventario: " + e.getMessage());
        }
    }

    private void emitirBoleta(UUID tenantId, UUID userId, Sale sale) {
        log.info("Iniciando emisiÃ³n automÃ¡tica de boleta para venta {}", sale.getNumero());

        try {
            // Construir payload
            Map<String, Object> request = new HashMap<>();

            // Receptor (Cliente o GenÃ©rico)
            if (sale.getCustomerId() != null) {
                // TODO: Obtener datos reales cliente si es necesario
                // Por ahora usamos datos bÃ¡sicos si no tenemos el objeto cliente completo
                request.put("receptorRut", "66.666.666-6");
                request.put("receptorRazonSocial",
                        sale.getCustomerNombre() != null ? sale.getCustomerNombre() : "Cliente Ocasional");
            } else {
                request.put("receptorRut", "66.666.666-6");
                request.put("receptorRazonSocial", "Cliente Ocasional");
            }
            request.put("receptorDireccion", "Sin Direccion");
            request.put("receptorComuna", "Santiago");
            request.put("receptorCiudad", "Santiago");

            // Items
            List<Map<String, Object>> items = new ArrayList<>();
            for (SaleItem item : sale.getItems()) {
                Map<String, Object> itemMap = new HashMap<>();
                itemMap.put("codigo", item.getProductSku());
                itemMap.put("nombreItem", item.getProductNombre());
                itemMap.put("cantidad", item.getCantidad());
                itemMap.put("precioUnitario", item.getPrecioUnitario());
                if (item.getDescuento() > 0) {
                    itemMap.put("descuentoMonto", item.getDescuento());
                }
                // Boleta siempre es afecta (exento=false) por defecto en retail simple, salvo
                // items especÃ­ficos
                // Aqui asumimos que si impuesto_porcentaje es 0, es exento
                itemMap.put("exento", item.getImpuestoPorcentaje().compareTo(BigDecimal.ZERO) == 0);

                items.add(itemMap);
            }
            request.put("items", items);

            // Referencia a venta POS
            request.put("ventaId", sale.getId());
            request.put("tipoDte", "BOLETA_ELECTRONICA"); // Enum name mapping

            // Llamada HTTP
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
            headers.set("X-Tenant-Id", tenantId.toString());
            headers.set("X-User-Id", userId != null ? userId.toString() : null);
            UUID branchId = sale.getSession().getRegister().getBranchId();
            headers.set("X-Branch-Id", branchId != null ? branchId.toString() : tenantId.toString());

            org.springframework.http.HttpEntity<Map<String, Object>> entity = new org.springframework.http.HttpEntity<>(
                    request, headers);

            String url = billingServiceUrl + "/api/billing/dte/boleta";
            restTemplate.postForObject(url, entity, Object.class);

            log.info("Boleta emitida exitosamente para venta {}", sale.getNumero());

        } catch (Exception e) {
            log.error("Error emitiendo boleta para venta {}: {}", sale.getNumero(), e.getMessage());
            // No propagamos la excepciÃ³n para no romper la venta, ya que es un proceso
            // post-venta
        }
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

    // ====== MÃ‰TODOS PARA ESTADÃSTICAS ======

    /**
     * Obtiene estadÃ­sticas de ventas de un dÃ­a
     */
    @Transactional(readOnly = true)
    public DailyStatsDto getDailyStats(UUID tenantId, LocalDate date) {
        log.info("Obteniendo estadÃ­sticas del dÃ­a {} para tenant {}", date, tenantId);

        // Use Chile timezone for date calculations (the business operates in Chile)
        java.time.ZoneId chileZone = java.time.ZoneId.of("America/Santiago");
        java.time.Instant startOfDay = date.atStartOfDay(chileZone).toInstant();
        java.time.Instant endOfDay = date.plusDays(1).atStartOfDay(chileZone).toInstant();

        log.info("Buscando ventas entre {} y {} (Chile timezone)", startOfDay, endOfDay);

        List<Sale> sales = saleRepository.findByTenantIdAndCreatedAtBetween(tenantId, startOfDay, endOfDay);
        log.info("Encontradas {} ventas para tenant {} en fecha {}", sales.size(), tenantId, date);

        // Calcular estadÃ­sticas
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

        // Initialize Hourly Map
        Map<Integer, DailyStatsDto.HourlyStat> hourlyMap = new HashMap<>();
        for (int i = 0; i < 24; i++) {
            hourlyMap.put(i, DailyStatsDto.HourlyStat.builder()
                    .hora(i)
                    .horaLabel(String.format("%02d:00", i))
                    .transacciones(0)
                    .total(BigDecimal.ZERO)
                    .build());
        }

        // Initialize Payment & Branch Maps
        Map<String, DailyStatsDto.PaymentMethodStat> paymentMap = new HashMap<>();
        Map<UUID, DailyStatsDto.BranchStat> branchMap = new HashMap<>();

        for (Sale sale : sales) {
            BigDecimal monto = BigDecimal.valueOf(sale.getTotal());

            // Hourly Stats (All sales)
            if (sale.getCreatedAt() != null) {
                int hour = sale.getCreatedAt().atZone(chileZone).getHour();
                DailyStatsDto.HourlyStat hStat = hourlyMap.get(hour);
                if (hStat != null) {
                    hStat.setTransacciones(hStat.getTransacciones() + 1);
                    hStat.setTotal(hStat.getTotal().add(monto));
                }
            }

            if (sale.getEstado() == Sale.Estado.COMPLETADA) {
                // Payment Method Stats
                for (SalePayment payment : sale.getPayments()) {
                    String medio = payment.getMedio() != null ? payment.getMedio() : "OTROS";
                    DailyStatsDto.PaymentMethodStat pStat = paymentMap.computeIfAbsent(medio,
                            k -> DailyStatsDto.PaymentMethodStat.builder()
                                    .metodoPago(k)
                                    .transacciones(0)
                                    .total(BigDecimal.ZERO)
                                    .porcentaje(BigDecimal.ZERO)
                                    .build());
                    pStat.setTransacciones(pStat.getTransacciones() + 1);
                    pStat.setTotal(pStat.getTotal().add(BigDecimal.valueOf(payment.getMonto())));
                }

                // Branch Stats
                if (sale.getSession() != null && sale.getSession().getRegister() != null) {
                    UUID branchId = sale.getSession().getRegister().getBranchId();
                    DailyStatsDto.BranchStat bStat = branchMap.computeIfAbsent(branchId,
                            k -> DailyStatsDto.BranchStat.builder()
                                    .sucursalId(k)
                                    .sucursalNombre("Sucursal") // Placeholder as we don't have name here
                                    .transacciones(0)
                                    .ventas(BigDecimal.ZERO)
                                    .porcentaje(BigDecimal.ZERO)
                                    .build());
                    bStat.setTransacciones(bStat.getTransacciones() + 1);
                    bStat.setVentas(bStat.getVentas().add(monto));
                }
            }
        }

        // Finalize lists and percentages
        List<DailyStatsDto.HourlyStat> ventasPorHora = new ArrayList<>(hourlyMap.values());
        ventasPorHora.sort(Comparator.comparingInt(DailyStatsDto.HourlyStat::getHora));

        List<DailyStatsDto.PaymentMethodStat> ventasPorMetodoPago = new ArrayList<>(paymentMap.values());
        if (totalVentas.compareTo(BigDecimal.ZERO) > 0) {
            for (DailyStatsDto.PaymentMethodStat p : ventasPorMetodoPago) {
                p.setPorcentaje(p.getTotal().multiply(BigDecimal.valueOf(100)).divide(totalVentas, 1,
                        java.math.RoundingMode.HALF_UP));
            }
        }

        List<DailyStatsDto.BranchStat> ventasPorSucursal = new ArrayList<>(branchMap.values());
        if (totalVentas.compareTo(BigDecimal.ZERO) > 0) {
            for (DailyStatsDto.BranchStat b : ventasPorSucursal) {
                b.setPorcentaje(b.getVentas().multiply(BigDecimal.valueOf(100)).divide(totalVentas, 1,
                        java.math.RoundingMode.HALF_UP));
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
                                .cantidad(item.getCantidad().intValue())
                                .total(BigDecimal.valueOf(item.getTotal()))
                                .build());
                    } else {
                        existing.setCantidad(existing.getCantidad() + item.getCantidad().intValue());
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
                .ventasPorHora(ventasPorHora)
                .ventasPorMetodoPago(ventasPorMetodoPago)
                .ventasPorSucursal(ventasPorSucursal)
                .build();
    }

    /**
     * Obtiene estadÃ­sticas en un rango de fechas
     */
    @Transactional(readOnly = true)
    public List<DailyStatsDto> getStatsRange(UUID tenantId, LocalDate from, LocalDate to) {
        log.info("Obteniendo estadÃ­sticas del {} al {} para tenant {}", from, to, tenantId);

        List<DailyStatsDto> stats = new java.util.ArrayList<>();
        LocalDate current = from;

        while (!current.isAfter(to)) {
            stats.add(getDailyStats(tenantId, current));
            current = current.plusDays(1);
        }

        return stats;
    }

    // ====== SCHEDULER (Batch Billing) ======

    /**
     * Procesa ventas pendientes de facturación cada 30 segundos (para pruebas) o 5
     * mins.
     * Usamos 30s para que usuario vea resultado rápido, luego se puede subir a 5m.
     */
    // Cache simple para configuración (TenantID -> {timestamp, interval})
    private final Map<UUID, TenantConfigCache> configCache = new java.util.concurrent.ConcurrentHashMap<>();

    private record TenantConfigCache(long timestamp, int intervalSeconds) {
    }

    @Scheduled(fixedDelay = 30000) // Run frequently to check buffers
    @Transactional
    public void processPendingDtes() {
        // 1. Process new pending sales
        processDteBatch(Sale.DteStatus.PENDING);

        // 2. Retry failed sales (Dead Letter Queue recovery)
        processDteBatch(Sale.DteStatus.ERROR);
    }

    private void processDteBatch(Sale.DteStatus status) {
        List<Sale> batch = saleRepository.findTop50ByDteStatus(status, Pageable.ofSize(50));

        if (!batch.isEmpty()) {
            log.debug("Scheduler: Processing {} sales with status {}...", batch.size(), status);

            for (Sale sale : batch) {
                try {
                    UUID tenantId = sale.getTenantId();

                    // Check batching interval (only for new PENDING ones to respect buffer)
                    if (status == Sale.DteStatus.PENDING) {
                        int interval = getTenantInterval(tenantId);
                        if (sale.getCreatedAt().plusSeconds(interval).isAfter(java.time.Instant.now())) {
                            continue;
                        }
                    }

                    UUID userId = sale.getCreatedBy();
                    log.info("Processing DTE for sale {} (Retry: {})", sale.getNumero(),
                            status == Sale.DteStatus.ERROR);

                    emitirBoleta(tenantId, userId, sale);

                    sale.setDteStatus(Sale.DteStatus.SENT);
                    sale.setDteError(null);
                    saleRepository.save(sale);

                } catch (Exception e) {
                    log.error("Error processing DTE for sale {}: {}", sale.getNumero(), e.getMessage());
                    sale.setDteStatus(Sale.DteStatus.ERROR);
                    sale.setDteError(e.getMessage());
                    saleRepository.save(sale);
                }
            }
        }
    }

    private int getTenantInterval(UUID tenantId) {
        long now = System.currentTimeMillis();
        TenantConfigCache cached = configCache.get(tenantId);

        // Refresh cache every 2 minutes
        if (cached == null || (now - cached.timestamp) > 120000) {
            try {
                org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
                org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
                headers.set("X-Tenant-Id", tenantId.toString());

                org.springframework.http.HttpEntity<Void> entity = new org.springframework.http.HttpEntity<>(headers);
                String url = billingServiceUrl + "/api/billing/config";

                // Need a DTO or just Map. Using Map to avoid coupling.
                Map resp = restTemplate.exchange(url, org.springframework.http.HttpMethod.GET, entity, Map.class)
                        .getBody();

                int interval = 60;
                if (resp != null && resp.get("dteProcessingIntervalSeconds") != null) {
                    interval = (Integer) resp.get("dteProcessingIntervalSeconds");
                }

                configCache.put(tenantId, new TenantConfigCache(now, interval));
                return interval;

            } catch (Exception e) {
                log.warn("Could not fetch billing config for tenant {}, using default 60s. Error: {}", tenantId,
                        e.getMessage());
                return 60; // Default fallback
            }
        }

        return cached.intervalSeconds();
    }

    public void processPendingDtesForTenant(UUID tenantId) {
        List<Sale> pending = saleRepository.findByTenantIdAndDteStatus(tenantId, Sale.DteStatus.PENDING);
        if (pending.isEmpty())
            return;

        log.info("Procesando {} ventas pendientes para tenant {}", pending.size(), tenantId);

        for (Sale sale : pending) {
            try {
                emitirBoleta(tenantId, sale.getCreatedBy(), sale);
                // Si emitirBoleta no lanza excepcion, asumimos éxito (o al menos enviado)
                // emitirBoleta usa RestTemplate simple. Si falla, cae al catch.

                sale.setDteStatus(Sale.DteStatus.SENT);
                sale.setDteError(null);
            } catch (Exception e) {
                log.error("Error batch DTE venta {}: {}", sale.getNumero(), e.getMessage());
                sale.setDteStatus(Sale.DteStatus.ERROR);
                sale.setDteError(e.getMessage());
            }
            saleRepository.save(sale);
        }
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
                .tenantId(sale.getTenantId())
                .numero(sale.getNumero())
                .sessionId(sale.getSession() != null ? sale.getSession().getId() : null)
                .commandId(sale.getCommandId())
                .customerId(sale.getCustomerId())
                .customerNombre(sale.getCustomerNombre())
                .estado(sale.getEstado())
                .updatedAt(sale.getUpdatedAt())
                .items(items)
                .payments(payments)
                .subtotal(sale.getSubtotal())
                .descuento(sale.getDescuento())
                .descuentoPorcentaje(sale.getDescuentoPorcentaje())
                .impuestoTotal(sale.getImpuestoTotal())
                .total(sale.getTotal())
                .build();
    }

    @Value("${services.marketing.url:}")
    private String marketingServiceUrl;

    private void publishSaleCompletedEvent(Sale sale) {
        if (marketingServiceUrl == null || marketingServiceUrl.isBlank()) {
            log.debug("Marketing service URL no configurada, omitiendo notificación");
            return;
        }
        // Fire-and-forget: no bloqueamos la venta
        new Thread(() -> {
            try {
                SaleCompletedEvent event = SaleCompletedEvent.builder()
                        .saleId(sale.getId())
                        .tenantId(sale.getTenantId())
                        .customerId(sale.getCustomerId())
                        .totalAmount(BigDecimal.valueOf(sale.getTotal()))
                        .timestamp(java.time.Instant.now())
                        .items(sale.getItems().stream().map(i -> SaleCompletedEvent.SaleItemEventDto.builder()
                                .productId(i.getVariantId())
                                .productSku(i.getProductSku())
                                .quantity(i.getCantidad() != null ? i.getCantidad().intValue() : 0)
                                .unitPrice(i.getPrecioUnitario() != null ? i.getPrecioUnitario() : BigDecimal.ZERO)
                                .total(i.getTotal() != null ? BigDecimal.valueOf(i.getTotal()) : BigDecimal.ZERO)
                                .build()).collect(Collectors.toList()))
                        .build();

                restTemplate.postForEntity(marketingServiceUrl + "/api/loyalty/sale-completed", event, Void.class);
                log.info("Notificación de venta enviada a marketing-service para venta {}", sale.getNumero());
            } catch (Exception e) {
                log.warn("No se pudo notificar a marketing-service para venta {}: {}", sale.getNumero(),
                        e.getMessage());
            }
        }).start();
    }
}
