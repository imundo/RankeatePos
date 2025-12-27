package com.poscl.accounting.domain.repository;

import com.poscl.accounting.domain.entity.BankTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface BankTransactionRepository extends JpaRepository<BankTransaction, UUID> {

    Page<BankTransaction> findByBankAccountIdOrderByTransactionDateDescCreatedAtDesc(
        UUID bankAccountId, Pageable pageable);

    List<BankTransaction> findByBankAccountIdAndReconciliationStatusOrderByTransactionDateDesc(
        UUID bankAccountId, BankTransaction.ReconciliationStatus status);

    List<BankTransaction> findByBankAccountIdAndTransactionDateBetweenOrderByTransactionDate(
        UUID bankAccountId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT SUM(bt.amount) FROM BankTransaction bt WHERE bt.bankAccount.id = :bankAccountId AND bt.amount > 0 AND bt.transactionDate BETWEEN :startDate AND :endDate")
    BigDecimal sumDeposits(UUID bankAccountId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT SUM(bt.amount) FROM BankTransaction bt WHERE bt.bankAccount.id = :bankAccountId AND bt.amount < 0 AND bt.transactionDate BETWEEN :startDate AND :endDate")
    BigDecimal sumWithdrawals(UUID bankAccountId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT COUNT(bt) FROM BankTransaction bt WHERE bt.bankAccount.id = :bankAccountId AND bt.reconciliationStatus = 'PENDING'")
    Long countPendingReconciliation(UUID bankAccountId);
}
