package com.poscl.operations.api.controller;

import com.poscl.operations.api.dto.*;
import com.poscl.operations.application.service.EmployeeService;
import com.poscl.operations.application.service.LeaveService;
import com.poscl.operations.domain.entity.*;
import com.poscl.operations.domain.repository.EmployeeDocumentRepository;
import com.poscl.operations.domain.repository.LeaveBalanceRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
public class EmployeeController {
    private final EmployeeService employeeService;
    private final LeaveService leaveService;
    private final EmployeeDocumentRepository documentRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;

    // ============ CRUD ============

    @GetMapping
    public ResponseEntity<Page<EmployeeDto>> getAll(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "true") boolean activeOnly) {

        PageRequest pageable = PageRequest.of(page, size, Sort.by("firstName").ascending());
        Page<Employee> employees;

        if (search != null && !search.isBlank()) {
            employees = employeeService.searchByTenant(tenantId, search, pageable);
        } else if (activeOnly) {
            employees = employeeService.findActiveByTenant(tenantId, pageable);
        } else {
            employees = employeeService.findByTenant(tenantId, pageable);
        }

        return ResponseEntity.ok(employees.map(this::toDto));
    }

    @GetMapping("/list")
    public ResponseEntity<List<EmployeeDto>> getAllActive(@RequestHeader("X-Tenant-ID") UUID tenantId) {
        List<Employee> employees = employeeService.findAllActiveByTenant(tenantId);
        return ResponseEntity.ok(employees.stream().map(this::toDto).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeDto> getById(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID id) {
        return employeeService.findByIdAndTenant(id, tenantId)
                .map(e -> ResponseEntity.ok(toDto(e)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<EmployeeDto> create(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @Valid @RequestBody CreateEmployeeRequest request) {
        Employee employee = Employee.builder()
                .tenantId(tenantId)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .rut(request.getRut())
                .email(request.getEmail())
                .phone(request.getPhone())
                .position(request.getPosition())
                .pinCode(request.getPinCode())
                .hireDate(request.getHireDate() != null ? request.getHireDate() : LocalDate.now())
                .baseSalary(request.getBaseSalary())
                .address(request.getAddress())
                .birthDate(request.getBirthDate())
                .nationality(request.getNationality())
                .photoUrl(request.getPhotoUrl())
                .emergencyContact(request.getEmergencyContact())
                .emergencyPhone(request.getEmergencyPhone())
                .bankName(request.getBankName())
                .bankAccountNumber(request.getBankAccountNumber())
                .bankAccountType(request.getBankAccountType())
                .countryCode(request.getCountryCode() != null ? request.getCountryCode() : "CL")
                .build();

        Employee saved = employeeService.createEmployee(employee);
        return ResponseEntity.ok(toDto(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmployeeDto> update(
            @PathVariable UUID id,
            @RequestBody UpdateEmployeeRequest request) {
        Employee updates = Employee.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .position(request.getPosition())
                .baseSalary(request.getBaseSalary())
                .address(request.getAddress())
                .birthDate(request.getBirthDate())
                .nationality(request.getNationality())
                .photoUrl(request.getPhotoUrl())
                .emergencyContact(request.getEmergencyContact())
                .emergencyPhone(request.getEmergencyPhone())
                .bankName(request.getBankName())
                .bankAccountNumber(request.getBankAccountNumber())
                .bankAccountType(request.getBankAccountType())
                .build();

        Employee updated = employeeService.updateEmployee(id, updates);
        return ResponseEntity.ok(toDto(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "Desvinculación") String reason) {
        employeeService.deactivateEmployee(id, reason);
        return ResponseEntity.noContent().build();
    }

    // ============ PIN ============

    @PostMapping("/{id}/regenerate-pin")
    public ResponseEntity<EmployeeDto> regeneratePin(@PathVariable UUID id) {
        Employee employee = employeeService.regeneratePin(id);
        return ResponseEntity.ok(toDto(employee));
    }

    // ============ Payroll Config ============

    @GetMapping("/{id}/payroll-config")
    public ResponseEntity<PayrollConfigDto> getPayrollConfig(@PathVariable UUID id) {
        return employeeService.getPayrollConfig(id)
                .map(this::toPayrollConfigDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/payroll-config")
    public ResponseEntity<PayrollConfigDto> updatePayrollConfig(
            @PathVariable UUID id,
            @RequestBody PayrollConfigDto config) {
        EmployeePayrollConfig entity = EmployeePayrollConfig.builder()
                .healthSystem(config.getHealthSystem())
                .isapreName(config.getIsapreName())
                .healthRate(config.getHealthRate())
                .isapreAdditionalUf(config.getIsapreAdditionalUf())
                .afpName(config.getAfpName())
                .afpRate(config.getAfpRate())
                .hasApv(config.isHasApv())
                .apvMonthlyAmount(config.getApvMonthlyAmount())
                .gratificationType(config.getGratificationType())
                .gratificationAmount(config.getGratificationAmount())
                .hasLunchAllowance(config.isHasLunchAllowance())
                .lunchAllowanceAmount(config.getLunchAllowanceAmount())
                .hasTransportAllowance(config.isHasTransportAllowance())
                .transportAllowanceAmount(config.getTransportAllowanceAmount())
                .exemptFromOvertime(config.isExemptFromOvertime())
                .overtimeMultiplier(config.getOvertimeMultiplier())
                .build();

        EmployeePayrollConfig updated = employeeService.updatePayrollConfig(id, entity);
        return ResponseEntity.ok(toPayrollConfigDto(updated));
    }

    // ============ Documents ============

    @GetMapping("/{id}/documents")
    public ResponseEntity<List<EmployeeDocument>> getDocuments(@PathVariable UUID id) {
        return ResponseEntity.ok(employeeService.getDocuments(id));
    }

    @PostMapping("/{id}/documents")
    public ResponseEntity<EmployeeDocument> addDocument(
            @PathVariable UUID id,
            @RequestBody EmployeeDocument document) {
        return ResponseEntity.ok(employeeService.addDocument(id, document));
    }

    @DeleteMapping("/documents/{documentId}")
    public ResponseEntity<Void> deleteDocument(@PathVariable UUID documentId) {
        employeeService.deleteDocument(documentId);
        return ResponseEntity.noContent().build();
    }

    // ============ History ============

    @GetMapping("/{id}/history")
    public ResponseEntity<List<EmployeeHistory>> getHistory(@PathVariable UUID id) {
        return ResponseEntity.ok(employeeService.getHistory(id));
    }

    // ============ Leave Balance ============

    @GetMapping("/{id}/leave-balance")
    public ResponseEntity<LeaveBalanceDto> getLeaveBalance(@PathVariable UUID id) {
        return leaveService.getCurrentBalance(id)
                .map(this::toLeaveBalanceDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/leave-balance/history")
    public ResponseEntity<List<LeaveBalanceDto>> getLeaveBalanceHistory(@PathVariable UUID id) {
        return ResponseEntity.ok(
                leaveService.getBalanceHistory(id).stream()
                        .map(this::toLeaveBalanceDto)
                        .toList());
    }

    // ============ Stats ============

    @GetMapping("/stats")
    public ResponseEntity<EmployeeStats> getStats(@RequestHeader("X-Tenant-ID") UUID tenantId) {
        return ResponseEntity.ok(EmployeeStats.builder()
                .totalEmployees(employeeService.countByTenant(tenantId))
                .activeEmployees(employeeService.countActiveByTenant(tenantId))
                .pendingLeaveRequests(leaveService.countPendingByTenant(tenantId))
                .build());
    }

    @GetMapping("/{id}/stats")
    public ResponseEntity<EmployeeDetailStats> getEmployeeStats(@PathVariable UUID id) {
        // TODO: Calculate real stats (Attendance Rate, Punctuality)
        return ResponseEntity.ok(EmployeeDetailStats.builder()
                .attendanceRate(100.0)
                .punctualityRate(100.0)
                .latenesses(0)
                .absences(0)
                .build());
    }

    @lombok.Builder
    @lombok.Data
    public static class EmployeeDetailStats {
        private double attendanceRate;
        private double punctualityRate;
        private int latenesses; // Count
        private int absences; // Count
    }

    // ============ Mappers ============

    private EmployeeDto toDto(Employee e) {
        BigDecimal vacationDays = leaveBalanceRepository
                .findByEmployeeIdAndYear(e.getId(), LocalDate.now().getYear())
                .map(LeaveBalance::getDaysRemaining)
                .orElse(BigDecimal.ZERO);

        long docsCount = documentRepository.countByEmployeeId(e.getId());

        return EmployeeDto.builder()
                .id(e.getId())
                .tenantId(e.getTenantId())
                .firstName(e.getFirstName())
                .lastName(e.getLastName())
                .rut(e.getRut())
                .email(e.getEmail())
                .phone(e.getPhone())
                .position(e.getPosition())
                .pinCode(e.getPinCode())
                .hireDate(e.getHireDate())
                .terminationDate(e.getTerminationDate())
                .baseSalary(e.getBaseSalary())
                .address(e.getAddress())
                .birthDate(e.getBirthDate())
                .nationality(e.getNationality())
                .photoUrl(e.getPhotoUrl())
                .emergencyContact(e.getEmergencyContact())
                .emergencyPhone(e.getEmergencyPhone())
                .bankName(e.getBankName())
                .bankAccountNumber(e.getBankAccountNumber())
                .bankAccountType(e.getBankAccountType())
                .countryCode(e.getCountryCode())
                .active(e.isActive())
                .initials(e.getInitials())
                .fullName(e.getFullName())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .vacationDaysRemaining(vacationDays)
                .documentsCount((int) docsCount)
                .build();
    }

    private PayrollConfigDto toPayrollConfigDto(EmployeePayrollConfig c) {
        return PayrollConfigDto.builder()
                .id(c.getId())
                .employeeId(c.getEmployee().getId())
                .healthSystem(c.getHealthSystem())
                .isapreName(c.getIsapreName())
                .healthRate(c.getHealthRate())
                .isapreAdditionalUf(c.getIsapreAdditionalUf())
                .afpName(c.getAfpName())
                .afpRate(c.getAfpRate())
                .hasApv(c.isHasApv())
                .apvMonthlyAmount(c.getApvMonthlyAmount())
                .gratificationType(c.getGratificationType())
                .gratificationAmount(c.getGratificationAmount())
                .hasLunchAllowance(c.isHasLunchAllowance())
                .lunchAllowanceAmount(c.getLunchAllowanceAmount())
                .hasTransportAllowance(c.isHasTransportAllowance())
                .transportAllowanceAmount(c.getTransportAllowanceAmount())
                .exemptFromOvertime(c.isExemptFromOvertime())
                .overtimeMultiplier(c.getOvertimeMultiplier())
                .build();
    }

    private LeaveBalanceDto toLeaveBalanceDto(LeaveBalance b) {
        return LeaveBalanceDto.builder()
                .id(b.getId())
                .employeeId(b.getEmployee().getId())
                .year(b.getYear())
                .countryCode(b.getCountryCode())
                .daysEntitled(b.getDaysEntitled())
                .daysAccrued(b.getDaysAccrued())
                .daysTaken(b.getDaysTaken())
                .daysRemaining(b.getDaysRemaining())
                .monthlyAccrualRate(b.getMonthlyAccrualRate())
                .seniorityBonusDays(b.getSeniorityBonusDays())
                .carryoverDays(b.getCarryoverDays())
                .lastAccruedMonth(b.getLastAccruedMonth())
                .build();
    }

    @lombok.Builder
    @lombok.Data
    public static class EmployeeStats {
        private long totalEmployees;
        private long activeEmployees;
        private long pendingLeaveRequests;
    }
}
