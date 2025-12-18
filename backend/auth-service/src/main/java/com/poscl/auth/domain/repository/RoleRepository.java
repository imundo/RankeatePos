package com.poscl.auth.domain.repository;

import com.poscl.auth.domain.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoleRepository extends JpaRepository<Role, UUID> {
    
    Optional<Role> findByNombre(String nombre);
    
    @Query("SELECT r FROM Role r WHERE r.tenantId IS NULL AND r.activo = true")
    List<Role> findGlobalRoles();
    
    @Query("SELECT r FROM Role r WHERE (r.tenantId IS NULL OR r.tenantId = :tenantId) AND r.activo = true")
    List<Role> findAvailableRolesForTenant(UUID tenantId);
    
    @Query("SELECT r FROM Role r WHERE r.nombre IN :nombres AND r.activo = true")
    List<Role> findByNombreIn(List<String> nombres);
}
