package com.poscl.operations.domain.repository;

import com.poscl.operations.domain.entity.StaffBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface StaffBlockRepository extends JpaRepository<StaffBlock, UUID> {

    List<StaffBlock> findByTenantIdAndStaffId(UUID tenantId, UUID staffId);

    @Query("SELECT sb FROM StaffBlock sb WHERE sb.tenantId = :tenantId AND sb.staffId = :staffId " +
            "AND sb.fechaInicio <= :fecha AND sb.fechaFin >= :fecha")
    List<StaffBlock> findActiveBlocks(
            @Param("tenantId") UUID tenantId,
            @Param("staffId") UUID staffId,
            @Param("fecha") LocalDateTime fecha);
}
