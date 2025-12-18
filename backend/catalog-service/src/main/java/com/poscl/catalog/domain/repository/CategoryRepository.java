package com.poscl.catalog.domain.repository;

import com.poscl.catalog.domain.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {

    @Query("SELECT c FROM Category c WHERE c.tenantId = :tenantId AND c.activa = true AND c.deletedAt IS NULL ORDER BY c.orden, c.nombre")
    List<Category> findActiveByTenantId(UUID tenantId);

    List<Category> findByTenantIdAndActivaTrueOrderByOrdenAsc(UUID tenantId);

    List<Category> findByTenantIdAndParentIsNullAndActivaTrueOrderByOrdenAsc(UUID tenantId);

    @Query("SELECT c FROM Category c WHERE c.tenantId = :tenantId AND c.parent IS NULL AND c.activa = true ORDER BY c.orden")
    List<Category> findRootCategoriesByTenantId(UUID tenantId);

    Optional<Category> findByTenantIdAndNombre(UUID tenantId, String nombre);

    @Query("SELECT c FROM Category c WHERE c.id = :id AND c.tenantId = :tenantId")
    Optional<Category> findByIdAndTenantId(UUID id, UUID tenantId);

    boolean existsByTenantIdAndNombreAndParent(UUID tenantId, String nombre, Category parent);

    boolean existsByTenantIdAndNombreIgnoreCase(UUID tenantId, String nombre);
}
