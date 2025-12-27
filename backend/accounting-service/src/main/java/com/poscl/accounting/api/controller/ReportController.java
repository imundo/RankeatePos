package com.poscl.accounting.api.controller;

import com.poscl.accounting.application.service.ReportPdfService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {

    private final ReportPdfService reportPdfService;

    public ReportController(ReportPdfService reportPdfService) {
        this.reportPdfService = reportPdfService;
    }

    @GetMapping("/balance-sheet")
    public ResponseEntity<byte[]> getBalanceSheet(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestParam(required = false) String asOfDate) {
        
        LocalDate date = asOfDate != null ? LocalDate.parse(asOfDate) : LocalDate.now();
        byte[] content = reportPdfService.generateBalanceSheet(tenantId, date);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_HTML);
        headers.set("Content-Disposition", "inline; filename=balance_" + date + ".html");
        
        return ResponseEntity.ok().headers(headers).body(content);
    }

    @GetMapping("/balance-sheet/download")
    public ResponseEntity<byte[]> downloadBalanceSheet(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestParam(required = false) String asOfDate) {
        
        LocalDate date = asOfDate != null ? LocalDate.parse(asOfDate) : LocalDate.now();
        byte[] content = reportPdfService.generateBalanceSheet(tenantId, date);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.set("Content-Disposition", "attachment; filename=balance_general_" + date + ".html");
        
        return ResponseEntity.ok().headers(headers).body(content);
    }

    @GetMapping("/income-statement")
    public ResponseEntity<byte[]> getIncomeStatement(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate) {
        
        LocalDate from = fromDate != null ? LocalDate.parse(fromDate) : LocalDate.now().withDayOfMonth(1);
        LocalDate to = toDate != null ? LocalDate.parse(toDate) : LocalDate.now();
        byte[] content = reportPdfService.generateIncomeStatement(tenantId, from, to);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_HTML);
        headers.set("Content-Disposition", "inline; filename=estado_resultados_" + to + ".html");
        
        return ResponseEntity.ok().headers(headers).body(content);
    }

    @GetMapping("/income-statement/download")
    public ResponseEntity<byte[]> downloadIncomeStatement(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate) {
        
        LocalDate from = fromDate != null ? LocalDate.parse(fromDate) : LocalDate.now().withDayOfMonth(1);
        LocalDate to = toDate != null ? LocalDate.parse(toDate) : LocalDate.now();
        byte[] content = reportPdfService.generateIncomeStatement(tenantId, from, to);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.set("Content-Disposition", "attachment; filename=estado_resultados_" + to + ".html");
        
        return ResponseEntity.ok().headers(headers).body(content);
    }
}
