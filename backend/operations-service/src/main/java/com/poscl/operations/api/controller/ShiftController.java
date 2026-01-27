package com.poscl.operations.api.controller;

import com.poscl.operations.application.service.ShiftService;
import com.poscl.operations.domain.entity.Shift;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/operations/shifts")
@RequiredArgsConstructor
public class ShiftController {
    private final ShiftService shiftService;

    @PostMapping
    public ResponseEntity<Shift> createShift(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestBody ShiftRequest request) {
        return ResponseEntity.ok(shiftService.scheduleShift(
                tenantId, request.employeeId(), request.start(), request.end(), request.type()));
    }

    @GetMapping
    public ResponseEntity<List<Shift>> getShifts(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return ResponseEntity.ok(shiftService.getShiftsByRange(tenantId, start, end));
    }

    public record ShiftRequest(UUID employeeId, LocalDateTime start, LocalDateTime end, String type) {
    }
}
