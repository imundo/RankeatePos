package com.poscl.operations.domain.repository;

import com.poscl.operations.domain.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, UUID> {
    List<Employee> findByTenantId(UUID tenantId);

    List<Employee> findByTenantIdAndActiveTrue(UUID tenantId);

    Optional<Employee> findByRutAndTenantId(String rut, UUID tenantId);

    Optional<Employee> findByIdAndTenantId(UUID id, UUID tenantId);

    boolean existsByRutAndTenantId(String rut, UUID tenantId);
}
