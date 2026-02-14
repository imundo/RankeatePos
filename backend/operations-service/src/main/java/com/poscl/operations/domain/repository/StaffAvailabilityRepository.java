package com.poscl.operations.domain.repository;

import com.poscl.operations.domain.entity.StaffAvailability;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface StaffAvailabilityRepository extends JpaRepository<StaffAvailability, UUID> {

    List<StaffAvailability> findByTenantIdAndStaffIdAndActivoTrue(UUID tenantId, UUID staffId);

    List<StaffAvailability> findByTenantIdAndActivoTrueOrderByStaffNombreAscDiaSemanaAsc(UUID tenantId);

    List<StaffAvailability> findByTenantIdAndDiaSemanaAndActivoTrue(UUID tenantId, Integer diaSemana);

    List<StaffAvailability> findByTenantIdAndStaffIdAndDiaSemanaAndActivoTrue(
            UUID tenantId, UUID staffId, Integer diaSemana);

    void deleteByTenantIdAndStaffId(UUID tenantId, UUID staffId);
}
