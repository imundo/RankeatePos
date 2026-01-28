package com.poscl.operations.domain.repository;

import com.poscl.operations.domain.entity.Shift;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface ShiftRepository extends JpaRepository<Shift, UUID> {
    List<Shift> findByTenantIdAndStartTimeBetween(UUID tenantId, LocalDateTime start, LocalDateTime end);

    List<Shift> findByEmployeeIdAndStartTimeBetween(UUID employeeId, LocalDateTime start, LocalDateTime end);

    @org.springframework.data.jpa.repository.Query("SELECT s FROM Shift s WHERE s.employee.id = :employeeId AND s.startTime <= :time AND s.endTime >= :time AND s.status != 'CANCELLED'")
    java.util.Optional<Shift> findActiveShift(UUID employeeId, LocalDateTime time);
}
