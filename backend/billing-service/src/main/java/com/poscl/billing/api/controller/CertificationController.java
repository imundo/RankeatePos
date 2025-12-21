package com.poscl.billing.api.controller;

import com.poscl.billing.infrastructure.sii.SiiCertificationService;
import com.poscl.billing.infrastructure.sii.SiiCertificationService.CertificationResult;
import com.poscl.billing.infrastructure.sii.SiiCertificationService.CertificationTestCase;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Controller para proceso de certificación SII
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/certificacion")
@RequiredArgsConstructor
public class CertificationController {

    private final SiiCertificationService certificationService;

    /**
     * Generar set de pruebas de certificación
     */
    @PostMapping("/generar-set")
    public ResponseEntity<GenerarSetResponse> generarSetPruebas(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestBody GenerarSetRequest request
    ) {
        log.info("Generando set de pruebas para tenant {} - RUT: {}", tenantId, request.rutEmisor);
        
        List<CertificationTestCase> testCases = certificationService.generateTestSet(
                request.rutEmisor,
                request.razonSocialEmisor
        );

        return ResponseEntity.ok(new GenerarSetResponse(
                testCases.size(),
                testCases.stream().map(this::mapTestCase).toList(),
                "Set de pruebas generado exitosamente"
        ));
    }

    /**
     * Ejecutar set de pruebas (envío al SII ambiente certificación)
     */
    @PostMapping("/ejecutar")
    public ResponseEntity<EjecutarSetResponse> ejecutarSetPruebas(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestBody EjecutarSetRequest request
    ) {
        log.info("Ejecutando set de pruebas para tenant {}", tenantId);
        
        // Generar set
        List<CertificationTestCase> testCases = certificationService.generateTestSet(
                request.rutEmisor,
                request.razonSocialEmisor
        );

        // TODO: Enviar cada documento al SII (ambiente Maullin)
        // Por ahora simula resultados
        for (CertificationTestCase testCase : testCases) {
            testCase.setValid(true);
            testCase.setTrackId("MOCK-CERT-" + System.currentTimeMillis() + "-" + testCase.getNumero());
            testCase.setEstadoSii("ENVIADO");
        }

        CertificationResult result = certificationService.validateTestSet(testCases);

        return ResponseEntity.ok(new EjecutarSetResponse(
                result.isAllPassed(),
                result.getPassed(),
                result.getFailed(),
                result.getTotal(),
                result.getMessage(),
                result.getErrors(),
                testCases.stream().map(this::mapTestCase).toList()
        ));
    }

    /**
     * Consultar estado de certificación
     */
    @GetMapping("/estado")
    public ResponseEntity<EstadoCertificacionResponse> getEstadoCertificacion(
            @RequestHeader("X-Tenant-Id") UUID tenantId
    ) {
        log.debug("Consultando estado de certificación para tenant {}", tenantId);

        // TODO: Consultar estado real de certificación del tenant
        return ResponseEntity.ok(new EstadoCertificacionResponse(
                "PENDIENTE",
                "Aún no se ha iniciado el proceso de certificación",
                null,
                false
        ));
    }

    /**
     * Obtener requisitos de certificación
     */
    @GetMapping("/requisitos")
    public ResponseEntity<Map<String, Object>> getRequisitos() {
        return ResponseEntity.ok(Map.of(
                "documentos_requeridos", List.of(
                        Map.of("tipo", "FACTURA_ELECTRONICA", "codigo", 33, "cantidad_minima", 3),
                        Map.of("tipo", "BOLETA_ELECTRONICA", "codigo", 39, "cantidad_minima", 2),
                        Map.of("tipo", "NOTA_CREDITO", "codigo", 61, "cantidad_minima", 1),
                        Map.of("tipo", "NOTA_DEBITO", "codigo", 56, "cantidad_minima", 1),
                        Map.of("tipo", "GUIA_DESPACHO", "codigo", 52, "cantidad_minima", 1)
                ),
                "requisitos_previos", List.of(
                        "Datos de empresa configurados",
                        "Certificado digital (.pfx) cargado y válido",
                        "CAF de pruebas obtenidos del ambiente Maullin"
                ),
                "ambiente", "certificacion",
                "url_sii", "https://maullin.sii.cl"
        ));
    }

    private TestCaseDto mapTestCase(CertificationTestCase tc) {
        return new TestCaseDto(
                tc.getNumero(),
                tc.getNombre(),
                tc.getDescripcion(),
                tc.getTipoDte().name(),
                tc.getTipoDte().getCodigo(),
                tc.getDte().getFolio(),
                tc.getDte().getMontoTotal() != null ? tc.getDte().getMontoTotal().longValue() : 0,
                tc.getExpectedResult(),
                tc.isValid(),
                tc.getTrackId(),
                tc.getEstadoSii(),
                tc.getErrorMessage()
        );
    }

    // === DTOs ===

    public record GenerarSetRequest(String rutEmisor, String razonSocialEmisor) {}

    public record GenerarSetResponse(int totalCasos, List<TestCaseDto> casos, String mensaje) {}

    public record EjecutarSetRequest(String rutEmisor, String razonSocialEmisor) {}

    public record EjecutarSetResponse(
            boolean exito,
            int pasaron,
            int fallaron,
            int total,
            String mensaje,
            List<String> errores,
            List<TestCaseDto> casos
    ) {}

    public record EstadoCertificacionResponse(
            String estado,
            String descripcion,
            String fechaCertificacion,
            boolean produccionHabilitado
    ) {}

    public record TestCaseDto(
            int numero,
            String nombre,
            String descripcion,
            String tipoDte,
            int codigoSii,
            int folio,
            long montoTotal,
            String resultadoEsperado,
            boolean valido,
            String trackId,
            String estadoSii,
            String errorMessage
    ) {}
}
