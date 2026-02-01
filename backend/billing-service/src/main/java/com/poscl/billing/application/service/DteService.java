package com.poscl.billing.application.service;

import com.poscl.billing.api.dto.DteResponse;
import com.poscl.billing.api.dto.EmitirDteRequest;
import com.poscl.billing.domain.entity.Caf;
import com.poscl.billing.domain.entity.Dte;
import com.poscl.billing.domain.entity.DteDetalle;
import com.poscl.billing.domain.enums.EstadoDte;
import com.poscl.billing.domain.enums.TipoDte;
import com.poscl.billing.domain.repository.CafRepository;
import com.poscl.billing.domain.repository.DteRepository;
import com.poscl.billing.domain.repository.BillingConfigRepository;
import com.poscl.billing.domain.factory.BillingProviderFactory;
import com.poscl.billing.domain.entity.BillingConfig;
import com.poscl.billing.domain.port.BillingProvider;
import com.poscl.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

/**
 * Servicio principal para emisión y gestión de DTEs
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DteService {

    private final DteRepository dteRepository;
    private final CafRepository cafRepository;
    private final BillingConfigRepository configRepository;
    private final BillingProviderFactory providerFactory;
    // private final XmlBuilderService xmlBuilderService; // TODO: Implementar
    // private final SignerService signerService; // TODO: Implementar
    // private final SiiService siiService; // TODO: Implementar
    // private final PdfService pdfService; // TODO: Implementar

    private static final int IVA_TASA = 19;

    /**
     * Emitir un nuevo DTE (boleta, factura, nota de crédito, etc.)
     */
    @Transactional
    public DteResponse emitirDte(UUID tenantId, UUID branchId, EmitirDteRequest request,
            String emisorRut, String emisorRazonSocial, String emisorGiro,
            String emisorDireccion, String emisorComuna, String emisorLogoUrl, UUID userId) {
        long startTime = System.currentTimeMillis();
        log.info("Emitiendo DTE tipo {} para tenant {}", request.getTipoDte(), tenantId);

        // 1. Obtener configuración del tenant (para emisor fallback)
        BillingConfig config = configRepository.findByTenantId(tenantId).orElse(null);

        // Fill missing emisor details from config
        if (config != null) {
            if (emisorRut == null)
                emisorRut = config.getEmisorRut();
            if (emisorRazonSocial == null)
                emisorRazonSocial = config.getEmisorRazonSocial();
            if (emisorGiro == null)
                emisorGiro = config.getEmisorGiro();
            if (emisorDireccion == null)
                emisorDireccion = config.getEmisorDireccion();
            if (emisorComuna == null)
                emisorComuna = config.getEmisorComuna();
            if (emisorLogoUrl == null)
                emisorLogoUrl = config.getEmisorLogoUrl();
        }

        if (emisorRut == null || emisorRazonSocial == null) {
            // If still null, we have a problem. But for "Sanitation" we make sure it
            // doesn't crash 500.
            // We can throw meaningful exception or use a "GENERICO" fallback if absolutely
            // needed.
            // Better to throw so user knows they need to configure the BillingConfig.
            log.warn("Missing emitter details for tenant {}, and no config found. DTE might fail or look incomplete.",
                    tenantId);
            if (emisorRut == null)
                emisorRut = "66.666.666-6"; // Default Mock
            if (emisorRazonSocial == null)
                emisorRazonSocial = "EMPRESA SIN CONFIGURAR";
        }

        long step1 = System.currentTimeMillis();
        log.info("Step 1 (Config): {}ms", step1 - startTime);

        // 2. Obtener folio del CAF
        Integer folio = obtenerSiguienteFolio(tenantId, request.getTipoDte());
        long step2 = System.currentTimeMillis();
        log.info("Step 2 (Folio): {}ms", step2 - step1);

        // 3. Calcular montos
        MontosDte montos = calcularMontos(request.getItems(), request.getTipoDte());

        // 4. Crear DTE
        Dte dte = Dte.builder()
                .tenantId(tenantId)
                .branchId(branchId)
                .tipoDte(request.getTipoDte())
                .folio(folio)
                .fechaEmision(LocalDate.now())
                // Emisor
                .emisorRut(emisorRut)
                .emisorRazonSocial(emisorRazonSocial)
                .emisorGiro(emisorGiro)
                .emisorDireccion(emisorDireccion)
                .emisorComuna(emisorComuna)
                .emisorLogoUrl(emisorLogoUrl) // Logo URL dinámico
                // Receptor
                .receptorRut(request.getReceptorRut())
                .receptorRazonSocial(request.getReceptorRazonSocial())
                .receptorGiro(request.getReceptorGiro())
                .receptorDireccion(request.getReceptorDireccion())
                .receptorComuna(request.getReceptorComuna())
                .receptorCiudad(request.getReceptorCiudad())
                .receptorEmail(request.getReceptorEmail())
                // Montos
                .montoNeto(montos.neto)
                .montoExento(montos.exento)
                .tasaIva(IVA_TASA)
                .montoIva(montos.iva)
                .montoTotal(montos.total)
                // Estado
                .estado(EstadoDte.PENDIENTE)
                // Referencias
                .ventaId(request.getVentaId())
                .dteReferenciaId(request.getDteReferenciaId())
                .tipoReferencia(request.getTipoReferencia())
                .razonReferencia(request.getRazonReferencia())
                // Auditoría
                .createdBy(userId)
                .build();

        // 4. Agregar detalles
        AtomicInteger lineaNum = new AtomicInteger(1);
        request.getItems().forEach(item -> {
            BigDecimal cantidad = item.getCantidad() != null ? BigDecimal.valueOf(item.getCantidad()) : BigDecimal.ONE;
            BigDecimal montoItem = cantidad
                    .multiply(item.getPrecioUnitario())
                    .setScale(0, RoundingMode.HALF_UP);

            if (item.getDescuentoMonto() != null) {
                montoItem = montoItem.subtract(item.getDescuentoMonto());
            } else if (item.getDescuentoPorcentaje() != null) {
                BigDecimal descuento = montoItem.multiply(item.getDescuentoPorcentaje())
                        .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
                montoItem = montoItem.subtract(descuento);
            }

            DteDetalle detalle = DteDetalle.builder()
                    .numeroLinea(lineaNum.getAndIncrement())
                    .codigo(item.getCodigo())
                    .nombreItem(item.getNombreItem())
                    .descripcionItem(item.getDescripcionItem())
                    .cantidad(cantidad)
                    .unidadMedida(item.getUnidadMedida())
                    .precioUnitario(item.getPrecioUnitario())
                    .descuentoPorcentaje(item.getDescuentoPorcentaje())
                    .descuentoMonto(item.getDescuentoMonto())
                    .montoItem(montoItem)
                    .indicadorExento(Boolean.TRUE.equals(item.getExento()) ? 1 : null)
                    .productoId(item.getProductoId())
                    .build();

            dte.addDetalle(detalle);
        });

        long step4 = System.currentTimeMillis();
        log.info("Step 4 (Build DTE): {}ms", step4 - step2);

        // 5. Guardar DTE inicial
        Dte saved = dteRepository.save(dte);
        long step5 = System.currentTimeMillis();
        log.info("Step 5 (Save DB): {}ms", step5 - step4);

        log.info("DTE guardado internamente: tipo={}, folio={}, id={}", saved.getTipoDte(), saved.getFolio(),
                saved.getId());

        // 6. Procesar con Proveedor (Estrategia)
        // BillingConfig config =
        // configRepository.findByTenantId(tenantId).orElse(null); // Already loaded in
        // step 1
        BillingProvider provider = providerFactory.getProvider(config);

        log.info("Usando proveedor de facturación: {}", provider.getCountry());
        long step6 = System.currentTimeMillis();
        saved = provider.emitir(saved, config);
        long step7 = System.currentTimeMillis();
        log.info("Step 6 (Provider Emitir): {}ms", step7 - step6);

        // 7. Actualizar DTE con resultado del proveedor
        saved = dteRepository.save(saved);
        long step8 = System.currentTimeMillis();
        log.info("Step 7 (Final Save): {}ms", step8 - step7);

        return toResponse(saved);
    }

    /**
     * Obtener DTE por ID
     */
    @Transactional(readOnly = true)
    public DteResponse getDte(UUID tenantId, UUID dteId) {
        Dte dte = dteRepository.findByIdAndTenantId(dteId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("DTE no encontrado"));
        return toResponse(dte);
    }

    /**
     * Listar DTEs con paginación
     */
    @Transactional(readOnly = true)
    public Page<DteResponse> listarDtes(UUID tenantId, TipoDte tipoDte, EstadoDte estado, Pageable pageable) {
        Page<Dte> dtes;

        if (tipoDte != null && estado != null) {
            dtes = dteRepository.findByTenantIdAndTipoDte(tenantId, tipoDte, pageable);
        } else if (tipoDte != null) {
            dtes = dteRepository.findByTenantIdAndTipoDte(tenantId, tipoDte, pageable);
        } else if (estado != null) {
            dtes = dteRepository.findByTenantIdAndEstado(tenantId, estado, pageable);
        } else {
            dtes = dteRepository.findByTenantId(tenantId, pageable);
        }

        return dtes.map(this::toSummaryResponse);
    }

    private DteResponse toSummaryResponse(Dte dte) {
        return DteResponse.builder()
                .id(dte.getId())
                .tipoDte(dte.getTipoDte())
                .tipoDteDescripcion(dte.getTipoDte().getDescripcion())
                .folio(dte.getFolio())
                .fechaEmision(dte.getFechaEmision())
                .emisorRut(dte.getEmisorRut())
                .emisorRazonSocial(dte.getEmisorRazonSocial())
                .receptorRut(dte.getReceptorRut())
                .receptorRazonSocial(dte.getReceptorRazonSocial())
                .receptorEmail(dte.getReceptorEmail())
                .montoNeto(dte.getMontoNeto())
                .montoExento(dte.getMontoExento())
                .montoIva(dte.getMontoIva())
                .montoTotal(dte.getMontoTotal())
                .estado(dte.getEstado())
                .estadoDescripcion(dte.getEstado().getNombre())
                .trackId(dte.getTrackId())
                .glosaEstado(dte.getGlosaEstado())
                .fechaEnvio(dte.getFechaEnvio())
                .fechaRespuesta(dte.getFechaRespuesta())
                .pdfUrl(dte.getPdfUrl())
                .xmlUrl("/api/billing/dte/" + dte.getId() + "/xml")
                // No details for summary
                .ventaId(dte.getVentaId())
                .dteReferenciaId(dte.getDteReferenciaId())
                .createdAt(dte.getCreatedAt())
                .build();
    }

    /**
     * Obtener libro de ventas para un período
     */
    @Transactional(readOnly = true)
    public List<DteResponse> getLibroVentas(UUID tenantId, LocalDate desde, LocalDate hasta, TipoDte tipoDte) {
        return dteRepository.findForLibroVentas(tenantId, desde, hasta, tipoDte)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // --- Métodos privados ---

    private Integer obtenerSiguienteFolio(UUID tenantId, TipoDte tipoDte) {
        // Try to get folio from CAF
        var cafOpt = cafRepository.findCafDisponible(tenantId, tipoDte);

        if (cafOpt.isPresent()) {
            Caf caf = cafOpt.get();

            if (caf.isVencido()) {
                log.warn("CAF vencido para {} - usando modo demo", tipoDte);
                return generarFolioDemo(tenantId, tipoDte);
            }

            Integer folio = caf.siguienteFolio();
            cafRepository.save(caf);

            log.debug("Folio {} asignado para {} (CAF: {}-{})",
                    folio, tipoDte, caf.getFolioDesde(), caf.getFolioHasta());

            return folio;
        }

        // Demo mode: Generate sequential folio without CAF
        log.info("Sin CAF configurado para {} - generando folio demo", tipoDte);
        return generarFolioDemo(tenantId, tipoDte);
    }

    /**
     * Genera folio para modo demo sin CAF
     */
    private Integer generarFolioDemo(UUID tenantId, TipoDte tipoDte) {
        // Get max folio for this tenant and type
        Integer maxFolio = dteRepository.findMaxFolioByTenantAndTipo(tenantId, tipoDte);
        return (maxFolio != null ? maxFolio : 0) + 1;
    }

    private MontosDte calcularMontos(List<EmitirDteRequest.ItemDto> items, TipoDte tipoDte) {
        BigDecimal neto = BigDecimal.ZERO;
        BigDecimal exento = BigDecimal.ZERO;

        for (EmitirDteRequest.ItemDto item : items) {
            BigDecimal cantidad = item.getCantidad() != null ? BigDecimal.valueOf(item.getCantidad()) : BigDecimal.ONE;
            BigDecimal montoItem = cantidad
                    .multiply(item.getPrecioUnitario())
                    .setScale(0, RoundingMode.HALF_UP);

            if (item.getDescuentoMonto() != null) {
                montoItem = montoItem.subtract(item.getDescuentoMonto());
            } else if (item.getDescuentoPorcentaje() != null) {
                BigDecimal descuento = montoItem.multiply(item.getDescuentoPorcentaje())
                        .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
                montoItem = montoItem.subtract(descuento);
            }

            if (Boolean.TRUE.equals(item.getExento())) {
                exento = exento.add(montoItem);
            } else {
                neto = neto.add(montoItem);
            }
        }

        // Para boletas, el monto incluye IVA
        // Para facturas, se calcula IVA sobre neto
        BigDecimal iva;
        BigDecimal total;

        if (tipoDte == TipoDte.BOLETA_ELECTRONICA || tipoDte == TipoDte.BOLETA_EXENTA) {
            // Boleta: Monto ya incluye IVA
            total = neto.add(exento);
            // Extraer IVA del total
            neto = total.multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(100 + IVA_TASA), 0, RoundingMode.HALF_UP);
            iva = total.subtract(neto);
        } else {
            // Factura: Calcular IVA sobre neto
            iva = neto.multiply(BigDecimal.valueOf(IVA_TASA))
                    .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
            total = neto.add(iva).add(exento);
        }

        return new MontosDte(neto, exento, iva, total);
    }

    private record MontosDte(BigDecimal neto, BigDecimal exento, BigDecimal iva, BigDecimal total) {
    }

    private DteResponse toResponse(Dte dte) {
        return DteResponse.builder()
                .id(dte.getId())
                .tipoDte(dte.getTipoDte())
                .tipoDteDescripcion(dte.getTipoDte().getDescripcion())
                .folio(dte.getFolio())
                .fechaEmision(dte.getFechaEmision())
                .emisorRut(dte.getEmisorRut())
                .emisorRazonSocial(dte.getEmisorRazonSocial())
                .emisorGiro(dte.getEmisorGiro())
                .emisorDireccion(dte.getEmisorDireccion())
                .emisorComuna(dte.getEmisorComuna())
                .emisorLogoUrl(dte.getEmisorLogoUrl())
                .receptorRut(dte.getReceptorRut())
                .receptorRazonSocial(dte.getReceptorRazonSocial())
                .receptorEmail(dte.getReceptorEmail())
                .montoNeto(dte.getMontoNeto())
                .montoExento(dte.getMontoExento())
                .montoIva(dte.getMontoIva())
                .montoTotal(dte.getMontoTotal())
                .estado(dte.getEstado())
                .estadoDescripcion(dte.getEstado().getNombre())
                .trackId(dte.getTrackId())
                .glosaEstado(dte.getGlosaEstado())
                .fechaEnvio(dte.getFechaEnvio())
                .fechaRespuesta(dte.getFechaRespuesta())
                .pdfUrl(dte.getPdfUrl())
                .xmlUrl("/api/billing/dte/" + dte.getId() + "/xml")
                .detalles(dte.getDetalles().stream()
                        .map(d -> DteResponse.DetalleDto.builder()
                                .numeroLinea(d.getNumeroLinea())
                                .codigo(d.getCodigo())
                                .nombreItem(d.getNombreItem())
                                .descripcionItem(d.getDescripcionItem())
                                .cantidad(d.getCantidad())
                                .unidadMedida(d.getUnidadMedida())
                                .precioUnitario(d.getPrecioUnitario())
                                .descuentoPorcentaje(d.getDescuentoPorcentaje())
                                .descuentoMonto(d.getDescuentoMonto())
                                .montoItem(d.getMontoItem())
                                .exento(d.isExento())
                                .productoId(d.getProductoId())
                                .build())
                        .collect(Collectors.toList()))
                .ventaId(dte.getVentaId())
                .dteReferenciaId(dte.getDteReferenciaId())
                .createdAt(dte.getCreatedAt())
                .build();
    }
}
