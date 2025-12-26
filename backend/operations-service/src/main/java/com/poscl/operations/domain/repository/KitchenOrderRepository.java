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

    @Query(value = "SELECT AVG(EXTRACT(EPOCH FROM (tiempo_completado - tiempo_ingreso))/60) FROM kitchen_orders " +
           "WHERE tenant_id = :tenantId AND branch_id = :branchId AND tiempo_completado IS NOT NULL " +
           "AND tiempo_ingreso > :since", nativeQuery = true)
    Double getAveragePreparationTimeMinutes(UUID tenantId, UUID branchId, LocalDateTime since);
}
