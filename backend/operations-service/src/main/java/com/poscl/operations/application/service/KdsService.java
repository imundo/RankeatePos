package com.poscl.operations.application.service;

import com.poscl.operations.domain.entity.KitchenOrder;
import com.poscl.operations.domain.entity.KitchenOrderItem;
import com.poscl.operations.domain.repository.KitchenOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class KdsService {

    private final KitchenOrderRepository orderRepository;

    public List<KitchenOrder> getActiveOrders(UUID tenantId, UUID branchId) {
        return orderRepository.findByTenantIdAndBranchIdAndEstadoInOrderByPrioridadDescTiempoIngresoAsc(
                tenantId, branchId, Arrays.asList("PENDIENTE", "PREPARANDO", "LISTO"));
    }

    public Optional<KitchenOrder> getOrderById(UUID orderId) {
        return orderRepository.findById(orderId);
    }

    @Transactional
    public KitchenOrder updateOrderStatus(UUID orderId, String newStatus) {
        KitchenOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));

        switch (newStatus.toUpperCase()) {
            case "PREPARANDO" -> order.startPreparing();
            case "LISTO" -> order.markReady();
            case "ENTREGADO" -> order.markDelivered();
            case "CANCELADO" -> order.cancel();
            default -> order.setEstado(newStatus);
        }

        log.info("Updated order {} status to {}", orderId, newStatus);
        return orderRepository.save(order);
    }

    @Transactional
    public KitchenOrderItem updateItemStatus(UUID orderId, UUID itemId, String newStatus) {
        KitchenOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));

        KitchenOrderItem item = order.getItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Item not found: " + itemId));

        switch (newStatus.toUpperCase()) {
            case "PREPARANDO" -> item.startPreparing();
            case "LISTO" -> item.markReady();
            default -> item.setEstado(newStatus);
        }

        // Check if all items are ready, then mark order as ready
        boolean allReady = order.getItems().stream()
                .allMatch(i -> "LISTO".equals(i.getEstado()));
        if (allReady && !"LISTO".equals(order.getEstado())) {
            order.markReady();
        }

        orderRepository.save(order);
        log.info("Updated item {} status to {}", itemId, newStatus);
        return item;
    }

    public KdsStats getStats(UUID tenantId, UUID branchId) {
        Long pendientes = orderRepository.countByTenantIdAndBranchIdAndEstado(tenantId, branchId, "PENDIENTE");
        Long enPreparacion = orderRepository.countByTenantIdAndBranchIdAndEstado(tenantId, branchId, "PREPARANDO");
        Long listos = orderRepository.countByTenantIdAndBranchIdAndEstado(tenantId, branchId, "LISTO");
        
        Double avgTime = orderRepository.getAveragePreparationTimeMinutes(
                tenantId, branchId, LocalDateTime.now().minusHours(24));

        return new KdsStats(
                pendientes != null ? pendientes : 0,
                enPreparacion != null ? enPreparacion : 0,
                listos != null ? listos : 0,
                avgTime != null ? avgTime.intValue() : 0
        );
    }

    public record KdsStats(long pendientes, long enPreparacion, long listos, int tiempoPromedioMinutos) {}
}
