package com.poscl.bff.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * BFF Controller for Billing Service (Facturación Electrónica SII)
 * Proxies requests to the billing-service microservice
 */
@RestController
@RequestMapping("/api/billing")
public class BillingController {

    private final RestTemplate restTemplate;
    private final String billingServiceUrl;

    public BillingController(
            RestTemplate restTemplate,
            @Value("${services.billing.url}") String billingServiceUrl) {
        this.restTemplate = restTemplate;
        this.billingServiceUrl = billingServiceUrl;
    }

    // ==================== EMISION DE DTEs ====================

    @PostMapping("/boleta")
    public ResponseEntity<?> emitirBoleta(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestHeader(value = "X-Branch-ID", required = false) String branchId,
            @RequestBody Map<String, Object> request) {

        String url = billingServiceUrl + "/api/dte/boleta";
        HttpHeaders headers = createBillingHeaders(authHeader, tenantId, branchId);

        return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(request, headers), Object.class);
    }

    @PostMapping("/factura")
    public ResponseEntity<?> emitirFactura(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestHeader(value = "X-Branch-ID", required = false) String branchId,
            @RequestBody Map<String, Object> request) {

        String url = billingServiceUrl + "/api/dte/factura";
        HttpHeaders headers = createBillingHeaders(authHeader, tenantId, branchId);

        return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(request, headers), Object.class);
    }

    @PostMapping("/nota-credito")
    public ResponseEntity<?> emitirNotaCredito(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestHeader(value = "X-Branch-ID", required = false) String branchId,
            @RequestBody Map<String, Object> request) {

        String url = billingServiceUrl + "/api/dte/nota-credito";
        HttpHeaders headers = createBillingHeaders(authHeader, tenantId, branchId);

        return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(request, headers), Object.class);
    }

    @PostMapping("/nota-debito")
    public ResponseEntity<?> emitirNotaDebito(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestHeader(value = "X-Branch-ID", required = false) String branchId,
            @RequestBody Map<String, Object> request) {

        String url = billingServiceUrl + "/api/dte/nota-debito";
        HttpHeaders headers = createBillingHeaders(authHeader, tenantId, branchId);

        return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(request, headers), Object.class);
    }

    // ==================== CONSULTA DE DTEs ====================

    @GetMapping("/dte")
    public ResponseEntity<?> listarDtes(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam(required = false) String tipoDte,
            @RequestParam(required = false) String estado,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        StringBuilder urlBuilder = new StringBuilder(billingServiceUrl + "/api/dte?page=" + page + "&size=" + size);
        if (tipoDte != null)
            urlBuilder.append("&tipoDte=").append(tipoDte);
        if (estado != null)
            urlBuilder.append("&estado=").append(estado);

        HttpHeaders headers = createBillingHeaders(authHeader, tenantId, null);

        return restTemplate.exchange(urlBuilder.toString(), HttpMethod.GET, new HttpEntity<>(headers), Object.class);
    }

    @GetMapping("/dte/{id}")
    public ResponseEntity<?> getDte(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {

        String url = billingServiceUrl + "/api/dte/" + id;
        HttpHeaders headers = createBillingHeaders(authHeader, tenantId, null);

        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
    }

    @GetMapping("/dte/{id}/xml")
    public ResponseEntity<?> getDteXml(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {

        String url = billingServiceUrl + "/api/dte/" + id + "/xml";
        HttpHeaders headers = createBillingHeaders(authHeader, tenantId, null);

        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
    }

    @GetMapping("/dte/{id}/pdf")
    public ResponseEntity<?> getDtePdf(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {

        String url = billingServiceUrl + "/api/dte/" + id + "/pdf";
        HttpHeaders headers = createBillingHeaders(authHeader, tenantId, null);

        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), byte[].class);
    }

    // ==================== CAF (Folios) ====================

    @GetMapping("/caf")
    public ResponseEntity<?> listarCafs(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {

        String url = billingServiceUrl + "/api/caf";
        HttpHeaders headers = createBillingHeaders(authHeader, tenantId, null);

        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
    }

    @GetMapping("/caf/disponibles")
    public ResponseEntity<?> foliosDisponibles(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {

        String url = billingServiceUrl + "/api/caf/disponibles";
        HttpHeaders headers = createBillingHeaders(authHeader, tenantId, null);

        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
    }

    @PostMapping("/caf")
    public ResponseEntity<?> uploadCaf(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestBody Map<String, Object> request) {

        String url = billingServiceUrl + "/api/caf";
        HttpHeaders headers = createBillingHeaders(authHeader, tenantId, null);

        return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(request, headers), Object.class);
    }

    // ==================== LIBRO DE VENTAS ====================

    @GetMapping("/libro-ventas")
    public ResponseEntity<?> getLibroVentas(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam String desde,
            @RequestParam String hasta,
            @RequestParam(required = false) String tipoDte) {

        StringBuilder urlBuilder = new StringBuilder(
                billingServiceUrl + "/api/dte/libro-ventas?desde=" + desde + "&hasta=" + hasta);
        if (tipoDte != null)
            urlBuilder.append("&tipoDte=").append(tipoDte);

        HttpHeaders headers = createBillingHeaders(authHeader, tenantId, null);

        return restTemplate.exchange(urlBuilder.toString(), HttpMethod.GET, new HttpEntity<>(headers), Object.class);
    }

    // ==================== CERTIFICACIÓN ====================

    @GetMapping("/certificacion/status")
    public ResponseEntity<?> getCertificationStatus(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {

        String url = billingServiceUrl + "/api/certificacion/status";
        HttpHeaders headers = createBillingHeaders(authHeader, tenantId, null);

        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
    }

    // ==================== HELPER ====================

    private HttpHeaders createBillingHeaders(String authHeader, String tenantId, String branchId) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (authHeader != null) {
            headers.set("Authorization", authHeader);
        }
        if (tenantId != null) {
            headers.set("X-Tenant-Id", tenantId);
        }
        if (branchId != null) {
            headers.set("X-Branch-Id", branchId);
        }
        // Set default emisor headers (would come from tenant config in production)
        headers.set("X-Emisor-Rut", "76.XXX.XXX-X");
        headers.set("X-Emisor-RazonSocial", "Empresa Demo");
        headers.set("X-Emisor-Giro", "Comercio");
        headers.set("X-Emisor-Direccion", "Dirección Demo");
        headers.set("X-Emisor-Comuna", "Santiago");
        return headers;
    }
}
