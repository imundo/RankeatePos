package com.poscl.billing.api.controller;

import com.poscl.billing.api.dto.DteResponse;
import com.poscl.billing.application.service.DteService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/billing/reports")
@RequiredArgsConstructor
@Tag(name = "Reportes", description = "Reportes de Facturación")
public class ReportsController {

    private final DteService dteService;

    @GetMapping("/sales-book/excel")
    @Operation(summary = "Descargar Libro de Ventas en Excel")
    public ResponseEntity<byte[]> downloadSalesBookExcel(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        log.info("GET /reports/sales-book/excel - Tenant: {}, From: {}, To: {}", tenantId, from, to);

        try {
            List<DteResponse> dtes = dteService.getLibroVentas(tenantId, from, to, null);
            byte[] excelContent = generateExcel(dtes, from, to);

            String filename = "Libro_Ventas_" + from + "_" + to + ".xlsx";

            return ResponseEntity.ok()
                    .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                    .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
                    .body(excelContent);

        } catch (Exception e) {
            log.error("Error generating Excel report", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    private byte[] generateExcel(List<DteResponse> dtes, LocalDate from, LocalDate to) throws Exception {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Libro de Ventas");

            // Styles
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Headers
            String[] headers = { "Fecha", "Tipo DTE", "Folio", "RUT Receptor", "Receptor", "Exento", "Neto", "IVA",
                    "Total", "Estado" };
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data
            int rowNum = 1;
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

            for (DteResponse dte : dtes) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(dte.getFechaEmision().format(formatter));
                row.createCell(1).setCellValue(dte.getTipoDte().name());
                row.createCell(2).setCellValue(dte.getFolio());
                row.createCell(3).setCellValue(dte.getReceptorRut());
                row.createCell(4).setCellValue(dte.getReceptorRazonSocial());
                row.createCell(5).setCellValue(dte.getMontoExento() != null ? dte.getMontoExento().doubleValue() : 0);
                row.createCell(6).setCellValue(dte.getMontoNeto() != null ? dte.getMontoNeto().doubleValue() : 0);
                row.createCell(7).setCellValue(dte.getMontoIva() != null ? dte.getMontoIva().doubleValue() : 0);
                row.createCell(8).setCellValue(dte.getMontoTotal().doubleValue());
                row.createCell(9).setCellValue(dte.getEstado().name());
            }

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }
}
