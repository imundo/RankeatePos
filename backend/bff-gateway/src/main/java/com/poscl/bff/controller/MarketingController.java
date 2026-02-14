package com.poscl.bff.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

/**
 * BFF Controller for Marketing Service (CRM, Email, Promotions, Reviews,
 * Referrals)
 * Uses a generic proxy approach to forward all /api/marketing/** requests
 */
@RestController
@RequestMapping("/api/marketing")
public class MarketingController {

    private final RestTemplate restTemplate;
    private final String marketingServiceUrl;

    public MarketingController(
            RestTemplate restTemplate,
            @Value("${services.marketing.url}") String marketingServiceUrl) {
        this.restTemplate = restTemplate;
        this.marketingServiceUrl = marketingServiceUrl;
    }

    // ==================== CUSTOMERS (CRM) ====================

    @GetMapping("/customers")
    public ResponseEntity<?> getCustomers(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            String url = marketingServiceUrl + "/api/customers?page=" + page + "&size=" + size;
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (HttpClientErrorException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsString());
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error getting customers", "detail", e.getMessage()));
        }
    }

    @GetMapping("/customers/search")
    public ResponseEntity<?> searchCustomers(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            String url = marketingServiceUrl + "/api/customers/search?query=" + query + "&page=" + page + "&size="
                    + size;
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error searching customers", "detail", e.getMessage()));
        }
    }

    @GetMapping("/customers/{id}")
    public ResponseEntity<?> getCustomer(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        try {
            String url = marketingServiceUrl + "/api/customers/" + id;
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (HttpClientErrorException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsString());
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error getting customer", "detail", e.getMessage()));
        }
    }

    @PostMapping("/customers")
    public ResponseEntity<?> createCustomer(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestBody Map<String, Object> request) {
        try {
            String url = marketingServiceUrl + "/api/customers";
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(request, headers), Object.class);
        } catch (HttpClientErrorException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsString());
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error creating customer", "detail", e.getMessage()));
        }
    }

    @PutMapping("/customers/{id}")
    public ResponseEntity<?> updateCustomer(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {
        try {
            String url = marketingServiceUrl + "/api/customers/" + id;
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.PUT, new HttpEntity<>(request, headers), Object.class);
        } catch (HttpClientErrorException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsString());
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error updating customer", "detail", e.getMessage()));
        }
    }

    @DeleteMapping("/customers/{id}")
    public ResponseEntity<?> deleteCustomer(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        try {
            String url = marketingServiceUrl + "/api/customers/" + id;
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.DELETE, new HttpEntity<>(headers), Object.class);
        } catch (HttpClientErrorException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsString());
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error deleting customer", "detail", e.getMessage()));
        }
    }

    @PostMapping("/customers/{id}/points")
    public ResponseEntity<?> addPoints(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader(value = "X-User-ID", required = false) String userId,
            @PathVariable String id,
            @RequestParam int points,
            @RequestParam(required = false) String description) {
        try {
            String url = marketingServiceUrl + "/api/customers/" + id + "/points?points=" + points
                    + (description != null ? "&description=" + description : "");
            HttpHeaders headers = createHeaders(authHeader, null, userId, null);
            return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error adding points", "detail", e.getMessage()));
        }
    }

    @PostMapping("/customers/{id}/redeem")
    public ResponseEntity<?> redeemPoints(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader(value = "X-User-ID", required = false) String userId,
            @PathVariable String id,
            @RequestParam int points,
            @RequestParam String rewardName) {
        try {
            String url = marketingServiceUrl + "/api/customers/" + id + "/redeem?points=" + points + "&rewardName="
                    + rewardName;
            HttpHeaders headers = createHeaders(authHeader, null, userId, null);
            return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error redeeming points", "detail", e.getMessage()));
        }
    }

    @PostMapping("/customers/{id}/purchase")
    public ResponseEntity<?> recordPurchase(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader(value = "X-User-ID", required = false) String userId,
            @PathVariable String id,
            @RequestParam String amount,
            @RequestParam String saleId) {
        try {
            String url = marketingServiceUrl + "/api/customers/" + id + "/purchase?amount=" + amount + "&saleId="
                    + saleId;
            HttpHeaders headers = createHeaders(authHeader, null, userId, null);
            return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error recording purchase", "detail", e.getMessage()));
        }
    }

    @PostMapping("/customers/{id}/tags")
    public ResponseEntity<?> addTag(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String id,
            @RequestParam String name,
            @RequestParam(defaultValue = "#6366F1") String color) {
        try {
            String url = marketingServiceUrl + "/api/customers/" + id + "/tags?name=" + name + "&color=" + color;
            HttpHeaders headers = createHeaders(authHeader, null, null, null);
            return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body(Map.of("error", "BFF Error adding tag", "detail", e.getMessage()));
        }
    }

    @DeleteMapping("/customers/{id}/tags/{tagId}")
    public ResponseEntity<?> removeTag(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String id,
            @PathVariable String tagId) {
        try {
            String url = marketingServiceUrl + "/api/customers/" + id + "/tags/" + tagId;
            HttpHeaders headers = createHeaders(authHeader, null, null, null);
            return restTemplate.exchange(url, HttpMethod.DELETE, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502).body(Map.of("error", "BFF Error removing tag", "detail", e.getMessage()));
        }
    }

    @GetMapping("/customers/{id}/timeline")
    public ResponseEntity<?> getTimeline(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String id) {
        try {
            String url = marketingServiceUrl + "/api/customers/" + id + "/timeline";
            HttpHeaders headers = createHeaders(authHeader, null, null, null);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error getting timeline", "detail", e.getMessage()));
        }
    }

    @GetMapping("/customers/birthdays")
    public ResponseEntity<?> getBirthdays(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {
        try {
            String url = marketingServiceUrl + "/api/customers/birthdays";
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error getting birthdays", "detail", e.getMessage()));
        }
    }

    @GetMapping("/customers/at-risk")
    public ResponseEntity<?> getAtRiskCustomers(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {
        try {
            String url = marketingServiceUrl + "/api/customers/at-risk";
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error getting at-risk customers", "detail", e.getMessage()));
        }
    }

    @PostMapping("/customers/update-segments")
    public ResponseEntity<?> updateSegments(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {
        try {
            String url = marketingServiceUrl + "/api/customers/update-segments";
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error updating segments", "detail", e.getMessage()));
        }
    }

    @GetMapping("/customers/stats")
    public ResponseEntity<?> getCustomerStats(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {
        try {
            String url = marketingServiceUrl + "/api/customers/stats";
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error getting customer stats", "detail", e.getMessage()));
        }
    }

    @GetMapping("/customers/{id}/score")
    public ResponseEntity<?> getCustomerScore(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        try {
            String url = marketingServiceUrl + "/api/customers/" + id + "/score";
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error getting customer score", "detail", e.getMessage()));
        }
    }

    // ==================== EMAIL CAMPAIGNS ====================

    @GetMapping("/email/templates")
    public ResponseEntity<?> getEmailTemplates(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {
        try {
            String url = marketingServiceUrl + "/api/email/templates";
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error getting email templates", "detail", e.getMessage()));
        }
    }

    @GetMapping("/email/templates/{id}")
    public ResponseEntity<?> getEmailTemplate(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        try {
            String url = marketingServiceUrl + "/api/email/templates/" + id;
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (HttpClientErrorException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsString());
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error getting email template", "detail", e.getMessage()));
        }
    }

    @PostMapping("/email/templates")
    public ResponseEntity<?> createEmailTemplate(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestBody Map<String, Object> request) {
        try {
            String url = marketingServiceUrl + "/api/email/templates";
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(request, headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error creating email template", "detail", e.getMessage()));
        }
    }

    @PutMapping("/email/templates/{id}")
    public ResponseEntity<?> updateEmailTemplate(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {
        try {
            String url = marketingServiceUrl + "/api/email/templates/" + id;
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.PUT, new HttpEntity<>(request, headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error updating email template", "detail", e.getMessage()));
        }
    }

    @DeleteMapping("/email/templates/{id}")
    public ResponseEntity<?> deleteEmailTemplate(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        try {
            String url = marketingServiceUrl + "/api/email/templates/" + id;
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.DELETE, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error deleting email template", "detail", e.getMessage()));
        }
    }

    @GetMapping("/email/templates/{id}/preview")
    public ResponseEntity<?> previewEmailTemplate(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id,
            @RequestParam(required = false) String customerId) {
        try {
            String url = marketingServiceUrl + "/api/email/templates/" + id + "/preview"
                    + (customerId != null ? "?customerId=" + customerId : "");
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error previewing template", "detail", e.getMessage()));
        }
    }

    @GetMapping("/email/campaigns")
    public ResponseEntity<?> getEmailCampaigns(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            String url = marketingServiceUrl + "/api/email/campaigns?page=" + page + "&size=" + size;
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error getting campaigns", "detail", e.getMessage()));
        }
    }

    @GetMapping("/email/campaigns/{id}")
    public ResponseEntity<?> getEmailCampaign(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        try {
            String url = marketingServiceUrl + "/api/email/campaigns/" + id;
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (HttpClientErrorException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsString());
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error getting campaign", "detail", e.getMessage()));
        }
    }

    @PostMapping("/email/campaigns")
    public ResponseEntity<?> createEmailCampaign(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestBody Map<String, Object> request) {
        try {
            String url = marketingServiceUrl + "/api/email/campaigns";
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(request, headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error creating campaign", "detail", e.getMessage()));
        }
    }

    @PostMapping("/email/campaigns/{id}/schedule")
    public ResponseEntity<?> scheduleCampaign(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id,
            @RequestParam String scheduledAt) {
        try {
            String url = marketingServiceUrl + "/api/email/campaigns/" + id + "/schedule?scheduledAt=" + scheduledAt;
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error scheduling campaign", "detail", e.getMessage()));
        }
    }

    @PostMapping("/email/campaigns/{id}/send")
    public ResponseEntity<?> sendCampaign(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        try {
            String url = marketingServiceUrl + "/api/email/campaigns/" + id + "/send";
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error sending campaign", "detail", e.getMessage()));
        }
    }

    @PostMapping("/email/campaigns/{id}/cancel")
    public ResponseEntity<?> cancelCampaign(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        try {
            String url = marketingServiceUrl + "/api/email/campaigns/" + id + "/cancel";
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error canceling campaign", "detail", e.getMessage()));
        }
    }

    @PostMapping("/email/automations/birthday")
    public ResponseEntity<?> sendBirthdayEmails(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {
        try {
            String url = marketingServiceUrl + "/api/email/automations/birthday";
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error sending birthday emails", "detail", e.getMessage()));
        }
    }

    @PostMapping("/email/automations/re-engagement")
    public ResponseEntity<?> sendReEngagementEmails(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam(defaultValue = "60") int daysInactive) {
        try {
            String url = marketingServiceUrl + "/api/email/automations/re-engagement?daysInactive=" + daysInactive;
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error sending re-engagement emails", "detail", e.getMessage()));
        }
    }

    @GetMapping("/email/analytics")
    public ResponseEntity<?> getEmailAnalytics(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {
        try {
            String url = marketingServiceUrl + "/api/email/analytics";
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error getting email analytics", "detail", e.getMessage()));
        }
    }

    // ==================== PROMOTIONS ====================

    @GetMapping("/promotions")
    public ResponseEntity<?> getPromotions(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            String url = marketingServiceUrl + "/api/promotions?page=" + page + "&size=" + size;
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error getting promotions", "detail", e.getMessage()));
        }
    }

    @GetMapping("/promotions/active")
    public ResponseEntity<?> getActivePromotions(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {
        try {
            String url = marketingServiceUrl + "/api/promotions/active";
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error getting active promotions", "detail", e.getMessage()));
        }
    }

    @GetMapping("/promotions/{id}")
    public ResponseEntity<?> getPromotion(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        try {
            String url = marketingServiceUrl + "/api/promotions/" + id;
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (HttpClientErrorException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsString());
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error getting promotion", "detail", e.getMessage()));
        }
    }

    @PostMapping("/promotions")
    public ResponseEntity<?> createPromotion(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestBody Map<String, Object> request) {
        try {
            String url = marketingServiceUrl + "/api/promotions";
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(request, headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error creating promotion", "detail", e.getMessage()));
        }
    }

    @PutMapping("/promotions/{id}")
    public ResponseEntity<?> updatePromotion(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {
        try {
            String url = marketingServiceUrl + "/api/promotions/" + id;
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.PUT, new HttpEntity<>(request, headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error updating promotion", "detail", e.getMessage()));
        }
    }

    @DeleteMapping("/promotions/{id}")
    public ResponseEntity<?> deletePromotion(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        try {
            String url = marketingServiceUrl + "/api/promotions/" + id;
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.DELETE, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error deleting promotion", "detail", e.getMessage()));
        }
    }

    @PostMapping("/promotions/{id}/toggle")
    public ResponseEntity<?> togglePromotion(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        try {
            String url = marketingServiceUrl + "/api/promotions/" + id + "/toggle";
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error toggling promotion", "detail", e.getMessage()));
        }
    }

    @PostMapping("/promotions/{id}/coupons")
    public ResponseEntity<?> createCoupon(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String id,
            @RequestParam String code,
            @RequestParam(required = false) Integer maxUses,
            @RequestParam(required = false) String expiresAt) {
        try {
            StringBuilder urlBuilder = new StringBuilder(
                    marketingServiceUrl + "/api/promotions/" + id + "/coupons?code=" + code);
            if (maxUses != null)
                urlBuilder.append("&maxUses=").append(maxUses);
            if (expiresAt != null)
                urlBuilder.append("&expiresAt=").append(expiresAt);
            HttpHeaders headers = createHeaders(authHeader, null, null, null);
            return restTemplate.exchange(urlBuilder.toString(), HttpMethod.POST, new HttpEntity<>(headers),
                    Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error creating coupon", "detail", e.getMessage()));
        }
    }

    @PostMapping("/promotions/{id}/coupons/generate")
    public ResponseEntity<?> generateCoupons(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String id,
            @RequestParam int quantity,
            @RequestParam(defaultValue = "PROMO") String prefix) {
        try {
            String url = marketingServiceUrl + "/api/promotions/" + id + "/coupons/generate?quantity=" + quantity
                    + "&prefix=" + prefix;
            HttpHeaders headers = createHeaders(authHeader, null, null, null);
            return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error generating coupons", "detail", e.getMessage()));
        }
    }

    @GetMapping("/promotions/{id}/coupons")
    public ResponseEntity<?> getCoupons(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String id) {
        try {
            String url = marketingServiceUrl + "/api/promotions/" + id + "/coupons";
            HttpHeaders headers = createHeaders(authHeader, null, null, null);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error getting coupons", "detail", e.getMessage()));
        }
    }

    @GetMapping("/promotions/validate/{code}")
    public ResponseEntity<?> validateCoupon(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String code,
            @RequestParam String cartTotal,
            @RequestParam(required = false) String segment,
            @RequestParam(required = false) String tier) {
        try {
            StringBuilder urlBuilder = new StringBuilder(
                    marketingServiceUrl + "/api/promotions/validate/" + code + "?cartTotal=" + cartTotal);
            if (segment != null)
                urlBuilder.append("&segment=").append(segment);
            if (tier != null)
                urlBuilder.append("&tier=").append(tier);
            HttpHeaders headers = createHeaders(authHeader, null, null, null);
            return restTemplate.exchange(urlBuilder.toString(), HttpMethod.GET, new HttpEntity<>(headers),
                    Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error validating coupon", "detail", e.getMessage()));
        }
    }

    @PostMapping("/promotions/redeem/{code}")
    public ResponseEntity<?> redeemCoupon(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String code) {
        try {
            String url = marketingServiceUrl + "/api/promotions/redeem/" + code;
            HttpHeaders headers = createHeaders(authHeader, null, null, null);
            return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error redeeming coupon", "detail", e.getMessage()));
        }
    }

    @GetMapping("/promotions/analytics")
    public ResponseEntity<?> getPromotionAnalytics(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {
        try {
            String url = marketingServiceUrl + "/api/promotions/analytics";
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error getting promotion analytics", "detail", e.getMessage()));
        }
    }

    // ==================== REVIEWS ====================

    @GetMapping("/reviews")
    public ResponseEntity<?> getReviews(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            String url = marketingServiceUrl + "/api/reviews?page=" + page + "&size=" + size;
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error getting reviews", "detail", e.getMessage()));
        }
    }

    @GetMapping("/reviews/public")
    public ResponseEntity<?> getPublicReviews(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            String url = marketingServiceUrl + "/api/reviews/public?page=" + page + "&size=" + size;
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error getting public reviews", "detail", e.getMessage()));
        }
    }

    @GetMapping("/reviews/pending")
    public ResponseEntity<?> getPendingReviews(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {
        try {
            String url = marketingServiceUrl + "/api/reviews/pending";
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error getting pending reviews", "detail", e.getMessage()));
        }
    }

    @GetMapping("/reviews/{id}")
    public ResponseEntity<?> getReview(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        try {
            String url = marketingServiceUrl + "/api/reviews/" + id;
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (HttpClientErrorException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsString());
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error getting review", "detail", e.getMessage()));
        }
    }

    @GetMapping("/reviews/customer/{customerId}")
    public ResponseEntity<?> getReviewsByCustomer(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String customerId) {
        try {
            String url = marketingServiceUrl + "/api/reviews/customer/" + customerId;
            HttpHeaders headers = createHeaders(authHeader, null, null, null);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error getting reviews by customer", "detail", e.getMessage()));
        }
    }

    @PostMapping("/reviews")
    public ResponseEntity<?> createReview(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestBody Map<String, Object> request) {
        try {
            String url = marketingServiceUrl + "/api/reviews";
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(request, headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error creating review", "detail", e.getMessage()));
        }
    }

    @PostMapping("/reviews/{id}/approve")
    public ResponseEntity<?> approveReview(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        try {
            String url = marketingServiceUrl + "/api/reviews/" + id + "/approve";
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error approving review", "detail", e.getMessage()));
        }
    }

    @PostMapping("/reviews/{id}/reject")
    public ResponseEntity<?> rejectReview(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        try {
            String url = marketingServiceUrl + "/api/reviews/" + id + "/reject";
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error rejecting review", "detail", e.getMessage()));
        }
    }

    @PostMapping("/reviews/{id}/flag")
    public ResponseEntity<?> flagReview(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        try {
            String url = marketingServiceUrl + "/api/reviews/" + id + "/flag";
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error flagging review", "detail", e.getMessage()));
        }
    }

    @PostMapping("/reviews/{id}/respond")
    public ResponseEntity<?> respondToReview(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestHeader(value = "X-User-ID", required = false) String userId,
            @PathVariable String id,
            @RequestBody String response) {
        try {
            String url = marketingServiceUrl + "/api/reviews/" + id + "/respond";
            HttpHeaders headers = createHeaders(authHeader, tenantId, userId, null);
            return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(response, headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error responding to review", "detail", e.getMessage()));
        }
    }

    @PostMapping("/reviews/{id}/helpful")
    public ResponseEntity<?> markReviewHelpful(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        try {
            String url = marketingServiceUrl + "/api/reviews/" + id + "/helpful";
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error marking review helpful", "detail", e.getMessage()));
        }
    }

    @GetMapping("/reviews/analytics")
    public ResponseEntity<?> getReviewAnalytics(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {
        try {
            String url = marketingServiceUrl + "/api/reviews/analytics";
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error getting review analytics", "detail", e.getMessage()));
        }
    }

    // ==================== REFERRALS ====================

    @GetMapping("/referrals")
    public ResponseEntity<?> getReferrals(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            String url = marketingServiceUrl + "/api/referrals?page=" + page + "&size=" + size;
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error getting referrals", "detail", e.getMessage()));
        }
    }

    @GetMapping("/referrals/pending")
    public ResponseEntity<?> getPendingReferrals(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {
        try {
            String url = marketingServiceUrl + "/api/referrals/pending";
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error getting pending referrals", "detail", e.getMessage()));
        }
    }

    @GetMapping("/referrals/{id}")
    public ResponseEntity<?> getReferral(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        try {
            String url = marketingServiceUrl + "/api/referrals/" + id;
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (HttpClientErrorException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsString());
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error getting referral", "detail", e.getMessage()));
        }
    }

    @GetMapping("/referrals/referrer/{referrerId}")
    public ResponseEntity<?> getReferralsByReferrer(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String referrerId) {
        try {
            String url = marketingServiceUrl + "/api/referrals/referrer/" + referrerId;
            HttpHeaders headers = createHeaders(authHeader, null, null, null);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error getting referrals by referrer", "detail", e.getMessage()));
        }
    }

    @PostMapping("/referrals")
    public ResponseEntity<?> createReferral(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam String referrerId,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String phone) {
        try {
            StringBuilder urlBuilder = new StringBuilder(
                    marketingServiceUrl + "/api/referrals?referrerId=" + referrerId);
            if (email != null)
                urlBuilder.append("&email=").append(email);
            if (phone != null)
                urlBuilder.append("&phone=").append(phone);
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(urlBuilder.toString(), HttpMethod.POST, new HttpEntity<>(headers),
                    Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error creating referral", "detail", e.getMessage()));
        }
    }

    @PostMapping("/referrals/register")
    public ResponseEntity<?> processReferralRegistration(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam String referralCode,
            @RequestParam String referredCustomerId) {
        try {
            String url = marketingServiceUrl + "/api/referrals/register?referralCode=" + referralCode
                    + "&referredCustomerId=" + referredCustomerId;
            HttpHeaders headers = createHeaders(authHeader, null, null, null);
            return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error processing registration", "detail", e.getMessage()));
        }
    }

    @PostMapping("/referrals/convert")
    public ResponseEntity<?> processReferralConversion(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam String referredCustomerId,
            @RequestParam String purchaseAmount) {
        try {
            String url = marketingServiceUrl + "/api/referrals/convert?referredCustomerId=" + referredCustomerId
                    + "&purchaseAmount=" + purchaseAmount;
            HttpHeaders headers = createHeaders(authHeader, null, null, null);
            return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error processing conversion", "detail", e.getMessage()));
        }
    }

    @PostMapping("/referrals/{id}/reward")
    public ResponseEntity<?> rewardReferrer(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {
        try {
            String url = marketingServiceUrl + "/api/referrals/" + id + "/reward";
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error rewarding referrer", "detail", e.getMessage()));
        }
    }

    @GetMapping("/referrals/leaderboard")
    public ResponseEntity<?> getReferralLeaderboard(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam(defaultValue = "10") int limit) {
        try {
            String url = marketingServiceUrl + "/api/referrals/leaderboard?limit=" + limit;
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error getting leaderboard", "detail", e.getMessage()));
        }
    }

    @GetMapping("/referrals/analytics")
    public ResponseEntity<?> getReferralAnalytics(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {
        try {
            String url = marketingServiceUrl + "/api/referrals/analytics";
            HttpHeaders headers = createHeaders(authHeader, tenantId, null, null);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error getting referral analytics", "detail", e.getMessage()));
        }
    }

    @GetMapping("/referrals/link/{referralCode}")
    public ResponseEntity<?> getReferralLink(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String referralCode,
            @RequestParam(defaultValue = "https://rankeate.cl") String baseUrl) {
        try {
            String url = marketingServiceUrl + "/api/referrals/link/" + referralCode + "?baseUrl=" + baseUrl;
            HttpHeaders headers = createHeaders(authHeader, null, null, null);
            return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("error", "BFF Error getting referral link", "detail", e.getMessage()));
        }
    }

    // ==================== HELPER ====================

    private HttpHeaders createHeaders(String authHeader, String tenantId, String userId, String branchId) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (authHeader != null) {
            headers.set("Authorization", authHeader);
        }
        if (tenantId != null) {
            headers.set("X-Tenant-Id", tenantId);
        }
        if (userId != null) {
            headers.set("X-User-Id", userId);
        }
        if (branchId != null) {
            headers.set("X-Branch-ID", branchId);
        }
        return headers;
    }
}
