package com.poscl.auth.domain.repository;

import com.poscl.auth.domain.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

        @Query("SELECT u FROM User u LEFT JOIN FETCH u.roles WHERE u.email = :email AND u.tenant.id = :tenantId")
        Optional<User> findByEmailAndTenantIdWithRoles(String email, UUID tenantId);

        @Query("SELECT u FROM User u LEFT JOIN FETCH u.tenant LEFT JOIN FETCH u.roles LEFT JOIN FETCH u.branches WHERE LOWER(u.email) = LOWER(:email) AND u.deletedAt IS NULL")
        Optional<User> findByEmailWithRolesAndBranches(String email);

        Optional<User> findByEmailAndTenant_Id(String email, UUID tenantId);

        boolean existsByEmailAndTenant_Id(String email, UUID tenantId);

        @Query("SELECT u FROM User u WHERE u.tenant.id = :tenantId AND u.activo = true AND u.deletedAt IS NULL")
        Page<User> findActiveByTenantId(UUID tenantId, Pageable pageable);

        @Query("SELECT u FROM User u WHERE u.id = :id AND u.tenant.id = :tenantId")
        Optional<User> findByIdAndTenantId(UUID id, UUID tenantId);

        @Query("SELECT u FROM User u LEFT JOIN FETCH u.roles LEFT JOIN FETCH u.branches WHERE u.id = :id")
        Optional<User> findByIdWithRolesAndBranches(UUID id);

        // Methods for UserService
        Optional<User> findByIdAndTenant_Id(UUID id, UUID tenantId);

        @Query("SELECT u FROM User u LEFT JOIN FETCH u.tenant LEFT JOIN FETCH u.roles WHERE u.tenant.id = :tenantId AND u.deletedAt IS NULL")
        Page<User> findByTenant_IdAndDeletedAtIsNull(UUID tenantId, Pageable pageable);

        @Query("SELECT u FROM User u LEFT JOIN FETCH u.tenant LEFT JOIN FETCH u.roles WHERE u.tenant.id = :tenantId AND u.deletedAt IS NULL AND "
                        +
                        "(LOWER(u.email) LIKE %:search% OR LOWER(u.nombre) LIKE %:search% OR LOWER(u.apellido) LIKE %:search%)")
        Page<User> searchByTenantId(UUID tenantId, String search, Pageable pageable);

        // Global methods for Admin API
        boolean existsByEmail(String email);

        Page<User> findByEmailContainingIgnoreCaseOrNombreContainingIgnoreCase(String email, String nombre,
                        Pageable pageable);
}
