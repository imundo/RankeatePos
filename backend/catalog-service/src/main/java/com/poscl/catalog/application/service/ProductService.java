package com.poscl.catalog.application.service;

import com.poscl.catalog.api.dto.*;
import com.poscl.catalog.domain.entity.*;
import com.poscl.catalog.domain.repository.*;
import com.poscl.shared.exception.BusinessConflictException;
import com.poscl.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Servicio de productos
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {
    
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final CategoryRepository categoryRepository;
    private final UnitRepository unitRepository;
    private final TaxRepository taxRepository;
    
    /**
     * Lista productos paginados
     */
    @Transactional(readOnly = true)
    public Page<ProductDto> findAll(UUID tenantId, Pageable pageable) {
        return productRepository.findActiveByTenantId(tenantId, pageable)
            .map(this::toDto);
    }
    
    /**
     * Busca productos por nombre o SKU
     */
    @Transactional(readOnly = true)
    public Page<ProductDto> search(UUID tenantId, String query, Pageable pageable) {
        return productRepository.searchByNameOrSku(tenantId, query, pageable)
            .map(this::toDto);
    }
    
    /**
     * Obtiene un producto por ID
     */
    @Transactional(readOnly = true)
    public ProductDto findById(UUID tenantId, UUID id) {
        Product product = productRepository.findByIdAndTenantIdWithDetails(id, tenantId)
            .orElseThrow(() -> new ResourceNotFoundException("Producto", id));
        return toDto(product);
    }
    
    /**
     * Busca variante por SKU o código de barras (para POS)
     */
    @Transactional(readOnly = true)
    public ProductDto.VariantDto findVariantByCode(UUID tenantId, String code) {
        ProductVariant variant = variantRepository.findBySkuOrBarcode(tenantId, code)
            .orElseThrow(() -> new ResourceNotFoundException("Producto con código " + code + " no encontrado"));
        return toVariantDto(variant);
    }
    
    /**
     * Crea un nuevo producto con variantes
     */
    @Transactional
    public ProductDto create(UUID tenantId, UUID userId, ProductRequest request) {
        log.info("Creando producto SKU: {} para tenant: {}", request.getSku(), tenantId);
        
        // Validar SKU único
        if (productRepository.existsByTenantIdAndSku(tenantId, request.getSku())) {
            throw new BusinessConflictException("SKU_EXISTS", 
                "Ya existe un producto con el SKU " + request.getSku());
        }
        
        // Obtener unidad
        Unit unit = unitRepository.findById(request.getUnitId())
            .orElseThrow(() -> new ResourceNotFoundException("Unidad", request.getUnitId()));
        
        // Obtener categoría (opcional)
        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findByIdAndTenantId(request.getCategoryId(), tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Categoría", request.getCategoryId()));
        }
        
        // Crear producto
        Product product = Product.builder()
            .tenantId(tenantId)
            .sku(request.getSku())
            .nombre(request.getNombre())
            .descripcion(request.getDescripcion())
            .category(category)
            .unit(unit)
            .requiereVariantes(request.getRequiereVariantes() != null ? request.getRequiereVariantes() : false)
            .permiteVentaFraccionada(request.getPermiteVentaFraccionada() != null ? request.getPermiteVentaFraccionada() : false)
            .imagenUrl(request.getImagenUrl())
            .activo(true)
            .createdBy(userId)
            .build();
        
        // Crear variantes
        if (request.getVariants() != null && !request.getVariants().isEmpty()) {
            for (ProductRequest.VariantRequest vr : request.getVariants()) {
                validateVariantSku(tenantId, vr.getSku());
                ProductVariant variant = createVariant(tenantId, vr);
                product.addVariant(variant);
            }
        } else {
            // Crear variante default con el mismo SKU del producto
            ProductVariant defaultVariant = ProductVariant.builder()
                .sku(request.getSku())
                .esDefault(true)
                .costo(0)
                .precioNeto(0)
                .precioBruto(0)
                .stockMinimo(0)
                .activo(true)
                .build();
            product.addVariant(defaultVariant);
        }
        
        product = productRepository.save(product);
        log.info("Producto creado con ID: {}", product.getId());
        
        return toDto(product);
    }
    
    /**
     * Actualiza un producto
     */
    @Transactional
    public ProductDto update(UUID tenantId, UUID id, UUID userId, ProductRequest request) {
        Product product = productRepository.findByIdAndTenantIdWithDetails(id, tenantId)
            .orElseThrow(() -> new ResourceNotFoundException("Producto", id));
        
        // Validar SKU si cambió
        if (!product.getSku().equals(request.getSku())) {
            if (productRepository.existsByTenantIdAndSku(tenantId, request.getSku())) {
                throw new BusinessConflictException("SKU_EXISTS", 
                    "Ya existe un producto con el SKU " + request.getSku());
            }
            product.setSku(request.getSku());
        }
        
        product.setNombre(request.getNombre());
        product.setDescripcion(request.getDescripcion());
        product.setImagenUrl(request.getImagenUrl());
        product.setUpdatedBy(userId);
        
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findByIdAndTenantId(request.getCategoryId(), tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Categoría", request.getCategoryId()));
            product.setCategory(category);
        }
        
        if (request.getUnitId() != null) {
            Unit unit = unitRepository.findById(request.getUnitId())
                .orElseThrow(() -> new ResourceNotFoundException("Unidad", request.getUnitId()));
            product.setUnit(unit);
        }
        
        product = productRepository.save(product);
        return toDto(product);
    }
    
    /**
     * Desactiva un producto (soft delete)
     */
    @Transactional
    public void delete(UUID tenantId, UUID id, UUID userId) {
        Product product = productRepository.findByIdAndTenantIdWithDetails(id, tenantId)
            .orElseThrow(() -> new ResourceNotFoundException("Producto", id));
        
        product.setActivo(false);
        product.setDeletedAt(java.time.Instant.now());
        product.setUpdatedBy(userId);
        productRepository.save(product);
        
        log.info("Producto {} desactivado por usuario {}", id, userId);
    }
    
    /**
     * Lista todos los productos activos con variantes (para sincronización POS)
     */
    @Transactional(readOnly = true)
    public List<ProductDto> findAllForSync(UUID tenantId) {
        return productRepository.findActiveWithVariantsByTenantId(tenantId)
            .stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    // === Helpers ===
    
    private void validateVariantSku(UUID tenantId, String sku) {
        if (variantRepository.existsByTenantIdAndSku(tenantId, sku)) {
            throw new BusinessConflictException("VARIANT_SKU_EXISTS", 
                "Ya existe una variante con el SKU " + sku);
        }
    }
    
    private ProductVariant createVariant(UUID tenantId, ProductRequest.VariantRequest vr) {
        Tax tax = null;
        if (vr.getTaxId() != null) {
            tax = taxRepository.findByIdAndTenantId(vr.getTaxId(), tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Impuesto", vr.getTaxId()));
        }
        
        return ProductVariant.builder()
            .sku(vr.getSku())
            .nombre(vr.getNombre())
            .barcode(vr.getBarcode())
            .costo(vr.getCosto() != null ? vr.getCosto() : 0)
            .precioNeto(vr.getPrecioNeto())
            .precioBruto(vr.getPrecioBruto())
            .tax(tax)
            .stockMinimo(vr.getStockMinimo() != null ? vr.getStockMinimo() : 0)
            .esDefault(vr.getEsDefault() != null ? vr.getEsDefault() : false)
            .activo(true)
            .build();
    }
    
    private ProductDto toDto(Product product) {
        List<ProductDto.VariantDto> variantDtos = new ArrayList<>();
        if (product.getVariants() != null) {
            variantDtos = product.getVariants().stream()
                .filter(ProductVariant::getActivo)
                .map(this::toVariantDto)
                .collect(Collectors.toList());
        }
        
        return ProductDto.builder()
            .id(product.getId())
            .sku(product.getSku())
            .nombre(product.getNombre())
            .descripcion(product.getDescripcion())
            .categoryId(product.getCategoryId())
            .categoryName(product.getCategoryName())
            .unitId(product.getUnit() != null ? product.getUnit().getId() : null)
            .unitCode(product.getUnitCode())
            .activo(product.getActivo())
            .requiereVariantes(product.getRequiereVariantes())
            .permiteVentaFraccionada(product.getPermiteVentaFraccionada())
            .imagenUrl(product.getImagenUrl())
            .variants(variantDtos)
            .build();
    }
    
    private ProductDto.VariantDto toVariantDto(ProductVariant v) {
        return ProductDto.VariantDto.builder()
            .id(v.getId())
            .sku(v.getSku())
            .nombre(v.getNombre())
            .barcode(v.getBarcode())
            .costo(v.getCosto())
            .precioNeto(v.getPrecioNeto())
            .precioBruto(v.getPrecioBruto())
            .taxId(v.getTax() != null ? v.getTax().getId() : null)
            .taxPercentage(v.getTaxPercentage())
            .stockMinimo(v.getStockMinimo())
            .activo(v.getActivo())
            .esDefault(v.getEsDefault())
            .marginPercentage(v.getMarginPercentage())
            .marginAbsolute(v.getMarginAbsolute())
            .build();
    }
}
