package com.poscl.purchases.application.service;

import com.poscl.purchases.api.dto.CreatePurchaseOrderRequest;
import com.poscl.purchases.domain.entity.PurchaseOrder;
import com.poscl.purchases.domain.entity.PurchaseOrderItem;
import com.poscl.purchases.domain.entity.PurchaseOrder.PurchaseOrderStatus;
import com.poscl.purchases.domain.entity.Supplier;
import com.poscl.purchases.domain.repository.PurchaseOrderRepository;
import com.poscl.purchases.domain.repository.SupplierRepository;
import com.poscl.purchases.domain.repository.AccountPayableRepository;
import com.poscl.purchases.domain.entity.AccountPayable;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class PurchaseOrderService {

    private final PurchaseOrderRepository orderRepository;
    private final SupplierRepository supplierRepository;
    private final AccountPayableRepository accountPayableRepository;

    @Transactional(readOnly = true)
    public List<PurchaseOrder> findAll(UUID tenantId) {
        return orderRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrder> findBySupplierId(UUID tenantId, UUID supplierId) {
        return orderRepository.findByTenantIdAndSupplierIdOrderByCreatedAtDesc(tenantId, supplierId);
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrder> findByStatus(UUID tenantId, PurchaseOrderStatus status) {
        return orderRepository.findByTenantIdAndStatus(tenantId, status);
    }

    @Transactional(readOnly = true)
    public Optional<PurchaseOrder> findById(UUID tenantId, UUID id) {
        return orderRepository.findById(id)
                .filter(o -> o.getTenantId().equals(tenantId));
    }

    @Transactional
    public PurchaseOrder create(UUID tenantId, CreatePurchaseOrderRequest request) {
        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .filter(s -> s.getTenantId().equals(tenantId))
                .orElseThrow(() -> new IllegalArgumentException("Proveedor no encontrado"));

        PurchaseOrder order = new PurchaseOrder();
        order.setTenantId(tenantId);
        order.setSupplier(supplier);
        order.setStatus(PurchaseOrderStatus.DRAFT);
        order.setOrderNumber(generateOrderNumber(tenantId));
        order.setOrderDate(LocalDate.now());
        order.setNotes(request.getNotes());
        
        if (request.getExpectedDeliveryDate() != null && !request.getExpectedDeliveryDate().isEmpty()) {
            try {
                order.setExpectedDeliveryDate(LocalDate.parse(request.getExpectedDeliveryDate().split("T")[0]));
            } catch (Exception e) {
                log.warn("Invalid expectedDeliveryDate: {}", request.getExpectedDeliveryDate());
            }
        }

        BigDecimal total = BigDecimal.ZERO;
        List<PurchaseOrderItem> orderItems = new ArrayList<>();
        
        if (request.getItems() != null) {
            int lineOrder = 1;
            for (CreatePurchaseOrderRequest.CreatePurchaseOrderItemRequest itemReq : request.getItems()) {
                PurchaseOrderItem item = new PurchaseOrderItem();
                item.setPurchaseOrder(order);
                item.setProductId(itemReq.getProductVariantId());
                item.setProductName(itemReq.getProductName() != null ? itemReq.getProductName() : "Producto sin nombre");
                item.setProductSku(itemReq.getProductSku());
                item.setQuantity(BigDecimal.valueOf(itemReq.getQuantity()));
                item.setUnitPrice(itemReq.getUnitCost());
                item.calculateSubtotal();
                item.setLineOrder(lineOrder++);
                orderItems.add(item);
                total = total.add(item.getSubtotal());
            }
        }
        
        order.setItems(orderItems);
        order.setSubtotal(total);
        order.setTaxAmount(BigDecimal.ZERO); // Simple example
        order.setTotal(total);

        // Update supplier stats
        supplier.setTotalOrders(supplier.getTotalOrders() + 1);
        supplierRepository.save(supplier);

        log.info("Creating purchase order {} for tenant: {}", order.getOrderNumber(), tenantId);
        return orderRepository.save(order);
    }

    @Transactional
    public PurchaseOrder submit(UUID tenantId, UUID id) {
        return approve(tenantId, id); // Alias for approve
    }

    @Transactional
    public PurchaseOrder approve(UUID tenantId, UUID id) {
        PurchaseOrder order = findById(tenantId, id)
                .orElseThrow(() -> new IllegalArgumentException("Orden no encontrada"));
        
        if (order.getStatus() != PurchaseOrderStatus.DRAFT && order.getStatus() != PurchaseOrderStatus.PENDING_APPROVAL) {
            throw new IllegalStateException("Solo se pueden aprobar ordenes en estado DRAFT o PENDING_APPROVAL");
        }
        
        order.setStatus(PurchaseOrderStatus.APPROVED);
        order.setApprovedAt(LocalDateTime.now());
        log.info("Approved purchase order: {}", order.getOrderNumber());
        return orderRepository.save(order);
    }

    @Transactional
    public PurchaseOrder send(UUID tenantId, UUID id) {
        PurchaseOrder order = findById(tenantId, id)
                .orElseThrow(() -> new IllegalArgumentException("Orden no encontrada"));
        
        if (order.getStatus() != PurchaseOrderStatus.APPROVED) {
            throw new IllegalStateException("Solo se pueden enviar ordenes aprobadas");
        }
        
        order.setStatus(PurchaseOrderStatus.SENT);
        return orderRepository.save(order);
    }

    @Transactional
    public PurchaseOrder receive(UUID tenantId, UUID id) {
        PurchaseOrder order = findById(tenantId, id)
                .orElseThrow(() -> new IllegalArgumentException("Orden no encontrada"));
        
        if (order.getStatus() == PurchaseOrderStatus.RECEIVED) {
            return order; // Already received
        }
        
        order.setStatus(PurchaseOrderStatus.RECEIVED);
        
        // Update Supplier KPIs and Create Account Payable
        Supplier supplier = order.getSupplier();
        if (supplier != null && order.getTotal() != null) {
            supplier.setTotalSpent(supplier.getTotalSpent().add(order.getTotal()));
            supplierRepository.save(supplier);
            
            AccountPayable payable = AccountPayable.builder()
                .tenantId(tenantId)
                .supplier(supplier)
                .purchaseOrder(order)
                .documentNumber("OC-" + order.getOrderNumber())
                .documentType("PURCHASE_ORDER")
                .issueDate(LocalDate.now())
                .dueDate(LocalDate.now().plusDays(30))
                .amount(order.getTotal())
                .balance(order.getTotal())
                .status(AccountPayable.AccountPayableStatus.PENDING)
                .build();
            accountPayableRepository.save(payable);
        }
        
        return orderRepository.save(order);
    }

    @Transactional
    public PurchaseOrder cancel(UUID tenantId, UUID id) {
        PurchaseOrder order = findById(tenantId, id)
                .orElseThrow(() -> new IllegalArgumentException("Orden no encontrada"));
        
        order.setStatus(PurchaseOrderStatus.CANCELLED);
        return orderRepository.save(order);
    }

    @Transactional
    public void delete(UUID tenantId, UUID id) {
        PurchaseOrder order = findById(tenantId, id)
                .orElseThrow(() -> new IllegalArgumentException("Orden no encontrada"));
        
        if (order.getStatus() != PurchaseOrderStatus.DRAFT && order.getStatus() != PurchaseOrderStatus.CANCELLED) {
            throw new IllegalStateException("Solo se pueden eliminar ordenes en borrador o canceladas");
        }
        
        orderRepository.delete(order);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSummary(UUID tenantId) {
        List<PurchaseOrder> all = findAll(tenantId);
        
        long pending = all.stream()
                .filter(o -> o.getStatus() == PurchaseOrderStatus.DRAFT 
                        || o.getStatus() == PurchaseOrderStatus.APPROVED
                        || o.getStatus() == PurchaseOrderStatus.SENT)
                .count();
        
        BigDecimal totalAmount = all.stream()
                .map(PurchaseOrder::getTotal)
                .filter(t -> t != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        return Map.of(
            "totalOrders", all.size(),
            "pendingOrders", pending,
            "totalAmount", totalAmount,
            "draftCount", all.stream().filter(o -> o.getStatus() == PurchaseOrderStatus.DRAFT).count(),
            "approvedCount", all.stream().filter(o -> o.getStatus() == PurchaseOrderStatus.APPROVED).count()
        );
    }

    private Long generateOrderNumber(UUID tenantId) {
        Long maxNumber = orderRepository.findMaxOrderNumber(tenantId);
        return (maxNumber != null ? maxNumber : 2000L) + 1;
    }
}
