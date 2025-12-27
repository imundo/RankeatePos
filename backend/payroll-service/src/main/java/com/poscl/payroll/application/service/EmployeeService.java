package com.poscl.payroll.application.service;

import com.poscl.payroll.domain.entity.Employee;
import com.poscl.payroll.domain.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;

    @Transactional(readOnly = true)
    public List<Employee> findAll(UUID tenantId) {
        return employeeRepository.findByTenantId(tenantId);
    }

    @Transactional(readOnly = true)
    public List<Employee> findActive(UUID tenantId) {
        return employeeRepository.findByTenantIdAndIsActiveTrue(tenantId);
    }

    @Transactional(readOnly = true)
    public Optional<Employee> findById(UUID tenantId, UUID id) {
        return employeeRepository.findByIdAndTenantId(id, tenantId);
    }

    @Transactional(readOnly = true)
    public Optional<Employee> findByRut(UUID tenantId, String rut) {
        return employeeRepository.findByTenantIdAndRut(tenantId, rut);
    }

    @Transactional
    public Employee create(UUID tenantId, Employee employee) {
        if (employeeRepository.existsByTenantIdAndRut(tenantId, employee.getRut())) {
            throw new IllegalArgumentException("Ya existe un empleado con RUT: " + employee.getRut());
        }
        employee.setTenantId(tenantId);
        employee.setIsActive(true);
        log.info("Creating employee: {} for tenant: {}", employee.getRut(), tenantId);
        return employeeRepository.save(employee);
    }

    @Transactional
    public Employee update(UUID tenantId, UUID id, Employee updated) {
        Employee existing = employeeRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Empleado no encontrado"));
        
        existing.setFirstName(updated.getFirstName());
        existing.setLastName(updated.getLastName());
        existing.setEmail(updated.getEmail());
        existing.setPhone(updated.getPhone());
        existing.setAddress(updated.getAddress());
        existing.setPosition(updated.getPosition());
        existing.setDepartment(updated.getDepartment());
        existing.setBaseSalary(updated.getBaseSalary());
        existing.setAfpCode(updated.getAfpCode());
        existing.setHealthInsuranceCode(updated.getHealthInsuranceCode());
        existing.setHealthPlanUf(updated.getHealthPlanUf());
        existing.setContractType(updated.getContractType());
        
        return employeeRepository.save(existing);
    }

    @Transactional
    public void deactivate(UUID tenantId, UUID id) {
        Employee employee = employeeRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Empleado no encontrado"));
        employee.setIsActive(false);
        employee.setTerminationDate(LocalDate.now());
        employeeRepository.save(employee);
        log.info("Deactivated employee: {}", id);
    }

    @Transactional(readOnly = true)
    public long countActive(UUID tenantId) {
        return employeeRepository.countByTenantIdAndIsActiveTrue(tenantId);
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalPayroll(UUID tenantId) {
        List<Employee> activeEmployees = findActive(tenantId);
        return activeEmployees.stream()
                .map(Employee::getBaseSalary)
                .filter(s -> s != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
