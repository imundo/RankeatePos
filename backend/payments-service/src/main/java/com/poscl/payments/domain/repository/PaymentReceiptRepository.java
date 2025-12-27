package com.poscl.payments.domain.repository;

import com.poscl.payments.domain.entity.PaymentReceipt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Repository
public interface PaymentReceiptRepository extends JpaRepository<PaymentReceipt, UUID> {

    Page<PaymentReceipt> findByTenantIdOrderByPaymentDateDesc(UUID tenantId, Pageable pageable);

    @Query("SELECT COALESCE(MAX(pr.receiptNumber), 0) + 1 FROM PaymentReceipt pr WHERE pr.tenantId = :tenantId")
    Long getNextReceiptNumber(UUID tenantId);

    @Query("SELECT SUM(pr.amount) FROM PaymentReceipt pr WHERE pr.tenantId = :tenantId AND pr.paymentDate BETWEEN :start AND :end AND pr.status = 'CONFIRMED'")
    BigDecimal getTotalCollectedInPeriod(UUID tenantId, LocalDate start, LocalDate end);
}
