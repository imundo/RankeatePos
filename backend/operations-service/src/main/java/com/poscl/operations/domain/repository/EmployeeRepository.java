package com.poscl.operations.domain.repository;

import com.poscl.operations.domain.entity.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, UUID> {
    List<Employee> findByTenantId(UUID tenantId);

    List<Employee> findByTenantIdAndActiveTrue(UUID tenantId);

    Page<Employee> findByTenantId(UUID tenantId, Pageable pageable);

    Page<Employee> findByTenantIdAndActiveTrue(UUID tenantId, Pageable pageable);

    Optional<Employee> findByRutAndTenantId(String rut, UUID tenantId);

    Optional<Employee> findByIdAndTenantId(UUID id, UUID tenantId);

    Optional<Employee> findByPinCodeAndTenantId(String pinCode, UUID tenantId);

    Optional<Employee> findByEmailAndTenantId(String email, UUID tenantId);

    boolean existsByRutAndTenantId(String rut, UUID tenantId);

    boolean existsByPinCodeAndTenantId(String pinCode, UUID tenantId);

    @Query("SELECT e FROM Employee e WHERE e.tenantId = :tenantId AND " +
            "(LOWER(e.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(e.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(e.rut) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Employee> searchByTenantId(UUID tenantId, String search, Pageable pageable);

    long countByTenantId(UUID tenantId);

    long countByTenantIdAndActiveTrue(UUID tenantId);
}
