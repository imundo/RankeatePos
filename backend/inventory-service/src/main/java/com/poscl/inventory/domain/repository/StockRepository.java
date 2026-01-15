package com.poscl.inventory.domain.repository;

import com.poscl.inventory.domain.model.Stock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StockRepository extends JpaRepository<Stock, UUID> {

    @Query("SELECT s FROM Stock s WHERE s.tenantId = :tenantId AND s.variant.id = :variantId AND s.branchId = :branchId")
    Optional<Stock> findByTenantIdAndVariantIdAndBranchId(UUID tenantId, UUID variantId, UUID branchId);

    List<Stock> findByTenantIdAndBranchId(UUID tenantId, UUID branchId);

    @Query("SELECT s FROM Stock s WHERE s.tenantId = :tenantId AND s.branchId = :branchId AND s.cantidadActual <= s.variant.stockMinimo")
    List<Stock> findLowStock(UUID tenantId, UUID branchId);

    @Query("SELECT COUNT(s) FROM Stock s WHERE s.tenantId = :tenantId AND s.cantidadActual <= s.variant.stockMinimo")
    long countLowStock(UUID tenantId);
}
