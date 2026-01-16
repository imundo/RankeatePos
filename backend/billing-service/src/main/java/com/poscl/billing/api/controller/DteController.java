package com.poscl.billing.api.controller;

import com.poscl.billing.api.dto.DteResponse;
import com.poscl.billing.api.dto.EmitirDteRequest;
import com.poscl.billing.application.service.DteService;
import com.poscl.billing.domain.enums.EstadoDte;
import com.poscl.billing.domain.enums.TipoDte;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Controller para gestión de Documentos Tributarios Electrónicos
 */
@Slf4j
@RestController
@RequestMapping("/api/billing/dte")
@RequiredArgsConstructor
@Tag(name = "DTEs", description = "Gestión de Documentos Tributarios Electrónicos")
public class DteController {

        private final DteService dteService;

        @PostMapping("/boleta")
        @Operation(summary = "Emitir Boleta Electrónica")
        public ResponseEntity<DteResponse> emitirBoleta(
                        @RequestHeader("X-Tenant-Id") UUID tenantId,
                        @RequestHeader("X-Branch-Id") UUID branchId,
                        @RequestHeader(value = "X-User-Id", required = false) UUID userId,
                        @RequestHeader("X-Emisor-Rut") String emisorRut,
                        @RequestHeader("X-Emisor-RazonSocial") String emisorRazonSocial,
                        @RequestHeader(value = "X-Emisor-Giro", required = false) String emisorGiro,
                        @RequestHeader(value = "X-Emisor-Direccion", required = false) String emisorDireccion,
                        @RequestHeader(value = "X-Emisor-Comuna", required = false) String emisorComuna,
                        @RequestHeader(value = "X-Emisor-Logo-Url", required = false) String emisorLogoUrl,
                        @Valid @RequestBody EmitirDteRequest request) {

                log.info("POST /api/billing/dte/boleta - Tenant: {}", tenantId);

                // Forzar tipo boleta
                request.setTipoDte(TipoDte.BOLETA_ELECTRONICA);

                DteResponse response = dteService.emitirDte(
                                tenantId, branchId, request,
                                emisorRut, emisorRazonSocial, emisorGiro,
                                emisorDireccion, emisorComuna, emisorLogoUrl, userId);

                return ResponseEntity.status(HttpStatus.CREATED).body(response);
        }

        @PostMapping("/factura")
        @Operation(summary = "Emitir Factura Electrónica")
        public ResponseEntity<DteResponse> emitirFactura(
                        @RequestHeader("X-Tenant-Id") UUID tenantId,
                        @RequestHeader("X-Branch-Id") UUID branchId,
                        @RequestHeader(value = "X-User-Id", required = false) UUID userId,
                        @RequestHeader("X-Emisor-Rut") String emisorRut,
                        @RequestHeader("X-Emisor-RazonSocial") String emisorRazonSocial,
                        @RequestHeader(value = "X-Emisor-Giro", required = false) String emisorGiro,
                        @RequestHeader(value = "X-Emisor-Direccion", required = false) String emisorDireccion,
                        @RequestHeader(value = "X-Emisor-Comuna", required = false) String emisorComuna,
                        @RequestHeader(value = "X-Emisor-Logo-Url", required = false) String emisorLogoUrl,
                        @Valid @RequestBody EmitirDteRequest request) {

                log.info("POST /api/billing/dte/factura - Tenant: {}", tenantId);

                // Forzar tipo factura
                request.setTipoDte(TipoDte.FACTURA_ELECTRONICA);

                DteResponse response = dteService.emitirDte(
                                tenantId, branchId, request,
                                emisorRut, emisorRazonSocial, emisorGiro,
                                emisorDireccion, emisorComuna, emisorLogoUrl, userId);

                return ResponseEntity.status(HttpStatus.CREATED).body(response);
        }

        @PostMapping("/nota-credito")
        @Operation(summary = "Emitir Nota de Crédito Electrónica")
        public ResponseEntity<DteResponse> emitirNotaCredito(
                        @RequestHeader("X-Tenant-Id") UUID tenantId,
                        @RequestHeader("X-Branch-Id") UUID branchId,
                        @RequestHeader(value = "X-User-Id", required = false) UUID userId,
                        @RequestHeader("X-Emisor-Rut") String emisorRut,
                        @RequestHeader("X-Emisor-RazonSocial") String emisorRazonSocial,
                        @RequestHeader(value = "X-Emisor-Giro", required = false) String emisorGiro,
                        @RequestHeader(value = "X-Emisor-Direccion", required = false) String emisorDireccion,
                        @RequestHeader(value = "X-Emisor-Comuna", required = false) String emisorComuna,
                        @Valid @RequestBody EmitirDteRequest request) {

                log.info("POST /api/billing/dte/nota-credito - Tenant: {}", tenantId);

                request.setTipoDte(TipoDte.NOTA_CREDITO);

                DteResponse response = dteService.emitirDte(
                                tenantId, branchId, request,
                                emisorRut, emisorRazonSocial, emisorGiro,
                                emisorDireccion, emisorComuna, userId);

                return ResponseEntity.status(HttpStatus.CREATED).body(response);
        }

