package com.poscl.billing.infrastructure.providers.chile;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

import javax.xml.crypto.dsig.*;
import javax.xml.crypto.dsig.dom.DOMSignContext;
import javax.xml.crypto.dsig.keyinfo.KeyInfo;
import javax.xml.crypto.dsig.keyinfo.KeyInfoFactory;
import javax.xml.crypto.dsig.keyinfo.X509Data;
import javax.xml.crypto.dsig.spec.C14NMethodParameterSpec;
import javax.xml.crypto.dsig.spec.TransformParameterSpec;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import java.io.ByteArrayInputStream;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.cert.X509Certificate;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

/**
 * Servicio de firma digital XML para DTEs del SII Chile
 * Usa XMLDSig (XML Digital Signature) según estándar W3C
 */
@Slf4j
@Component
public class SiiSigner {

    private static final String SIGNATURE_METHOD = SignatureMethod.RSA_SHA1;
    private static final String DIGEST_METHOD = DigestMethod.SHA1;
    private static final String CANONICALIZATION_METHOD = CanonicalizationMethod.INCLUSIVE;

    /**
     * Firmar un documento XML con el certificado del tenant
     * @param xml XML a firmar
     * @param privateKey Clave privada del certificado
     * @param certificate Certificado X509
     * @return XML firmado
     */
    public String signXml(String xml, PrivateKey privateKey, X509Certificate certificate) {
        log.debug("Firmando XML con certificado: {}", certificate.getSubjectX500Principal().getName());
        
        try {
            // Parsear XML
            DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
            dbf.setNamespaceAware(true);
            Document doc = dbf.newDocumentBuilder()
                    .parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)));

            // Encontrar elemento Documento para firmar
            Element documentElement = (Element) doc.getElementsByTagName("Documento").item(0);
            if (documentElement == null) {
                documentElement = doc.getDocumentElement();
            }
            
            String referenceUri = documentElement.getAttribute("ID");
            if (referenceUri == null || referenceUri.isEmpty()) {
                referenceUri = "doc-" + UUID.randomUUID().toString();
                documentElement.setAttribute("ID", referenceUri);
            }

            // Crear contexto de firma
            XMLSignatureFactory signFactory = XMLSignatureFactory.getInstance("DOM");
            
            // Referencia al documento
            List<Transform> transforms = List.of(
                    signFactory.newTransform(Transform.ENVELOPED, (TransformParameterSpec) null)
            );
            
            Reference ref = signFactory.newReference(
                    "#" + referenceUri,
                    signFactory.newDigestMethod(DIGEST_METHOD, null),
                    transforms,
                    null,
                    null
            );

            // Información de la firma
            SignedInfo signedInfo = signFactory.newSignedInfo(
                    signFactory.newCanonicalizationMethod(CANONICALIZATION_METHOD, (C14NMethodParameterSpec) null),
                    signFactory.newSignatureMethod(SIGNATURE_METHOD, null),
                    Collections.singletonList(ref)
            );

            // KeyInfo con certificado
            KeyInfoFactory keyInfoFactory = signFactory.getKeyInfoFactory();
            X509Data x509Data = keyInfoFactory.newX509Data(List.of(certificate));
            KeyInfo keyInfo = keyInfoFactory.newKeyInfo(List.of(x509Data));

            // Crear firma
            XMLSignature signature = signFactory.newXMLSignature(signedInfo, keyInfo);

            // Firmar
            DOMSignContext signContext = new DOMSignContext(privateKey, documentElement);
            signature.sign(signContext);

            // Convertir a String
            return documentToString(doc);
            
        } catch (Exception e) {
            log.error("Error firmando XML: {}", e.getMessage(), e);
            throw new RuntimeException("Error al firmar documento XML", e);
        }
    }

    /**
     * Firmar solo el TED (Timbre Electrónico del DTE)
     * El TED requiere firma separada con la clave del CAF
     */
    public String signTed(String tedXml, PrivateKey cafPrivateKey) {
        log.debug("Firmando TED con clave del CAF");
        
        try {
            // Para el TED, la firma es más simple (SHA1withRSA sobre el contenido DD)
            Signature signature = Signature.getInstance("SHA1withRSA");
            signature.initSign(cafPrivateKey);
            
            // Extraer contenido DD del TED para firmar
            int ddStart = tedXml.indexOf("<DD>");
            int ddEnd = tedXml.indexOf("</DD>") + 5;
            if (ddStart >= 0 && ddEnd > ddStart) {
                String ddContent = tedXml.substring(ddStart, ddEnd);
                signature.update(ddContent.getBytes(StandardCharsets.ISO_8859_1));
                
                byte[] signatureBytes = signature.sign();
                String signatureBase64 = java.util.Base64.getEncoder().encodeToString(signatureBytes);
                
                // Insertar firma en FRMT
                return tedXml.replace(
                        "<FRMT algoritmo=\"SHA1withRSA\"><!-- Firma TED --></FRMT>",
                        "<FRMT algoritmo=\"SHA1withRSA\">" + signatureBase64 + "</FRMT>"
                );
            }
            
            return tedXml;
            
        } catch (Exception e) {
            log.error("Error firmando TED: {}", e.getMessage(), e);
            return tedXml;
        }
    }

    /**
     * Verificar una firma XML
     */
    public boolean verifySignature(String signedXml) {
        // TODO: Implementar verificación de firma
        log.warn("Verificación de firma no implementada");
        return true;
    }

    private String documentToString(Document doc) {
        try {
            TransformerFactory tf = TransformerFactory.newInstance();
            Transformer transformer = tf.newTransformer();
            StringWriter writer = new StringWriter();
            transformer.transform(new DOMSource(doc), new StreamResult(writer));
            return writer.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error convirtiendo documento a String", e);
        }
    }
}
