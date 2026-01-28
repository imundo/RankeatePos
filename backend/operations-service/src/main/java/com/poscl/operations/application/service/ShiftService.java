package com.poscl.operations.application.service;

import com.poscl.operations.domain.entity.Employee;
import com.poscl.operations.domain.entity.Shift;
import com.poscl.operations.domain.repository.EmployeeRepository;
import com.poscl.operations.domain.repository.ShiftRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ShiftService {
    private final ShiftRepository shiftRepository;
    private final EmployeeRepository employeeRepository;

    public Shift scheduleShift(UUID tenantId, UUID employeeId, LocalDateTime start, LocalDateTime end, String type) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));

        Shift shift = Shift.builder()
                .tenantId(tenantId)
                .employee(employee)
                .startTime(start)
                .endTime(end)
                .type(type)
                .status("SCHEDULED")
                .build();

        return shiftRepository.save(shift);
    }

    public List<Shift> getShiftsByRange(UUID tenantId, LocalDateTime start, LocalDateTime end) {
        return shiftRepository.findByTenantIdAndStartTimeBetween(tenantId, start, end);
    }

    public java.util.Optional<Shift> getActiveShift(UUID employeeId, LocalDateTime time) {
        return shiftRepository.findActiveShift(employeeId, time);
    }
}
