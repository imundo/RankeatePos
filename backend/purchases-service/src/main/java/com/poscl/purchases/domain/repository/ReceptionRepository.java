package com.poscl.purchases.domain.repository;

import com.poscl.purchases.domain.entity.Reception;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReceptionRepository extends JpaRepository<Reception, UUID> {
    List<Reception> findByTenantId(UUID tenantId);

    List<Reception> findByPurchaseOrderId(UUID purchaseOrderId);
}
