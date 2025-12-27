package com.poscl.payroll.domain.repository;

import com.poscl.payroll.domain.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, UUID> {
    
    List<Employee> findByTenantIdAndIsActiveTrue(UUID tenantId);
    
    List<Employee> findByTenantId(UUID tenantId);
    
    Optional<Employee> findByTenantIdAndRut(UUID tenantId, String rut);
    
    Optional<Employee> findByIdAndTenantId(UUID id, UUID tenantId);
    
    boolean existsByTenantIdAndRut(UUID tenantId, String rut);
    
    long countByTenantIdAndIsActiveTrue(UUID tenantId);
}
