package com.poscl.accounting.domain.repository;

import com.poscl.accounting.domain.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AccountRepository extends JpaRepository<Account, UUID> {

    List<Account> findByTenantIdAndIsActiveOrderByCode(UUID tenantId, Boolean isActive);

    List<Account> findByTenantIdAndParentIsNullAndIsActiveOrderByCode(UUID tenantId, Boolean isActive);

    List<Account> findByTenantIdAndParentIdAndIsActiveOrderByCode(UUID tenantId, UUID parentId, Boolean isActive);

    Optional<Account> findByTenantIdAndCode(UUID tenantId, String code);

    List<Account> findByTenantIdAndTypeAndAllowsMovementsOrderByCode(
        UUID tenantId, Account.AccountType type, Boolean allowsMovements);

    @Query("SELECT a FROM Account a WHERE a.tenantId = :tenantId AND a.allowsMovements = true AND a.isActive = true ORDER BY a.code")
    List<Account> findAllMovableAccounts(UUID tenantId);

    @Query("SELECT a FROM Account a WHERE a.tenantId = :tenantId AND a.code LIKE :codePrefix% ORDER BY a.code")
    List<Account> findByCodePrefix(UUID tenantId, String codePrefix);

    boolean existsByTenantIdAndCode(UUID tenantId, String code);
}
