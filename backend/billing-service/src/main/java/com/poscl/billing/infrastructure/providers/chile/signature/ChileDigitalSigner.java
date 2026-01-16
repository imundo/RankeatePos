package com.poscl.billing.infrastructure.providers.chile.signature;

import com.poscl.billing.domain.entity.CertificadoDigital;
import com.poscl.billing.domain.repository.CertificadoDigitalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.xml.security.Init;
import org.apache.xml.security.signature.XMLSignature;
import org.apache.xml.security.transforms.Transforms;
import org.apache.xml.security.utils.Constants;
import org.springframework.stereotype.Component;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import java.io.ByteArrayInputStream;
import java.io.StringReader;
import java.io.StringWriter;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.cert.X509Certificate;
import java.util.UUID;

/**
 * Firma digital real con Apache XMLSec (producción)
 */
@Slf4j
@Component("chileDigitalSignerReal")
@RequiredArgsConstructor
public class ChileDigitalSigner {

    private final CertificadoDigitalRepository certificadoRepository;

    static {
        Init.init(); // Initialize Apache XMLSec
    }

    /**
     * Firma XML con certificado digital .pfx
     */
    public String sign(String xml, UUID tenantId) throws Exception {
        log.info("🔐 Firmando XML para tenant: {}", tenantId);

        // 1. Obtener certificado activo
        CertificadoDigital cert = certificadoRepository.findActivoByTenantId(tenantId)
                .orElseThrow(() -> new Exception("No hay certificado digital activo para el tenant"));

        if (cert.isVencido()) {
            throw new Exception("El certificado digital está vencido");
        }

        // 2. Cargar KeyStore desde .pfx
        KeyStore keyStore = KeyStore.getInstance("PKCS12");
        String password = decryptPassword(cert.getPfxPasswordEncrypted());
        keyStore.load(new ByteArrayInputStream(cert.getPfxData()), password.toCharArray());

        // 3. Obtener private key y certificado
        String alias = keyStore.aliases().nextElement();
        PrivateKey privateKey = (PrivateKey) keyStore.getKey(alias, password.toCharArray());
        X509Certificate certificate = (X509Certificate) keyStore.getCertificate(alias);

        // 4. Parsear XML
        Document doc = parseXML(xml);

        // 5. Crear elemento de firma
        Element root = doc.getDocumentElement();
        XMLSignature sig = new XMLSignature(doc, "", XMLSignature.ALGO_ID_SIGNATURE_RSA_SHA1);
        root.appendChild(sig.getElement());

        // 6. Configurar transforms enveloped
        Transforms transforms = new Transforms(doc);
        transforms.addTransform(Transforms.TRANSFORM_ENVELOPED_SIGNATURE);
        sig.addDocument("", transforms, Constants.ALGO_ID_DIGEST_SHA1);

        // 7. Añadir información del certificado
        sig.addKeyInfo(certificate);

        // 8. Firmar
        sig.sign(privateKey);

        // 9. Serializar documento firmado
        String signedXml = serializeXML(doc);

        log.info("✅ XML firmado exitosamente");
        return signedXml;
    }

    private Document parseXML(String xml) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(true);
        DocumentBuilder builder = factory.newDocumentBuilder();
        return builder.parse(new ByteArrayInputStream(xml.getBytes("UTF-8")));
    }

    private String serializeXML(Document doc) throws Exception {
        TransformerFactory tf = TransformerFactory.newInstance();
        Transformer transformer = tf.newTransformer();
        StringWriter writer = new StringWriter();
        transformer.transform(new DOMSource(doc), new StreamResult(writer));
        return writer.toString();
    }

    private String decryptPassword(String encrypted) {
        // TODO: Implementar decripción real (AES)
        // Por ahora retorna el mismo (asumiendo que se almacenó sin encriptar
        // temporalmente)
        return encrypted;
    }
}
