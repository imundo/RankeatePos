package com.poscl.operations.api.controller;

import com.poscl.operations.api.dto.*;
import com.poscl.operations.application.service.LeaveService;
import com.poscl.operations.domain.entity.Employee;
import com.poscl.operations.domain.entity.LeaveRequest;
import com.poscl.operations.domain.repository.EmployeeRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/leaves")
@RequiredArgsConstructor
public class LeaveController {
    private final LeaveService leaveService;
    private final EmployeeRepository employeeRepository;

    // ============ Leave Requests ============

    @GetMapping
    public ResponseEntity<Page<LeaveRequestDto>> getAll(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) LeaveRequest.RequestStatus status) {

        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<LeaveRequest> requests = leaveService.findByTenant(tenantId, pageable);
        return ResponseEntity.ok(requests.map(this::toDto));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<LeaveRequestDto>> getPending(@RequestHeader("X-Tenant-ID") UUID tenantId) {
        List<LeaveRequest> requests = leaveService.findPendingByTenant(tenantId);
        return ResponseEntity.ok(requests.stream().map(this::toDto).toList());
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<Page<LeaveRequestDto>> getByEmployee(
            @PathVariable UUID employeeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<LeaveRequest> requests = leaveService.findByEmployee(employeeId, pageable);
        return ResponseEntity.ok(requests.map(this::toDto));
    }

    @PostMapping
    public ResponseEntity<LeaveRequestDto> create(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @Valid @RequestBody CreateLeaveRequest request) {

        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));

        LeaveRequest leaveRequest = LeaveRequest.builder()
                .tenantId(tenantId)
                .employee(employee)
                .type(request.getType())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .daysRequested(request.getDaysRequested())
                .amountRequested(request.getAmountRequested())
                .benefitCode(request.getBenefitCode())
                .reason(request.getReason())
                .notes(request.getNotes())
                .attachmentUrl(request.getAttachmentUrl())
                .attachmentFileName(request.getAttachmentFileName())
                .build();

        LeaveRequest saved = leaveService.createRequest(leaveRequest);
        return ResponseEntity.ok(toDto(saved));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<LeaveRequestDto> approve(
            @PathVariable UUID id,
            @RequestHeader("X-User-ID") UUID userId,
            @RequestHeader("X-User-Name") String userName) {

        LeaveRequest approved = leaveService.approveRequest(id, userId, userName);
        return ResponseEntity.ok(toDto(approved));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<LeaveRequestDto> reject(
            @PathVariable UUID id,
            @RequestHeader("X-User-ID") UUID userId,
            @RequestHeader("X-User-Name") String userName,
            @RequestParam String reason) {

        LeaveRequest rejected = leaveService.rejectRequest(id, userId, userName, reason);
        return ResponseEntity.ok(toDto(rejected));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<LeaveRequestDto> cancel(@PathVariable UUID id) {
        LeaveRequest cancelled = leaveService.cancelRequest(id);
        return ResponseEntity.ok(toDto(cancelled));
    }

    // ============ Stats ============

    @GetMapping("/stats")
    public ResponseEntity<LeaveStats> getStats(@RequestHeader("X-Tenant-ID") UUID tenantId) {
        return ResponseEntity.ok(LeaveStats.builder()
                .pendingRequests(leaveService.countPendingByTenant(tenantId))
                .build());
    }

    // ============ Mapper ============

    private LeaveRequestDto toDto(LeaveRequest r) {
        return LeaveRequestDto.builder()
                .id(r.getId())
                .tenantId(r.getTenantId())
                .employeeId(r.getEmployee().getId())
                .employeeName(r.getEmployee().getFullName())
                .type(r.getType())
                .startDate(r.getStartDate())
                .endDate(r.getEndDate())
                .daysRequested(r.getDaysRequested())
                .amountRequested(r.getAmountRequested())
                .benefitCode(r.getBenefitCode())
                .reason(r.getReason())
                .notes(r.getNotes())
                .attachmentUrl(r.getAttachmentUrl())
                .attachmentFileName(r.getAttachmentFileName())
                .status(r.getStatus())
                .approvedBy(r.getApprovedBy())
                .approverName(r.getApproverName())
                .rejectionReason(r.getRejectionReason())
                .approvedAt(r.getApprovedAt())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }

    @lombok.Builder
    @lombok.Data
    public static class LeaveStats {
        private long pendingRequests;
    }
}
