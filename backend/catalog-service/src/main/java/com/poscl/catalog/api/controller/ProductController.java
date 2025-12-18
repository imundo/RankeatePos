package com.poscl.catalog.api.controller;

import com.poscl.catalog.api.dto.*;
import com.poscl.catalog.application.service.ProductService;
import com.poscl.shared.dto.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controlador de productos
 */
@Slf4j
@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Tag(name = "Productos", description = "Gestión del catálogo de productos")
public class ProductController {
    
    private final ProductService productService;
    
    @GetMapping
    @Operation(summary = "Listar productos", description = "Lista productos paginados del tenant")
    public ResponseEntity<PageResponse<ProductDto>> findAll(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestParam(required = false) String search,
            Pageable pageable) {
        
        Page<ProductDto> page;
        if (search != null && !search.isBlank()) {
            page = productService.search(tenantId, search, pageable);
        } else {
            page = productService.findAll(tenantId, pageable);
        }
        
        return ResponseEntity.ok(PageResponse.of(
            page.getContent(),
            page.getNumber(),
            page.getSize(),
            page.getTotalElements()
        ));
    }
    
    @GetMapping("/sync")
    @Operation(summary = "Sincronizar catálogo", description = "Obtiene todos los productos activos para sincronización offline")
    public ResponseEntity<List<ProductDto>> syncAll(@RequestHeader("X-Tenant-Id") UUID tenantId) {
        log.info("Sincronización de catálogo para tenant: {}", tenantId);
        return ResponseEntity.ok(productService.findAllForSync(tenantId));
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Obtener producto", description = "Obtiene un producto por ID")
    public ResponseEntity<ProductDto> findById(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(productService.findById(tenantId, id));
    }
    
    @GetMapping("/lookup/{code}")
    @Operation(summary = "Buscar por código", description = "Busca variante por SKU o código de barras (para POS)")
    public ResponseEntity<ProductDto.VariantDto> lookupByCode(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable String code) {
        return ResponseEntity.ok(productService.findVariantByCode(tenantId, code));
    }
    
    @PostMapping
    @Operation(summary = "Crear producto", description = "Crea un nuevo producto con variantes")
    public ResponseEntity<ProductDto> create(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestHeader("X-User-Id") UUID userId,
            @Valid @RequestBody ProductRequest request) {
        
        log.info("POST /api/products - SKU: {}", request.getSku());
        ProductDto product = productService.create(tenantId, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(product);
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Actualizar producto", description = "Actualiza un producto existente")
    public ResponseEntity<ProductDto> update(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable UUID id,
            @Valid @RequestBody ProductRequest request) {
        
        log.info("PUT /api/products/{}", id);
        return ResponseEntity.ok(productService.update(tenantId, id, userId, request));
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar producto", description = "Desactiva un producto (soft delete)")
    public ResponseEntity<Void> delete(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable UUID id) {
        
        log.info("DELETE /api/products/{}", id);
        productService.delete(tenantId, id, userId);
        return ResponseEntity.noContent().build();
    }
}
