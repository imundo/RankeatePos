package com.poscl.operations.application.service;

import com.poscl.operations.domain.entity.*;
import com.poscl.operations.domain.repository.*;
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
public class PublicAttendanceService {
    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;
    private final PublicAttendanceLinkRepository linkRepository;
    private final AttendanceStatisticsRepository statisticsRepository;

    // ============ Public Attendance Links ============

    @Transactional
    public PublicAttendanceLink createLink(UUID tenantId, UUID branchId, String name, String createdBy) {
        PublicAttendanceLink link = PublicAttendanceLink.builder()
                .tenantId(tenantId)
                .branchId(branchId)
                .name(name)
                .createdBy(createdBy)
                .build();
        return linkRepository.save(link);
    }

    public List<PublicAttendanceLink> getLinksByTenant(UUID tenantId) {
        return linkRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    public List<PublicAttendanceLink> getActiveLinksByTenant(UUID tenantId) {
        return linkRepository.findByTenantIdAndActiveTrue(tenantId);
    }

    public Optional<PublicAttendanceLink> findByToken(String token) {
        return linkRepository.findByToken(token);
    }

    public Optional<PublicAttendanceLink> findActiveByToken(String token) {
        return linkRepository.findByTokenAndActiveTrue(token);
    }

    @Transactional
    public void deactivateLink(UUID linkId, String deactivatedBy, String reason) {
        PublicAttendanceLink link = linkRepository.findById(linkId)
                .orElseThrow(() -> new RuntimeException("Link no encontrado"));
        link.deactivate(deactivatedBy, reason);
        linkRepository.save(link);
    }

    @Transactional
    public void reactivateLink(UUID linkId) {
        PublicAttendanceLink link = linkRepository.findById(linkId)
                .orElseThrow(() -> new RuntimeException("Link no encontrado"));
        link.setActive(true);
        link.setDeactivatedAt(null);
        link.setDeactivatedBy(null);
        link.setDeactivationReason(null);
        linkRepository.save(link);
    }

    // ============ Public Clock In/Out ============

    @Transactional
    public Attendance clockInByToken(String token, String pinCode) {
        log.info("Public clock in attempt with token {} and PIN", token);

        // Validate token
        PublicAttendanceLink link = linkRepository.findByTokenAndActiveTrue(token)
                .orElseThrow(() -> new RuntimeException("Link inválido o desactivado"));

        // Find employee by PIN within tenant
        Employee employee = employeeRepository.findByPinCodeAndTenantId(pinCode, link.getTenantId())
                .orElseThrow(() -> new RuntimeException("PIN inválido"));

        // Check if already clocked in
        Optional<Attendance> activeSession = attendanceRepository
                .findByTenantIdAndEmployeeIdAndClockOutTimeIsNull(link.getTenantId(), employee.getId());

        Attendance result;
        if (activeSession.isPresent()) {
            // Clock out
            Attendance session = activeSession.get();
            session.setClockOutTime(Instant.now());
            session.setStatus("COMPLETED");
            result = attendanceRepository.save(session);
            link.recordClockOut();
        } else {
            // Clock in
            Attendance newSession = Attendance.builder()
                    .tenantId(link.getTenantId())
                    .employee(employee)
                    .clockInTime(Instant.now())
                    .checkInMethod("PUBLIC_LINK")
                    .status("PRESENT")
                    .build();
            result = attendanceRepository.save(newSession);
            link.recordClockIn();
        }

        linkRepository.save(link);
        return result;
    }

    // ============ Statistics ============

    public Optional<AttendanceStatistics> getEmployeeStats(UUID tenantId, UUID employeeId, int year, int month) {
        return statisticsRepository.findByTenantIdAndEmployeeIdAndYearAndMonth(tenantId, employeeId, year, month);
    }

    public List<AttendanceStatistics> getTenantStats(UUID tenantId, int year, int month) {
        return statisticsRepository.findByTenantIdAndYearAndMonth(tenantId, year, month);
    }

    public List<AttendanceStatistics> getEmployeeYearlyStats(UUID employeeId, int year) {
        return statisticsRepository.findByEmployeeIdAndYearOrderByMonthAsc(employeeId, year);
    }

    @Transactional
    public void calculateMonthlyStatistics(UUID tenantId, int year, int month) {
        log.info("Calculating attendance statistics for tenant {} - {}/{}", tenantId, year, month);

        List<Employee> employees = employeeRepository.findByTenantIdAndActiveTrue(tenantId);
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

        Instant startInstant = startDate.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant endInstant = endDate.atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toInstant();

        for (Employee employee : employees) {
            List<Attendance> records = attendanceRepository
                    .findByEmployeeIdAndClockInTimeBetween(employee.getId(), startInstant, endInstant);

            // Calculate work days (excluding weekends)
            int workDays = 0;
            LocalDate current = startDate;
            while (!current.isAfter(endDate)) {
                if (current.getDayOfWeek().getValue() < 6) { // Monday to Friday
                    workDays++;
                }
                current = current.plusDays(1);
            }

            AttendanceStatistics stats = statisticsRepository
                    .findByTenantIdAndEmployeeIdAndYearAndMonth(tenantId, employee.getId(), year, month)
                    .orElse(AttendanceStatistics.builder()
                            .tenantId(tenantId)
                            .employeeId(employee.getId())
                            .year(year)
                            .month(month)
                            .build());

            stats.setTotalWorkDays(workDays);
            stats.setDaysPresent(records.size());
            stats.setDaysAbsent(Math.max(0, workDays - records.size()));

            // TODO: Calculate late arrivals based on scheduled start time
            stats.setDaysLate(0);

            // Calculate total worked time
            int totalMinutes = 0;
            for (Attendance record : records) {
                if (record.getClockOutTime() != null) {
                    long minutes = java.time.Duration.between(record.getClockInTime(), record.getClockOutTime())
                            .toMinutes();
                    totalMinutes += (int) minutes;
                }
            }
            stats.setTotalWorkedMinutes(totalMinutes);

            stats.recalculatePercentages();
            statisticsRepository.save(stats);
        }
    }

    public Double getAverageAttendance(UUID tenantId, int year, int month) {
        return statisticsRepository.getAverageAttendanceByTenantAndPeriod(tenantId, year, month);
    }

    public Double getAveragePunctuality(UUID tenantId, int year, int month) {
        return statisticsRepository.getAveragePunctualityByTenantAndPeriod(tenantId, year, month);
    }
}
