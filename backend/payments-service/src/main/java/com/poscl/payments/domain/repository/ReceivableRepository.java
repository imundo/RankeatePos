package com.poscl.payments.domain.repository;

import com.poscl.payments.domain.entity.Receivable;
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
public interface ReceivableRepository extends JpaRepository<Receivable, UUID> {

    Page<Receivable> findByTenantIdOrderByDueDateAsc(UUID tenantId, Pageable pageable);

    Page<Receivable> findByTenantIdAndStatusOrderByDueDateAsc(
        UUID tenantId, Receivable.ReceivableStatus status, Pageable pageable);

    List<Receivable> findByTenantIdAndCustomerIdOrderByDueDateAsc(UUID tenantId, UUID customerId);

    List<Receivable> findByTenantIdAndDueDateBeforeAndStatusNot(
        UUID tenantId, LocalDate date, Receivable.ReceivableStatus status);

    @Query("SELECT SUM(r.balance) FROM Receivable r WHERE r.tenantId = :tenantId AND r.status NOT IN ('PAID', 'CANCELLED')")
    BigDecimal getTotalPendingBalance(UUID tenantId);

    @Query("SELECT SUM(r.balance) FROM Receivable r WHERE r.tenantId = :tenantId AND r.status = 'OVERDUE'")
    BigDecimal getTotalOverdueBalance(UUID tenantId);

    @Query("SELECT COUNT(r) FROM Receivable r WHERE r.tenantId = :tenantId AND r.status = 'OVERDUE'")
    Long countOverdue(UUID tenantId);

    @Query("SELECT r FROM Receivable r WHERE r.tenantId = :tenantId AND r.dueDate BETWEEN :startDate AND :endDate")
    List<Receivable> findByDueDateRange(UUID tenantId, LocalDate startDate, LocalDate endDate);
}
