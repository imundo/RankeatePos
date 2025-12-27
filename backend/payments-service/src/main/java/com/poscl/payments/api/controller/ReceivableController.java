package com.poscl.payments.api.controller;

import com.poscl.payments.application.service.ReceivableService;
import com.poscl.payments.domain.entity.PaymentReceipt;
import com.poscl.payments.domain.entity.Receivable;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/v1/receivables")
@RequiredArgsConstructor
public class ReceivableController {

    private final ReceivableService receivableService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getReceivables(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestParam(required = false) String status) {
        
        UUID tid = parseTenantId(tenantId);
        Page<Receivable> page;
        
        if (status != null && !status.isEmpty()) {
            try {
                Receivable.ReceivableStatus s = Receivable.ReceivableStatus.valueOf(status.toUpperCase());
                page = receivableService.getReceivablesByStatus(tid, s, PageRequest.of(0, 100));
            } catch (IllegalArgumentException e) {
                page = receivableService.getReceivables(tid, PageRequest.of(0, 100));
            }
        } else {
            page = receivableService.getReceivables(tid, PageRequest.of(0, 100));
        }
        
        List<Map<String, Object>> result = page.getContent().stream()
                .map(this::mapReceivable)
                .toList();
        
        return ResponseEntity.ok(result);
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary(
            @RequestHeader("X-Tenant-Id") String tenantId) {
        
        UUID tid = parseTenantId(tenantId);
        
        BigDecimal totalPending = receivableService.getTotalPendingBalance(tid);
        BigDecimal totalOverdue = receivableService.getTotalOverdueBalance(tid);
        Long overdueCount = receivableService.countOverdue(tid);
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalReceivables", totalPending);
        summary.put("pendingAmount", totalPending);
        summary.put("overdueAmount", totalOverdue);
        summary.put("collectedThisMonth", BigDecimal.ZERO); // TODO: implement
        summary.put("overdueCount", overdueCount);
        summary.put("pendingCount", 0); // TODO: count from service
        summary.put("avgDaysOverdue", 0.0);
        
        // Aging analysis
        Map<String, Object> aging = new HashMap<>();
        aging.put("current", totalPending.subtract(totalOverdue));
        aging.put("days1to30", BigDecimal.ZERO);
        aging.put("days31to60", BigDecimal.ZERO);
        aging.put("days61to90", BigDecimal.ZERO);
        aging.put("over90", BigDecimal.ZERO);
        summary.put("aging", aging);
        
        return ResponseEntity.ok(summary);
    }

    @PostMapping
    public ResponseEntity<?> createReceivable(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestBody Receivable receivable) {
        
        UUID tid = parseTenantId(tenantId);
        Receivable created = receivableService.createReceivable(tid, receivable);
        return ResponseEntity.ok(mapReceivable(created));
    }

    @PostMapping("/{id}/collect")
    public ResponseEntity<Map<String, Object>> collectPayment(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable UUID id,
            @RequestBody Map<String, Object> request) {
        
        UUID tid = parseTenantId(tenantId);
        BigDecimal amount = new BigDecimal(request.get("amount").toString());
        String methodStr = (String) request.getOrDefault("paymentMethod", "TRANSFER");
        PaymentReceipt.PaymentMethod method = PaymentReceipt.PaymentMethod.valueOf(methodStr);
        String reference = (String) request.get("referenceNumber");
        String notes = (String) request.get("notes");
        
        PaymentReceipt receipt = receivableService.collectPayment(tid, id, amount, method, reference, notes, null);
        
        Map<String, Object> result = new HashMap<>();
        result.put("id", receipt.getId());
        result.put("receivableId", id);
        result.put("amount", amount);
        result.put("paymentMethod", method);
        result.put("paymentDate", receipt.getPaymentDate());
        result.put("receiptNumber", receipt.getReceiptNumber());
        result.put("status", "COMPLETED");
        
        return ResponseEntity.ok(result);
    }

    private UUID parseTenantId(String tenantId) {
        try {
            return UUID.fromString(tenantId);
        } catch (Exception e) {
            return UUID.fromString("00000000-0000-0000-0000-000000000001");
        }
    }

    private Map<String, Object> mapReceivable(Receivable r) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", r.getId());
        map.put("documentNumber", r.getDocumentNumber());
        map.put("customerName", r.getCustomerName());
        map.put("amount", r.getOriginalAmount());
        map.put("paidAmount", r.getPaidAmount());
        map.put("balance", r.getBalance());
        map.put("dueDate", r.getDueDate() != null ? r.getDueDate().toString() : null);
        map.put("status", r.getStatus());
        map.put("daysOverdue", r.getDaysOverdue());
        return map;
    }
}
