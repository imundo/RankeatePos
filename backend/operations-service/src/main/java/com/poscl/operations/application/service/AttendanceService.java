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
import java.time.LocalDateTime;
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
    private final ShiftService shiftService;
    private final LeaveService leaveService;

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
            // Check for Active Leave (Blocker)
            Optional<com.poscl.operations.domain.entity.LeaveRequest> activeLeave = leaveService
                    .getActiveLeave(employee.getId(), LocalDate.now());
            if (activeLeave.isPresent()) {
                throw new RuntimeException("No puede marcar asistencia: Empleado con permiso activo ("
                        + activeLeave.get().getType() + ")");
            }

            // Check for Shift (Lateness Calculation)
            // Default status
            String status = "PRESENT";

            // Check active or upcoming shift for today
            // Logic: Find if there is a shift covering NOW or starting soon/recently
            // Using a simple lookup for "Shift at this moment"
            Optional<com.poscl.operations.domain.entity.Shift> shift = shiftService.getActiveShift(employee.getId(),
                    LocalDateTime.now());

            if (shift.isPresent()) {
                LocalDateTime shiftStart = shift.get().getStartTime();
                LocalDateTime now = LocalDateTime.now();

                // Tolerance hardcoded for now (could be fetched from config)
                long toleranceMinutes = 15;
                if (now.isAfter(shiftStart.plusMinutes(toleranceMinutes))) {
                    status = "LATE";
                }
            }

            // Check in
            Attendance newSession = Attendance.builder()
                    .tenantId(tenantId)
                    .employee(employee)
                    .clockInTime(Instant.now())
                    .checkInMethod("PIN")
                    .status(status)
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
