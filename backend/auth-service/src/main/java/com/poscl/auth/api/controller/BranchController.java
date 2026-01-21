package com.poscl.auth.api.controller;

import com.poscl.auth.api.dto.BranchDto;
import com.poscl.auth.application.service.BranchService;
import com.poscl.auth.domain.entity.Branch;
import jakarta.validation.Valid;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/branches")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class BranchController {

    private final BranchService branchService;

    @GetMapping
    public ResponseEntity<List<BranchDto>> getAllBranches(
            @RequestHeader("X-Tenant-Id") UUID tenantId) {

        log.info("GET /api/branches - TenantId: {}", tenantId);
        List<BranchDto> branches = branchService.findAll(tenantId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(branches);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BranchDto> getBranchById(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id) {

        log.info("GET /api/branches/{} - TenantId: {}", id, tenantId);
        return ResponseEntity.ok(toDto(branchService.findById(tenantId, id)));
    }

    @PostMapping
    public ResponseEntity<BranchDto> createBranch(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @Valid @RequestBody CreateBranchRequest request) {

        log.info("POST /api/branches - TenantId: {}, nombre: {}", tenantId, request.getNombre());

        Branch branchData = Branch.builder()
                .codigo(request.getCodigo())
                .nombre(request.getNombre())
                .direccion(request.getDireccion())
                .comuna(request.getComuna())
                .ciudad(request.getCiudad())
                .telefono(request.getTelefono())
                .email(request.getEmail())
                .build();

        Branch created = branchService.create(tenantId, branchData);
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BranchDto> updateBranch(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateBranchRequest request) {

        log.info("PUT /api/branches/{} - TenantId: {}", id, tenantId);

        Branch branchUpdates = Branch.builder()
                .nombre(request.getNombre())
                .direccion(request.getDireccion())
                .comuna(request.getComuna())
                .ciudad(request.getCiudad())
                .telefono(request.getTelefono())
                .email(request.getEmail())
                .build();

        Branch updated = branchService.update(tenantId, id, branchUpdates);
        return ResponseEntity.ok(toDto(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBranch(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id) {

        log.info("DELETE /api/branches/{} - TenantId: {}", id, tenantId);
        branchService.delete(tenantId, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/principal")
    public ResponseEntity<BranchDto> setPrincipal(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id) {
        log.info("POST /api/branches/{}/principal - TenantId: {}", id, tenantId);
        Branch updated = branchService.setPrincipal(tenantId, id);
        return ResponseEntity.ok(toDto(updated));
    }

    private BranchDto toDto(Branch branch) {
        return BranchDto.builder()
                .id(branch.getId())
                .codigo(branch.getCodigo())
                .nombre(branch.getNombre())
                .direccion(branch.getDireccion())
                .comuna(branch.getComuna())
                .ciudad(branch.getCiudad())
                .telefono(branch.getTelefono())
                .email(branch.getEmail())
                .activa(branch.getActiva())
                .esPrincipal(Boolean.TRUE.equals(branch.getEsPrincipal()))
                .build();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateBranchRequest {
        private String codigo;
        private String nombre;
        private String direccion;
        private String comuna;
        private String ciudad;
        private String telefono;
        private String email;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateBranchRequest {
        private String nombre;
        private String direccion;
        private String comuna;
        private String ciudad;
        private String telefono;
        private String email;
        private Boolean activa;
    }
}
