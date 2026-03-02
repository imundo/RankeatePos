package com.poscl.crm.domain.repository;

import com.poscl.crm.domain.entity.CreditTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CreditTransactionRepository extends JpaRepository<CreditTransaction, UUID> {

    List<CreditTransaction> findByCustomerProfileIdOrderByCreatedAtDesc(UUID customerProfileId);
    
    Page<CreditTransaction> findByTenantIdOrderByCreatedAtDesc(UUID tenantId, Pageable pageable);
}
