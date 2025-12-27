package com.poscl.purchases.application.service;

import com.poscl.purchases.domain.entity.PurchaseOrder;
import com.poscl.purchases.domain.repository.PurchaseOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
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
    public List<PurchaseOrder> findByStatus(UUID tenantId, PurchaseOrder.OrderStatus status) {
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
        order.setStatus(PurchaseOrder.OrderStatus.DRAFT);
        order.setOrderNumber(generateOrderNumber(tenantId));
        order.setOrderDate(LocalDate.now());
        
        log.info("Creating purchase order {} for tenant: {}", order.getOrderNumber(), tenantId);
        return orderRepository.save(order);
    }

    @Transactional
    public PurchaseOrder approve(UUID tenantId, UUID id) {
        PurchaseOrder order = findById(tenantId, id)
                .orElseThrow(() -> new IllegalArgumentException("Orden no encontrada"));
        
        if (order.getStatus() != PurchaseOrder.OrderStatus.DRAFT) {
            throw new IllegalStateException("Solo se pueden aprobar órdenes en estado DRAFT");
        }
        
        order.setStatus(PurchaseOrder.OrderStatus.APPROVED);
        order.setApprovedAt(LocalDate.now());
        log.info("Approved purchase order: {}", order.getOrderNumber());
        return orderRepository.save(order);
    }

    @Transactional
    public PurchaseOrder send(UUID tenantId, UUID id) {
        PurchaseOrder order = findById(tenantId, id)
                .orElseThrow(() -> new IllegalArgumentException("Orden no encontrada"));
        
        if (order.getStatus() != PurchaseOrder.OrderStatus.APPROVED) {
            throw new IllegalStateException("Solo se pueden enviar órdenes aprobadas");
        }
        
        order.setStatus(PurchaseOrder.OrderStatus.SENT);
        order.setSentAt(LocalDate.now());
        return orderRepository.save(order);
    }

    @Transactional
    public PurchaseOrder receive(UUID tenantId, UUID id) {
        PurchaseOrder order = findById(tenantId, id)
                .orElseThrow(() -> new IllegalArgumentException("Orden no encontrada"));
        
        order.setStatus(PurchaseOrder.OrderStatus.RECEIVED);
        order.setReceivedAt(LocalDate.now());
        return orderRepository.save(order);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSummary(UUID tenantId) {
        List<PurchaseOrder> all = findAll(tenantId);
        
        long pending = all.stream()
                .filter(o -> o.getStatus() == PurchaseOrder.OrderStatus.DRAFT 
                        || o.getStatus() == PurchaseOrder.OrderStatus.APPROVED
                        || o.getStatus() == PurchaseOrder.OrderStatus.SENT)
                .count();
        
        BigDecimal totalAmount = all.stream()
                .map(PurchaseOrder::getTotal)
                .filter(t -> t != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        return Map.of(
            "totalOrders", all.size(),
            "pendingOrders", pending,
            "totalAmount", totalAmount,
            "draftCount", all.stream().filter(o -> o.getStatus() == PurchaseOrder.OrderStatus.DRAFT).count(),
            "approvedCount", all.stream().filter(o -> o.getStatus() == PurchaseOrder.OrderStatus.APPROVED).count()
        );
    }

    private int generateOrderNumber(UUID tenantId) {
        Integer maxNumber = orderRepository.findMaxOrderNumber(tenantId);
        return (maxNumber != null ? maxNumber : 2000) + 1;
    }
}
