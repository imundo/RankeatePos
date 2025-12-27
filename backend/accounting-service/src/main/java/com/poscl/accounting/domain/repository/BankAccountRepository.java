package com.poscl.accounting.domain.repository;

import com.poscl.accounting.domain.entity.BankAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BankAccountRepository extends JpaRepository<BankAccount, UUID> {

    List<BankAccount> findByTenantIdAndIsActiveOrderByBankName(UUID tenantId, Boolean isActive);

    Optional<BankAccount> findByTenantIdAndAccountNumber(UUID tenantId, String accountNumber);

    List<BankAccount> findByTenantIdAndBankNameContainingIgnoreCaseAndIsActive(
        UUID tenantId, String bankName, Boolean isActive);
}
