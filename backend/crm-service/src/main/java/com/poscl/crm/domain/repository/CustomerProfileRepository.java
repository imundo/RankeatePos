package com.poscl.crm.domain.repository;

import com.poscl.crm.domain.entity.CustomerProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomerProfileRepository extends JpaRepository<CustomerProfile, UUID> {

    Page<CustomerProfile> findByTenantId(UUID tenantId, Pageable pageable);

    Optional<CustomerProfile> findByTenantIdAndRut(UUID tenantId, String rut);

    Optional<CustomerProfile> findByTenantIdAndEmail(UUID tenantId, String email);

    @Query("SELECT c FROM CustomerProfile c WHERE c.tenantId = :tenantId AND c.currentDebt > 0")
    Page<CustomerProfile> findDebtorsByTenantId(UUID tenantId, Pageable pageable);

    @Query("SELECT c FROM CustomerProfile c WHERE c.tenantId = :tenantId " +
           "AND (LOWER(c.fullName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(c.rut) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(c.email) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR c.phone LIKE CONCAT('%', :query, '%'))")
    List<CustomerProfile> searchByQuery(UUID tenantId, String query);
    
    @Query("SELECT SUM(c.currentDebt) FROM CustomerProfile c WHERE c.tenantId = :tenantId")
    BigDecimal sumTotalDebtByTenantId(UUID tenantId);
}
