package com.poscl.billing.infrastructure.providers.chile.signature;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.UUID;

/**
 * Mock de firma digital para pre-producción
 * Simula firma XMLDSig sin certificado real
 */
@Slf4j
@Component
public class ChileDigitalSignerMock {

    /**
     * Firma XML con certificado digital (MOCK)
     * En producción: Cargar .pfx, firmar con XMLSec
     * 
     * @param xml      XML a firmar
     * @param tenantId ID del tenant (para obtener certificado)
     * @return XML con nodo Signature simulado
     */
    public String sign(String xml, UUID tenantId) {
        log.info("🔐 [MOCK] Firmando XML para tenant: {}", tenantId);

        try {
            // Generar hash SHA-256 del contenido
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(xml.getBytes(StandardCharsets.UTF_8));
            String signatureValue = Base64.getEncoder().encodeToString(hash);

            // Insertar nodo Signature antes de </DTE>
            String signatureNode = generateMockSignatureNode(signatureValue, tenantId);
            String signedXml = xml.replace("</DTE>", signatureNode + "\n</DTE>");

            log.info("✅ [MOCK] XML firmado exitosamente");
            return signedXml;

        } catch (Exception e) {
            log.error("❌ Error en firma mock: {}", e.getMessage());
            throw new RuntimeException("Error al firmar XML (mock)", e);
        }
    }

    /**
     * Genera nodo Signature mock compatible con XMLDSig
     */
    private String generateMockSignatureNode(String signatureValue, UUID tenantId) {
        return String.format("""
                <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
                  <SignedInfo>
                    <CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
                    <SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
                    <Reference URI="">
                      <Transforms>
                        <Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
                      </Transforms>
                      <DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
                      <DigestValue>%s</DigestValue>
                    </Reference>
                  </SignedInfo>
                  <SignatureValue>MOCK-SIGNATURE-%s</SignatureValue>
                  <KeyInfo>
                    <X509Data>
                      <X509Certificate>MOCK-CERT-DATA</X509Certificate>
                    </X509Data>
                  </KeyInfo>
                </Signature>""", signatureValue.substring(0, 40), tenantId.toString().substring(0, 8));
    }

    /**
     * Valida firma (siempre true en mock)
     */
    public boolean validate(String signedXml) {
        log.info("🔍 [MOCK] Validando firma XML (siempre válido en mock)");
        return signedXml.contains("<Signature");
    }
}
