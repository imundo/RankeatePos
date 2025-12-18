package com.poscl.auth.api.controller;

import com.poscl.auth.api.dto.BranchDto;
import com.poscl.auth.domain.entity.Branch;
import com.poscl.auth.domain.entity.Tenant;
import com.poscl.auth.domain.repository.BranchRepository;
import com.poscl.auth.domain.repository.TenantRepository;
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

    private final BranchRepository branchRepository;
    private final TenantRepository tenantRepository;

    @GetMapping
    public ResponseEntity<List<BranchDto>> getAllBranches(
            @RequestHeader("X-Tenant-Id") UUID tenantId) {

        log.info("GET /api/branches - TenantId: {}", tenantId);
        List<BranchDto> branches = branchRepository.findByTenant_IdAndActivaTrue(tenantId)
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
        return branchRepository.findById(id)
                .filter(b -> b.getTenant().getId().equals(tenantId))
                .map(this::toDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<BranchDto> createBranch(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @Valid @RequestBody CreateBranchRequest request) {

        log.info("POST /api/branches - TenantId: {}, nombre: {}", tenantId, request.getNombre());

        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant no encontrado"));

        Branch branch = Branch.builder()
                .tenant(tenant)
                .codigo(request.getCodigo())
                .nombre(request.getNombre())
                .direccion(request.getDireccion())
                .comuna(request.getComuna())
                .ciudad(request.getCiudad())
                .telefono(request.getTelefono())
                .email(request.getEmail())
                .activa(true)
                .build();

        branch = branchRepository.save(branch);
        log.info("Sucursal creada: {}", branch.getId());

        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(branch));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BranchDto> updateBranch(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateBranchRequest request) {

        log.info("PUT /api/branches/{} - TenantId: {}", id, tenantId);

        Branch branch = branchRepository.findById(id)
                .filter(b -> b.getTenant().getId().equals(tenantId))
                .orElseThrow(() -> new RuntimeException("Sucursal no encontrada"));

        if (request.getNombre() != null)
            branch.setNombre(request.getNombre());
        if (request.getDireccion() != null)
            branch.setDireccion(request.getDireccion());
        if (request.getComuna() != null)
            branch.setComuna(request.getComuna());
        if (request.getCiudad() != null)
            branch.setCiudad(request.getCiudad());
        if (request.getTelefono() != null)
            branch.setTelefono(request.getTelefono());
        if (request.getEmail() != null)
            branch.setEmail(request.getEmail());
        if (request.getActiva() != null)
            branch.setActiva(request.getActiva());

        branch = branchRepository.save(branch);
        return ResponseEntity.ok(toDto(branch));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBranch(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id) {

        log.info("DELETE /api/branches/{} - TenantId: {}", id, tenantId);

        Branch branch = branchRepository.findById(id)
                .filter(b -> b.getTenant().getId().equals(tenantId))
                .orElseThrow(() -> new RuntimeException("Sucursal no encontrada"));

        // Soft delete
        branch.setActiva(false);
        branchRepository.save(branch);

        return ResponseEntity.noContent().build();
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
