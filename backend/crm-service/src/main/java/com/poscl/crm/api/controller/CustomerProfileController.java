package com.poscl.crm.api.controller;

import com.poscl.crm.api.dto.CustomerProfileDto;
import com.poscl.crm.application.service.CustomerProfileService;
import com.poscl.crm.domain.entity.CustomerProfile;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/crm/profiles")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Customer Profiles", description = "CRM World-Class - Perfiles y RFM")
public class CustomerProfileController {

    private final CustomerProfileService profileService;

    @GetMapping
    @Operation(summary = "Listar todos los clientes del CRM")
    public ResponseEntity<Page<CustomerProfileDto>> getProfiles(
            @RequestHeader("X-Tenant-ID") String tenantIdStr,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        UUID tenantId = UUID.fromString(tenantIdStr);
        Pageable pageable = PageRequest.of(page, size);
        
        Page<CustomerProfile> profiles = profileService.getProfiles(tenantId, pageable);
        return ResponseEntity.ok(profiles.map(this::toDto));
    }

    @GetMapping("/search")
    @Operation(summary = "Buscar clientes en el CRM por RUT, email o nombre")
    public ResponseEntity<List<CustomerProfileDto>> searchProfiles(
            @RequestHeader("X-Tenant-ID") String tenantIdStr,
            @RequestParam("q") String query) {
        
        UUID tenantId = UUID.fromString(tenantIdStr);
        List<CustomerProfile> profiles = profileService.searchProfiles(tenantId, query);
        
        return ResponseEntity.ok(profiles.stream().map(this::toDto).collect(Collectors.toList()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener perfil de cliente 360")
    public ResponseEntity<CustomerProfileDto> getProfile(@PathVariable UUID id) {
        CustomerProfile profile = profileService.getProfileById(id);
        return ResponseEntity.ok(toDto(profile));
    }

    @PostMapping
    @Operation(summary = "Crear nuevo cliente en CRM")
    public ResponseEntity<CustomerProfileDto> createProfile(
            @RequestHeader("X-Tenant-ID") String tenantIdStr,
            @RequestBody Map<String, String> request) {
        
        UUID tenantId = UUID.fromString(tenantIdStr);
        CustomerProfile profile = profileService.createProfile(
                tenantId,
                request.get("fullName"),
                request.get("rut"),
                request.get("email"),
                request.get("phone")
        );
        
        return ResponseEntity.ok(toDto(profile));
    }
    
    @PutMapping("/{id}/limit")
    @Operation(summary = "Ajustar límite de crédito (Fiado) del cliente")
    public ResponseEntity<CustomerProfileDto> updateCreditLimit(
            @PathVariable UUID id,
            @RequestBody Map<String, BigDecimal> request) {
        
        CustomerProfile profile = profileService.updateCreditLimit(id, request.get("limit"));
        return ResponseEntity.ok(toDto(profile));
    }

    private CustomerProfileDto toDto(CustomerProfile p) {
        BigDecimal available = BigDecimal.ZERO;
        if (p.getCreditLimit() != null) {
            available = p.getCreditLimit().subtract(p.getCurrentDebt());
            if (available.compareTo(BigDecimal.ZERO) < 0) {
                available = BigDecimal.ZERO;
            }
        }
        
        return CustomerProfileDto.builder()
                .id(p.getId())
                .tenantId(p.getTenantId())
                .fullName(p.getFullName())
                .rut(p.getRut())
                .email(p.getEmail())
                .phone(p.getPhone())
                .creditLimit(p.getCreditLimit())
                .currentDebt(p.getCurrentDebt())
                .availableCredit(available)
                .lastPurchaseDate(p.getLastPurchaseDate())
                .purchaseCount(p.getPurchaseCount())
                .totalLTV(p.getTotalLTV())
                .segment(calculateSegment(p))
                .build();
    }
    
    private String calculateSegment(CustomerProfile p) {
        if (p.getTotalLTV() != null && p.getTotalLTV().compareTo(new BigDecimal("500000")) > 0) return "VIP";
        if (p.getPurchaseCount() > 10) return "FREQUENT";
        if (p.getPurchaseCount() == 0) return "NEW";
        return "REGULAR";
    }
}
