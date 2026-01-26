package com.poscl.operations.api.controller;

import com.poscl.operations.application.service.AttendanceService;
import com.poscl.operations.domain.entity.Attendance;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/operations/attendance")
@RequiredArgsConstructor
public class AttendanceController {
    private final AttendanceService attendanceService;

    @PostMapping("/clock-in")
    public ResponseEntity<Attendance> clockIn(@RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestBody Map<String, String> payload) {
        String pin = payload.get("pin");
        return ResponseEntity.ok(attendanceService.clockInByPin(tenantId, pin));
    }

    @GetMapping("/monthly")
    public ResponseEntity<List<Attendance>> getMonthly(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(attendanceService.getMonthlyAttendance(tenantId, year, month));
    }
}
