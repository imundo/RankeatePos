package com.poscl.payments.api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/v1/receivables")
public class ReceivableController {

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getReceivables(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestParam(required = false) String status) {
        
        List<Map<String, Object>> receivables = new ArrayList<>();
        
        receivables.add(createReceivable("F-2045", "Empresa ABC Ltda.", 1500000, 0, "PENDING", LocalDate.now().plusDays(15)));
        receivables.add(createReceivable("F-2044", "Comercial XYZ", 850000, 300000, "PARTIAL", LocalDate.now().plusDays(7)));
        receivables.add(createReceivable("F-2043", "Distribuidora Norte", 2200000, 2200000, "PAID", LocalDate.now().minusDays(3)));
        receivables.add(createReceivable("F-2042", "Local El Trigal", 450000, 0, "OVERDUE", LocalDate.now().minusDays(10)));
        receivables.add(createReceivable("F-2041", "Servicios Integrales SpA", 3800000, 0, "PENDING", LocalDate.now().plusDays(30)));
        receivables.add(createReceivable("F-2040", "Restaurant La Esquina", 680000, 0, "OVERDUE", LocalDate.now().minusDays(5)));
        
        if (status != null && !status.isEmpty()) {
            receivables = receivables.stream()
                    .filter(r -> status.equalsIgnoreCase((String) r.get("status")))
                    .toList();
        }
        
        return ResponseEntity.ok(receivables);
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary(
            @RequestHeader("X-Tenant-Id") String tenantId) {
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalReceivables", 9480000);
        summary.put("pendingAmount", 5300000);
        summary.put("overdueAmount", 1130000);
        summary.put("collectedThisMonth", 8500000);
        summary.put("overdueCount", 2);
        summary.put("pendingCount", 4);
        summary.put("avgDaysOverdue", 7.5);
        
        // Aging analysis
        Map<String, Object> aging = new HashMap<>();
        aging.put("current", 5300000);
        aging.put("days1to30", 680000);
        aging.put("days31to60", 450000);
        aging.put("days61to90", 0);
        aging.put("over90", 0);
        summary.put("aging", aging);
        
        return ResponseEntity.ok(summary);
    }

    @PostMapping("/{id}/collect")
    public ResponseEntity<Map<String, Object>> collectPayment(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {
        
        Map<String, Object> result = new HashMap<>();
        result.put("id", UUID.randomUUID().toString());
        result.put("receivableId", id);
        result.put("amount", request.get("amount"));
        result.put("paymentMethod", request.getOrDefault("paymentMethod", "TRANSFER"));
        result.put("paymentDate", LocalDate.now().toString());
        result.put("receiptNumber", "REC-" + (new Random().nextInt(9000) + 1000));
        result.put("status", "COMPLETED");
        
        return ResponseEntity.ok(result);
    }

    private Map<String, Object> createReceivable(String docNumber, String customer, int amount, 
            int paidAmount, String status, LocalDate dueDate) {
        Map<String, Object> receivable = new HashMap<>();
        receivable.put("id", UUID.randomUUID().toString());
        receivable.put("documentNumber", docNumber);
        receivable.put("customerName", customer);
        receivable.put("amount", amount);
        receivable.put("paidAmount", paidAmount);
        receivable.put("balance", amount - paidAmount);
        receivable.put("dueDate", dueDate.toString());
        receivable.put("status", status);
        
        if ("OVERDUE".equals(status)) {
            receivable.put("daysOverdue", (int) (LocalDate.now().toEpochDay() - dueDate.toEpochDay()));
        }
        
        return receivable;
    }
}
