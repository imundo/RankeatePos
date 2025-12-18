package com.poscl.catalog.application.service;

import com.poscl.catalog.api.dto.CategoryDto;
import com.poscl.catalog.api.dto.CategoryRequest;
import com.poscl.catalog.domain.entity.Category;
import com.poscl.catalog.domain.repository.CategoryRepository;
import com.poscl.shared.exception.DomainException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Servicio de categorías - CRUD completo
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class CategoryService {

    private final CategoryRepository categoryRepository;

    /**
     * Lista todas las categorías activas del tenant
     */
    @Transactional(readOnly = true)
    public List<CategoryDto> findAll(UUID tenantId) {
        return categoryRepository.findByTenantIdAndActivaTrueOrderByOrdenAsc(tenantId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene categorías en estructura de árbol (solo raíces con hijos)
     */
    @Transactional(readOnly = true)
    public List<CategoryDto> getTree(UUID tenantId) {
        return categoryRepository.findByTenantIdAndParentIsNullAndActivaTrueOrderByOrdenAsc(tenantId)
                .stream()
                .map(this::toDtoWithChildren)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene una categoría por ID
     */
    @Transactional(readOnly = true)
    public CategoryDto findById(UUID tenantId, UUID id) {
        Category category = categoryRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new DomainException("CATEGORY_NOT_FOUND",
                        "Categoría no encontrada", HttpStatus.NOT_FOUND));
        return toDtoWithChildren(category);
    }

    /**
     * Crea una nueva categoría
     */
    public CategoryDto create(UUID tenantId, UUID userId, CategoryRequest request) {
        // Verificar si existe categoría con mismo nombre
        if (categoryRepository.existsByTenantIdAndNombreIgnoreCase(tenantId, request.getNombre())) {
            throw new DomainException("CATEGORY_EXISTS",
                    "Ya existe una categoría con ese nombre", HttpStatus.CONFLICT);
        }

        Category parent = null;
        if (request.getParentId() != null) {
            parent = categoryRepository.findByIdAndTenantId(request.getParentId(), tenantId)
                    .orElseThrow(() -> new DomainException("PARENT_NOT_FOUND",
                            "Categoría padre no encontrada", HttpStatus.NOT_FOUND));
        }

        Category category = Category.builder()
                .tenantId(tenantId)
                .nombre(request.getNombre())
                .descripcion(request.getDescripcion())
                .parent(parent)
                .orden(request.getOrden() != null ? request.getOrden() : 0)
                .activa(true)
                .createdBy(userId)
                .createdAt(Instant.now())
                .build();

        category = categoryRepository.save(category);
        log.info("Categoría creada: {} - TenantId: {}", category.getNombre(), tenantId);

        return toDto(category);
    }

    /**
     * Actualiza una categoría existente
     */
    public CategoryDto update(UUID tenantId, UUID id, UUID userId, CategoryRequest request) {
        Category category = categoryRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new DomainException("CATEGORY_NOT_FOUND",
                        "Categoría no encontrada", HttpStatus.NOT_FOUND));

        // Verificar nombre único (excluyendo la actual)
        if (!category.getNombre().equalsIgnoreCase(request.getNombre())
                && categoryRepository.existsByTenantIdAndNombreIgnoreCase(tenantId, request.getNombre())) {
            throw new DomainException("CATEGORY_EXISTS",
                    "Ya existe una categoría con ese nombre", HttpStatus.CONFLICT);
        }

        Category parent = null;
        if (request.getParentId() != null && !request.getParentId().equals(id)) {
            parent = categoryRepository.findByIdAndTenantId(request.getParentId(), tenantId)
                    .orElseThrow(() -> new DomainException("PARENT_NOT_FOUND",
                            "Categoría padre no encontrada", HttpStatus.NOT_FOUND));
        }

        category.setNombre(request.getNombre());
        category.setDescripcion(request.getDescripcion());
        category.setParent(parent);
        if (request.getOrden() != null) {
            category.setOrden(request.getOrden());
        }
        category.setUpdatedBy(userId);
        category.setUpdatedAt(Instant.now());

        category = categoryRepository.save(category);
        log.info("Categoría actualizada: {} - ID: {}", category.getNombre(), id);

        return toDto(category);
    }

    /**
     * Elimina (soft delete) una categoría
     */
    public void delete(UUID tenantId, UUID id, UUID userId) {
        Category category = categoryRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new DomainException("CATEGORY_NOT_FOUND",
                        "Categoría no encontrada", HttpStatus.NOT_FOUND));

        category.setActiva(false);
        category.setDeletedAt(Instant.now());
        category.setUpdatedBy(userId);
        categoryRepository.save(category);

        log.info("Categoría eliminada: {} - ID: {}", category.getNombre(), id);
    }

    /**
     * Reordena una categoría
     */
    public CategoryDto reorder(UUID tenantId, UUID id, UUID userId, Integer newOrder) {
        Category category = categoryRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new DomainException("CATEGORY_NOT_FOUND",
                        "Categoría no encontrada", HttpStatus.NOT_FOUND));

        category.setOrden(newOrder);
        category.setUpdatedBy(userId);
        category.setUpdatedAt(Instant.now());

        category = categoryRepository.save(category);
        return toDto(category);
    }

    // Mappers
    private CategoryDto toDto(Category category) {
        return CategoryDto.builder()
                .id(category.getId())
                .nombre(category.getNombre())
                .descripcion(category.getDescripcion())
                .parentId(category.getParentId())
                .parentName(category.getParent() != null ? category.getParent().getNombre() : null)
                .orden(category.getOrden())
                .activa(category.getActiva())
                .build();
    }

    private CategoryDto toDtoWithChildren(Category category) {
        CategoryDto dto = toDto(category);
        if (category.getChildren() != null && !category.getChildren().isEmpty()) {
            dto.setChildren(
                    category.getChildren().stream()
                            .filter(Category::getActiva)
                            .map(this::toDtoWithChildren)
                            .collect(Collectors.toList()));
        }
        return dto;
    }
}
