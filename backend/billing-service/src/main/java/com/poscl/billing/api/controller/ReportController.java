package com.poscl.billing.api.controller;

import com.poscl.billing.application.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/billing/reports")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Reports", description = "Reportes y exportaciones")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/sales-book/excel")
    @Operation(summary = "Exportar Libro de Ventas a Excel")
    public ResponseEntity<byte[]> getLibroVentasExcel(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        log.info("Generating Excel Report for tenant {} from {} to {}", tenantId, from, to);
        byte[] content = reportService.generateLibroVentasExcel(tenantId, from, to);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"libro_ventas_" + from + "_al_" + to + ".xlsx\"")
                .contentType(
                        MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(content);
    }

    @GetMapping("/sales-book/pdf")
    @Operation(summary = "Exportar Libro de Ventas a PDF")
    public ResponseEntity<byte[]> getLibroVentasPdf(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        log.info("Generating PDF Report for tenant {} from {} to {}", tenantId, from, to);
        byte[] content = reportService.generateLibroVentasPdf(tenantId, from, to);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"libro_ventas_" + from + "_al_" + to + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(content);
    }
}
