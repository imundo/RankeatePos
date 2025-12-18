package com.poscl.sales.domain.repository;

import com.poscl.sales.domain.entity.CashRegister;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CashRegisterRepository extends JpaRepository<CashRegister, UUID> {
    
    @Query("SELECT cr FROM CashRegister cr WHERE cr.tenantId = :tenantId AND cr.branchId = :branchId AND cr.activa = true")
    List<CashRegister> findActiveByBranchId(UUID tenantId, UUID branchId);
    
    @Query("SELECT cr FROM CashRegister cr WHERE cr.id = :id AND cr.tenantId = :tenantId")
    Optional<CashRegister> findByIdAndTenantId(UUID id, UUID tenantId);
    
    @Query("SELECT cr FROM CashRegister cr WHERE cr.tenantId = :tenantId AND cr.activa = true")
    List<CashRegister> findActiveByTenantId(UUID tenantId);
}
