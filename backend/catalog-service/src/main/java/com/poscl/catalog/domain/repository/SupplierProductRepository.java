package com.poscl.catalog.domain.repository;

import com.poscl.catalog.domain.entity.SupplierProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SupplierProductRepository extends JpaRepository<SupplierProduct, UUID> {
    List<SupplierProduct> findBySupplierId(UUID supplierId);

    List<SupplierProduct> findByProductVariantId(UUID productVariantId);

    void deleteBySupplierIdAndProductVariantId(UUID supplierId, UUID productVariantId);
}
