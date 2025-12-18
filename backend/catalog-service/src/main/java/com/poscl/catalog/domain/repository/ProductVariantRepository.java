package com.poscl.catalog.domain.repository;

import com.poscl.catalog.domain.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, UUID> {

    List<ProductVariant> findByProduct_Id(UUID productId);

    Optional<ProductVariant> findByTenantIdAndSku(UUID tenantId, String sku);

    Optional<ProductVariant> findByTenantIdAndBarcode(UUID tenantId, String barcode);

    boolean existsByTenantIdAndSku(UUID tenantId, String sku);

    boolean existsByTenantIdAndBarcode(UUID tenantId, String barcode);

    @Query("SELECT v FROM ProductVariant v WHERE v.id = :id AND v.tenantId = :tenantId")
    Optional<ProductVariant> findByIdAndTenantId(UUID id, UUID tenantId);

    @Query("SELECT v FROM ProductVariant v LEFT JOIN FETCH v.product LEFT JOIN FETCH v.tax WHERE v.tenantId = :tenantId AND v.activo = true")
    List<ProductVariant> findActiveByTenantId(UUID tenantId);

    @Query("SELECT v FROM ProductVariant v LEFT JOIN FETCH v.product WHERE v.tenantId = :tenantId AND (v.sku = :code OR v.barcode = :code) AND v.activo = true")
    Optional<ProductVariant> findBySkuOrBarcode(UUID tenantId, String code);
}
