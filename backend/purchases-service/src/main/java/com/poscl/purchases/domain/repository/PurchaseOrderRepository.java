package com.poscl.purchases.domain.repository;

import com.poscl.purchases.domain.entity.PurchaseOrder;
import com.poscl.purchases.domain.entity.PurchaseOrder.PurchaseOrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, UUID> {
    
    Page<PurchaseOrder> findByTenantIdOrderByCreatedAtDesc(UUID tenantId, Pageable pageable);
    
    Page<PurchaseOrder> findByTenantIdAndStatusOrderByCreatedAtDesc(UUID tenantId, PurchaseOrderStatus status, Pageable pageable);
    
    List<PurchaseOrder> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);
    
    List<PurchaseOrder> findByTenantIdAndStatus(UUID tenantId, PurchaseOrderStatus status);
    
    @Query("SELECT COALESCE(MAX(po.orderNumber), 2000) FROM PurchaseOrder po WHERE po.tenantId = :tenantId")
    Long findMaxOrderNumber(UUID tenantId);
    
    @Query("SELECT po FROM PurchaseOrder po LEFT JOIN FETCH po.items WHERE po.id = :id")
    Optional<PurchaseOrder> findByIdWithItems(UUID id);
}
