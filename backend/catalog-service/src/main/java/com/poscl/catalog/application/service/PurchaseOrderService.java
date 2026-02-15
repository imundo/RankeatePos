package com.poscl.catalog.application.service;

import com.poscl.catalog.api.dto.CreatePurchaseOrderRequest;
import com.poscl.catalog.api.dto.PurchaseOrderDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface PurchaseOrderService {
    Page<PurchaseOrderDto> getPurchaseOrders(String tenantId, Pageable pageable);

    PurchaseOrderDto getPurchaseOrder(String tenantId, UUID id);

    PurchaseOrderDto createPurchaseOrder(String tenantId, CreatePurchaseOrderRequest request);

    void deletePurchaseOrder(String tenantId, UUID id); // Only DRAFT

    PurchaseOrderDto submitPurchaseOrder(String tenantId, UUID id);

    PurchaseOrderDto receivePurchaseOrder(String tenantId, UUID id);

    PurchaseOrderDto cancelPurchaseOrder(String tenantId, UUID id);
}
