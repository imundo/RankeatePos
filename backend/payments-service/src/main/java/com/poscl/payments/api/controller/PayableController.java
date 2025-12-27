package com.poscl.payments.api.controller;

import com.poscl.payments.application.service.PayableService;
import com.poscl.payments.domain.entity.Payable;
import com.poscl.payments.domain.entity.PaymentReceipt;
import com.poscl.payments.domain.entity.PaymentVoucher;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payables")
@RequiredArgsConstructor
@Tag(name = "Cuentas por Pagar", description = "Gestión de cuentas por pagar")
public class PayableController {

    private final PayableService payableService;

    @GetMapping
    @Operation(summary = "Listar cuentas por pagar")
    public ResponseEntity<Page<Payable>> getPayables(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestParam(required = false) Payable.PayableStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        
        Page<Payable> result = status != null 
            ? payableService.getPayablesByStatus(tenantId, status, pageable)
            : payableService.getPayables(tenantId, pageable);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener cuenta por pagar por ID")
    public ResponseEntity<Payable> getPayableById(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(payableService.getPayableById(tenantId, id));
    }

    @PostMapping("/{id}/pay")
    @Operation(summary = "Registrar pago")
    public ResponseEntity<PaymentVoucher> makePayment(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId,
            @PathVariable UUID id,
            @RequestBody MakePaymentRequest request) {
        
        PaymentVoucher voucher = payableService.makePayment(
            tenantId, id, request.amount(), request.paymentMethod(),
            request.referenceNumber(), request.notes(), userId);
        return ResponseEntity.ok(voucher);
    }

    @GetMapping("/summary")
    @Operation(summary = "Resumen de cuentas por pagar")
    public ResponseEntity<Map<String, Object>> getSummary(
            @RequestHeader("X-Tenant-Id") UUID tenantId) {
        return ResponseEntity.ok(Map.of(
            "totalPending", payableService.getTotalPendingBalance(tenantId),
            "countOverdue", payableService.countOverdue(tenantId)
        ));
    }

    public record MakePaymentRequest(
        BigDecimal amount,
        PaymentReceipt.PaymentMethod paymentMethod,
        String referenceNumber,
        String notes
    ) {}
}
