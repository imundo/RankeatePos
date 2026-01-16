package com.poscl.billing.infrastructure.providers.chile.sii;

import com.poscl.billing.infrastructure.providers.BillingProvider.SendResult;
import com.poscl.billing.infrastructure.providers.BillingProvider.StatusResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Mock del cliente SII para pre-producción
 * Simula respuestas del SII sin llamadas reales
 */
@Slf4j
@Component
public class ChileSiiClientMock {

    // Simula almacenamiento de DTEs enviados
    private final Map<String, MockDteStatus> sentDocuments = new ConcurrentHashMap<>();

    /**
     * Simula envío de DTE al SII
     * En producción: POST a https://maullin.sii.cl/cgi_dte/UPL/DTEUpload
     * 
     * @param signedXml XML firmado
     * @param tenantId  ID del tenant
     * @return Resultado con trackId simulado
     */
    public SendResult send(String signedXml, UUID tenantId) {
        log.info("📤 [MOCK-SII] Enviando DTE al SII para tenant: {}", tenantId);

        String trackId = generateTrackId();

        // Simular almacenamiento
        sentDocuments.put(trackId, new MockDteStatus(
                trackId,
                "RECIBIDO",
                "DTE recibido y en proceso de validación",
                Instant.now(),
                tenantId));

        log.info("✅ [MOCK-SII] DTE enviado exitosamente. TrackID: {}", trackId);

        return SendResult.ok(trackId);
    }

    /**
     * Simula consulta de estado en SII
     * En producción: GET a https://maullin.sii.cl/cgi_dte/consultaDte
     * 
     * @param trackId  ID de seguimiento
     * @param tenantId ID del tenant
     * @return Estado actual del DTE
     */
    public StatusResult checkStatus(String trackId, UUID tenantId) {
        log.info("🔍 [MOCK-SII] Consultando estado DTE. TrackID: {}", trackId);

        MockDteStatus status = sentDocuments.get(trackId);

        if (status == null) {
            log.warn("⚠️ [MOCK-SII] TrackID no encontrado: {}", trackId);
            return StatusResult.rejected("TrackID no encontrado en sistema SII (mock)");
        }

        // Simular progresión automática de estados
        String currentStatus = updateMockStatus(status);

        log.info("📊 [MOCK-SII] Estado actual: {}", currentStatus);

        return switch (currentStatus) {
            case "ACEPTADO" -> StatusResult.accepted("DTE aceptado por el SII (mock)");
            case "RECIBIDO", "EN_PROCESO" -> StatusResult.pending();
            default -> StatusResult.rejected("DTE rechazado por errores (mock)");
        };
    }

    /**
     * Simula progresión de estados (después de 3 segundos → ACEPTADO)
     */
    private String updateMockStatus(MockDteStatus status) {
        long secondsSinceSent = Instant.now().getEpochSecond() - status.sentAt.getEpochSecond();

        if (secondsSinceSent > 3) {
            status.status = "ACEPTADO";
            status.glosa = "DTE aceptado por el SII (simulación)";
        } else if (secondsSinceSent > 1) {
            status.status = "EN_PROCESO";
            status.glosa = "DTE en proceso de validación";
        }

        return status.status;
    }

    /**
     * Genera TrackID simulado formato SII
     */
    private String generateTrackId() {
        return String.format("MOCK-%d-%s",
                System.currentTimeMillis(),
                UUID.randomUUID().toString().substring(0, 8).toUpperCase());
    }

    /**
     * Simula obtención de token de autenticación SII
     */
    public String getAuthToken(UUID tenantId) {
        log.info("🔑 [MOCK-SII] Obteniendo token de autenticación para tenant: {}", tenantId);
        return "MOCK-TOKEN-" + tenantId.toString().substring(0, 8);
    }

    /**
     * Limpia documentos mock (útil para testing)
     */
    public void clearMockData() {
        sentDocuments.clear();
        log.info("🧹 [MOCK-SII] Data mock limpiada");
    }

    // Clase interna para almacenar estado mock
    private static class MockDteStatus {
        String trackId;
        String status;
        String glosa;
        Instant sentAt;
        UUID tenantId;

        MockDteStatus(String trackId, String status, String glosa, Instant sentAt, UUID tenantId) {
            this.trackId = trackId;
            this.status = status;
            this.glosa = glosa;
            this.sentAt = sentAt;
            this.tenantId = tenantId;
        }
    }
}
