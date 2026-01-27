package com.poscl.operations.api.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class EmployeeDto {
    private UUID id;
    private UUID tenantId;
    private String firstName;
    private String lastName;
    private String rut;
    private String email;
    private String phone;
    private String position;
    private String pinCode;
    private LocalDate hireDate;
    private LocalDate terminationDate;
    private BigDecimal baseSalary;
    private String address;
    private LocalDate birthDate;
    private String nationality;
    private String photoUrl;
    private String emergencyContact;
    private String emergencyPhone;
    private String bankName;
    private String bankAccountNumber;
    private String bankAccountType;
    private String countryCode;
    private boolean active;
    private String initials;
    private String fullName;
    private Instant createdAt;
    private Instant updatedAt;

    // Nested summary fields
    private BigDecimal vacationDaysRemaining;
    private int documentsCount;
}
