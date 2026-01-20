package com.poscl.operations.application.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Client service to sync customer data with Marketing CRM
 */
@Service
@Slf4j
public class CrmSyncService {

    @Value("${marketing.service.url:http://marketing-service:8080}")
    private String marketingServiceUrl;

    private static final HttpClient httpClient = HttpClient.newHttpClient();

    /**
     * Sync customer data when a reservation is created
     * Creates or updates customer in CRM and records interaction
     */
    public void syncReservationCustomer(UUID tenantId, String customerName, String phone, String email,
            UUID reservationId) {
        try {
            // First, find or create customer
            String customerId = findOrCreateCustomer(tenantId, customerName, phone, email);

            if (customerId != null) {
                // Record reservation interaction
                recordInteraction(customerId, "RESERVATION",
                        "Reserva creada: " + reservationId.toString().substring(0, 8));
                log.info("Customer {} synced with CRM for reservation {}", customerName, reservationId);
            }
        } catch (Exception e) {
            log.error("Failed to sync customer with CRM: {}", e.getMessage());
            // Don't fail the reservation if CRM sync fails
        }
    }

    /**
     * Record when a reservation is completed (for visit tracking)
     */
    public void recordCompletedVisit(UUID tenantId, String phone, String customerName, UUID reservationId) {
        try {
            String customerId = findCustomerByPhone(tenantId, phone);
            if (customerId != null) {
                recordInteraction(customerId, "VISIT_COMPLETED",
                        "Visita completada: " + reservationId.toString().substring(0, 8));
                updateLastVisitDate(customerId);
            }
        } catch (Exception e) {
            log.error("Failed to record completed visit: {}", e.getMessage());
        }
    }

    /**
     * Record when a reservation is cancelled
     */
    public void recordCancellation(UUID tenantId, String phone, UUID reservationId) {
        try {
            String customerId = findCustomerByPhone(tenantId, phone);
            if (customerId != null) {
                recordInteraction(customerId, "CANCELLATION",
                        "Reserva cancelada: " + reservationId.toString().substring(0, 8));
            }
        } catch (Exception e) {
            log.error("Failed to record cancellation: {}", e.getMessage());
        }
    }

    private String findOrCreateCustomer(UUID tenantId, String name, String phone, String email) {
        try {
            // First try to find by phone
            String existingId = findCustomerByPhone(tenantId, phone);
            if (existingId != null) {
                return existingId;
            }

            // Create new customer
            String payload = String.format("""
                    {
                        "name": "%s",
                        "phone": "%s",
                        "email": "%s",
                        "segment": "NEW",
                        "loyaltyTier": "BRONZE"
                    }
                    """,
                    escapeJson(name),
                    escapeJson(phone != null ? phone : ""),
                    escapeJson(email != null ? email : ""));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(marketingServiceUrl + "/api/customers"))
                    .header("Content-Type", "application/json")
                    .header("X-Tenant-ID", tenantId.toString())
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                // Parse ID from response (simplified)
                String body = response.body();
                if (body.contains("\"id\":\"")) {
                    int start = body.indexOf("\"id\":\"") + 6;
                    int end = body.indexOf("\"", start);
                    return body.substring(start, end);
                }
            }
            return null;
        } catch (Exception e) {
            log.error("Error creating customer in CRM", e);
            return null;
        }
    }

    private String findCustomerByPhone(UUID tenantId, String phone) {
        if (phone == null || phone.isEmpty())
            return null;

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(marketingServiceUrl + "/api/customers/search?phone=" + phone))
                    .header("X-Tenant-ID", tenantId.toString())
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                String body = response.body();
                if (body.contains("\"id\":\"")) {
                    int start = body.indexOf("\"id\":\"") + 6;
                    int end = body.indexOf("\"", start);
                    return body.substring(start, end);
                }
            }
            return null;
        } catch (Exception e) {
            log.error("Error finding customer by phone", e);
            return null;
        }
    }

    private void recordInteraction(String customerId, String type, String description) {
        try {
            String payload = String.format("""
                    {
                        "type": "%s",
                        "description": "%s",
                        "channel": "RESERVATION_SYSTEM"
                    }
                    """, type, escapeJson(description));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(marketingServiceUrl + "/api/customers/" + customerId + "/interactions"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();

            httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (Exception e) {
            log.error("Error recording interaction", e);
        }
    }

    private void updateLastVisitDate(String customerId) {
        try {
            String payload = String.format("""
                    {
                        "lastPurchaseDate": "%s"
                    }
                    """, LocalDate.now().toString());

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(marketingServiceUrl + "/api/customers/" + customerId))
                    .header("Content-Type", "application/json")
                    .method("PATCH", HttpRequest.BodyPublishers.ofString(payload))
                    .build();

            httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (Exception e) {
            log.error("Error updating last visit date", e);
        }
    }

    private String escapeJson(String input) {
        if (input == null)
            return "";
        return input.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
