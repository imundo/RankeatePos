package com.poscl.accounting.application.service;

import com.poscl.accounting.api.dto.AccountDtos.*;
import com.poscl.accounting.domain.entity.Account;
import com.poscl.accounting.domain.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AccountService {

    private final AccountRepository accountRepository;

    public AccountResponse createAccount(UUID tenantId, CreateAccountRequest request) {
        // Validar código único
        if (accountRepository.existsByTenantIdAndCode(tenantId, request.getCode())) {
            throw new IllegalArgumentException("Ya existe una cuenta con el código: " + request.getCode());
        }

        Account parent = null;
        int level = 1;
        if (request.getParentId() != null) {
            parent = accountRepository.findById(request.getParentId())
                .orElseThrow(() -> new IllegalArgumentException("Cuenta padre no encontrada"));
            level = parent.getLevel() + 1;
        }

        Account account = Account.builder()
            .tenantId(tenantId)
            .code(request.getCode())
            .name(request.getName())
            .description(request.getDescription())
            .type(request.getType())
            .nature(request.getNature())
            .level(level)
            .parent(parent)
            .allowsMovements(request.getAllowsMovements() != null ? request.getAllowsMovements() : true)
            .isSystemAccount(false)
            .build();

        account = accountRepository.save(account);
        log.info("Created account {} for tenant {}", request.getCode(), tenantId);
        return toResponse(account);
    }

    @Transactional(readOnly = true)
    public List<AccountResponse> getAllAccounts(UUID tenantId) {
        return accountRepository.findByTenantIdAndIsActiveOrderByCode(tenantId, true)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AccountTreeNode> getAccountTree(UUID tenantId) {
        List<Account> rootAccounts = accountRepository
            .findByTenantIdAndParentIsNullAndIsActiveOrderByCode(tenantId, true);
        return rootAccounts.stream()
            .map(this::toTreeNode)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AccountResponse> getMovableAccounts(UUID tenantId) {
        return accountRepository.findAllMovableAccounts(tenantId)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AccountResponse getAccountById(UUID tenantId, UUID accountId) {
        Account account = accountRepository.findById(accountId)
            .filter(a -> a.getTenantId().equals(tenantId))
            .orElseThrow(() -> new IllegalArgumentException("Cuenta no encontrada"));
        return toResponse(account);
    }

    public AccountResponse updateAccount(UUID tenantId, UUID accountId, UpdateAccountRequest request) {
        Account account = accountRepository.findById(accountId)
            .filter(a -> a.getTenantId().equals(tenantId))
            .orElseThrow(() -> new IllegalArgumentException("Cuenta no encontrada"));

        if (account.getIsSystemAccount()) {
            throw new IllegalArgumentException("No se puede modificar una cuenta del sistema");
        }

        if (request.getName() != null) account.setName(request.getName());
        if (request.getDescription() != null) account.setDescription(request.getDescription());
        if (request.getIsActive() != null) account.setIsActive(request.getIsActive());
        if (request.getAllowsMovements() != null) account.setAllowsMovements(request.getAllowsMovements());

        account = accountRepository.save(account);
        return toResponse(account);
    }

    public void deleteAccount(UUID tenantId, UUID accountId) {
        Account account = accountRepository.findById(accountId)
            .filter(a -> a.getTenantId().equals(tenantId))
            .orElseThrow(() -> new IllegalArgumentException("Cuenta no encontrada"));

        if (account.getIsSystemAccount()) {
            throw new IllegalArgumentException("No se puede eliminar una cuenta del sistema");
        }

        // Soft delete
        account.setIsActive(false);
        accountRepository.save(account);
    }

    private AccountResponse toResponse(Account account) {
        return AccountResponse.builder()
            .id(account.getId())
            .code(account.getCode())
            .name(account.getName())
            .description(account.getDescription())
            .type(account.getType())
            .nature(account.getNature())
            .level(account.getLevel())
            .parentId(account.getParent() != null ? account.getParent().getId() : null)
            .parentName(account.getParent() != null ? account.getParent().getName() : null)
            .isActive(account.getIsActive())
            .allowsMovements(account.getAllowsMovements())
            .isSystemAccount(account.getIsSystemAccount())
            .hasChildren(!account.getChildren().isEmpty())
            .createdAt(account.getCreatedAt())
            .build();
    }

    private AccountTreeNode toTreeNode(Account account) {
        return AccountTreeNode.builder()
            .id(account.getId())
            .code(account.getCode())
            .name(account.getName())
            .type(account.getType())
            .level(account.getLevel())
            .allowsMovements(account.getAllowsMovements())
            .isActive(account.getIsActive())
            .children(account.getChildren().stream()
                .filter(Account::getIsActive)
                .map(this::toTreeNode)
                .collect(Collectors.toList()))
            .build();
    }
}
