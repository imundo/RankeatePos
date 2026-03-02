package com.poscl.crm.api.controller;

import com.poscl.crm.api.dto.ChargeCreditRequest;
import com.poscl.crm.api.dto.CreditTransactionDto;
import com.poscl.crm.api.dto.CustomerProfileDto;
import com.poscl.crm.api.dto.PayCreditRequest;
import com.poscl.crm.application.service.CustomerProfileService;
import com.poscl.crm.domain.entity.CreditTransaction;
import com.poscl.crm.domain.entity.CustomerProfile;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/crm/credit")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Accounts Receivable", description = "Cuentas Corrientes y Fiados")
public class CreditController {

    private final CustomerProfileService profileService;

    @GetMapping("/debtors")
    @Operation(summary = "Listar clientes morosos (con deuda)")
    public ResponseEntity<Page<CustomerProfileDto>> getDebtors(
            @RequestHeader("X-Tenant-ID") String tenantIdStr,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        UUID tenantId = UUID.fromString(tenantIdStr);
        Pageable pageable = PageRequest.of(page, size);
        
        Page<CustomerProfile> debtors = profileService.getDebtors(tenantId, pageable);
        return ResponseEntity.ok(debtors.map(this::toProfileDto));
    }

    @PostMapping("/{customerId}/charge")
    @Operation(summary = "Cargar monto a crédito", description = "Llamado por sales-service ANTES de cerrar venta")
    public ResponseEntity<?> chargeCredit(
            @PathVariable UUID customerId,
            @Valid @RequestBody ChargeCreditRequest request) {
        try {
            CreditTransaction tx = profileService.chargeCredit(customerId, request);
            return ResponseEntity.ok(toDto(tx));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage()); // 400 = POS REJECTS SALE
        }
    }

    @PostMapping("/{customerId}/pay")
    @Operation(summary = "Abonar a la deuda de cuenta corriente")
    public ResponseEntity<CreditTransactionDto> payCredit(
            @PathVariable UUID customerId,
            @Valid @RequestBody PayCreditRequest request) {
        
        CreditTransaction tx = profileService.payCredit(customerId, request);
        return ResponseEntity.ok(toDto(tx));
    }

    @GetMapping("/{customerId}/history")
    @Operation(summary = "Historial de transacciones de Fiado (Cargos y Pagos)")
    public ResponseEntity<List<CreditTransactionDto>> getHistory(@PathVariable UUID customerId) {
        List<CreditTransaction> history = profileService.getTransactionHistory(customerId);
        return ResponseEntity.ok(history.stream().map(this::toDto).collect(Collectors.toList()));
    }

    private CreditTransactionDto toDto(CreditTransaction tx) {
        return CreditTransactionDto.builder()
                .id(tx.getId())
                .customerProfileId(tx.getCustomerProfile().getId())
                .customerName(tx.getCustomerProfile().getFullName())
                .type(tx.getType().name())
                .amount(tx.getAmount())
                .referenceSaleId(tx.getReferenceSaleId())
                .referencePaymentId(tx.getReferencePaymentId())
                .description(tx.getDescription())
                .createdAt(tx.getCreatedAt())
                .build();
    }
    
    // Copy for simplicity in this controller
    private CustomerProfileDto toProfileDto(CustomerProfile p) {
        BigDecimal available = BigDecimal.ZERO;
        if (p.getCreditLimit() != null) {
            available = p.getCreditLimit().subtract(p.getCurrentDebt());
            if (available.compareTo(BigDecimal.ZERO) < 0) {
                available = BigDecimal.ZERO;
            }
        }
        return CustomerProfileDto.builder()
                .id(p.getId())
                .fullName(p.getFullName())
                .rut(p.getRut())
                .creditLimit(p.getCreditLimit())
                .currentDebt(p.getCurrentDebt())
                .availableCredit(available)
                .build();
    }
}
