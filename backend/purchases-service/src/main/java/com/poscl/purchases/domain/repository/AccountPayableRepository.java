package com.poscl.purchases.domain.repository;

import com.poscl.purchases.domain.entity.AccountPayable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AccountPayableRepository extends JpaRepository<AccountPayable, UUID> {
    List<AccountPayable> findByTenantIdAndSupplierIdOrderByDueDateAsc(UUID tenantId, UUID supplierId);
    List<AccountPayable> findByTenantIdAndStatusOrderByDueDateAsc(UUID tenantId, AccountPayable.AccountPayableStatus status);
}
