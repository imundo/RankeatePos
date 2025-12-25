package com.poscl.operations.domain.repository;

import com.poscl.operations.domain.entity.SubscriptionDelivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface SubscriptionDeliveryRepository extends JpaRepository<SubscriptionDelivery, UUID> {

    List<SubscriptionDelivery> findByFechaOrderByHoraProgramadaAsc(LocalDate fecha);

    List<SubscriptionDelivery> findByFechaAndEstadoOrderByHoraProgramadaAsc(LocalDate fecha, String estado);

    List<SubscriptionDelivery> findBySubscriptionIdOrderByFechaDesc(UUID subscriptionId);

    Long countByFechaAndEstado(LocalDate fecha, String estado);
}
