package com.poscl.billing.infrastructure.sii;

import com.poscl.billing.infrastructure.security.CertificateManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
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
import java.security.PrivateKey;
import java.security.cert.X509Certificate;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Servicio de autenticación con el SII
 * Implementa el flujo Seed -> Token según especificaciones del SII
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SiiAuthService {

    private final SiiConfig siiConfig;
    private final CertificateManager certificateManager;
    private final WebClient.Builder webClientBuilder;

    // Cache de tokens (tenant -> TokenInfo)
    private final Map<UUID, TokenInfo> tokenCache = new ConcurrentHashMap<>();
    
    private static final Duration TOKEN_VALIDITY = Duration.ofMinutes(50); // Token válido 1 hora, renovamos a los 50 min

    /**
     * Obtener token de autenticación para un tenant
     * El token se cachea y renueva automáticamente
     */
    public String getToken(UUID tenantId) {
        TokenInfo cached = tokenCache.get(tenantId);
        
        if (cached != null && !cached.isExpired()) {
            log.debug("Usando token cacheado para tenant {}", tenantId);
            return cached.token;
        }
        
        log.info("Obteniendo nuevo token SII para tenant {}", tenantId);
        String newToken = requestNewToken(tenantId);
        
        tokenCache.put(tenantId, new TokenInfo(newToken, LocalDateTime.now()));
        return newToken;
    }

    /**
     * Flujo completo: obtener semilla → firmarla → obtener token
     */
    private String requestNewToken(UUID tenantId) {
        try {
            // 1. Obtener semilla (seed)
            String seed = getSeed();
            log.debug("Semilla obtenida: {}", seed);

            // 2. Firmar semilla con certificado del tenant
            String signedSeed = signSeed(seed, tenantId);
            log.debug("Semilla firmada");

            // 3. Obtener token
            String token = getTokenFromSeed(signedSeed);
            log.info("Token obtenido exitosamente para tenant {}", tenantId);
            
            return token;
            
        } catch (Exception e) {
            log.error("Error obteniendo token SII para tenant {}: {}", tenantId, e.getMessage());
            throw new RuntimeException("Error de autenticación con SII: " + e.getMessage(), e);
        }
    }

    /**
     * Paso 1: Obtener semilla del SII
     */
    private String getSeed() {
        WebClient client = webClientBuilder.build();
        
        String response = client.get()
                .uri(siiConfig.getSeedUrl())
                .retrieve()
                .bodyToMono(String.class)
                .block(Duration.ofSeconds(30));

        // Extraer semilla de la respuesta XML
        // Formato: <SEMILLA>valor</SEMILLA>
        Pattern pattern = Pattern.compile("<SEMILLA>(.+?)</SEMILLA>");
        Matcher matcher = pattern.matcher(response != null ? response : "");
        
        if (matcher.find()) {
            return matcher.group(1);
        }
        
        throw new RuntimeException("No se pudo obtener la semilla del SII");
    }

    /**
     * Paso 2: Firmar la semilla con el certificado digital
     */
    private String signSeed(String seed, UUID tenantId) {
        try {
            PrivateKey privateKey = certificateManager.getPrivateKey(tenantId);
            X509Certificate certificate = certificateManager.getCertificate(tenantId);

            // Construir XML de la semilla
            String seedXml = buildSeedXml(seed);
            
            // Parsear y firmar
            DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
            dbf.setNamespaceAware(true);
            Document doc = dbf.newDocumentBuilder()
                    .parse(new ByteArrayInputStream(seedXml.getBytes(StandardCharsets.UTF_8)));

            // Firmar
            XMLSignatureFactory signFactory = XMLSignatureFactory.getInstance("DOM");
            
            Reference ref = signFactory.newReference(
                    "",
                    signFactory.newDigestMethod(DigestMethod.SHA1, null),
                    List.of(signFactory.newTransform(Transform.ENVELOPED, (TransformParameterSpec) null)),
                    null, null
            );

            SignedInfo signedInfo = signFactory.newSignedInfo(
                    signFactory.newCanonicalizationMethod(CanonicalizationMethod.INCLUSIVE, (C14NMethodParameterSpec) null),
                    signFactory.newSignatureMethod(SignatureMethod.RSA_SHA1, null),
                    Collections.singletonList(ref)
            );

            KeyInfoFactory keyInfoFactory = signFactory.getKeyInfoFactory();
            X509Data x509Data = keyInfoFactory.newX509Data(List.of(certificate));
            KeyInfo keyInfo = keyInfoFactory.newKeyInfo(List.of(x509Data));

            XMLSignature signature = signFactory.newXMLSignature(signedInfo, keyInfo);
            
            Element getToken = (Element) doc.getElementsByTagName("getToken").item(0);
            DOMSignContext signContext = new DOMSignContext(privateKey, getToken);
            signature.sign(signContext);

            // Convertir a string
            return documentToString(doc);
            
        } catch (Exception e) {
            throw new RuntimeException("Error firmando semilla", e);
        }
    }

    private String buildSeedXml(String seed) {
        return """
            <?xml version="1.0" encoding="UTF-8"?>
            <getToken>
                <item>
                    <Semilla>%s</Semilla>
                </item>
            </getToken>
            """.formatted(seed);
    }

    /**
     * Paso 3: Obtener token enviando semilla firmada
     */
    private String getTokenFromSeed(String signedSeedXml) {
        WebClient client = webClientBuilder.build();
        
        String response = client.post()
                .uri(siiConfig.getTokenUrl())
                .header("Content-Type", "application/xml")
                .bodyValue(signedSeedXml)
                .retrieve()
                .bodyToMono(String.class)
                .block(Duration.ofSeconds(30));

        // Extraer token de la respuesta
        // Formato: <TOKEN>valor</TOKEN>
        Pattern pattern = Pattern.compile("<TOKEN>(.+?)</TOKEN>");
        Matcher matcher = pattern.matcher(response != null ? response : "");
        
        if (matcher.find()) {
            return matcher.group(1);
        }
        
        // Verificar si hay error
        Pattern errorPattern = Pattern.compile("<ESTADO>(.+?)</ESTADO>");
        Matcher errorMatcher = errorPattern.matcher(response != null ? response : "");
        if (errorMatcher.find()) {
            throw new RuntimeException("Error del SII: " + errorMatcher.group(1));
        }
        
        throw new RuntimeException("No se pudo obtener el token del SII");
    }

    /**
     * Invalidar token de un tenant
     */
    public void invalidateToken(UUID tenantId) {
        tokenCache.remove(tenantId);
        log.debug("Token invalidado para tenant {}", tenantId);
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

    private record TokenInfo(String token, LocalDateTime obtainedAt) {
        boolean isExpired() {
            return LocalDateTime.now().isAfter(obtainedAt.plus(TOKEN_VALIDITY));
        }
    }
}
