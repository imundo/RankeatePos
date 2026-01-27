package com.poscl.operations.api.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class UpdateEmployeeRequest {
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String position;
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
}
