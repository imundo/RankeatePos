package com.poscl.payments.api.controller;

import com.poscl.payments.application.service.ReceivableService;
import com.poscl.payments.domain.entity.PaymentReceipt;
import com.poscl.payments.domain.entity.Receivable;
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
@RequestMapping("/api/v1/receivables")
@RequiredArgsConstructor
@Tag(name = "Cuentas por Cobrar", description = "Gestión de cuentas por cobrar y cobranza")
public class ReceivableController {

    private final ReceivableService receivableService;

    @GetMapping
    @Operation(summary = "Listar cuentas por cobrar")
    public ResponseEntity<Page<Receivable>> getReceivables(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestParam(required = false) Receivable.ReceivableStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        
        Page<Receivable> result = status != null 
            ? receivableService.getReceivablesByStatus(tenantId, status, pageable)
            : receivableService.getReceivables(tenantId, pageable);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener cuenta por cobrar por ID")
    public ResponseEntity<Receivable> getReceivableById(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(receivableService.getReceivableById(tenantId, id));
    }

    @PostMapping("/{id}/collect")
    @Operation(summary = "Registrar cobro")
    public ResponseEntity<PaymentReceipt> collectPayment(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId,
            @PathVariable UUID id,
            @RequestBody CollectPaymentRequest request) {
        
        PaymentReceipt receipt = receivableService.collectPayment(
            tenantId, id, request.amount(), request.paymentMethod(),
            request.referenceNumber(), request.notes(), userId);
        return ResponseEntity.ok(receipt);
    }

    @GetMapping("/summary")
    @Operation(summary = "Resumen de cuentas por cobrar")
    public ResponseEntity<Map<String, Object>> getSummary(
            @RequestHeader("X-Tenant-Id") UUID tenantId) {
        return ResponseEntity.ok(Map.of(
            "totalPending", receivableService.getTotalPendingBalance(tenantId),
            "totalOverdue", receivableService.getTotalOverdueBalance(tenantId),
            "countOverdue", receivableService.countOverdue(tenantId)
        ));
    }

    public record CollectPaymentRequest(
        BigDecimal amount,
        PaymentReceipt.PaymentMethod paymentMethod,
        String referenceNumber,
        String notes
    ) {}
}
