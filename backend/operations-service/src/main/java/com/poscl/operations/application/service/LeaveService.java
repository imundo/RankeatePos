package com.poscl.operations.application.service;

import com.poscl.operations.domain.entity.Employee;
import com.poscl.operations.domain.entity.LeaveBalance;
import com.poscl.operations.domain.entity.LeaveRequest;
import com.poscl.operations.domain.repository.EmployeeRepository;
import com.poscl.operations.domain.repository.LeaveBalanceRepository;
import com.poscl.operations.domain.repository.LeaveRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeaveService {
    private final LeaveRequestRepository leaveRequestRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final EmployeeRepository employeeRepository;

    // ============ Leave Requests ============

    @Transactional
    public LeaveRequest createRequest(LeaveRequest request) {
        log.info("Creating leave request for employee {}", request.getEmployee().getId());

        // Validate dates
        if (request.getStartDate() != null && request.getEndDate() != null) {
            if (request.getEndDate().isBefore(request.getStartDate())) {
                throw new RuntimeException("La fecha de fin no puede ser anterior a la fecha de inicio");
            }

            // Calculate days if not provided
            if (request.getDaysRequested() == null) {
                long days = ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate()) + 1;
                request.setDaysRequested(BigDecimal.valueOf(days));
            }
        }

        // For vacation requests, validate balance
        if (request.getType() == LeaveRequest.RequestType.VACATION) {
            validateVacationBalance(request.getEmployee().getId(), request.getDaysRequested());
        }

        request.setStatus(LeaveRequest.RequestStatus.PENDING);
        return leaveRequestRepository.save(request);
    }

    @Transactional
    public LeaveRequest approveRequest(UUID requestId, UUID approvedBy, String approverName) {
        LeaveRequest request = leaveRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Solicitud no encontrada"));

        if (request.getStatus() != LeaveRequest.RequestStatus.PENDING) {
            throw new RuntimeException("La solicitud ya fue procesada");
        }

        request.setStatus(LeaveRequest.RequestStatus.APPROVED);
        request.setApprovedBy(approvedBy);
        request.setApproverName(approverName);
        request.setApprovedAt(java.time.Instant.now());

        // For vacation, deduct from balance
        if (request.getType() == LeaveRequest.RequestType.VACATION && request.getDaysRequested() != null) {
            deductVacationDays(request.getEmployee().getId(), request.getDaysRequested());
        }

        return leaveRequestRepository.save(request);
    }

    @Transactional
    public LeaveRequest rejectRequest(UUID requestId, UUID rejectedBy, String rejectorName, String reason) {
        LeaveRequest request = leaveRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Solicitud no encontrada"));

        if (request.getStatus() != LeaveRequest.RequestStatus.PENDING) {
            throw new RuntimeException("La solicitud ya fue procesada");
        }

        request.setStatus(LeaveRequest.RequestStatus.REJECTED);
        request.setApprovedBy(rejectedBy);
        request.setApproverName(rejectorName);
        request.setRejectionReason(reason);
        request.setApprovedAt(java.time.Instant.now());

        return leaveRequestRepository.save(request);
    }

    @Transactional
    public LeaveRequest cancelRequest(UUID requestId) {
        LeaveRequest request = leaveRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Solicitud no encontrada"));

        if (request.getStatus() == LeaveRequest.RequestStatus.APPROVED) {
            // Restore vacation days if already deducted
            if (request.getType() == LeaveRequest.RequestType.VACATION && request.getDaysRequested() != null) {
                restoreVacationDays(request.getEmployee().getId(), request.getDaysRequested());
            }
        }

        request.setStatus(LeaveRequest.RequestStatus.CANCELLED);
        return leaveRequestRepository.save(request);
    }

    public Page<LeaveRequest> findByTenant(UUID tenantId, Pageable pageable) {
        return leaveRequestRepository.findByTenantIdOrderByCreatedAtDesc(tenantId, pageable);
    }

    public Page<LeaveRequest> findByEmployee(UUID employeeId, Pageable pageable) {
        return leaveRequestRepository.findByEmployeeIdOrderByCreatedAtDesc(employeeId, pageable);
    }

    public List<LeaveRequest> findPendingByTenant(UUID tenantId) {
        return leaveRequestRepository.findPendingByTenantId(tenantId);
    }

    public long countPendingByTenant(UUID tenantId) {
        return leaveRequestRepository.countByTenantIdAndStatus(tenantId, LeaveRequest.RequestStatus.PENDING);
    }

    // ============ Leave Balance ============

    public Optional<LeaveBalance> getCurrentBalance(UUID employeeId) {
        int currentYear = LocalDate.now().getYear();
        return leaveBalanceRepository.findByEmployeeIdAndYear(employeeId, currentYear);
    }

    public List<LeaveBalance> getBalanceHistory(UUID employeeId) {
        return leaveBalanceRepository.findByEmployeeIdOrderByYearDesc(employeeId);
    }

    /**
     * Scheduled job to accrue monthly vacation days.
     * Runs on the 1st of each month at 1:00 AM.
     */
    @Scheduled(cron = "0 0 1 1 * *")
    @Transactional
    public void accrueMonthlyVacationDays() {
        log.info("Running monthly vacation accrual job");

        int currentYear = LocalDate.now().getYear();
        int currentMonth = LocalDate.now().getMonthValue();

        List<LeaveBalance> balances = leaveBalanceRepository.findBalancesNeedingAccrual(currentYear, currentMonth);

        for (LeaveBalance balance : balances) {
            balance.accrueMonth(currentMonth);
            leaveBalanceRepository.save(balance);
            log.debug("Accrued {} days for employee {}", balance.getMonthlyAccrualRate(),
                    balance.getEmployee().getId());
        }

        log.info("Accrued vacation days for {} employees", balances.size());
    }

    /**
     * Create leave balances for new year.
     * Runs on January 1st at 0:05 AM.
     */
    @Scheduled(cron = "0 5 0 1 1 *")
    @Transactional
    public void createNewYearBalances() {
        log.info("Creating new year leave balances");

        int newYear = LocalDate.now().getYear();
        List<Employee> activeEmployees = employeeRepository.findByTenantIdAndActiveTrue(null);

        for (Employee employee : activeEmployees) {
            Optional<LeaveBalance> existing = leaveBalanceRepository.findByEmployeeIdAndYear(employee.getId(), newYear);

            if (existing.isEmpty()) {
                // Get previous year's remaining balance for carryover
                Optional<LeaveBalance> previousYear = leaveBalanceRepository
                        .findByEmployeeIdAndYear(employee.getId(), newYear - 1);

                BigDecimal carryover = previousYear
                        .map(LeaveBalance::getDaysRemaining)
                        .orElse(BigDecimal.ZERO);

                // Calculate years of service for seniority bonus
                int yearsOfService = 0;
                if (employee.getHireDate() != null) {
                    yearsOfService = (int) ChronoUnit.YEARS.between(employee.getHireDate(), LocalDate.now());
                }

                LeaveBalance newBalance = LeaveBalance.builder()
                        .employee(employee)
                        .year(newYear)
                        .countryCode(employee.getCountryCode())
                        .monthlyAccrualRate(calculateMonthlyRate(employee.getCountryCode()))
                        .daysEntitled(calculateEntitlement(employee.getCountryCode(), yearsOfService))
                        .seniorityBonusDays(calculateSeniorityBonus(employee.getCountryCode(), yearsOfService))
                        .carryoverDays(carryover)
                        .daysAccrued(BigDecimal.ZERO)
                        .daysTaken(BigDecimal.ZERO)
                        .daysRemaining(carryover)
                        .lastAccruedMonth(0)
                        .build();

                leaveBalanceRepository.save(newBalance);
            }
        }
    }

    // ============ Private Helpers ============

    private void validateVacationBalance(UUID employeeId, BigDecimal daysRequested) {
        Optional<LeaveBalance> balance = getCurrentBalance(employeeId);

        if (balance.isEmpty()) {
            throw new RuntimeException("No hay saldo de vacaciones disponible");
        }

        if (balance.get().getDaysRemaining().compareTo(daysRequested) < 0) {
            throw new RuntimeException("Saldo de vacaciones insuficiente. Disponible: " +
                    balance.get().getDaysRemaining() + " días");
        }
    }

    private void deductVacationDays(UUID employeeId, BigDecimal days) {
        LeaveBalance balance = getCurrentBalance(employeeId)
                .orElseThrow(() -> new RuntimeException("No hay saldo de vacaciones"));

        balance.setDaysTaken(balance.getDaysTaken().add(days));
        balance.recalculateRemaining();
        leaveBalanceRepository.save(balance);
    }

    private void restoreVacationDays(UUID employeeId, BigDecimal days) {
        Optional<LeaveBalance> balance = getCurrentBalance(employeeId);
        if (balance.isPresent()) {
            LeaveBalance b = balance.get();
            b.setDaysTaken(b.getDaysTaken().subtract(days));
            b.recalculateRemaining();
            leaveBalanceRepository.save(b);
        }
    }

    private BigDecimal calculateMonthlyRate(String countryCode) {
        return switch (countryCode) {
            case "CL" -> new BigDecimal("1.25");
            case "AR" -> new BigDecimal("1.17");
            case "PE" -> new BigDecimal("2.50");
            case "CO" -> new BigDecimal("1.25");
            case "VE" -> new BigDecimal("1.25");
            case "ES" -> new BigDecimal("1.83");
            default -> new BigDecimal("1.25");
        };
    }

    private BigDecimal calculateEntitlement(String countryCode, int yearsOfService) {
        BigDecimal base = switch (countryCode) {
            case "CL" -> new BigDecimal("15");
            case "AR" -> yearsOfService >= 10 ? new BigDecimal("28")
                    : yearsOfService >= 5 ? new BigDecimal("21") : new BigDecimal("14");
            case "PE" -> new BigDecimal("30");
            case "CO" -> new BigDecimal("15");
            case "VE" -> new BigDecimal("15").add(BigDecimal.valueOf(Math.min(yearsOfService, 15)));
            case "ES" -> new BigDecimal("22");
            default -> new BigDecimal("15");
        };
        return base;
    }

    private BigDecimal calculateSeniorityBonus(String countryCode, int yearsOfService) {
        return switch (countryCode) {
            case "CL" -> BigDecimal.valueOf(yearsOfService / 3);
            case "CO" -> BigDecimal.valueOf(yearsOfService / 5);
            default -> BigDecimal.ZERO;
        };
    }

    public Optional<LeaveRequest> getActiveLeave(UUID employeeId, LocalDate date) {
        return leaveRequestRepository.findActiveLeave(employeeId, date);
    }

    public List<LeaveRequest> getLeavesByRange(UUID tenantId, LocalDate start, LocalDate end) {
        // Fetch all approved leaves for tenant (using unpaged for MVP simplicity)
        return leaveRequestRepository
                .findByTenantIdAndStatus(tenantId, LeaveRequest.RequestStatus.APPROVED, Pageable.unpaged())
                .stream()
                .filter(l -> !l.getStartDate().isAfter(end) && !l.getEndDate().isBefore(start))
                .toList();
    }
}