        @PostMapping("/nota-debito")
        @Operation(summary = "Emitir Nota de Débito Electrónica")
        public ResponseEntity<DteResponse> emitirNotaDebito(
                        @RequestHeader("X-Tenant-Id") UUID tenantId,
                        @RequestHeader("X-Branch-Id") UUID branchId,
                        @RequestHeader(value = "X-User-Id", required = false) UUID userId,
                        @RequestHeader("X-Emisor-Rut") String emisorRut,
                        @RequestHeader("X-Emisor-RazonSocial") String emisorRazonSocial,
                        @RequestHeader(value = "X-Emisor-Giro", required = false) String emisorGiro,
                        @RequestHeader(value = "X-Emisor-Direccion", required = false) String emisorDireccion,
                        @RequestHeader(value = "X-Emisor-Comuna", required = false) String emisorComuna,
                        @Valid @RequestBody EmitirDteRequest request) {

                log.info("POST /api/billing/dte/nota-debito - Tenant: {}", tenantId);

                request.setTipoDte(TipoDte.NOTA_DEBITO);

                DteResponse response = dteService.emitirDte(
                                tenantId, branchId, request,
                                emisorRut, emisorRazonSocial, emisorGiro,
                                emisorDireccion, emisorComuna, userId);

                return ResponseEntity.status(HttpStatus.CREATED).body(response);
        }

        @GetMapping
        @Operation(summary = "Listar DTEs")
        public ResponseEntity<Page<DteResponse>> listarDtes(
                        @RequestHeader("X-Tenant-Id") UUID tenantId,
                        @RequestParam(required = false) TipoDte tipoDte,
                        @RequestParam(required = false) EstadoDte estado,
                        @PageableDefault(size = 20) Pageable pageable) {

                log.info("GET /api/billing/dte - Tenant: {}, Tipo: {}, Estado: {}", tenantId, tipoDte, estado);

                Page<DteResponse> dtes = dteService.listarDtes(tenantId, tipoDte, estado, pageable);
                return ResponseEntity.ok(dtes);
        }

        @GetMapping("/{id}")
        @Operation(summary = "Obtener DTE por ID")
        public ResponseEntity<DteResponse> getDte(
                        @RequestHeader("X-Tenant-Id") UUID tenantId,
                        @PathVariable UUID id) {

                log.info("GET /api/billing/dte/{} - Tenant: {}", id, tenantId);

                DteResponse dte = dteService.getDte(tenantId, id);
                return ResponseEntity.ok(dte);
        }

        @GetMapping("/{id}/xml")
        @Operation(summary = "Descargar XML del DTE")
        public ResponseEntity<String> getXml(
                        @RequestHeader("X-Tenant-Id") UUID tenantId,
                        @PathVariable UUID id) {

                DteResponse dte = dteService.getDte(tenantId, id);
                // TODO: Retornar XML real
                return ResponseEntity.ok()
                                .header("Content-Type", "application/xml")
                                .header("Content-Disposition",
                                                "attachment; filename=\"dte_" + dte.getTipoDte().getCodigo() + "_"
                                                                + dte.getFolio() + ".xml\"")
                                .body("<?xml version=\"1.0\"?><DTE><!-- TODO: XML content --></DTE>");
        }

        @GetMapping("/libro-ventas")
        @Operation(summary = "Obtener Libro de Ventas")
        public ResponseEntity<List<DteResponse>> getLibroVentas(
                        @RequestHeader("X-Tenant-Id") UUID tenantId,
                        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
                        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
                        @RequestParam(required = false) TipoDte tipoDte) {

                log.info("GET /api/billing/dte/libro-ventas - Tenant: {}, Desde: {}, Hasta: {}", tenantId, desde,
                                hasta);

                List<DteResponse> dtes = dteService.getLibroVentas(tenantId, desde, hasta, tipoDte);
                return ResponseEntity.ok(dtes);
        }
}
