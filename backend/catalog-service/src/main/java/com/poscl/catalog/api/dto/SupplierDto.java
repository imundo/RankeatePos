package com.poscl.catalog.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierDto {
    private UUID id;
    
    // Legacy fields (some aligned to frontend ones via mapper, some direct)
    private String nombre; // In mapper we map this to/from businessName
    private String rut;
    private String email;
    private String telefono; // In mapper we map this to/from phone
    private String direccion; // address
    private String contacto; // contactName
    private String plazoPago; 
    private Boolean activo; // isActive
    
    // New fields
    private String businessName; // Also mapped from frontend directly
    private String fantasyName;
    private String giro;
    private String website;
    private String city;
    private java.math.BigDecimal discountPercentage;
    private String currency;
    private String bankAccount;
    private String bankName;
    private String category;
    private String deliveryType;
    private Integer avgDeliveryDays;
    private Integer paymentTerms;
    private String notes;
    private String address; // To match frontend
    private String contactName; // To match frontend
    private String phone; // To match frontend
    private Boolean isActive; // To match frontend
}
