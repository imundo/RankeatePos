package com.poscl.operations.application.service;

import com.poscl.operations.domain.entity.*;
import com.poscl.operations.domain.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeService {
    private final EmployeeRepository employeeRepository;
    private final EmployeePayrollConfigRepository payrollConfigRepository;
    private final EmployeeDocumentRepository documentRepository;
    private final EmployeeHistoryRepository historyRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;

    private static final SecureRandom RANDOM = new SecureRandom();

    // ============ CRUD Operations ============

    @Transactional
    public Employee createEmployee(Employee employee) {
        log.info("Creating employee: {} {} for tenant {}", employee.getFirstName(), employee.getLastName(),
                employee.getTenantId());

        // Validate RUT is unique for tenant
        if (employeeRepository.existsByRutAndTenantId(employee.getRut(), employee.getTenantId())) {
            throw new RuntimeException("Ya existe un empleado con el RUT " + employee.getRut());
        }

        // Generate unique PIN if not provided
        if (employee.getPinCode() == null || employee.getPinCode().isBlank()) {
            employee.setPinCode(generateUniquePin(employee.getTenantId()));
        } else {
            // Validate PIN uniqueness
            if (employeeRepository.existsByPinCodeAndTenantId(employee.getPinCode(), employee.getTenantId())) {
                throw new RuntimeException("El PIN ya está en uso por otro empleado");
            }
        }

        // Set defaults
        if (employee.getCountryCode() == null) {
            employee.setCountryCode("CL");
        }
        if (employee.getHireDate() == null) {
            employee.setHireDate(LocalDate.now());
        }

        Employee saved = employeeRepository.save(employee);

        // Create default payroll config
        createDefaultPayrollConfig(saved);

        // Create initial leave balance for current year
        createInitialLeaveBalance(saved);

        // Record history event
        recordHistory(saved, EmployeeHistory.EventType.HIRED, "Empleado contratado", null, employee.getPosition());

        return saved;
    }

    @Transactional
    public Employee updateEmployee(UUID id, Employee updates) {
        Employee existing = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));

        // Track changes for history
        if (updates.getPosition() != null && !updates.getPosition().equals(existing.getPosition())) {
            recordHistory(existing, EmployeeHistory.EventType.POSITION_CHANGE,
                    "Cambio de cargo", existing.getPosition(), updates.getPosition());
            existing.setPosition(updates.getPosition());
        }

        if (updates.getBaseSalary() != null && !updates.getBaseSalary().equals(existing.getBaseSalary())) {
            recordHistory(existing, EmployeeHistory.EventType.SALARY_CHANGE,
                    "Cambio de sueldo base",
                    existing.getBaseSalary() != null ? existing.getBaseSalary().toString() : "0",
                    updates.getBaseSalary().toString());
            existing.setBaseSalary(updates.getBaseSalary());
        }

        // Update other fields
        if (updates.getFirstName() != null)
            existing.setFirstName(updates.getFirstName());
        if (updates.getLastName() != null)
            existing.setLastName(updates.getLastName());
        if (updates.getEmail() != null)
            existing.setEmail(updates.getEmail());
        if (updates.getPhone() != null)
            existing.setPhone(updates.getPhone());
        if (updates.getAddress() != null)
            existing.setAddress(updates.getAddress());
        if (updates.getBirthDate() != null)
            existing.setBirthDate(updates.getBirthDate());
        if (updates.getNationality() != null)
            existing.setNationality(updates.getNationality());
        if (updates.getPhotoUrl() != null)
            existing.setPhotoUrl(updates.getPhotoUrl());
        if (updates.getEmergencyContact() != null)
            existing.setEmergencyContact(updates.getEmergencyContact());
        if (updates.getEmergencyPhone() != null)
            existing.setEmergencyPhone(updates.getEmergencyPhone());
        if (updates.getBankName() != null)
            existing.setBankName(updates.getBankName());
        if (updates.getBankAccountNumber() != null)
            existing.setBankAccountNumber(updates.getBankAccountNumber());
        if (updates.getBankAccountType() != null)
            existing.setBankAccountType(updates.getBankAccountType());

        return employeeRepository.save(existing);
    }

    public Optional<Employee> findById(UUID id) {
        return employeeRepository.findById(id);
    }

    public Optional<Employee> findByIdAndTenant(UUID id, UUID tenantId) {
        return employeeRepository.findByIdAndTenantId(id, tenantId);
    }

    public Page<Employee> findByTenant(UUID tenantId, Pageable pageable) {
        return employeeRepository.findByTenantId(tenantId, pageable);
    }

    public Page<Employee> findActiveByTenant(UUID tenantId, Pageable pageable) {
        return employeeRepository.findByTenantIdAndActiveTrue(tenantId, pageable);
    }

    public Page<Employee> searchByTenant(UUID tenantId, String search, Pageable pageable) {
        return employeeRepository.searchByTenantId(tenantId, search, pageable);
    }

    public List<Employee> findAllActiveByTenant(UUID tenantId) {
        return employeeRepository.findByTenantIdAndActiveTrue(tenantId);
    }

    @Transactional
    public void deactivateEmployee(UUID id, String reason) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));

        employee.setActive(false);
        employee.setTerminationDate(LocalDate.now());
        employeeRepository.save(employee);

        recordHistory(employee, EmployeeHistory.EventType.TERMINATED, reason, "Activo", "Inactivo");
    }

    @Transactional
    public Employee regeneratePin(UUID employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));

        String newPin = generateUniquePin(employee.getTenantId());
        employee.setPinCode(newPin);

        return employeeRepository.save(employee);
    }

    // ============ Payroll Config ============

    public Optional<EmployeePayrollConfig> getPayrollConfig(UUID employeeId) {
        return payrollConfigRepository.findByEmployeeId(employeeId);
    }

    @Transactional
    public EmployeePayrollConfig updatePayrollConfig(UUID employeeId, EmployeePayrollConfig config) {
        EmployeePayrollConfig existing = payrollConfigRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new RuntimeException("Configuración no encontrada"));

        // Update fields
        existing.setHealthSystem(config.getHealthSystem());
        existing.setIsapreName(config.getIsapreName());
        existing.setHealthRate(config.getHealthRate());
        existing.setIsapreAdditionalUf(config.getIsapreAdditionalUf());
        existing.setAfpName(config.getAfpName());
        existing.setAfpRate(config.getAfpRate());
        existing.setHasApv(config.isHasApv());
        existing.setApvMonthlyAmount(config.getApvMonthlyAmount());
        existing.setGratificationType(config.getGratificationType());
        existing.setGratificationAmount(config.getGratificationAmount());
        existing.setHasLunchAllowance(config.isHasLunchAllowance());
        existing.setLunchAllowanceAmount(config.getLunchAllowanceAmount());
        existing.setHasTransportAllowance(config.isHasTransportAllowance());
        existing.setTransportAllowanceAmount(config.getTransportAllowanceAmount());
        existing.setExemptFromOvertime(config.isExemptFromOvertime());
        existing.setOvertimeMultiplier(config.getOvertimeMultiplier());

        return payrollConfigRepository.save(existing);
    }

    // ============ Documents ============

    public List<EmployeeDocument> getDocuments(UUID employeeId) {
        return documentRepository.findByEmployeeIdOrderByUploadedAtDesc(employeeId);
    }

    @Transactional
    public EmployeeDocument addDocument(UUID employeeId, EmployeeDocument document) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));

        document.setEmployee(employee);
        return documentRepository.save(document);
    }

    @Transactional
    public void deleteDocument(UUID documentId) {
        documentRepository.deleteById(documentId);
    }

    // ============ History ============

    public List<EmployeeHistory> getHistory(UUID employeeId) {
        return historyRepository.findByEmployeeIdOrderByEventDateDesc(employeeId);
    }

    // ============ Stats ============

    public long countByTenant(UUID tenantId) {
        return employeeRepository.countByTenantId(tenantId);
    }

    public long countActiveByTenant(UUID tenantId) {
        return employeeRepository.countByTenantIdAndActiveTrue(tenantId);
    }

    // ============ Private Helpers ============

    private String generateUniquePin(UUID tenantId) {
        String pin;
        int attempts = 0;
        do {
            pin = String.format("%04d", RANDOM.nextInt(10000));
            attempts++;
            if (attempts > 100) {
                throw new RuntimeException("No se pudo generar un PIN único");
            }
        } while (employeeRepository.existsByPinCodeAndTenantId(pin, tenantId));
        return pin;
    }

    private void createDefaultPayrollConfig(Employee employee) {
        EmployeePayrollConfig config = EmployeePayrollConfig.builder()
                .employee(employee)
                .healthSystem(EmployeePayrollConfig.HealthSystemType.FONASA)
                .healthRate(new BigDecimal("7.00"))
                .afpName("AFP Modelo")
                .afpRate(new BigDecimal("12.50"))
                .gratificationType(EmployeePayrollConfig.GratificationType.MONTHLY)
                .build();
        payrollConfigRepository.save(config);
    }

    private void createInitialLeaveBalance(Employee employee) {
        int currentYear = LocalDate.now().getYear();
        int currentMonth = LocalDate.now().getMonthValue();

        // Calculate monthly accrual based on country
        BigDecimal monthlyRate = calculateMonthlyAccrualRate(employee.getCountryCode());
        BigDecimal daysEntitled = calculateYearlyEntitlement(employee.getCountryCode(), 0); // 0 years seniority

        LeaveBalance balance = LeaveBalance.builder()
                .employee(employee)
                .year(currentYear)
                .countryCode(employee.getCountryCode())
                .monthlyAccrualRate(monthlyRate)
                .daysEntitled(daysEntitled)
                .daysAccrued(BigDecimal.ZERO)
                .daysTaken(BigDecimal.ZERO)
                .daysRemaining(BigDecimal.ZERO)
                .lastAccruedMonth(0)
                .build();

        // Accrue for months worked this year
        for (int month = 1; month <= currentMonth; month++) {
            balance.accrueMonth(month);
        }

        leaveBalanceRepository.save(balance);
    }

    private BigDecimal calculateMonthlyAccrualRate(String countryCode) {
        return switch (countryCode) {
            case "CL" -> new BigDecimal("1.25"); // 15 days / 12 months
            case "AR" -> new BigDecimal("1.17"); // 14 days / 12 months
            case "PE" -> new BigDecimal("2.50"); // 30 days / 12 months
            case "CO" -> new BigDecimal("1.25"); // 15 days / 12 months
            case "VE" -> new BigDecimal("1.25"); // 15 days / 12 months
            case "ES" -> new BigDecimal("1.83"); // 22 days / 12 months
            default -> new BigDecimal("1.25");
        };
    }

    private BigDecimal calculateYearlyEntitlement(String countryCode, int yearsOfService) {
        BigDecimal baseDays = switch (countryCode) {
            case "CL" -> new BigDecimal("15");
            case "AR" -> new BigDecimal("14");
            case "PE" -> new BigDecimal("30");
            case "CO" -> new BigDecimal("15");
            case "VE" -> new BigDecimal("15");
            case "ES" -> new BigDecimal("22");
            default -> new BigDecimal("15");
        };

        // Seniority bonus (example for Chile: +1 day every 3 years)
        if ("CL".equals(countryCode) && yearsOfService >= 3) {
            int bonusDays = yearsOfService / 3;
            baseDays = baseDays.add(BigDecimal.valueOf(bonusDays));
        }

        return baseDays;
    }

    private void recordHistory(Employee employee, EmployeeHistory.EventType type,
            String description, String previousValue, String newValue) {
        EmployeeHistory history = EmployeeHistory.builder()
                .employee(employee)
                .eventType(type)
                .description(description)
                .previousValue(previousValue)
                .newValue(newValue)
                .eventDate(Instant.now())
                .build();
        historyRepository.save(history);
    }
}
