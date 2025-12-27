package com.poscl.accounting.api.controller;

import com.poscl.accounting.api.dto.AccountDtos.*;
import com.poscl.accounting.application.service.AccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
@Tag(name = "Cuentas Contables", description = "Plan de cuentas y gestión de cuentas contables")
public class AccountController {

    private final AccountService accountService;

    @PostMapping
    @Operation(summary = "Crear cuenta contable")
    public ResponseEntity<AccountResponse> createAccount(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @Valid @RequestBody CreateAccountRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(accountService.createAccount(tenantId, request));
    }

    @GetMapping
    @Operation(summary = "Listar todas las cuentas")
    public ResponseEntity<List<AccountResponse>> getAllAccounts(
            @RequestHeader("X-Tenant-Id") UUID tenantId) {
        return ResponseEntity.ok(accountService.getAllAccounts(tenantId));
    }

    @GetMapping("/tree")
    @Operation(summary = "Obtener árbol de cuentas (estructura jerárquica)")
    public ResponseEntity<List<AccountTreeNode>> getAccountTree(
            @RequestHeader("X-Tenant-Id") UUID tenantId) {
        return ResponseEntity.ok(accountService.getAccountTree(tenantId));
    }

    @GetMapping("/movable")
    @Operation(summary = "Listar cuentas que permiten movimientos")
    public ResponseEntity<List<AccountResponse>> getMovableAccounts(
            @RequestHeader("X-Tenant-Id") UUID tenantId) {
        return ResponseEntity.ok(accountService.getMovableAccounts(tenantId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener cuenta por ID")
    public ResponseEntity<AccountResponse> getAccountById(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(accountService.getAccountById(tenantId, id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar cuenta contable")
    public ResponseEntity<AccountResponse> updateAccount(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateAccountRequest request) {
        return ResponseEntity.ok(accountService.updateAccount(tenantId, id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar cuenta contable (soft delete)")
    public ResponseEntity<Void> deleteAccount(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id) {
        accountService.deleteAccount(tenantId, id);
        return ResponseEntity.noContent().build();
    }
}
