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
import com.poscl.shared.exception.BusinessConflictException;
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
    // private final XmlBuilderService xmlBuilderService;  // TODO: Implementar
    // private final SignerService signerService;           // TODO: Implementar
    // private final SiiService siiService;                 // TODO: Implementar
    // private final PdfService pdfService;                 // TODO: Implementar

    private static final int IVA_TASA = 19;

    /**
     * Emitir un nuevo DTE (boleta, factura, nota de crédito, etc.)
     */
    @Transactional
    public DteResponse emitirDte(UUID tenantId, UUID branchId, EmitirDteRequest request, 
                                  String emisorRut, String emisorRazonSocial, String emisorGiro,
                                  String emisorDireccion, String emisorComuna, UUID userId) {
        log.info("Emitiendo DTE tipo {} para tenant {}", request.getTipoDte(), tenantId);

        // 1. Obtener folio del CAF
        Integer folio = obtenerSiguienteFolio(tenantId, request.getTipoDte());

        // 2. Calcular montos
        MontosDte montos = calcularMontos(request.getItems(), request.getTipoDte());

        // 3. Crear DTE
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
            BigDecimal montoItem = item.getCantidad()
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
                    .cantidad(item.getCantidad())
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

        // 5. Guardar DTE
        Dte saved = dteRepository.save(dte);
        log.info("DTE creado: tipo={}, folio={}, id={}", saved.getTipoDte(), saved.getFolio(), saved.getId());

        // TODO: 6. Generar XML
        // String xml = xmlBuilderService.buildDte(saved);
        // saved.setXmlContent(xml);

        // TODO: 7. Firmar XML
        // String xmlFirmado = signerService.sign(xml, tenantId);
        // saved.setXmlFirmado(xmlFirmado);

        // TODO: 8. Generar PDF con timbre
        // String pdfUrl = pdfService.generatePdf(saved);
        // saved.setPdfUrl(pdfUrl);

        // TODO: 9. Enviar al SII si está configurado
        // if (Boolean.TRUE.equals(request.getEnviarSii())) {
        //     siiService.enviar(saved);
        // }

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

        return dtes.map(this::toResponse);
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
        Caf caf = cafRepository.findCafDisponible(tenantId, tipoDte)
                .orElseThrow(() -> new BusinessConflictException("SIN_FOLIOS",
                        "No hay folios disponibles para " + tipoDte.getDescripcion() + 
                        ". Por favor, suba un nuevo CAF."));

        if (caf.isVencido()) {
            throw new BusinessConflictException("CAF_VENCIDO",
                    "El CAF para " + tipoDte.getDescripcion() + " está vencido.");
        }

        Integer folio = caf.siguienteFolio();
        cafRepository.save(caf);
        
        log.debug("Folio {} asignado para {} (CAF: {}-{})", 
                folio, tipoDte, caf.getFolioDesde(), caf.getFolioHasta());
        
        return folio;
    }

    private MontosDte calcularMontos(List<EmitirDteRequest.ItemDto> items, TipoDte tipoDte) {
        BigDecimal neto = BigDecimal.ZERO;
        BigDecimal exento = BigDecimal.ZERO;

        for (EmitirDteRequest.ItemDto item : items) {
            BigDecimal montoItem = item.getCantidad()
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

    private record MontosDte(BigDecimal neto, BigDecimal exento, BigDecimal iva, BigDecimal total) {}

    private DteResponse toResponse(Dte dte) {
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
