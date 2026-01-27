package com.poscl.operations.api.controller;

import com.poscl.operations.application.service.PayrollService;
import com.poscl.operations.domain.entity.Payroll;
import com.poscl.operations.domain.entity.PayrollRun;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/operations/payroll")
@RequiredArgsConstructor
public class PayrollController {
    private final PayrollService payrollService;

    @PostMapping("/calculate")
    public ResponseEntity<PayrollRun> calculateMonthly(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(payrollService.createMonthlyRun(tenantId, year, month));
    }

    @GetMapping("/history")
    public ResponseEntity<List<Payroll>> getHistory(
            @RequestHeader("X-Tenant-ID") UUID tenantId) {
        return ResponseEntity.ok(payrollService.getLastPayrolls(tenantId));
    }
}
