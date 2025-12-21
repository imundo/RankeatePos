package com.poscl.billing.infrastructure.providers;

import com.poscl.billing.domain.entity.Dte;
import com.poscl.billing.domain.enums.Pais;
import com.poscl.billing.domain.enums.TipoDocumento;

import java.util.List;
import java.util.UUID;

/**
 * Interface para proveedores de facturación electrónica por país.
 * Implementa el patrón Strategy para soportar diferentes autoridades tributarias.
 */
public interface BillingProvider {

    /**
     * @return País que maneja este provider
     */
    Pais getPais();

    /**
     * @return Tipos de documento soportados por este país
     */
    List<TipoDocumento> getTiposDocumentoSoportados();

    /**
     * Construir XML del documento según el formato del país
     * @param dte Documento a convertir
     * @return XML generado
     */
    String buildXml(Dte dte);

    /**
     * Firmar el XML con certificado digital
     * @param xml XML a firmar
     * @param tenantId ID del tenant para obtener certificado
     * @return XML firmado
     */
    String signXml(String xml, UUID tenantId);

    /**
     * Generar timbre/código de verificación
     * @param dte Documento
     * @return Bytes del código (PDF417, QR, etc.)
     */
    byte[] generateTimbre(Dte dte);

    /**
     * Enviar documento a la autoridad tributaria
     * @param signedXml XML firmado
     * @param tenantId ID del tenant
     * @return Resultado del envío
     */
    SendResult send(String signedXml, UUID tenantId);

    /**
     * Consultar estado de un documento enviado
     * @param trackId ID de seguimiento
     * @param tenantId ID del tenant
     * @return Estado actual
     */
    StatusResult checkStatus(String trackId, UUID tenantId);

    /**
     * Validar configuración del tenant para este país
     * @param tenantId ID del tenant
     * @return true si está configurado correctamente
     */
    boolean validateConfiguration(UUID tenantId);

    /**
     * Obtener siguiente folio/serie disponible
     * @param tenantId ID del tenant
     * @param tipoDoc Tipo de documento
     * @return Folio/serie siguiente
     */
    String getNextFolio(UUID tenantId, TipoDocumento tipoDoc);

    // === Clases de resultado ===

    record SendResult(
            boolean success,
            String trackId,
            String errorCode,
            String errorMessage
    ) {
        public static SendResult ok(String trackId) {
            return new SendResult(true, trackId, null, null);
        }

        public static SendResult error(String code, String message) {
            return new SendResult(false, null, code, message);
        }
    }

    record StatusResult(
            String status,
            boolean accepted,
            String glosa,
            String pdfUrl
    ) {
        public static StatusResult accepted(String glosa) {
            return new StatusResult("ACEPTADO", true, glosa, null);
        }

        public static StatusResult rejected(String glosa) {
            return new StatusResult("RECHAZADO", false, glosa, null);
        }

        public static StatusResult pending() {
            return new StatusResult("PENDIENTE", false, "En proceso", null);
        }
    }
}
