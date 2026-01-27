package com.poscl.operations.application.service;

import com.poscl.operations.domain.entity.Employee;
import com.poscl.operations.domain.entity.PerformanceReview;
import com.poscl.operations.domain.repository.EmployeeRepository;
import com.poscl.operations.domain.repository.PerformanceReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PerformanceReviewService {
    private final PerformanceReviewRepository reviewRepository;
    private final EmployeeRepository employeeRepository;

    public PerformanceReview createReview(UUID tenantId, UUID employeeId, String period, String reviewer, Integer score,
            String feedback) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));

        PerformanceReview review = PerformanceReview.builder()
                .tenantId(tenantId)
                .employee(employee)
                .period(period)
                .reviewerName(reviewer)
                .overallScore(score)
                .feedback(feedback)
                .status("COMPLETED")
                .reviewDate(LocalDate.now())
                .build();

        return reviewRepository.save(review);
    }

    public List<PerformanceReview> getReviewsByEmployee(UUID employeeId) {
        return reviewRepository.findByEmployeeId(employeeId);
    }
}
