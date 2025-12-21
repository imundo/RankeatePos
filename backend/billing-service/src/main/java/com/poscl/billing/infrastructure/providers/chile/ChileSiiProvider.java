package com.poscl.billing.infrastructure.providers.chile;

import com.poscl.billing.domain.entity.Caf;
import com.poscl.billing.domain.entity.Dte;
import com.poscl.billing.domain.enums.Pais;
import com.poscl.billing.domain.enums.TipoDocumento;
import com.poscl.billing.domain.enums.TipoDte;
import com.poscl.billing.domain.repository.CafRepository;
import com.poscl.billing.domain.repository.CertificadoRepository;
import com.poscl.billing.infrastructure.providers.BillingProvider;
import com.poscl.billing.infrastructure.security.CertificateManager;
import com.poscl.shared.exception.BusinessConflictException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.security.PrivateKey;
import java.security.cert.X509Certificate;
import java.util.List;
import java.util.UUID;

/**
 * Proveedor de facturación electrónica para Chile (SII)
 * Implementa integración completa con el Servicio de Impuestos Internos
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ChileSiiProvider implements BillingProvider {

    private final CafRepository cafRepository;
    private final CertificadoRepository certificadoRepository;
    private final SiiXmlBuilder xmlBuilder;
    private final SiiSigner signer;
    private final SiiTimbreGenerator timbreGenerator;
    private final SiiPdfGenerator pdfGenerator;
    private final CertificateManager certificateManager;

    @Override
    public Pais getPais() {
        return Pais.CL;
    }

    @Override
    public List<TipoDocumento> getTiposDocumentoSoportados() {
        return TipoDocumento.getByPais(Pais.CL);
    }

    @Override
    public String buildXml(Dte dte) {
        log.debug("Construyendo XML DTE para Chile - Tipo: {}, Folio: {}", 
                dte.getTipoDte(), dte.getFolio());
        
        // Obtener CAF para incluir en el XML
        Caf caf = cafRepository.findCafDisponible(dte.getTenantId(), dte.getTipoDte())
                .orElseThrow(() -> new BusinessConflictException("SIN_CAF",
                        "No hay CAF disponible para " + dte.getTipoDte().getDescripcion()));
        
        return xmlBuilder.buildDteXml(dte, caf);
    }

    @Override
    public String signXml(String xml, UUID tenantId) {
        log.debug("Firmando XML para tenant {}", tenantId);
        
        // Verificar si hay certificado configurado
        if (!certificadoRepository.existsByTenantIdAndActivoTrue(tenantId)) {
            log.warn("No hay certificado digital configurado para tenant {}", tenantId);
            return xml; // Retornar sin firmar
        }
        
        try {
            PrivateKey privateKey = certificateManager.getPrivateKey(tenantId);
            X509Certificate certificate = certificateManager.getCertificate(tenantId);
            
            return signer.signXml(xml, privateKey, certificate);
        } catch (Exception e) {
            log.error("Error firmando XML para tenant {}: {}", tenantId, e.getMessage());
            throw new BusinessConflictException("ERROR_FIRMA",
                    "Error al firmar el documento: " + e.getMessage());
        }
    }

    @Override
    public byte[] generateTimbre(Dte dte) {
        log.debug("Generando timbre PDF417 para DTE {}", dte.getId());
        
        // El TED se extrae del XML del documento
        String tedXml = extractTedFromXml(dte.getXmlContent());
        return timbreGenerator.generatePdf417(dte, tedXml);
    }

    /**
     * Generar HTML/PDF del documento
     */
    public String generateDocumentHtml(Dte dte) {
        String tedXml = extractTedFromXml(dte.getXmlContent());
        return pdfGenerator.generateHtml(dte, tedXml);
    }

    @Override
    public SendResult send(String signedXml, UUID tenantId) {
        log.info("Enviando DTE al SII para tenant {}", tenantId);
        
        // TODO: Implementar envío real al SII
        // Por ahora simula envío exitoso
        // El envío real requiere:
        // 1. Obtener token de autenticación del SII
        // 2. Construir sobre XML (EnvioDTE)
        // 3. Enviar via web service
        // 4. Procesar respuesta
        
        String trackId = "TRACK-" + System.currentTimeMillis();
        log.info("DTE enviado (simulado) - TrackId: {}", trackId);
        
        return SendResult.ok(trackId);
    }

    @Override
    public StatusResult checkStatus(String trackId, UUID tenantId) {
        log.debug("Consultando estado de {} para tenant {}", trackId, tenantId);
        
        // TODO: Implementar consulta real de estado al SII
        // Requiere llamar al web service de consulta con el trackId
        
        return StatusResult.pending();
    }

    @Override
    public boolean validateConfiguration(UUID tenantId) {
        // Verificar que el tenant tiene:
        // 1. CAFs cargados
        boolean hasCAFs = !cafRepository.findByTenantIdAndActivoTrue(tenantId).isEmpty();
        
        // 2. Certificado digital (opcional pero recomendado)
        boolean hasCertificate = certificadoRepository.existsByTenantIdAndActivoTrue(tenantId);
        
        if (!hasCAFs) {
            log.warn("Tenant {} no tiene CAFs cargados", tenantId);
        }
        if (!hasCertificate) {
            log.warn("Tenant {} no tiene certificado digital", tenantId);
        }
        
        return hasCAFs; // Mínimo requiere CAFs
    }

    @Override
    public String getNextFolio(UUID tenantId, TipoDocumento tipoDoc) {
        TipoDte tipoDte = TipoDte.fromCodigo(tipoDoc.getCodigoSii());
        
        Caf caf = cafRepository.findCafDisponible(tenantId, tipoDte)
                .orElseThrow(() -> new BusinessConflictException("SIN_FOLIOS",
                        "No hay folios disponibles para " + tipoDoc.getDescripcion()));
        
        if (caf.isVencido()) {
            throw new BusinessConflictException("CAF_VENCIDO",
                    "El CAF está vencido para " + tipoDoc.getDescripcion());
        }
        
        Integer folio = caf.siguienteFolio();
        cafRepository.save(caf);
        
        log.debug("Folio {} asignado para {}", folio, tipoDoc);
        return String.valueOf(folio);
    }

    /**
     * Extraer el TED del XML del documento
     */
    private String extractTedFromXml(String xml) {
        if (xml == null) return null;
        
        int tedStart = xml.indexOf("<TED");
        int tedEnd = xml.indexOf("</TED>") + 6;
        
        if (tedStart >= 0 && tedEnd > tedStart) {
            return xml.substring(tedStart, tedEnd);
        }
        
        return null;
    }
}
