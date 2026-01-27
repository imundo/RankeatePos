package com.poscl.operations.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "employees")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Employee {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID tenantId;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(nullable = false)
    private String rut; // ID document (RUT Chile, DNI Argentina, etc.)

    private String email;
    private String phone;
    private String position;

    @Column(nullable = false)
    private String pinCode;

    private LocalDate hireDate;
    private LocalDate terminationDate;

    private BigDecimal baseSalary;

    // Extended personal info
    private String address;
    private LocalDate birthDate;
    private String nationality;
    private String photoUrl;

    // Emergency contact
    private String emergencyContact;
    private String emergencyPhone;

    // Banking info
    private String bankName;
    private String bankAccountNumber;
    private String bankAccountType; // CHECKING, SAVINGS

    // Country for tax calculations
    @Builder.Default
    private String countryCode = "CL";

    @Builder.Default
    private boolean active = true;

    // Payroll configuration (1:1 relationship)
    @OneToOne(mappedBy = "employee", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private EmployeePayrollConfig payrollConfig;

    // Documents uploaded for this employee
    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<EmployeeDocument> documents = new ArrayList<>();

    // Leave balances
    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<LeaveBalance> leaveBalances = new ArrayList<>();

    private Instant createdAt;
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public String getFullName() {
        return firstName + " " + lastName;
    }

    public String getInitials() {
        return (firstName != null && !firstName.isEmpty() ? firstName.substring(0, 1) : "") +
                (lastName != null && !lastName.isEmpty() ? lastName.substring(0, 1) : "");
    }
}
