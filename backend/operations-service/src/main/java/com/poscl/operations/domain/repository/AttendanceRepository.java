package com.poscl.operations.domain.repository;

import com.poscl.operations.domain.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, UUID> {
    List<Attendance> findByTenantIdAndEmployeeId(UUID tenantId, UUID employeeId);

    // Find active session (clocked in but not out)
    Optional<Attendance> findByTenantIdAndEmployeeIdAndClockOutTimeIsNull(UUID tenantId, UUID employeeId);

    List<Attendance> findByTenantIdAndClockInTimeBetween(UUID tenantId, Instant start, Instant end);
}
