package com.poscl.purchases.api.controller;

import com.poscl.purchases.api.dto.AccountPayableDto;
import com.poscl.purchases.application.service.AccountPayableService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/accounts-payable")
@RequiredArgsConstructor
public class AccountPayableController {

    private final AccountPayableService accountPayableService;

    @GetMapping("/supplier/{supplierId}")
    public ResponseEntity<List<AccountPayableDto>> getBySupplier(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable UUID supplierId) {
        return ResponseEntity.ok(accountPayableService.getBySupplierId(parseTenantId(tenantId), supplierId));
    }

    @PostMapping
    public ResponseEntity<AccountPayableDto> create(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestBody AccountPayableDto dto) {
        return ResponseEntity.ok(accountPayableService.create(parseTenantId(tenantId), dto));
    }

    @PostMapping("/{id}/pay")
    public ResponseEntity<AccountPayableDto> pay(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(accountPayableService.pay(parseTenantId(tenantId), id));
    }

    private UUID parseTenantId(String tenantId) {
        try {
            return UUID.fromString(tenantId);
        } catch (Exception e) {
            return UUID.fromString("00000000-0000-0000-0000-000000000001");
        }
    }
}
