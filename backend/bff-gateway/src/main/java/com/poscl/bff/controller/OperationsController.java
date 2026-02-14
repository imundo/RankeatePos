package com.poscl.bff.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * BFF Controller for Operations Service (Loyalty, KDS, Reservations,
 * Subscriptions)
 * Proxies requests to the operations-service microservice
 */
@RestController
@RequestMapping("/api")
public class OperationsController {

    private final RestTemplate restTemplate;
    private final String operationsServiceUrl;

    public OperationsController(
            RestTemplate restTemplate,
            @Value("${services.operations.url}") String operationsServiceUrl) {
        this.restTemplate = restTemplate;
        this.operationsServiceUrl = operationsServiceUrl;
    }

    // ==================== LOYALTY ====================

    @GetMapping("/loyalty/customers")
    public ResponseEntity<?> getLoyaltyCustomers(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        try {
            String url = operationsServiceUrl + "/api/loyalty/customers?page=" + page + "&size=" + size;
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error getting loyalty customers: " + e.getMessage());
        }
    }

    @GetMapping("/loyalty/customers/search")
    public ResponseEntity<?> searchLoyaltyCustomers(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam String q) {

        try {
            String url = operationsServiceUrl + "/api/loyalty/customers/search?q=" + q;
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error searching loyalty customers: " + e.getMessage());
        }
    }

    @GetMapping("/loyalty/customers/{id}")
    public ResponseEntity<?> getLoyaltyCustomer(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String id) {

        String url = operationsServiceUrl + "/api/loyalty/customers/" + id;
        HttpHeaders headers = createHeaders(authHeader, null);

        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
    }

