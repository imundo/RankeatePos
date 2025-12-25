package com.poscl.operations.application.service;

import com.poscl.operations.domain.entity.Subscription;
import com.poscl.operations.domain.entity.SubscriptionDelivery;
import com.poscl.operations.domain.entity.SubscriptionPlan;
import com.poscl.operations.domain.repository.SubscriptionDeliveryRepository;
import com.poscl.operations.domain.repository.SubscriptionPlanRepository;
import com.poscl.operations.domain.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionsService {

    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionPlanRepository planRepository;
    private final SubscriptionDeliveryRepository deliveryRepository;

    // ==================== PLANS ====================

    public List<SubscriptionPlan> getActivePlans(UUID tenantId) {
        return planRepository.findByTenantIdAndActivoOrderByPrecioAsc(tenantId, true);
    }

    public List<SubscriptionPlan> getAllPlans(UUID tenantId) {
        return planRepository.findByTenantIdOrderByNombreAsc(tenantId);
    }

    @Transactional
    public SubscriptionPlan createPlan(UUID tenantId, String nombre, String descripcion,
                                       String frecuencia, BigDecimal precio, String productos) {
        SubscriptionPlan plan = SubscriptionPlan.builder()
                .tenantId(tenantId)
                .nombre(nombre)
                .descripcion(descripcion)
                .frecuencia(frecuencia)
                .precio(precio)
                .productos(productos)
                .build();

        log.info("Creating subscription plan: {} for tenant: {}", nombre, tenantId);
        return planRepository.save(plan);
    }

    // ==================== SUBSCRIPTIONS ====================

    public List<Subscription> getSubscriptions(UUID tenantId) {
        return subscriptionRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    public List<Subscription> getActiveSubscriptions(UUID tenantId) {
        return subscriptionRepository.findByTenantIdAndEstadoOrderByCreatedAtDesc(tenantId, "ACTIVA");
    }

    public Optional<Subscription> getSubscriptionById(UUID id) {
        return subscriptionRepository.findById(id);
    }

    @Transactional
    public Subscription createSubscription(UUID tenantId, UUID planId, String clienteNombre,
                                           String clienteTelefono, String direccionEntrega,
                                           String comuna, LocalDate fechaInicio) {
        
        SubscriptionPlan plan = planRepository.findById(planId)
                .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + planId));

        LocalDate proximaEntrega = calculateNextDelivery(fechaInicio, plan.getFrecuencia());

        Subscription subscription = Subscription.builder()
                .tenantId(tenantId)
                .plan(plan)
                .clienteNombre(clienteNombre)
                .clienteTelefono(clienteTelefono)
                .direccionEntrega(direccionEntrega)
                .comuna(comuna)
                .fechaInicio(fechaInicio)
                .proximaEntrega(proximaEntrega)
                .build();

        log.info("Creating subscription for {} with plan {}", clienteNombre, plan.getNombre());
        return subscriptionRepository.save(subscription);
    }

    @Transactional
    public Subscription updateStatus(UUID subscriptionId, String newStatus) {
        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found: " + subscriptionId));

        switch (newStatus.toUpperCase()) {
            case "PAUSADA" -> subscription.pause();
            case "ACTIVA" -> subscription.resume();
            case "CANCELADA" -> subscription.cancel();
            default -> subscription.setEstado(newStatus);
        }

        log.info("Updated subscription {} status to {}", subscriptionId, newStatus);
        return subscriptionRepository.save(subscription);
    }

    // ==================== DELIVERIES ====================

    public List<SubscriptionDelivery> getDeliveriesForDate(LocalDate date) {
        return deliveryRepository.findByFechaOrderByHoraProgramadaAsc(date);
    }

    public List<SubscriptionDelivery> getPendingDeliveries(LocalDate date) {
        return deliveryRepository.findByFechaAndEstadoOrderByHoraProgramadaAsc(date, "PENDIENTE");
    }

    @Transactional
    public SubscriptionDelivery updateDeliveryStatus(UUID deliveryId, String newStatus) {
        SubscriptionDelivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new IllegalArgumentException("Delivery not found: " + deliveryId));

        switch (newStatus.toUpperCase()) {
            case "EN_RUTA" -> delivery.startDelivery();
            case "ENTREGADO" -> {
                delivery.markDelivered();
                // Update subscription delivery count
                Subscription subscription = delivery.getSubscription();
                subscription.setTotalEntregas(subscription.getTotalEntregas() + 1);
                subscriptionRepository.save(subscription);
            }
            case "FALLIDO" -> delivery.markFailed("Entrega fallida");
            default -> delivery.setEstado(newStatus);
        }

        log.info("Updated delivery {} status to {}", deliveryId, newStatus);
        return deliveryRepository.save(delivery);
    }

    // ==================== STATS ====================

    public SubscriptionStats getStats(UUID tenantId) {
        Long activeCount = subscriptionRepository.countByTenantIdAndEstado(tenantId, "ACTIVA");
        BigDecimal mrr = subscriptionRepository.calculateMonthlyRecurringRevenue(tenantId);
        Long pendingDeliveries = deliveryRepository.countByFechaAndEstado(LocalDate.now(), "PENDIENTE");

        return new SubscriptionStats(
                activeCount != null ? activeCount : 0,
                mrr != null ? mrr : BigDecimal.ZERO,
                pendingDeliveries != null ? pendingDeliveries : 0
        );
    }

    // ==================== HELPERS ====================

    private LocalDate calculateNextDelivery(LocalDate from, String frecuencia) {
        return switch (frecuencia.toUpperCase()) {
            case "DIARIA" -> from.plusDays(1);
            case "SEMANAL" -> from.plusWeeks(1);
            case "QUINCENAL" -> from.plusWeeks(2);
            case "MENSUAL" -> from.plusMonths(1);
            default -> from.plusDays(1);
        };
    }

    public record SubscriptionStats(long activeSubscriptions, BigDecimal monthlyRevenue, long pendingDeliveries) {}
}
