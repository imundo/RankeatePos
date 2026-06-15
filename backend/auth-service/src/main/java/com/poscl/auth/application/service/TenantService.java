package com.poscl.auth.application.service;

import com.poscl.auth.api.dto.TenantRequest;
import com.poscl.auth.domain.entity.Tenant;
import com.poscl.auth.domain.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Servicio de gestión de Tenants (empresas/clientes)
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TenantService {

    private final TenantRepository tenantRepository;
    private final com.poscl.auth.domain.repository.ModuleRepository moduleRepository;
    private final com.poscl.auth.infrastructure.repository.TenantDocumentRepository documentRepository;

    /**
     * Cuenta total de tenants
     */
    public long countAll() {
        return tenantRepository.count();
    }

    // ...

    public void updateModules(UUID tenantId, java.util.Map<String, Boolean> modulesMap) {
        log.info("Updating modules for tenant {}. Input size: {}", tenantId, modulesMap.size());

        long startTime = System.currentTimeMillis();

        // Use withModules to avoid lazy loading N+1 or session issues
        Tenant tenant = findByIdWithModules(tenantId);

        // Map existing modules by ID for O(1) access
        java.util.Map<UUID, com.poscl.auth.domain.entity.TenantModule> existingModulesMap = tenant.getTenantModules()
                .stream()
                .collect(java.util.stream.Collectors.toMap(tm -> tm.getModule().getId(), tm -> tm));

        // Optimization: Fetch all involved modules in ONE query instad of N
        java.util.Map<String, Boolean> normalizedMap = new java.util.HashMap<>();
        modulesMap.forEach((k, v) -> normalizedMap.put(k.toLowerCase(), v));

        java.util.List<String> codes = new java.util.ArrayList<>(normalizedMap.keySet());
        java.util.List<com.poscl.auth.domain.entity.Module> modules = moduleRepository.findByCodeInIgnoreCase(codes);

        log.debug("Found {} modules in DB matching codes", modules.size());

        int updates = 0;
        int inserts = 0;

        for (com.poscl.auth.domain.entity.Module module : modules) {
            // Case-insensitive lookup
            Boolean isActive = normalizedMap.get(module.getCode().toLowerCase());

            if (existingModulesMap.containsKey(module.getId())) {
                existingModulesMap.get(module.getId()).setActive(isActive);
                updates++;
            } else {
                if (Boolean.TRUE.equals(isActive)) {
                    tenant.addModule(com.poscl.auth.domain.entity.TenantModule.builder()
                            .tenant(tenant)
                            .module(module)
                            .active(true)
                            .build());
                    inserts++;
                }
            }
        }

        tenantRepository.save(tenant);
        long duration = System.currentTimeMillis()
                - startTime;
        log.info("Tenant modules updated in {} ms. Updates: {}, Inserts: {}", duration, updates, inserts);
    }

    /**
     * Cuenta tenants activos
     */
    public long countActive() {
        return tenantRepository.countByActivoTrue();
    }

    /**
     * Lista todos los tenants con búsqueda y filtro de estado
     */
    public Page<Tenant> findAll(String search, String status, Pageable pageable) {
        if (search != null && !search.isBlank()) {
            if ("active".equalsIgnoreCase(status)) {
                return tenantRepository.findByRazonSocialContainingIgnoreCaseAndActivoTrue(search, pageable);
            } else if ("inactive".equalsIgnoreCase(status)) {
                return tenantRepository.findByRazonSocialContainingIgnoreCaseAndActivoFalse(search, pageable);
            }
            return tenantRepository.findByRazonSocialContainingIgnoreCase(search, pageable);
        }

        if ("active".equalsIgnoreCase(status)) {
            return tenantRepository.findByActivoTrue(pageable);
        } else if ("inactive".equalsIgnoreCase(status)) {
            return tenantRepository.findByActivoFalse(pageable);
        }

        return tenantRepository.findAll(pageable);
    }

    /**
     * Busca un tenant por ID
     */
    public Tenant findById(UUID id) {
        return tenantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tenant no encontrado: " + id));
    }

    /**
     * Busca un tenant por ID con módulos precargados (evita N+1)
     */
    public Tenant findByIdWithModules(UUID id) {
        return tenantRepository.findByIdWithModules(id)
                .orElseThrow(() -> new RuntimeException("Tenant no encontrado: " + id));
    }

    /**
     * Crea un nuevo tenant
     */
    public Tenant create(TenantRequest request) {
        log.info("Creando nuevo tenant: {}", request.getRazonSocial());

        // Verificar RUT único
        if (tenantRepository.existsByRut(request.getRut())) {
            throw new RuntimeException("Ya existe un tenant con el RUT: " + request.getRut());
        }

        Tenant tenant = Tenant.builder()
                .rut(request.getRut())
                .razonSocial(request.getRazonSocial())
                .nombreFantasia(request.getNombreFantasia())
                .giro(request.getGiro())
                .direccion(request.getDireccion())
                .comuna(request.getComuna())
                .region(request.getRegion())
                .ciudad(request.getCiudad())
                .telefono(request.getTelefono())
                .businessType(request.getBusinessType())
                .plan(request.getPlan() != null ? request.getPlan() : "FREE")
                .activo(true)
                .build();

        tenant = tenantRepository.save(tenant);
        log.info("Tenant creado con ID: {}", tenant.getId());

        return tenant;
    }

    /**
     * Actualiza el estado de un tenant (activo/suspendido)
     */
    public Tenant updateStatus(UUID id, boolean activo) {
        log.info("Actualizando estado de tenant {} a activo={}", id, activo);

        Tenant tenant = findById(id);
        tenant.setActivo(activo);

        return tenantRepository.save(tenant);
    }

    /**
     * Actualiza datos de un tenant
     */
    public Tenant update(UUID id, TenantRequest request) {
        Tenant tenant = findById(id);

        if (request.getRazonSocial() != null)
            tenant.setRazonSocial(request.getRazonSocial());
        if (request.getNombreFantasia() != null)
            tenant.setNombreFantasia(request.getNombreFantasia());
        if (request.getGiro() != null)
            tenant.setGiro(request.getGiro());
        if (request.getDireccion() != null)
            tenant.setDireccion(request.getDireccion());
        if (request.getComuna() != null)
            tenant.setComuna(request.getComuna());
        if (request.getRegion() != null)
            tenant.setRegion(request.getRegion());
        if (request.getCiudad() != null)
            tenant.setCiudad(request.getCiudad());
        if (request.getTelefono() != null)
            tenant.setTelefono(request.getTelefono());
        if (request.getBusinessType() != null)
            tenant.setBusinessType(request.getBusinessType());
        if (request.getPlan() != null)
            tenant.setPlan(request.getPlan());

        return tenantRepository.save(tenant);
    }

    /**
     * Actualiza el branding de la empresa
     */
    public Tenant updateBranding(UUID id, String logoUrl, String primaryColor, String secondaryColor, String accentColor) {
        Tenant tenant = findById(id);
        if (logoUrl != null) tenant.setLogoUrl(logoUrl);
        if (primaryColor != null) tenant.setPrimaryColor(primaryColor);
        if (secondaryColor != null) tenant.setSecondaryColor(secondaryColor);
        if (accentColor != null) tenant.setAccentColor(accentColor);
        return tenantRepository.save(tenant);
    }

    /**
     * Documentos
     */
    private String calculateDocumentStatus(java.time.LocalDate expiryDate, Integer diasAlerta) {
        if (expiryDate == null) return "VIGENTE";
        java.time.LocalDate hoy = java.time.LocalDate.now();
        int daysToAlert = diasAlerta != null ? diasAlerta : 30;
        
        if (expiryDate.isBefore(hoy)) {
            return "VENCIDO";
        } else if (expiryDate.isBefore(hoy.plusDays(daysToAlert))) {
            return "POR_VENCER";
        }
        return "VIGENTE";
    }

    public java.util.List<com.poscl.auth.domain.entity.TenantDocument> getDocuments(UUID tenantId) {
        Tenant tenant = findById(tenantId);
        java.util.List<com.poscl.auth.domain.entity.TenantDocument> docs = documentRepository.findByTenantId(tenantId);
        // Actualizar estado dinámicamente si es necesario
        for (com.poscl.auth.domain.entity.TenantDocument doc : docs) {
            String status = calculateDocumentStatus(doc.getFechaVencimiento(), tenant.getDiasAlertaDocumentos());
            if (!status.equals(doc.getEstado())) {
                doc.setEstado(status);
                // Opcional: guardarlo para no recalcular siempre
                documentRepository.save(doc);
            }
        }
        return docs;
    }

    public com.poscl.auth.domain.entity.TenantDocument addDocument(UUID tenantId, com.poscl.auth.api.dto.TenantDocumentDto dto) {
        Tenant tenant = findById(tenantId);
        String estadoCalculado = calculateDocumentStatus(dto.fechaVencimiento(), tenant.getDiasAlertaDocumentos());
        
        com.poscl.auth.domain.entity.TenantDocument doc = com.poscl.auth.domain.entity.TenantDocument.builder()
                .tenant(tenant)
                .nombre(dto.nombre())
                .tipo(dto.tipo())
                .fechaVencimiento(dto.fechaVencimiento())
                .archivoUrl(dto.archivoUrl())
                .estado(estadoCalculado)
                .build();
        return documentRepository.save(doc);
    }

    public com.poscl.auth.domain.entity.TenantDocument updateDocument(UUID tenantId, UUID docId, com.poscl.auth.api.dto.TenantDocumentDto dto) {
        Tenant tenant = findById(tenantId);
        com.poscl.auth.domain.entity.TenantDocument doc = documentRepository.findById(docId)
                .orElseThrow(() -> new RuntimeException("Documento no encontrado"));
                
        if (!doc.getTenant().getId().equals(tenantId)) {
            throw new RuntimeException("No tiene permisos para editar este documento");
        }

        String estadoCalculado = calculateDocumentStatus(dto.fechaVencimiento(), tenant.getDiasAlertaDocumentos());
        
        doc.setNombre(dto.nombre());
        doc.setTipo(dto.tipo());
        doc.setFechaVencimiento(dto.fechaVencimiento());
        doc.setEstado(estadoCalculado);
        if (dto.archivoUrl() != null && !dto.archivoUrl().isBlank()) {
            doc.setArchivoUrl(dto.archivoUrl());
        }
        
        return documentRepository.save(doc);
    }

    public void deleteDocument(UUID tenantId, UUID documentId) {
        com.poscl.auth.domain.entity.TenantDocument doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Documento no encontrado"));
        if (!doc.getTenant().getId().equals(tenantId)) {
            throw new RuntimeException("El documento no pertenece a este tenant");
        }
        documentRepository.delete(doc);
    }
}
