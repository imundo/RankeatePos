package com.poscl.catalog.domain.repository;

import com.poscl.catalog.domain.entity.StockMovement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, UUID> {

    Page<StockMovement> findByTenantIdAndBranchIdOrderByCreatedAtDesc(
            UUID tenantId, UUID branchId, Pageable pageable);

    Page<StockMovement> findByVariant_IdOrderByCreatedAtDesc(UUID variantId, Pageable pageable);

    @Query("SELECT m FROM StockMovement m WHERE m.tenantId = :tenantId " +
            "AND m.createdAt BETWEEN :from AND :to ORDER BY m.createdAt DESC")
    List<StockMovement> findByTenantIdAndDateRange(UUID tenantId, Instant from, Instant to);

    @Query("SELECT m FROM StockMovement m JOIN FETCH m.variant v JOIN FETCH v.product " +
            "WHERE m.variant.id = :variantId ORDER BY m.createdAt DESC")
    List<StockMovement> findKardexByVariant(UUID variantId);
}
