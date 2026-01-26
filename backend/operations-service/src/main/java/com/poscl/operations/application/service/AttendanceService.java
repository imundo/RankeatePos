package com.poscl.operations.application.service;

import com.poscl.operations.domain.entity.Attendance;
import com.poscl.operations.domain.entity.Employee;
import com.poscl.operations.domain.repository.AttendanceRepository;
import com.poscl.operations.domain.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AttendanceService {
    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;

    @Transactional
    public Attendance clockInByPin(UUID tenantId, String pinCode) {
        log.info("Attempting clock in with PIN for tenant {}", tenantId);

        // 1. Find Employee by PIN
        // In real app, we might want a more secure way to lookup, scanning all
        // employees of tenant for match
        // Or adding a findByPinCode to repo (less secure if pins are not unique
        // globally, but unique per tenant)
        Employee employee = employeeRepository.findByTenantIdAndActiveTrue(tenantId).stream()
                .filter(e -> e.getPinCode().equals(pinCode))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("PIN inválido o empleado no encontrado"));

        // 2. Check if already clocked in
        Optional<Attendance> activeSession = attendanceRepository
                .findByTenantIdAndEmployeeIdAndClockOutTimeIsNull(tenantId, employee.getId());

        if (activeSession.isPresent()) {
            // Check out
            Attendance session = activeSession.get();
            session.setClockOutTime(Instant.now());
            session.setStatus("COMPLETED");
            return attendanceRepository.save(session);
        } else {
            // Check in
            Attendance newSession = Attendance.builder()
                    .tenantId(tenantId)
                    .employee(employee)
                    .clockInTime(Instant.now())
                    .checkInMethod("PIN")
                    .status("PRESENT")
                    .build();
            return attendanceRepository.save(newSession);
        }
    }

    public List<Attendance> getMonthlyAttendance(UUID tenantId, int year, int month) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());

        Instant startInstant = start.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant endInstant = end.atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toInstant();

        return attendanceRepository.findByTenantIdAndClockInTimeBetween(tenantId, startInstant, endInstant);
    }
}
