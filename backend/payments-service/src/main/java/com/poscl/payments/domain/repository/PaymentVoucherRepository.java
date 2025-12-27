package com.poscl.payments.domain.repository;

import com.poscl.payments.domain.entity.PaymentVoucher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Repository
public interface PaymentVoucherRepository extends JpaRepository<PaymentVoucher, UUID> {

    Page<PaymentVoucher> findByTenantIdOrderByPaymentDateDesc(UUID tenantId, Pageable pageable);

    @Query("SELECT COALESCE(MAX(pv.voucherNumber), 0) + 1 FROM PaymentVoucher pv WHERE pv.tenantId = :tenantId")
    Long getNextVoucherNumber(UUID tenantId);

    @Query("SELECT SUM(pv.amount) FROM PaymentVoucher pv WHERE pv.tenantId = :tenantId AND pv.paymentDate BETWEEN :start AND :end AND pv.status = 'CONFIRMED'")
    BigDecimal getTotalPaidInPeriod(UUID tenantId, LocalDate start, LocalDate end);
}
