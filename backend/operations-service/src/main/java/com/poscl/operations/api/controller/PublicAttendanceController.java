package com.poscl.operations.api.controller;

import com.poscl.operations.api.dto.PublicAttendanceLinkDto;
import com.poscl.operations.application.service.PublicAttendanceService;
import com.poscl.operations.domain.entity.Attendance;
import com.poscl.operations.domain.entity.AttendanceStatistics;
import com.poscl.operations.domain.entity.PublicAttendanceLink;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class PublicAttendanceController {
    private final PublicAttendanceService publicAttendanceService;

    @Value("${app.public.base-url:http://localhost:4200}")
    private String publicBaseUrl;

    // ============ Admin endpoints (protected) ============

    @GetMapping("/api/attendance/links")
    public ResponseEntity<List<PublicAttendanceLinkDto>> getLinks(@RequestHeader("X-Tenant-ID") UUID tenantId) {
        List<PublicAttendanceLink> links = publicAttendanceService.getLinksByTenant(tenantId);
        return ResponseEntity.ok(links.stream().map(this::toDto).toList());
    }

    @PostMapping("/api/attendance/links")
    public ResponseEntity<PublicAttendanceLinkDto> createLink(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-Name") String userName,
            @RequestBody CreateLinkRequest request) {

        PublicAttendanceLink link = publicAttendanceService.createLink(
                tenantId,
                request.getBranchId(),
                request.getName(),
                userName);

        return ResponseEntity.ok(toDto(link));
    }

    @PostMapping("/api/attendance/links/{id}/deactivate")
    public ResponseEntity<Void> deactivateLink(
            @PathVariable UUID id,
            @RequestHeader("X-User-Name") String userName,
            @RequestParam(defaultValue = "Desactivado manualmente") String reason) {

        publicAttendanceService.deactivateLink(id, userName, reason);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/attendance/links/{id}/reactivate")
    public ResponseEntity<Void> reactivateLink(@PathVariable UUID id) {
        publicAttendanceService.reactivateLink(id);
        return ResponseEntity.noContent().build();
    }

    // ============ Statistics ============

    @GetMapping("/api/attendance/statistics")
    public ResponseEntity<List<AttendanceStatistics>> getStatistics(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(publicAttendanceService.getTenantStats(tenantId, year, month));
    }

    @GetMapping("/api/attendance/statistics/employee/{employeeId}")
    public ResponseEntity<List<AttendanceStatistics>> getEmployeeStatistics(
            @PathVariable UUID employeeId,
            @RequestParam int year) {
        return ResponseEntity.ok(publicAttendanceService.getEmployeeYearlyStats(employeeId, year));
    }

    @PostMapping("/api/attendance/statistics/calculate")
    public ResponseEntity<Void> calculateStatistics(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestParam int year,
            @RequestParam int month) {
        publicAttendanceService.calculateMonthlyStatistics(tenantId, year, month);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/attendance/statistics/averages")
    public ResponseEntity<AttendanceAverages> getAverages(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(AttendanceAverages.builder()
                .averageAttendance(publicAttendanceService.getAverageAttendance(tenantId, year, month))
                .averagePunctuality(publicAttendanceService.getAveragePunctuality(tenantId, year, month))
                .build());
    }

    // ============ Public endpoint (no auth) ============

    @PostMapping("/public/attendance/{token}/clock")
    public ResponseEntity<ClockResponse> publicClock(
            @PathVariable String token,
            @RequestBody ClockRequest request) {

        Attendance attendance = publicAttendanceService.clockInByToken(token, request.getPinCode());

        String type = attendance.getClockOutTime() != null ? "CLOCK_OUT" : "CLOCK_IN";
        String message = type.equals("CLOCK_IN")
                ? "Entrada registrada correctamente"
                : "Salida registrada correctamente";

        return ResponseEntity.ok(ClockResponse.builder()
                .type(type)
                .message(message)
                .employeeName(attendance.getEmployee().getFullName())
                .timestamp(attendance.getClockOutTime() != null
                        ? attendance.getClockOutTime()
                        : attendance.getClockInTime())
                .build());
    }

    @GetMapping("/public/attendance/{token}/validate")
    public ResponseEntity<LinkValidation> validateLink(@PathVariable String token) {
        return publicAttendanceService.findActiveByToken(token)
                .map(link -> ResponseEntity.ok(LinkValidation.builder()
                        .valid(true)
                        .name(link.getName())
                        .build()))
                .orElse(ResponseEntity.ok(LinkValidation.builder()
                        .valid(false)
                        .build()));
    }

    // ============ DTOs ============

    private PublicAttendanceLinkDto toDto(PublicAttendanceLink link) {
        return PublicAttendanceLinkDto.builder()
                .id(link.getId())
                .tenantId(link.getTenantId())
                .branchId(link.getBranchId())
                .token(link.getToken())
                .name(link.getName())
                .description(link.getDescription())
                .active(link.isActive())
                .deactivatedAt(link.getDeactivatedAt())
                .deactivatedBy(link.getDeactivatedBy())
                .deactivationReason(link.getDeactivationReason())
                .totalClockIns(link.getTotalClockIns())
                .totalClockOuts(link.getTotalClockOuts())
                .lastUsedDate(link.getLastUsedDate())
                .lastUsedAt(link.getLastUsedAt())
                .createdBy(link.getCreatedBy())
                .createdAt(link.getCreatedAt())
                .publicUrl(publicBaseUrl + "/attendance/" + link.getToken())
                .build();
    }

    @lombok.Data
    public static class CreateLinkRequest {
        private UUID branchId;
        private String name;
    }

    @lombok.Data
    public static class ClockRequest {
        private String pinCode;
    }

    @lombok.Data
    @lombok.Builder
    public static class ClockResponse {
        private String type;
        private String message;
        private String employeeName;
        private java.time.Instant timestamp;
    }

    @lombok.Data
    @lombok.Builder
    public static class LinkValidation {
        private boolean valid;
        private String name;
    }

    @lombok.Data
    @lombok.Builder
    public static class AttendanceAverages {
        private Double averageAttendance;
        private Double averagePunctuality;
    }
}
