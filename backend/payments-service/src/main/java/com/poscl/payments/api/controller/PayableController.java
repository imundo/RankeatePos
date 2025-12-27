package com.poscl.payments.api.controller;

import com.poscl.payments.application.service.PayableService;
import com.poscl.payments.domain.entity.Payable;
import com.poscl.payments.domain.entity.PaymentReceipt;
import com.poscl.payments.domain.entity.PaymentVoucher;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/v1/payables")
@RequiredArgsConstructor
public class PayableController {

    private final PayableService payableService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getPayables(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestParam(required = false) String status) {
        
        UUID tid = parseTenantId(tenantId);
        Page<Payable> page;
        
        if (status != null && !status.isEmpty()) {
            try {
                Payable.PayableStatus s = Payable.PayableStatus.valueOf(status.toUpperCase());
                page = payableService.getPayablesByStatus(tid, s, PageRequest.of(0, 100));
            } catch (IllegalArgumentException e) {
                page = payableService.getPayables(tid, PageRequest.of(0, 100));
            }
        } else {
            page = payableService.getPayables(tid, PageRequest.of(0, 100));
        }
        
        List<Map<String, Object>> result = page.getContent().stream()
                .map(this::mapPayable)
                .toList();
        
        return ResponseEntity.ok(result);
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary(
            @RequestHeader("X-Tenant-Id") String tenantId) {
        
        UUID tid = parseTenantId(tenantId);
        
        BigDecimal totalPending = payableService.getTotalPendingBalance(tid);
        Long overdueCount = payableService.countOverdue(tid);
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalPayables", totalPending);
        summary.put("pendingAmount", totalPending);
        summary.put("overdueAmount", BigDecimal.ZERO);
        summary.put("paidThisMonth", BigDecimal.ZERO);
        summary.put("overdueCount", overdueCount);
        summary.put("pendingCount", 0);
        summary.put("upcomingWeek", BigDecimal.ZERO);
        
        return ResponseEntity.ok(summary);
    }

    @PostMapping
    public ResponseEntity<?> createPayable(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestBody Payable payable) {
        
        UUID tid = parseTenantId(tenantId);
        Payable created = payableService.createPayable(tid, payable);
        return ResponseEntity.ok(mapPayable(created));
    }

    @PostMapping("/{id}/pay")
    public ResponseEntity<Map<String, Object>> makePayment(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable UUID id,
            @RequestBody Map<String, Object> request) {
        
        UUID tid = parseTenantId(tenantId);
        BigDecimal amount = new BigDecimal(request.get("amount").toString());
        String methodStr = (String) request.getOrDefault("paymentMethod", "TRANSFER");
        PaymentReceipt.PaymentMethod method = PaymentReceipt.PaymentMethod.valueOf(methodStr);
        String reference = (String) request.get("referenceNumber");
        String notes = (String) request.get("notes");
        
        PaymentVoucher voucher = payableService.makePayment(tid, id, amount, method, reference, notes, null);
        
        Map<String, Object> result = new HashMap<>();
        result.put("id", voucher.getId());
        result.put("payableId", id);
        result.put("amount", amount);
        result.put("paymentMethod", method);
        result.put("paymentDate", voucher.getPaymentDate());
        result.put("voucherNumber", voucher.getVoucherNumber());
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

    private Map<String, Object> mapPayable(Payable p) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", p.getId());
        map.put("documentNumber", p.getDocumentNumber());
        map.put("supplierName", p.getSupplierName());
        map.put("amount", p.getOriginalAmount());
        map.put("paidAmount", p.getPaidAmount());
        map.put("balance", p.getBalance());
        map.put("dueDate", p.getDueDate() != null ? p.getDueDate().toString() : null);
        map.put("status", p.getStatus());
        return map;
    }
}
