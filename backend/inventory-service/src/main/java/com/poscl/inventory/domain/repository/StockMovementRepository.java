package com.poscl.inventory.domain.repository;

import com.poscl.inventory.domain.model.StockMovement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, UUID> {

    Page<StockMovement> findByTenantIdAndBranchIdOrderByCreatedAtDesc(UUID tenantId, UUID branchId, Pageable pageable);

    @Query("SELECT sm FROM StockMovement sm WHERE sm.variant.id = :variantId ORDER BY sm.createdAt DESC")
    List<StockMovement> findByVariantIdOrderByCreatedAtDesc(UUID variantId);
}
