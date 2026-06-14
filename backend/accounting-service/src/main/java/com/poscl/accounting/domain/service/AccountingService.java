package com.poscl.accounting.domain.service;

import com.poscl.accounting.domain.entity.Account;
import com.poscl.accounting.domain.entity.JournalEntry;
import com.poscl.accounting.domain.entity.JournalLine;
import com.poscl.accounting.domain.repository.AccountRepository;
import com.poscl.accounting.domain.repository.JournalEntryRepository;
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
public class AccountingService {

    private final JournalEntryRepository journalEntryRepository;
    private final AccountRepository accountRepository;

    @Transactional
    public void generateSaleJournalEntry(UUID tenantId, UUID branchId, UUID saleId, BigDecimal totalAmount, BigDecimal netAmount, BigDecimal taxAmount) {
        log.info("Generating automatic journal entry for sale {}", saleId);

        // Fetch accounts (in a real scenario, these would be mapped in an AccountingConfig per tenant)
        // Default codes for MVP:
        // "1.1.1.01" - Caja/Banco (Asset)
        // "4.1.1.01" - Ingresos por Ventas (Income)
        // "2.1.2.01" - IVA Débito Fiscal (Liability)

        Account cashAccount = accountRepository.findByTenantIdAndCode(tenantId, "1.1.1.01")
                .orElseGet(() -> createDefaultAccount(tenantId, "1.1.1.01", "Caja/Banco", Account.AccountType.ASSET, Account.AccountNature.DEBIT));
        
        Account salesIncomeAccount = accountRepository.findByTenantIdAndCode(tenantId, "4.1.1.01")
                .orElseGet(() -> createDefaultAccount(tenantId, "4.1.1.01", "Ingresos por Ventas", Account.AccountType.INCOME, Account.AccountNature.CREDIT));

        Account ivaAccount = accountRepository.findByTenantIdAndCode(tenantId, "2.1.2.01")
                .orElseGet(() -> createDefaultAccount(tenantId, "2.1.2.01", "IVA Débito Fiscal", Account.AccountType.LIABILITY, Account.AccountNature.CREDIT));

        JournalEntry entry = JournalEntry.builder()
                .tenantId(tenantId)
                .branchId(branchId)
                .date(LocalDate.now())
                .description("Ingreso por Venta de Mercadería - Ticket " + saleId)
                .referenceId(saleId)
                .referenceType("SALE")
                .status(JournalEntry.JournalEntryStatus.POSTED)
                .build();

        // DEBIT: Caja (Total amount)
        JournalLine line1 = JournalLine.builder()
                .account(cashAccount)
                .description("Cobro de Venta")
                .debit(totalAmount)
                .credit(BigDecimal.ZERO)
                .build();
        entry.addLine(line1);

        // CREDIT: Ingresos por Ventas (Net amount)
        JournalLine line2 = JournalLine.builder()
                .account(salesIncomeAccount)
                .description("Ingreso por Venta")
                .debit(BigDecimal.ZERO)
                .credit(netAmount != null ? netAmount : totalAmount)
                .build();
        entry.addLine(line2);

        // CREDIT: IVA Débito Fiscal (Tax amount)
        if (taxAmount != null && taxAmount.compareTo(BigDecimal.ZERO) > 0) {
            JournalLine line3 = JournalLine.builder()
                    .account(ivaAccount)
                    .description("IVA Débito Fiscal")
                    .debit(BigDecimal.ZERO)
                    .credit(taxAmount)
                    .build();
            entry.addLine(line3);
        }

        entry.validateBalance();
        journalEntryRepository.save(entry);
        
        log.info("Journal entry created successfully for sale {}", saleId);
    }

    private Account createDefaultAccount(UUID tenantId, String code, String name, Account.AccountType type, Account.AccountNature nature) {
        Account account = Account.builder()
                .tenantId(tenantId)
                .code(code)
                .name(name)
                .type(type)
                .nature(nature)
                .isSystemAccount(true)
                .build();
        return accountRepository.save(account);
    }
}
