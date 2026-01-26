package com.poscl.purchases.domain.repository;

import com.poscl.purchases.domain.entity.PurchaseRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PurchaseRequestRepository extends JpaRepository<PurchaseRequest, UUID> {
    List<PurchaseRequest> findByTenantId(UUID tenantId);

    List<PurchaseRequest> findByTenantIdAndStatus(UUID tenantId, PurchaseRequest.RequestStatus status);
}
