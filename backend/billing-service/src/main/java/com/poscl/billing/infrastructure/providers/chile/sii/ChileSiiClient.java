package com.poscl.billing.infrastructure.providers.chile.sii;

import com.poscl.billing.infrastructure.providers.BillingProvider.SendResult;
import com.poscl.billing.infrastructure.providers.BillingProvider.StatusResult;
import com.poscl.billing.infrastructure.providers.chile.signature.ChileDigitalSigner;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Cliente SII real para producción
 */
@Slf4j
@Component("chileSiiClientReal")
@RequiredArgsConstructor
public class ChileSiiClient {

    private final WebClient.Builder webClientBuilder;
    private final ChileDigitalSigner digitalSigner;

    @Value("${sii.ambiente:certificacion}")
    private String ambiente;

    /**
     * Enviar DTE al SII
     */
    public SendResult send(String signedXml, UUID tenantId) {
        log.info("📤 Enviando DTE al SII ({})", ambiente);

        try {
            // 1. Obtener token de autenticación
            String token = getAuthToken(tenantId);

            // 2. Construir sobre XML
            String envelope = buildEnvelope(signedXml, token);

            // 3. POST al SII
            String response = webClientBuilder.build()
                    .post()
                    .uri(getSiiUrl("upload"))
                    .header("Cookie", "TOKEN=" + token)
                    .contentType(MediaType.TEXT_XML)
                    .bodyValue(envelope)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(30))
                    .block();

            // 4. Extraer Track ID
            String trackId = extractTrackId(response);

            log.info("✅ DTE enviado. TrackID: {}", trackId);
            return SendResult.ok(trackId);

        } catch (Exception e) {
            log.error("❌ Error enviando DTE al SII: {}", e.getMessage());
            return SendResult.error("SII_ERROR", e.getMessage());
        }
    }

    /**
     * Consultar estado del DTE en el SII
     */
    public StatusResult checkStatus(String trackId, UUID tenantId) {
        log.info("🔍 Consultando estado DTE. Track ID: {}", trackId);

        try {
            String token = getAuthToken(tenantId);

            String response = webClientBuilder.build()
                    .get()
                    .uri(getSiiUrl("status") + "?trackId=" + trackId)
                    .header("Cookie", "TOKEN=" + token)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(20))
                    .block();

            // Parsear respuesta
            if (response.contains("ACEPTADO") || response.contains("APR")) {
                return StatusResult.accepted("DTE aceptado por el SII");
            } else if (response.contains("RECHAZADO") || response.contains("REP")) {
                String glosa = extractGlosa(response);
                return StatusResult.rejected(glosa);
            } else {
                return StatusResult.pending();
            }

        } catch (Exception e) {
            log.error("❌ Error consultando estado: {}", e.getMessage());
            return StatusResult.pending();
        }
    }

    /**
     * Obtener token de autenticación del SII
     */
    private String getAuthToken(UUID tenantId) throws Exception {
        // 1. Solicitar semilla
        String seedResponse = webClientBuilder.build()
                .get()
                .uri(getSiiUrl("seed"))
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(10))
                .block();

        String seed = extractSeed(seedResponse);

        // 2. Firmar semilla
        String signedSeed = digitalSigner.sign(
                "<getToken><item><Semilla>" + seed + "</Semilla></item></getToken>",
                tenantId);

        // 3. Intercambiar por token
        String tokenResponse = webClientBuilder.build()
                .post()
                .uri(getSiiUrl("token"))
                .contentType(MediaType.TEXT_XML)
                .bodyValue(signedSeed)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(10))
                .block();

        return extractToken(tokenResponse);
    }

    private String getSiiUrl(String endpoint) {
        String baseUrl = ambiente.equals("produccion")
                ? "https://palena.sii.cl"
                : "https://maullin.sii.cl";

        return switch (endpoint) {
            case "seed" -> baseUrl + "/DTEWS/CrSeed.jws?WSDL";
            case "token" -> baseUrl + "/DTEWS/GetTokenFromSeed.jws?WSDL";
            case "upload" -> baseUrl + "/cgi_dte/UPL/DTEUpload";
            case "status" -> baseUrl + "/cgi_dte/UPL/DTEUpload";
            default -> throw new IllegalArgumentException("Unknown endpoint: " + endpoint);
        };
    }

    private String buildEnvelope(String xml, String token) {
        return String.format("""
                <?xml version="1.0" encoding="UTF-8"?>
                <SetDTE>
                    <Documento>%s</Documento>
                </SetDTE>
                """, xml);
    }

    private String extractSeed(String response) {
        Pattern pattern = Pattern.compile("<SEMILLA>(\\d+)</SEMILLA>");
        Matcher matcher = pattern.matcher(response);
        if (matcher.find()) {
            return matcher.group(1);
        }
        throw new RuntimeException("No se pudo extraer la semilla");
    }

    private String extractToken(String response) {
        Pattern pattern = Pattern.compile("<TOKEN>([^<]+)</TOKEN>");
        Matcher matcher = pattern.matcher(response);
        if (matcher.find()) {
            return matcher.group(1);
        }
        throw new RuntimeException("No se pudo extraer el token");
    }

    private String extractTrackId(String response) {
        Pattern pattern = Pattern.compile("<TRACKID>(\\d+)</TRACKID>");
        Matcher matcher = pattern.matcher(response);
        if (matcher.find()) {
            return matcher.group(1);
        }
        throw new RuntimeException("No se pudo extraer el TrackID");
    }

    private String extractGlosa(String response) {
        Pattern pattern = Pattern.compile("<GLOSA>([^<]+)</GLOSA>");
        Matcher matcher = pattern.matcher(response);
        return matcher.find() ? matcher.group(1) : "Sin descripción";
    }
}
