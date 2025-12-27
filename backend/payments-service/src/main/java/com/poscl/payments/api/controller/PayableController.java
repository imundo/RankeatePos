package com.poscl.payments.api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/v1/payables")
public class PayableController {

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getPayables(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestParam(required = false) String status) {
        
        List<Map<String, Object>> payables = new ArrayList<>();
        
        payables.add(createPayable("OC-1045", "Distribuidora Nacional SpA", 2500000, 0, "PENDING", LocalDate.now().plusDays(20)));
        payables.add(createPayable("OC-1044", "Importadora del Pacífico", 1200000, 600000, "PARTIAL", LocalDate.now().plusDays(10)));
        payables.add(createPayable("OC-1043", "Comercial Norte Grande", 800000, 800000, "PAID", LocalDate.now().minusDays(5)));
        payables.add(createPayable("OC-1042", "Servicios Eléctricos", 350000, 0, "OVERDUE", LocalDate.now().minusDays(8)));
        payables.add(createPayable("OC-1041", "Internet Empresarial", 89000, 0, "PENDING", LocalDate.now().plusDays(5)));
        
        if (status != null && !status.isEmpty()) {
            payables = payables.stream()
                    .filter(p -> status.equalsIgnoreCase((String) p.get("status")))
                    .toList();
        }
        
        return ResponseEntity.ok(payables);
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary(
            @RequestHeader("X-Tenant-Id") String tenantId) {
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalPayables", 4939000);
        summary.put("pendingAmount", 3789000);
        summary.put("overdueAmount", 350000);
        summary.put("paidThisMonth", 5200000);
        summary.put("overdueCount", 1);
        summary.put("pendingCount", 4);
        summary.put("upcomingWeek", 1289000);
        
        return ResponseEntity.ok(summary);
    }

    @PostMapping("/{id}/pay")
    public ResponseEntity<Map<String, Object>> makePayment(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {
        
        Map<String, Object> result = new HashMap<>();
        result.put("id", UUID.randomUUID().toString());
        result.put("payableId", id);
        result.put("amount", request.get("amount"));
        result.put("paymentMethod", request.getOrDefault("paymentMethod", "TRANSFER"));
        result.put("paymentDate", LocalDate.now().toString());
        result.put("voucherNumber", "VOU-" + (new Random().nextInt(9000) + 1000));
        result.put("status", "COMPLETED");
        
        return ResponseEntity.ok(result);
    }

    private Map<String, Object> createPayable(String docNumber, String supplier, int amount, 
            int paidAmount, String status, LocalDate dueDate) {
        Map<String, Object> payable = new HashMap<>();
        payable.put("id", UUID.randomUUID().toString());
        payable.put("documentNumber", docNumber);
        payable.put("supplierName", supplier);
        payable.put("amount", amount);
        payable.put("paidAmount", paidAmount);
        payable.put("balance", amount - paidAmount);
        payable.put("dueDate", dueDate.toString());
        payable.put("status", status);
        
        if ("OVERDUE".equals(status)) {
            payable.put("daysOverdue", (int) (LocalDate.now().toEpochDay() - dueDate.toEpochDay()));
        }
        
        return payable;
    }
}
