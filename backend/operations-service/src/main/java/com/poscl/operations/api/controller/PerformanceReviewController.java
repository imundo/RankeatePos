package com.poscl.operations.api.controller;

import com.poscl.operations.application.service.PerformanceReviewService;
import com.poscl.operations.domain.entity.PerformanceReview;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/operations/reviews")
@RequiredArgsConstructor
public class PerformanceReviewController {
    private final PerformanceReviewService reviewService;

    @PostMapping
    public ResponseEntity<PerformanceReview> createReview(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestBody ReviewRequest request) {
        return ResponseEntity.ok(reviewService.createReview(
                tenantId, request.employeeId(), request.period(), request.reviewer(), request.score(),
                request.feedback()));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<PerformanceReview>> getReviews(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(reviewService.getReviewsByEmployee(employeeId));
    }

    public record ReviewRequest(UUID employeeId, String period, String reviewer, Integer score, String feedback) {
    }
}
