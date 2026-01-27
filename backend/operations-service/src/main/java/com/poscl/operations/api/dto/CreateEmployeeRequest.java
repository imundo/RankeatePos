package com.poscl.operations.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreateEmployeeRequest {
    @NotBlank(message = "El nombre es requerido")
    private String firstName;

    @NotBlank(message = "El apellido es requerido")
    private String lastName;

    @NotBlank(message = "El RUT es requerido")
    private String rut;

    @Email(message = "Email inválido")
    private String email;

    private String phone;

    @NotBlank(message = "El cargo es requerido")
    private String position;

    private String pinCode; // Optional, will be auto-generated if not provided

    @NotNull(message = "La fecha de contratación es requerida")
    private LocalDate hireDate;

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
}
