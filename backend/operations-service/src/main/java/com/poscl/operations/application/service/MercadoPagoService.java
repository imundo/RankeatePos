package com.poscl.operations.application.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.UUID;

/**
 * Mercado Pago service for generating payment links
 */
@Service
@Slf4j
public class MercadoPagoService {

    @Value("${mercadopago.access-token:}")
    private String accessToken;

    @Value("${mercadopago.success-url:}")
    private String successUrl;

    private static final HttpClient httpClient = HttpClient.newHttpClient();
    private static final String MP_API_URL = "https://api.mercadopago.com/checkout/preferences";

    /**
     * Generate a payment link for a reservation
     */
    public String generatePaymentLink(BigDecimal amount, String description, UUID reservationId) {
        if (accessToken == null || accessToken.isEmpty()) {
            log.warn("MercadoPago not configured, returning simulation link");
            return "https://link.mercadopago.cl/sim-" + reservationId.toString().substring(0, 8);
        }

        try {
            String externalRef = "reserva-" + reservationId.toString();
            String successUrlFinal = successUrl != null && !successUrl.isEmpty()
                    ? successUrl
                    : "https://pos.rankeate.cl/reservas/pago-exitoso";

            String payload = String.format("""
                    {
                        "items": [{
                            "title": "%s",
                            "quantity": 1,
                            "unit_price": %s,
                            "currency_id": "CLP"
                        }],
                        "external_reference": "%s",
                        "back_urls": {
                            "success": "%s",
                            "failure": "%s",
                            "pending": "%s"
                        },
                        "auto_return": "approved"
                    }
                    """,
                    description.replace("\"", "\\\""),
                    amount.intValue(),
                    externalRef,
                    successUrlFinal,
                    successUrlFinal + "?status=failure",
                    successUrlFinal + "?status=pending");

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(MP_API_URL))
                    .header("Authorization", "Bearer " + accessToken)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                // Parse init_point from response
                String body = response.body();
                int startIdx = body.indexOf("\"init_point\":\"") + 14;
                int endIdx = body.indexOf("\"", startIdx);
                String initPoint = body.substring(startIdx, endIdx);

                log.info("MercadoPago payment link generated for reservation {}: {}",
                        reservationId, initPoint);
                return initPoint;
            } else {
                log.error("MercadoPago error: {} - {}", response.statusCode(), response.body());
                return null;
            }
        } catch (Exception e) {
            log.error("Error generating MercadoPago link", e);
            return null;
        }
    }

    /**
     * Check if MercadoPago is configured
     */
    public boolean isConfigured() {
        return accessToken != null && !accessToken.isEmpty();
    }

    /**
     * Verify payment status
     */
    public String getPaymentStatus(String externalReference) {
        if (!isConfigured()) {
            return "UNKNOWN";
        }

        try {
            String url = String.format(
                    "https://api.mercadopago.com/v1/payments/search?external_reference=%s",
                    externalReference);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Authorization", "Bearer " + accessToken)
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                String body = response.body();
                if (body.contains("\"status\":\"approved\"")) {
                    return "APPROVED";
                } else if (body.contains("\"status\":\"pending\"")) {
                    return "PENDING";
                } else if (body.contains("\"status\":\"rejected\"")) {
                    return "REJECTED";
                }
            }
            return "UNKNOWN";
        } catch (Exception e) {
            log.error("Error checking payment status", e);
            return "ERROR";
        }
    }
}
