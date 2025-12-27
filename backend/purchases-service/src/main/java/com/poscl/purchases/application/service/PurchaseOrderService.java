package com.poscl.purchases.application.service;

import com.poscl.purchases.domain.entity.PurchaseOrder;
import com.poscl.purchases.domain.entity.PurchaseOrder.PurchaseOrderStatus;
import com.poscl.purchases.domain.repository.PurchaseOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class PurchaseOrderService {

    private final PurchaseOrderRepository orderRepository;

    @Transactional(readOnly = true)
    public List<PurchaseOrder> findAll(UUID tenantId) {
        return orderRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
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
    public PurchaseOrder create(UUID tenantId, PurchaseOrder order) {
        order.setTenantId(tenantId);
        order.setStatus(PurchaseOrderStatus.DRAFT);
        order.setOrderNumber(generateOrderNumber(tenantId));
        order.setOrderDate(LocalDate.now());
        
        log.info("Creating purchase order {} for tenant: {}", order.getOrderNumber(), tenantId);
        return orderRepository.save(order);
    }

    @Transactional
    public PurchaseOrder approve(UUID tenantId, UUID id) {
        PurchaseOrder order = findById(tenantId, id)
                .orElseThrow(() -> new IllegalArgumentException("Orden no encontrada"));
        
        if (order.getStatus() != PurchaseOrderStatus.DRAFT && order.getStatus() != PurchaseOrderStatus.PENDING_APPROVAL) {
            throw new IllegalStateException("Solo se pueden aprobar órdenes en estado DRAFT o PENDING_APPROVAL");
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
            throw new IllegalStateException("Solo se pueden enviar órdenes aprobadas");
        }
        
        order.setStatus(PurchaseOrderStatus.SENT);
        return orderRepository.save(order);
    }

    @Transactional
    public PurchaseOrder receive(UUID tenantId, UUID id) {
        PurchaseOrder order = findById(tenantId, id)
                .orElseThrow(() -> new IllegalArgumentException("Orden no encontrada"));
        
        order.setStatus(PurchaseOrderStatus.RECEIVED);
        return orderRepository.save(order);
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
