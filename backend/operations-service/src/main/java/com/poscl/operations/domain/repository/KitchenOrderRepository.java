package com.poscl.operations.domain.repository;

import com.poscl.operations.domain.entity.KitchenOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface KitchenOrderRepository extends JpaRepository<KitchenOrder, UUID> {

    List<KitchenOrder> findByTenantIdAndBranchIdAndEstadoNotOrderByPrioridadDescTiempoIngresoAsc(
            UUID tenantId, UUID branchId, String excludedEstado);

    List<KitchenOrder> findByTenantIdAndBranchIdAndEstadoInOrderByPrioridadDescTiempoIngresoAsc(
            UUID tenantId, UUID branchId, List<String> estados);

    @Query("SELECT COUNT(o) FROM KitchenOrder o WHERE o.tenantId = :tenantId AND o.branchId = :branchId AND o.estado = :estado")
    Long countByTenantIdAndBranchIdAndEstado(UUID tenantId, UUID branchId, String estado);

    @Query("SELECT AVG(EXTRACT(EPOCH FROM (o.tiempoCompletado - o.tiempoIngreso))/60) FROM KitchenOrder o " +
           "WHERE o.tenantId = :tenantId AND o.branchId = :branchId AND o.tiempoCompletado IS NOT NULL " +
           "AND o.tiempoIngreso > :since")
    Double getAveragePreparationTimeMinutes(UUID tenantId, UUID branchId, LocalDateTime since);
}
