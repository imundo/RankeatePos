package com.poscl.operations.domain.repository;

import com.poscl.operations.domain.entity.LoyaltyCustomer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LoyaltyCustomerRepository extends JpaRepository<LoyaltyCustomer, UUID> {

    Page<LoyaltyCustomer> findByTenantIdAndActivo(UUID tenantId, Boolean activo, Pageable pageable);

    Optional<LoyaltyCustomer> findByTenantIdAndEmail(UUID tenantId, String email);

    Optional<LoyaltyCustomer> findByTenantIdAndTelefono(UUID tenantId, String telefono);

    List<LoyaltyCustomer> findByTenantIdAndNivel(UUID tenantId, String nivel);

    @Query("SELECT c FROM LoyaltyCustomer c WHERE c.tenantId = :tenantId AND c.activo = true " +
           "AND (LOWER(c.nombre) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(c.email) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR c.telefono LIKE CONCAT('%', :query, '%'))")
    List<LoyaltyCustomer> searchByQuery(UUID tenantId, String query);

    @Query("SELECT COUNT(c) FROM LoyaltyCustomer c WHERE c.tenantId = :tenantId AND c.activo = true")
    Long countActiveByTenantId(UUID tenantId);

    @Query("SELECT SUM(c.puntosActuales) FROM LoyaltyCustomer c WHERE c.tenantId = :tenantId")
    Long sumPuntosActualesByTenantId(UUID tenantId);
}
