package com.poscl.catalog.domain.repository;

import com.poscl.catalog.domain.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TagRepository extends JpaRepository<Tag, UUID> {

    List<Tag> findByTenantIdAndActivoTrueOrderByNombreAsc(UUID tenantId);

    List<Tag> findByTenantIdOrderByNombreAsc(UUID tenantId);

    Optional<Tag> findByTenantIdAndId(UUID tenantId, UUID id);

    Optional<Tag> findByTenantIdAndNombre(UUID tenantId, String nombre);

    boolean existsByTenantIdAndNombre(UUID tenantId, String nombre);

    boolean existsByTenantIdAndNombreAndIdNot(UUID tenantId, String nombre, UUID id);
}
