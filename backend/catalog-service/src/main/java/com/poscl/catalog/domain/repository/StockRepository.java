package com.poscl.catalog.domain.repository;

import com.poscl.catalog.domain.entity.Stock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StockRepository extends JpaRepository<Stock, UUID> {

    Optional<Stock> findByVariant_IdAndBranchId(UUID variantId, UUID branchId);

    List<Stock> findByTenantIdAndBranchId(UUID tenantId, UUID branchId);

    @Query("SELECT s FROM Stock s WHERE s.tenantId = :tenantId AND s.branchId = :branchId " +
            "AND s.cantidadActual <= s.variant.stockMinimo")
    List<Stock> findLowStockByTenantAndBranch(UUID tenantId, UUID branchId);

    @Query("SELECT s FROM Stock s JOIN FETCH s.variant v JOIN FETCH v.product " +
            "WHERE s.tenantId = :tenantId AND s.branchId = :branchId")
    List<Stock> findAllWithProductByTenantAndBranch(UUID tenantId, UUID branchId);

    @Query("SELECT COUNT(s) FROM Stock s WHERE s.tenantId = :tenantId " +
            "AND s.cantidadActual <= s.variant.stockMinimo")
    long countLowStock(UUID tenantId);
}
