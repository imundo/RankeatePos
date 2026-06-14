package com.poscl.accounting.domain.service;

import com.poscl.accounting.domain.entity.BankAccount;
import com.poscl.accounting.domain.entity.BankTransaction;
import com.poscl.accounting.domain.repository.BankAccountRepository;
import com.poscl.accounting.domain.repository.BankTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TreasuryService {

    private final BankAccountRepository bankAccountRepository;
    private final BankTransactionRepository bankTransactionRepository;

    @Transactional
    public void registerSaleIncome(UUID tenantId, UUID saleId, BigDecimal amount) {
        log.info("Registering sale income for sale {} in treasury", saleId);

        // Find default cash/bank account for the tenant
        BankAccount defaultAccount = bankAccountRepository.findByTenantIdAndIsActiveOrderByBankName(tenantId, true)
                .stream().findFirst()
                .orElseGet(() -> createDefaultBankAccount(tenantId));

        BankTransaction transaction = BankTransaction.builder()
                .tenantId(tenantId)
                .bankAccount(defaultAccount)
                .type(BankTransaction.TransactionType.DEPOSIT)
                .amount(amount)
                .date(LocalDate.now())
                .description("Ingreso por Venta POS - " + saleId)
                .referenceId(saleId)
                .referenceType("SALE")
                .status(BankTransaction.TransactionStatus.COMPLETED)
                .build();

        // Update balance
        defaultAccount.addBalance(amount);
        bankAccountRepository.save(defaultAccount);
        
        bankTransactionRepository.save(transaction);
        log.info("Treasury transaction saved for sale {}", saleId);
    }

    private BankAccount createDefaultBankAccount(UUID tenantId) {
        BankAccount account = BankAccount.builder()
                .tenantId(tenantId)
                .bankName("Caja Principal")
                .accountType("CASH")
                .accountNumber("CAJA-01")
                .currency("CLP")
                .currentBalance(BigDecimal.ZERO)
                .isActive(true)
                .build();
        return bankAccountRepository.save(account);
    }
}
