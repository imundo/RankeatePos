package com.poscl.operations.domain.repository;

import com.poscl.operations.domain.entity.RestaurantTable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RestaurantTableRepository extends JpaRepository<RestaurantTable, UUID> {

    List<RestaurantTable> findByTenantIdAndBranchIdAndActivoOrderByNumeroAsc(
            UUID tenantId, UUID branchId, Boolean activo);

    List<RestaurantTable> findByTenantIdAndBranchIdAndEstadoAndActivo(
            UUID tenantId, UUID branchId, String estado, Boolean activo);

    List<RestaurantTable> findByTenantIdAndBranchIdAndCapacidadGreaterThanEqualAndEstado(
            UUID tenantId, UUID branchId, Integer capacidad, String estado);
}
