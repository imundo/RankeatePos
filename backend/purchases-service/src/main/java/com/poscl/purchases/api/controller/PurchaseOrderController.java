package com.poscl.purchases.api.controller;

import com.poscl.purchases.domain.entity.PurchaseOrder;
import com.poscl.purchases.domain.entity.PurchaseOrderItem;
import com.poscl.purchases.domain.entity.Supplier;
import com.poscl.purchases.domain.repository.PurchaseOrderRepository;
import com.poscl.purchases.domain.repository.SupplierRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/purchase-orders")
@RequiredArgsConstructor
@Tag(name = "Órdenes de Compra", description = "Gestión de órdenes de compra")
public class PurchaseOrderController {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SupplierRepository supplierRepository;

    @GetMapping
    @Operation(summary = "Listar órdenes de compra")
    public ResponseEntity<Page<PurchaseOrder>> getPurchaseOrders(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestParam(required = false) PurchaseOrder.PurchaseOrderStatus status,
            Pageable pageable) {
        Page<PurchaseOrder> result = status != null
            ? purchaseOrderRepository.findByTenantIdAndStatusOrderByCreatedAtDesc(tenantId, status, pageable)
            : purchaseOrderRepository.findByTenantIdOrderByCreatedAtDesc(tenantId, pageable);
        return ResponseEntity.ok(result);
    }

    @PostMapping
    @Operation(summary = "Crear orden de compra")
    public ResponseEntity<PurchaseOrder> createPurchaseOrder(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId,
            @RequestBody CreatePurchaseOrderRequest request) {
        
        Supplier supplier = supplierRepository.findById(request.supplierId())
            .orElseThrow(() -> new IllegalArgumentException("Proveedor no encontrado"));

        PurchaseOrder po = PurchaseOrder.builder()
            .tenantId(tenantId)
            .orderNumber(purchaseOrderRepository.getNextOrderNumber(tenantId))
            .supplier(supplier)
            .orderDate(LocalDate.now())
            .expectedDeliveryDate(request.expectedDeliveryDate())
            .notes(request.notes())
            .status(PurchaseOrder.PurchaseOrderStatus.DRAFT)
            .createdBy(userId)
            .build();

        for (var itemReq : request.items()) {
            PurchaseOrderItem item = PurchaseOrderItem.builder()
                .productId(itemReq.productId())
                .productSku(itemReq.productSku())
                .productName(itemReq.productName())
                .quantity(itemReq.quantity())
                .unit(itemReq.unit())
                .unitPrice(itemReq.unitPrice())
                .build();
            po.addItem(item);
        }

        return ResponseEntity.ok(purchaseOrderRepository.save(po));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener orden de compra por ID")
    public ResponseEntity<PurchaseOrder> getPurchaseOrderById(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id) {
        return purchaseOrderRepository.findByIdWithItems(id)
            .filter(po -> po.getTenantId().equals(tenantId))
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Aprobar orden de compra")
    public ResponseEntity<PurchaseOrder> approvePurchaseOrder(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId,
            @PathVariable UUID id) {
        
        PurchaseOrder po = purchaseOrderRepository.findById(id)
            .filter(p -> p.getTenantId().equals(tenantId))
            .orElseThrow(() -> new IllegalArgumentException("Orden no encontrada"));

        po.setStatus(PurchaseOrder.PurchaseOrderStatus.APPROVED);
        po.setApprovedAt(LocalDateTime.now());
        po.setApprovedBy(userId);
        
        return ResponseEntity.ok(purchaseOrderRepository.save(po));
    }

    public record CreatePurchaseOrderRequest(
        UUID supplierId,
        LocalDate expectedDeliveryDate,
        String notes,
        java.util.List<ItemRequest> items
    ) {}

    public record ItemRequest(
        UUID productId,
        String productSku,
        String productName,
        java.math.BigDecimal quantity,
        String unit,
        java.math.BigDecimal unitPrice
    ) {}
}
