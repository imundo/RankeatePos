package com.poscl.bff.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;

/**
 * BFF Controller for Billing Service (Facturación Electrónica SII)
 * Proxies requests to the billing-service microservice
 */
@Slf4j
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
            @RequestHeader(value = "X-Emisor-Rut", required = false) String emisorRut,
            @RequestHeader(value = "X-Emisor-RazonSocial", required = false) String emisorRazonSocial,
            @RequestHeader(value = "X-Emisor-Giro", required = false) String emisorGiro,
            @RequestHeader(value = "X-Emisor-Direccion", required = false) String emisorDireccion,
            @RequestHeader(value = "X-Emisor-Comuna", required = false) String emisorComuna,
            @RequestHeader(value = "X-Emisor-Logo-Url", required = false) String emisorLogoUrl,
            @RequestBody Map<String, Object> request) {

        String url = billingServiceUrl + "/api/billing/dte/boleta";
        HttpHeaders headers = createBillingHeaders(authHeader, tenantId, branchId,
                emisorRut, emisorRazonSocial, emisorGiro, emisorDireccion, emisorComuna, emisorLogoUrl);

        return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(request, headers), Object.class);
    }

    @PostMapping("/factura")
    public ResponseEntity<?> emitirFactura(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestHeader(value = "X-Branch-ID", required = false) String branchId,
            @RequestHeader(value = "X-Emisor-Rut", required = false) String emisorRut,
            @RequestHeader(value = "X-Emisor-RazonSocial", required = false) String emisorRazonSocial,
            @RequestHeader(value = "X-Emisor-Giro", required = false) String emisorGiro,
            @RequestHeader(value = "X-Emisor-Direccion", required = false) String emisorDireccion,
            @RequestHeader(value = "X-Emisor-Comuna", required = false) String emisorComuna,
            @RequestHeader(value = "X-Emisor-Logo-Url", required = false) String emisorLogoUrl,
            @RequestBody Map<String, Object> request) {

        String url = billingServiceUrl + "/api/billing/dte/factura";
        HttpHeaders headers = createBillingHeaders(authHeader, tenantId, branchId,
                emisorRut, emisorRazonSocial, emisorGiro, emisorDireccion, emisorComuna, emisorLogoUrl);

        return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(request, headers), Object.class);
    }

    @PostMapping("/nota-credito")
    public ResponseEntity<?> emitirNotaCredito(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestHeader(value = "X-Branch-ID", required = false) String branchId,
            @RequestHeader(value = "X-Emisor-Rut", required = false) String emisorRut,
            @RequestHeader(value = "X-Emisor-RazonSocial", required = false) String emisorRazonSocial,
            @RequestHeader(value = "X-Emisor-Giro", required = false) String emisorGiro,
            @RequestHeader(value = "X-Emisor-Direccion", required = false) String emisorDireccion,
            @RequestHeader(value = "X-Emisor-Comuna", required = false) String emisorComuna,
            @RequestHeader(value = "X-Emisor-Logo-Url", required = false) String emisorLogoUrl,
            @RequestBody Map<String, Object> request) {

        String url = billingServiceUrl + "/api/billing/dte/nota-credito";
        HttpHeaders headers = createBillingHeaders(authHeader, tenantId, branchId,
                emisorRut, emisorRazonSocial, emisorGiro, emisorDireccion, emisorComuna, emisorLogoUrl);

        return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(request, headers), Object.class);
    }

    @PostMapping("/nota-debito")
    public ResponseEntity<?> emitirNotaDebito(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestHeader(value = "X-Branch-ID", required = false) String branchId,
            @RequestHeader(value = "X-Emisor-Rut", required = false) String emisorRut,
            @RequestHeader(value = "X-Emisor-RazonSocial", required = false) String emisorRazonSocial,
            @RequestHeader(value = "X-Emisor-Giro", required = false) String emisorGiro,
            @RequestHeader(value = "X-Emisor-Direccion", required = false) String emisorDireccion,
            @RequestHeader(value = "X-Emisor-Comuna", required = false) String emisorComuna,
            @RequestHeader(value = "X-Emisor-Logo-Url", required = false) String emisorLogoUrl,
            @RequestBody Map<String, Object> request) {

        String url = billingServiceUrl + "/api/billing/dte/nota-debito";
        HttpHeaders headers = createBillingHeaders(authHeader, tenantId, branchId,
                emisorRut, emisorRazonSocial, emisorGiro, emisorDireccion, emisorComuna, emisorLogoUrl);

        return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(request, headers), Object.class);
    }

    // ==================== CONSULTA DE DTEs ====================

    @GetMapping("/dte/ping")
    public ResponseEntity<String> ping() {
        String url = billingServiceUrl + "/api/billing/dte/ping";
        return restTemplate.getForEntity(url, String.class);
    }

    @GetMapping(value = "/dte", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> listarDtes(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam(required = false) String tipoDte,
            @RequestParam(required = false) String estado,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        StringBuilder urlBuilder = new StringBuilder(
                billingServiceUrl + "/api/billing/dte?page=" + page + "&size=" + size);
        if (tipoDte != null)
            urlBuilder.append("&tipoDte=").append(tipoDte);
        if (estado != null)
            urlBuilder.append("&estado=").append(estado);

        HttpHeaders headers = createSimpleHeaders(authHeader, tenantId);

        log.info("BFF: Listar DTEs calling {} with type={}, estado={}", urlBuilder.toString(), tipoDte, estado);
        try {
            ResponseEntity<String> response = restTemplate.exchange(urlBuilder.toString(), HttpMethod.GET,
                    new HttpEntity<>(headers), String.class);
            log.info("BFF: Listar DTEs response status: {}", response.getStatusCode());
            return response;
        } catch (Exception e) {
            log.error("BFF: Error calling Billing Service List DTEs: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"error\": \"Error calling Billing Service\", \"details\": \"" + e.getMessage() + "\"}");
        }
    }

    @GetMapping(value = "/dte/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> getDte(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {

        String url = billingServiceUrl + "/api/billing/dte/" + id;
        HttpHeaders headers = createSimpleHeaders(authHeader, tenantId);

        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), String.class);
    }

    @GetMapping(value = "/dte/{id}/xml", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> getDteXml(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {

        String url = billingServiceUrl + "/api/billing/dte/" + id + "/xml";
        HttpHeaders headers = createSimpleHeaders(authHeader, tenantId);

        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), String.class);
    }

    @GetMapping("/dte/{id}/pdf")
    public ResponseEntity<?> getDtePdf(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable String id) {

        String url = billingServiceUrl + "/api/billing/dte/" + id + "/pdf";
        HttpHeaders headers = createSimpleHeaders(authHeader, tenantId);

        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), byte[].class);
    }

    // ==================== CAF (Folios) ====================

    @GetMapping(value = "/caf", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> listarCafs(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {

        String url = billingServiceUrl + "/api/billing/caf";
        HttpHeaders headers = createSimpleHeaders(authHeader, tenantId);

        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), String.class);
    }

    @GetMapping(value = "/caf/disponibles", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> foliosDisponibles(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {

        String url = billingServiceUrl + "/api/billing/caf/disponibles";
        HttpHeaders headers = createSimpleHeaders(authHeader, tenantId);

        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), String.class);
    }

    @PostMapping("/caf")
    public ResponseEntity<?> uploadCaf(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestBody Map<String, Object> request) {

        String url = billingServiceUrl + "/api/billing/caf";
        HttpHeaders headers = createSimpleHeaders(authHeader, tenantId);

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
                billingServiceUrl + "/api/billing/dte/libro-ventas?desde=" + desde + "&hasta=" + hasta);
        if (tipoDte != null)
            urlBuilder.append("&tipoDte=").append(tipoDte);

        HttpHeaders headers = createSimpleHeaders(authHeader, tenantId);

        return restTemplate.exchange(urlBuilder.toString(), HttpMethod.GET, new HttpEntity<>(headers), Object.class);
    }

    // ==================== CERTIFICACIÓN ====================

    @GetMapping("/certificacion/status")
    public ResponseEntity<?> getCertificationStatus(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader("X-Tenant-ID") String tenantId) {

        String url = billingServiceUrl + "/api/billing/certificacion/status";
        HttpHeaders headers = createSimpleHeaders(authHeader, tenantId);

        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Object.class);
    }

    // ==================== HELPER ====================

    /**
     * Creates headers with emisor information for DTE emission endpoints.
     * Emisor headers are passed through from the frontend (which gets them from
     * tenant data).
     */
    private HttpHeaders createBillingHeaders(String authHeader, String tenantId, String branchId,
            String emisorRut, String emisorRazonSocial, String emisorGiro,
            String emisorDireccion, String emisorComuna, String emisorLogoUrl) {
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
        // Pass through emisor headers from frontend (defaults if not provided)
        headers.set("X-Emisor-Rut", emisorRut != null ? emisorRut : "76.XXX.XXX-X");
        headers.set("X-Emisor-RazonSocial", emisorRazonSocial != null ? emisorRazonSocial : "Mi Empresa");
        if (emisorGiro != null)
            headers.set("X-Emisor-Giro", emisorGiro);
        if (emisorDireccion != null)
            headers.set("X-Emisor-Direccion", emisorDireccion);
        if (emisorComuna != null)
            headers.set("X-Emisor-Comuna", emisorComuna);
        if (emisorLogoUrl != null)
            headers.set("X-Emisor-Logo-Url", emisorLogoUrl);
        return headers;
    }

    /**
     * Creates simple headers for GET requests that don't need emisor info.
     */
    private HttpHeaders createSimpleHeaders(String authHeader, String tenantId) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (authHeader != null) {
            headers.set("Authorization", authHeader);
        }
        if (tenantId != null) {
            headers.set("X-Tenant-Id", tenantId);
        }
        return headers;
    }
}
