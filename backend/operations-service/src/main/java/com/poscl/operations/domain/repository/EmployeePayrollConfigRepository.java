package com.poscl.operations.domain.repository;

import com.poscl.operations.domain.entity.EmployeePayrollConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmployeePayrollConfigRepository extends JpaRepository<EmployeePayrollConfig, UUID> {
    Optional<EmployeePayrollConfig> findByEmployeeId(UUID employeeId);

    void deleteByEmployeeId(UUID employeeId);
}
