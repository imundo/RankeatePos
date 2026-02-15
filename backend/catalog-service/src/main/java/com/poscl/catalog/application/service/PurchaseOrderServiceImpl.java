package com.poscl.catalog.application.service;

import com.poscl.catalog.api.dto.CreatePurchaseOrderRequest;
import com.poscl.catalog.api.dto.PurchaseOrderDto;
import com.poscl.catalog.api.mapper.PurchaseOrderMapper;
import com.poscl.catalog.domain.entity.*;
import com.poscl.catalog.domain.enums.PurchaseOrderStatus;
import com.poscl.catalog.domain.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PurchaseOrderServiceImpl implements PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SupplierRepository supplierRepository;
    private final ProductVariantRepository productVariantRepository;
    private final SupplierProductRepository supplierProductRepository;
    private final PurchaseOrderMapper purchaseOrderMapper;

    @Override
    @Transactional(readOnly = true)
    public Page<PurchaseOrderDto> getPurchaseOrders(String tenantId, Pageable pageable) {
        return purchaseOrderRepository.findByTenantId(UUID.fromString(tenantId), pageable)
                .map(purchaseOrderMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public PurchaseOrderDto getPurchaseOrder(String tenantId, UUID id) {
        return purchaseOrderMapper.toDto(getOrderOrThrow(tenantId, id));
    }

    @Override
    @Transactional
    public PurchaseOrderDto createPurchaseOrder(String tenantId, CreatePurchaseOrderRequest request) {
        UUID tenantUuid = UUID.fromString(tenantId);

        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .filter(s -> s.getTenantId().equals(tenantUuid))
                .orElseThrow(() -> new RuntimeException("Supplier not found"));

        // Generate Order Number
        Long nextOrderNumber = purchaseOrderRepository.findMaxOrderNumberByTenantId(tenantUuid)
                .orElse(0L) + 1;

        PurchaseOrder order = PurchaseOrder.builder()
                .tenantId(tenantUuid)
                .orderNumber(nextOrderNumber)
                .supplier(supplier)
                .status(PurchaseOrderStatus.DRAFT)
                .expectedDeliveryDate(request.getExpectedDeliveryDate())
                .notes(request.getNotes())
                .items(new ArrayList<>())
                .totalAmount(0)
                .build();

        // Add Items
        int total = 0;
        if (request.getItems() != null) {
            for (var itemReq : request.getItems()) {
                ProductVariant variant = productVariantRepository.findById(itemReq.getProductVariantId())
                        .orElseThrow(() -> new RuntimeException(
                                "Product Variant not found: " + itemReq.getProductVariantId()));

                int subtotal = itemReq.getQuantity() * itemReq.getUnitCost();
                total += subtotal;

                PurchaseOrderItem item = PurchaseOrderItem.builder()
                        .purchaseOrder(order)
                        .productVariant(variant)
                        .quantity(itemReq.getQuantity())
                        .unitCost(itemReq.getUnitCost())
                        .subtotal(subtotal)
                        .build();
                order.getItems().add(item);
            }
        }
        order.setTotalAmount(total);

        return purchaseOrderMapper.toDto(purchaseOrderRepository.save(order));
    }

    @Override
    @Transactional
    public void deletePurchaseOrder(String tenantId, UUID id) {
        PurchaseOrder order = getOrderOrThrow(tenantId, id);
        if (order.getStatus() != PurchaseOrderStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT orders can be deleted");
        }
        purchaseOrderRepository.delete(order);
    }

    @Override
    @Transactional
    public PurchaseOrderDto submitPurchaseOrder(String tenantId, UUID id) {
        PurchaseOrder order = getOrderOrThrow(tenantId, id);
        if (order.getStatus() != PurchaseOrderStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT orders can be submitted");
        }
        order.setStatus(PurchaseOrderStatus.SENT);
        return purchaseOrderMapper.toDto(purchaseOrderRepository.save(order));
    }

    @Override
    @Transactional
    public PurchaseOrderDto receivePurchaseOrder(String tenantId, UUID id) {
        PurchaseOrder order = getOrderOrThrow(tenantId, id);

        // Can receive from SENT or PARTIAL? Assuming SENT for now.
        if (order.getStatus() != PurchaseOrderStatus.SENT) {
            throw new RuntimeException("Order must be SENT to be received");
        }

        // Processing Logic
        for (PurchaseOrderItem item : order.getItems()) {
            ProductVariant variant = item.getProductVariant();

            // 1. Calculate Weighted Average Cost
            // New Cost = ((Current Stock * Current Cost) + (New Stock * New Cost)) / Total
            // Stock
            int currentStock = variant.getStock();
            // Handle null cost (treat as 0)
            int currentCost = variant.getCosto() != null ? variant.getCosto() : 0;
            int newQuantity = item.getQuantity();
            int newUnitCost = item.getUnitCost();

            long totalValue = ((long) currentStock * currentCost) + ((long) newQuantity * newUnitCost);
            int totalStock = currentStock + newQuantity;

            int newWeightedCost = totalStock > 0 ? (int) (totalValue / totalStock) : newUnitCost;

            // Update Variant
            variant.setStock(totalStock);
            variant.setCosto(newWeightedCost);
            productVariantRepository.save(variant);

            // 2. Update Supplier Product (Last Cost)
            // Ideally should find by supplier + variant
            supplierProductRepository.findBySupplierId(order.getSupplier().getId()).stream()
                    .filter(sp -> sp.getProductVariant().getId().equals(variant.getId()))
                    .findFirst()
                    .ifPresent(sp -> {
                        sp.setLastCost(newUnitCost);
                        supplierProductRepository.save(sp);
                    });
        }

        order.setStatus(PurchaseOrderStatus.RECEIVED);
        return purchaseOrderMapper.toDto(purchaseOrderRepository.save(order));
    }

    @Override
    @Transactional
    public PurchaseOrderDto cancelPurchaseOrder(String tenantId, UUID id) {
        PurchaseOrder order = getOrderOrThrow(tenantId, id);
        if (order.getStatus() == PurchaseOrderStatus.RECEIVED) {
            throw new RuntimeException("Cannot cancel RECEIVED order");
        }
        order.setStatus(PurchaseOrderStatus.CANCELLED);
        return purchaseOrderMapper.toDto(purchaseOrderRepository.save(order));
    }

    private PurchaseOrder getOrderOrThrow(String tenantId, UUID id) {
        return purchaseOrderRepository.findById(id)
                .filter(o -> o.getTenantId().equals(UUID.fromString(tenantId)))
                .orElseThrow(() -> new RuntimeException("Order not found"));
    }
}