    @PostMapping("/loyalty/customers")
    public ResponseEntity<?> createLoyaltyCustomer(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestBody Map<String, Object> request) {

        String url = operationsServiceUrl + "/api/loyalty/customers";
        HttpHeaders headers = createHeaders(authHeader, tenantId);

        return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(request, headers), Object.class);
    }

    @PutMapping("/loyalty/customers/{id}")
    public ResponseEntity<?> updateLoyaltyCustomer(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {

        String url = operationsServiceUrl + "/api/loyalty/customers/" + id;
        HttpHeaders headers = createHeaders(authHeader, null);

        return restTemplate.exchange(url, HttpMethod.PUT, new HttpEntity<>(request, headers), Object.class);
    }

    @PostMapping("/loyalty/customers/{id}/points")
    public ResponseEntity<?> addPoints(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {

        String url = operationsServiceUrl + "/api/loyalty/customers/" + id + "/points";
        HttpHeaders headers = createHeaders(authHeader, null);

        return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(request, headers), Object.class);
    }

    @PostMapping("/loyalty/customers/{id}/redeem")
    public ResponseEntity<?> redeemPoints(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {

        String url = operationsServiceUrl + "/api/loyalty/customers/" + id + "/redeem";
        HttpHeaders headers = createHeaders(authHeader, null);

        return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(request, headers), Object.class);
    }

    @GetMapping("/loyalty/customers/{id}/transactions")
    public ResponseEntity<?> getTransactions(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String id) {

        String url = operationsServiceUrl + "/api/loyalty/customers/" + id + "/transactions";
        HttpHeaders headers = createHeaders(authHeader, null);

        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
    }

    @GetMapping("/loyalty/rewards")
    public ResponseEntity<?> getRewards(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {

        String url = operationsServiceUrl + "/api/loyalty/rewards";
        HttpHeaders headers = createHeaders(authHeader, tenantId);

        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
    }

    @GetMapping("/loyalty/stats")
    public ResponseEntity<?> getLoyaltyStats(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {

        String url = operationsServiceUrl + "/api/loyalty/stats";
        HttpHeaders headers = createHeaders(authHeader, tenantId);

        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
    }

    // ==================== KDS ====================

    @GetMapping("/kds/orders")
    public ResponseEntity<?> getKdsOrders(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestHeader(value = "X-Branch-ID", required = false) String branchId) {

        String url = operationsServiceUrl + "/api/kds/orders";
        HttpHeaders headers = createHeaders(authHeader, tenantId);
        if (branchId != null) {
            headers.set("X-Branch-ID", branchId);
        }

        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
    }

    @PutMapping("/kds/orders/{id}/status")
    public ResponseEntity<?> updateKdsOrderStatus(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {

        String url = operationsServiceUrl + "/api/kds/orders/" + id + "/status";
        HttpHeaders headers = createHeaders(authHeader, null);

        return restTemplate.exchange(url, HttpMethod.PUT, new HttpEntity<>(request, headers), Object.class);
    }

    @GetMapping("/kds/stats")
    public ResponseEntity<?> getKdsStats(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {

        String url = operationsServiceUrl + "/api/kds/stats";
        HttpHeaders headers = createHeaders(authHeader, tenantId);

        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
    }

    // ==================== RESERVATIONS ====================

    @GetMapping("/ping")
    public ResponseEntity<?> ping() {
        try {
            String url = operationsServiceUrl + "/actuator/health";
            return restTemplate.getForEntity(url, Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Pong Error: " + e.getMessage());
        }
    }

    @GetMapping("/reservations")
    public ResponseEntity<?> getReservations(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam(required = false) String date) {

        try {
            String url = operationsServiceUrl + "/api/reservations" + (date != null ? "?date=" + date : "");
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error getting reservations: " + e.getMessage());
        }
    }

    @PostMapping("/reservations")
    public ResponseEntity<?> createReservation(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestBody Map<String, Object> request) {

        String url = operationsServiceUrl + "/api/reservations";
        HttpHeaders headers = createHeaders(authHeader, tenantId);

        return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(request, headers), Object.class);
    }

    @PutMapping("/reservations/{id}/status")
    public ResponseEntity<?> updateReservationStatus(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {

        String url = operationsServiceUrl + "/api/reservations/" + id + "/status";
        HttpHeaders headers = createHeaders(authHeader, null);

        return restTemplate.exchange(url, HttpMethod.PUT, new HttpEntity<>(request, headers), Object.class);
    }

    @GetMapping("/reservations/tables")
    public ResponseEntity<?> getTables(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {

        String url = operationsServiceUrl + "/api/reservations/tables";
        HttpHeaders headers = createHeaders(authHeader, tenantId);

        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
    }

    // ==================== SUBSCRIPTIONS ====================

    @GetMapping("/subscriptions")
    public ResponseEntity<?> getSubscriptions(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {

        String url = operationsServiceUrl + "/api/subscriptions";
        HttpHeaders headers = createHeaders(authHeader, tenantId);

        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
    }

    @GetMapping("/subscriptions/plans")
    public ResponseEntity<?> getSubscriptionPlans(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {

        String url = operationsServiceUrl + "/api/subscriptions/plans";
        HttpHeaders headers = createHeaders(authHeader, tenantId);

        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
    }

    @GetMapping("/subscriptions/deliveries")
    public ResponseEntity<?> getDeliveries(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam(required = false) String date) {

        String url = operationsServiceUrl + "/api/subscriptions/deliveries" + (date != null ? "?date=" + date : "");
        HttpHeaders headers = createHeaders(authHeader, tenantId);

        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
    }

    @PutMapping("/subscriptions/deliveries/{id}/status")
    public ResponseEntity<?> updateDeliveryStatus(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {

        String url = operationsServiceUrl + "/api/subscriptions/deliveries/" + id + "/status";
        HttpHeaders headers = createHeaders(authHeader, null);

        return restTemplate.exchange(url, HttpMethod.PUT, new HttpEntity<>(request, headers), Object.class);
    }

    // ==================== AUTOMATIONS ====================

    @GetMapping("/automations")
    public ResponseEntity<?> getAutomations(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {

        try {
            String url = operationsServiceUrl + "/api/automations";
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error getting automations: " + e.getMessage());
        }
    }

    @PostMapping("/automations/{id}/toggle")
    public ResponseEntity<?> toggleAutomation(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String id) {

        String url = operationsServiceUrl + "/api/automations/" + id + "/toggle";
        HttpHeaders headers = createHeaders(authHeader, null);

        return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(headers), Object.class);
    }

    @GetMapping("/automations/config")
    public ResponseEntity<?> getAutomationConfig(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {

        String url = operationsServiceUrl + "/api/automations/config";
        HttpHeaders headers = createHeaders(authHeader, tenantId);

        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
    }

    @PostMapping("/automations/config")
    public ResponseEntity<?> saveAutomationConfig(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestBody Map<String, Object> request) {

        String url = operationsServiceUrl + "/api/automations/config";
        HttpHeaders headers = createHeaders(authHeader, tenantId);

        return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(request, headers), Object.class);
    }

    @GetMapping("/automations/logs")
    public ResponseEntity<?> getAutomationLogs(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam(required = false) String automationId) {

        String url = operationsServiceUrl + "/api/automations/logs"
                + (automationId != null ? "?automationId=" + automationId : "");
        HttpHeaders headers = createHeaders(authHeader, tenantId);

        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
    }

    // ==================== PRICE LISTS ====================

    @GetMapping("/price-lists")
    public ResponseEntity<?> getPriceLists(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {
        try {
            String url = operationsServiceUrl + "/api/price-lists";
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error getting price lists: " + e.getMessage());
        }
    }

    @GetMapping("/price-lists/active")
    public ResponseEntity<?> getActivePriceLists(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {
        try {
            String url = operationsServiceUrl + "/api/price-lists/active";
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error getting active price lists: " + e.getMessage());
        }
    }

    @GetMapping("/price-lists/{id}")
    public ResponseEntity<?> getPriceList(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        try {
            String url = operationsServiceUrl + "/api/price-lists/" + id;
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error getting price list: " + e.getMessage());
        }
    }

    @PostMapping("/price-lists")
    public ResponseEntity<?> createPriceList(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestBody Object request) {
        try {
            String url = operationsServiceUrl + "/api/price-lists";
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(request, headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error creating price list: " + e.getMessage());
        }
    }

    @PutMapping("/price-lists/{id}")
    public ResponseEntity<?> updatePriceList(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id,
            @RequestBody Object request) {
        try {
            String url = operationsServiceUrl + "/api/price-lists/" + id;
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, HttpMethod.PUT, new HttpEntity<>(request, headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error updating price list: " + e.getMessage());
        }
    }

    @DeleteMapping("/price-lists/{id}")
    public ResponseEntity<?> deletePriceList(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        try {
            String url = operationsServiceUrl + "/api/price-lists/" + id;
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, HttpMethod.DELETE, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error deleting price list: " + e.getMessage());
        }
    }

    @GetMapping("/price-lists/{id}/items")
    public ResponseEntity<?> getPriceListItems(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        try {
            String url = operationsServiceUrl + "/api/price-lists/" + id + "/items";
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error getting price list items: " + e.getMessage());
        }
    }

    @PostMapping("/price-lists/{id}/items")
    public ResponseEntity<?> setPriceListItem(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id,
            @RequestBody Object request) {
        try {
            String url = operationsServiceUrl + "/api/price-lists/" + id + "/items";
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(request, headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error setting price: " + e.getMessage());
        }
    }

    @GetMapping("/price-lists/resolve")
    public ResponseEntity<?> resolvePrice(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam String productoId,
            @RequestParam String precioBase,
            @RequestParam(required = false) String sucursalId,
            @RequestParam(required = false) String clienteId) {
        try {
            StringBuilder url = new StringBuilder(operationsServiceUrl + "/api/price-lists/resolve?productoId="
                    + productoId + "&precioBase=" + precioBase);
            if (sucursalId != null)
                url.append("&sucursalId=").append(sucursalId);
            if (clienteId != null)
                url.append("&clienteId=").append(clienteId);
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url.toString(), HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error resolving price: " + e.getMessage());
        }
    }

    // ==================== APPOINTMENTS ====================

    @GetMapping("/operations/appointments")
    public ResponseEntity<?> getAppointments(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            String url = operationsServiceUrl + "/api/appointments?page=" + page + "&size=" + size;
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error getting appointments: " + e.getMessage());
        }
    }

    @GetMapping("/operations/appointments/{id}")
    public ResponseEntity<?> getAppointment(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        try {
            String url = operationsServiceUrl + "/api/appointments/" + id;
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error getting appointment: " + e.getMessage());
        }
    }

    @GetMapping("/operations/appointments/date")
    public ResponseEntity<?> getAppointmentsByDate(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam String fecha) {
        try {
            String url = operationsServiceUrl + "/api/appointments/date?fecha=" + fecha;
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error getting appointments by date: " + e.getMessage());
        }
    }

    @GetMapping("/operations/appointments/range")
    public ResponseEntity<?> getAppointmentsByRange(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam String start,
            @RequestParam String end) {
        try {
            String url = operationsServiceUrl + "/api/appointments/range?start=" + start + "&end=" + end;
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error getting appointments by range: " + e.getMessage());
        }
    }

    @GetMapping("/operations/appointments/staff/{staffId}")
    public ResponseEntity<?> getAppointmentsByStaff(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String staffId,
            @RequestParam String fecha) {
        try {
            String url = operationsServiceUrl + "/api/appointments/staff/" + staffId + "?fecha=" + fecha;
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error getting staff appointments: " + e.getMessage());
        }
    }

    @GetMapping("/operations/appointments/customer/{customerId}")
    public ResponseEntity<?> getAppointmentsByCustomer(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String customerId) {
        try {
            String url = operationsServiceUrl + "/api/appointments/customer/" + customerId;
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error getting customer appointments: " + e.getMessage());
        }
    }

    @PostMapping("/operations/appointments")
    public ResponseEntity<?> createAppointment(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestBody Map<String, Object> request) {
        try {
            String url = operationsServiceUrl + "/api/appointments";
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(request, headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error creating appointment: " + e.getMessage());
        }
    }

    @PutMapping("/operations/appointments/{id}")
    public ResponseEntity<?> updateAppointment(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {
        try {
            String url = operationsServiceUrl + "/api/appointments/" + id;
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, HttpMethod.PUT, new HttpEntity<>(request, headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error updating appointment: " + e.getMessage());
        }
    }

    @PutMapping("/operations/appointments/{id}/status")
    public ResponseEntity<?> updateAppointmentStatus(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {
        try {
            String url = operationsServiceUrl + "/api/appointments/" + id + "/status";
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, HttpMethod.PUT, new HttpEntity<>(request, headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error updating appointment status: " + e.getMessage());
        }
    }

    @PutMapping("/operations/appointments/{id}/reschedule")
    public ResponseEntity<?> rescheduleAppointment(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {
        try {
            String url = operationsServiceUrl + "/api/appointments/" + id + "/reschedule";
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, HttpMethod.PUT, new HttpEntity<>(request, headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error rescheduling appointment: " + e.getMessage());
        }
    }

    @DeleteMapping("/operations/appointments/{id}")
    public ResponseEntity<?> deleteAppointment(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        try {
            String url = operationsServiceUrl + "/api/appointments/" + id;
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, HttpMethod.DELETE, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error deleting appointment: " + e.getMessage());
        }
    }

    // ==================== APPOINTMENT SLOTS ====================

    @GetMapping("/operations/appointments/available-slots")
    public ResponseEntity<?> getAvailableSlots(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam String fecha,
            @RequestParam(required = false) String serviceId,
            @RequestParam(required = false) String staffId) {
        try {
            StringBuilder url = new StringBuilder(
                    operationsServiceUrl + "/api/appointments/available-slots?fecha=" + fecha);
            if (serviceId != null)
                url.append("&serviceId=").append(serviceId);
            if (staffId != null)
                url.append("&staffId=").append(staffId);
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url.toString(), HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error getting available slots: " + e.getMessage());
        }
    }

    // ==================== APPOINTMENT CALENDAR & STATS ====================

    @GetMapping("/operations/appointments/calendar")
    public ResponseEntity<?> getAppointmentCalendar(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam int year,
            @RequestParam int month) {
        try {
            String url = operationsServiceUrl + "/api/appointments/calendar?year=" + year + "&month=" + month;
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error getting appointment calendar: " + e.getMessage());
        }
    }

    @GetMapping("/operations/appointments/stats")
    public ResponseEntity<?> getAppointmentStats(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {
        try {
            String url = operationsServiceUrl + "/api/appointments/stats";
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error getting appointment stats: " + e.getMessage());
        }
    }

    // ==================== APPOINTMENT SERVICES CATALOG ====================

    @GetMapping("/operations/appointments/services")
    public ResponseEntity<?> getAppointmentServices(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {
        try {
            String url = operationsServiceUrl + "/api/appointments/services";
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error getting appointment services: " + e.getMessage());
        }
    }

    @GetMapping("/operations/appointments/services/all")
    public ResponseEntity<?> getAllAppointmentServices(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {
        try {
            String url = operationsServiceUrl + "/api/appointments/services/all";
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error getting all services: " + e.getMessage());
        }
    }

    @GetMapping("/operations/appointments/services/{id}")
    public ResponseEntity<?> getAppointmentService(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        try {
            String url = operationsServiceUrl + "/api/appointments/services/" + id;
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error getting service: " + e.getMessage());
        }
    }

    @PostMapping("/operations/appointments/services")
    public ResponseEntity<?> createAppointmentService(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestBody Map<String, Object> request) {
        try {
            String url = operationsServiceUrl + "/api/appointments/services";
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(request, headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error creating service: " + e.getMessage());
        }
    }

    @PutMapping("/operations/appointments/services/{id}")
    public ResponseEntity<?> updateAppointmentService(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {
        try {
            String url = operationsServiceUrl + "/api/appointments/services/" + id;
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, HttpMethod.PUT, new HttpEntity<>(request, headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error updating service: " + e.getMessage());
        }
    }

    @DeleteMapping("/operations/appointments/services/{id}")
    public ResponseEntity<?> deleteAppointmentService(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        try {
            String url = operationsServiceUrl + "/api/appointments/services/" + id;
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, HttpMethod.DELETE, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error deleting service: " + e.getMessage());
        }
    }

    // ==================== STAFF AVAILABILITY ====================

    @GetMapping("/operations/appointments/staff-availability")
    public ResponseEntity<?> getStaffAvailability(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {
        try {
            String url = operationsServiceUrl + "/api/appointments/staff-availability";
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error getting staff availability: " + e.getMessage());
        }
    }

    @GetMapping("/operations/appointments/staff-availability/{staffId}")
    public ResponseEntity<?> getStaffSchedule(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String staffId) {
        try {
            String url = operationsServiceUrl + "/api/appointments/staff-availability/" + staffId;
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error getting staff schedule: " + e.getMessage());
        }
    }

    @PostMapping("/operations/appointments/staff-availability/{staffId}/schedule")
    public ResponseEntity<?> saveStaffSchedule(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String staffId,
            @RequestBody Object request) {
        try {
            String url = operationsServiceUrl + "/api/appointments/staff-availability/" + staffId + "/schedule";
            HttpHeaders headers = createHeaders(authHeader, tenantId);
            return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(request, headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body("BFF Error saving staff schedule: " + e.getMessage());
        }
    }

    // ==================== HELPER ====================

    private HttpHeaders createHeaders(String authHeader, String tenantId) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (authHeader != null) {
            headers.set("Authorization", authHeader);
        }
        if (tenantId != null) {
            headers.set("X-Tenant-ID", tenantId);
        }
        return headers;
    }
}
