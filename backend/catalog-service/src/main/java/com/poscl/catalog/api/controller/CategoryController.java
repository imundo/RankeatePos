package com.poscl.catalog.api.controller;

import com.poscl.catalog.api.dto.CategoryDto;
import com.poscl.catalog.api.dto.CategoryRequest;
import com.poscl.catalog.application.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controlador de categorías - CRUD completo
 */
@Slf4j
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@Tag(name = "Categorías", description = "Gestión de categorías de productos")
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    @Operation(summary = "Listar categorías", description = "Lista todas las categorías del tenant en forma de árbol")
    public ResponseEntity<List<CategoryDto>> findAll(
            @RequestHeader("X-Tenant-Id") UUID tenantId) {
        log.info("GET /api/categories - TenantId: {}", tenantId);
        return ResponseEntity.ok(categoryService.findAll(tenantId));
    }

    @GetMapping("/tree")
    @Operation(summary = "Árbol de categorías", description = "Obtiene categorías en estructura jerárquica")
    public ResponseEntity<List<CategoryDto>> getTree(
            @RequestHeader("X-Tenant-Id") UUID tenantId) {
        log.info("GET /api/categories/tree - TenantId: {}", tenantId);
        return ResponseEntity.ok(categoryService.getTree(tenantId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener categoría", description = "Obtiene una categoría por ID")
    public ResponseEntity<CategoryDto> findById(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id) {
        log.info("GET /api/categories/{} - TenantId: {}", id, tenantId);
        return ResponseEntity.ok(categoryService.findById(tenantId, id));
    }

    @PostMapping
    @Operation(summary = "Crear categoría", description = "Crea una nueva categoría")
    public ResponseEntity<CategoryDto> create(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestHeader("X-User-Id") UUID userId,
            @Valid @RequestBody CategoryRequest request) {
        log.info("POST /api/categories - Nombre: {}", request.getNombre());
        CategoryDto category = categoryService.create(tenantId, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(category);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar categoría", description = "Actualiza una categoría existente")
    public ResponseEntity<CategoryDto> update(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable UUID id,
            @Valid @RequestBody CategoryRequest request) {
        log.info("PUT /api/categories/{}", id);
        return ResponseEntity.ok(categoryService.update(tenantId, id, userId, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar categoría", description = "Desactiva una categoría (soft delete)")
    public ResponseEntity<Void> delete(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable UUID id) {
        log.info("DELETE /api/categories/{}", id);
        categoryService.delete(tenantId, id, userId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/reorder")
    @Operation(summary = "Reordenar categoría", description = "Cambia el orden de una categoría")
    public ResponseEntity<CategoryDto> reorder(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable UUID id,
            @RequestParam Integer newOrder) {
        log.info("PUT /api/categories/{}/reorder - newOrder: {}", id, newOrder);
        return ResponseEntity.ok(categoryService.reorder(tenantId, id, userId, newOrder));
    }
}
