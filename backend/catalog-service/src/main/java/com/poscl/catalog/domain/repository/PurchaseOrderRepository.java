package com.poscl.catalog.domain.repository;

import com.poscl.catalog.domain.entity.PurchaseOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, UUID> {

    Page<PurchaseOrder> findByTenantId(UUID tenantId, Pageable pageable);

    @Query("SELECT MAX(p.orderNumber) FROM PurchaseOrder p WHERE p.tenantId = :tenantId")
    Optional<Long> findMaxOrderNumberByTenantId(UUID tenantId);
}
