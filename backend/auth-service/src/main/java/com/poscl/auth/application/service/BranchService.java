package com.poscl.auth.application.service;

import com.poscl.auth.domain.entity.Branch;
import com.poscl.auth.domain.entity.Tenant;
import com.poscl.auth.domain.repository.BranchRepository;
import com.poscl.auth.domain.repository.TenantRepository;
import com.poscl.shared.exception.DomainException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class BranchService {

    private final BranchRepository branchRepository;
    private final TenantRepository tenantRepository;

    @Transactional(readOnly = true)
    public List<Branch> findAll(UUID tenantId) {
        return branchRepository.findByTenant_IdAndActivaTrue(tenantId);
    }

    @Transactional(readOnly = true)
    public Branch findById(UUID tenantId, UUID id) {
        return branchRepository.findByIdAndTenant_Id(id, tenantId)
                .orElseThrow(
                        () -> new DomainException("BRANCH_NOT_FOUND", "Sucursal no encontrada", HttpStatus.NOT_FOUND));
    }

    public Branch create(UUID tenantId, Branch branchData) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(
                        () -> new DomainException("TENANT_NOT_FOUND", "Tenant no encontrado", HttpStatus.NOT_FOUND));

        if (branchData.getCodigo() != null
                && branchRepository.existsByTenant_IdAndCodigo(tenantId, branchData.getCodigo())) {
            throw new DomainException("DUPLICATE_CODE", "El código de sucursal ya existe", HttpStatus.CONFLICT);
        }

        // Check if this is the first branch, if so make it principal
        boolean isFirst = branchRepository.findByTenant_IdAndActivaTrue(tenantId).isEmpty();

        Branch branch = Branch.builder()
                .tenant(tenant)
                .codigo(branchData.getCodigo())
                .nombre(branchData.getNombre())
                .direccion(branchData.getDireccion())
                .comuna(branchData.getComuna())
                .ciudad(branchData.getCiudad())
                .telefono(branchData.getTelefono())
                .email(branchData.getEmail())
                .esPrincipal(isFirst) // Auto-principal if first
                .activa(true)
                .build();

        return branchRepository.save(branch);
    }

    public Branch update(UUID tenantId, UUID id, Branch branchUpdates) {
        Branch branch = findById(tenantId, id);

        if (branchUpdates.getNombre() != null)
            branch.setNombre(branchUpdates.getNombre());
        if (branchUpdates.getDireccion() != null)
            branch.setDireccion(branchUpdates.getDireccion());
        if (branchUpdates.getComuna() != null)
            branch.setComuna(branchUpdates.getComuna());
        if (branchUpdates.getCiudad() != null)
            branch.setCiudad(branchUpdates.getCiudad());
        if (branchUpdates.getTelefono() != null)
            branch.setTelefono(branchUpdates.getTelefono());
        if (branchUpdates.getEmail() != null)
            branch.setEmail(branchUpdates.getEmail());

        // Handle Principal assignment carefully (not implemented in update yet for
        // simplicity, explicit method preferred)

        return branchRepository.save(branch);
    }

    public void delete(UUID tenantId, UUID id) {
        Branch branch = findById(tenantId, id);

        if (Boolean.TRUE.equals(branch.getEsPrincipal())) {
            throw new DomainException("CANNOT_DELETE_PRINCIPAL", "No se puede eliminar la sucursal principal",
                    HttpStatus.BAD_REQUEST);
        }

        branch.setActiva(false);
        branchRepository.save(branch);
    }

    public Branch setPrincipal(UUID tenantId, UUID id) {
        Branch newPrincipal = findById(tenantId, id);

        // Unset previous principal
        branchRepository.findPrincipalByTenantId(tenantId).ifPresent(old -> {
            old.setEsPrincipal(false);
            branchRepository.save(old);
        });

        newPrincipal.setEsPrincipal(true);
        return branchRepository.save(newPrincipal);
    }
}
