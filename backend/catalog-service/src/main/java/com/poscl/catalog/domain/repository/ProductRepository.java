package com.poscl.catalog.domain.repository;

import com.poscl.catalog.domain.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {

    @Query("SELECT p FROM Product p WHERE p.tenantId = :tenantId AND p.activo = true AND p.deletedAt IS NULL")
    Page<Product> findActiveByTenantId(UUID tenantId, Pageable pageable);

    @Query("SELECT DISTINCT p FROM Product p " +
            "LEFT JOIN FETCH p.variants " +
            "LEFT JOIN FETCH p.category " +
            "LEFT JOIN FETCH p.unit " +
            "WHERE p.tenantId = :tenantId AND p.activo = true AND p.deletedAt IS NULL")
    List<Product> findActiveWithVariantsByTenantId(UUID tenantId);

    Optional<Product> findByTenantIdAndSku(UUID tenantId, String sku);

    boolean existsByTenantIdAndSku(UUID tenantId, String sku);

    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.variants LEFT JOIN FETCH p.category WHERE p.id = :id AND p.tenantId = :tenantId")
    Optional<Product> findByIdAndTenantIdWithDetails(UUID id, UUID tenantId);

    @Query("SELECT p FROM Product p WHERE p.tenantId = :tenantId AND p.category.id = :categoryId AND p.activo = true")
    Page<Product> findByCategoryId(UUID tenantId, UUID categoryId, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.tenantId = :tenantId AND p.activo = true AND " +
            "(LOWER(p.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Product> searchByNameOrSku(UUID tenantId, String search, Pageable pageable);
}
