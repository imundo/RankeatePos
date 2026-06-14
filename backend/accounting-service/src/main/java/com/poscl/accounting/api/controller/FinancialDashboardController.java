package com.poscl.accounting.api.controller;

import com.poscl.accounting.domain.entity.BankTransaction;
import com.poscl.accounting.domain.repository.BankTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/accounting/dashboard")
@RequiredArgsConstructor
public class FinancialDashboardController {

    private final BankTransactionRepository bankTransactionRepository;

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getFinancialSummary(
            @RequestHeader("X-Tenant-Id") UUID tenantId) {

        List<BankTransaction> transactions = bankTransactionRepository.findByTenantId(tenantId);
        
        BigDecimal ingresos = transactions.stream()
                .filter(t -> t.getTransactionType() == BankTransaction.TransactionType.DEPOSIT)
                .map(BankTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal egresos = transactions.stream()
                .filter(t -> t.getTransactionType() == BankTransaction.TransactionType.WITHDRAWAL)
                .map(BankTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal balance = ingresos.subtract(egresos);

        Map<String, Object> response = new HashMap<>();
        response.put("ingresosTotales", ingresos);
        response.put("egresosTotales", egresos);
        response.put("balanceNeto", balance);
        response.put("impuestosPorPagar", 0); // Placeholder for MVP

        return ResponseEntity.ok(response);
    }
}