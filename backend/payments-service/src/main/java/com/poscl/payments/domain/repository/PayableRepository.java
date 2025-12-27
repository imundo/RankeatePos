package com.poscl.payments.domain.repository;

import com.poscl.payments.domain.entity.Payable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface PayableRepository extends JpaRepository<Payable, UUID> {

    Page<Payable> findByTenantIdOrderByDueDateAsc(UUID tenantId, Pageable pageable);

    Page<Payable> findByTenantIdAndStatusOrderByDueDateAsc(
        UUID tenantId, Payable.PayableStatus status, Pageable pageable);

    List<Payable> findByTenantIdAndSupplierIdOrderByDueDateAsc(UUID tenantId, UUID supplierId);

    @Query("SELECT SUM(p.balance) FROM Payable p WHERE p.tenantId = :tenantId AND p.status NOT IN ('PAID', 'CANCELLED')")
    BigDecimal getTotalPendingBalance(UUID tenantId);

    @Query("SELECT COUNT(p) FROM Payable p WHERE p.tenantId = :tenantId AND p.status = 'OVERDUE'")
    Long countOverdue(UUID tenantId);
}
