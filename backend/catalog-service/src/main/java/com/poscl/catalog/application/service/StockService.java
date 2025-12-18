package com.poscl.catalog.application.service;

import com.poscl.catalog.api.dto.*;
import com.poscl.catalog.domain.entity.*;
import com.poscl.catalog.domain.entity.StockMovement.TipoMovimiento;
import com.poscl.catalog.domain.repository.*;
import com.poscl.shared.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StockService {

    private final StockRepository stockRepository;
    private final StockMovementRepository movementRepository;
    private final ProductVariantRepository variantRepository;

    /**
     * Obtiene el stock de una variante en una sucursal
     */
    public StockDto getStock(UUID tenantId, UUID variantId, UUID branchId) {
        Stock stock = stockRepository.findByVariant_IdAndBranchId(variantId, branchId)
                .orElseGet(() -> createEmptyStock(tenantId, variantId, branchId));
        return toDto(stock);
    }

    /**
     * Lista todo el stock de una sucursal
     */
    public List<StockDto> getStockByBranch(UUID tenantId, UUID branchId) {
        return stockRepository.findAllWithProductByTenantAndBranch(tenantId, branchId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Lista productos con stock bajo
     */
    public List<StockDto> getLowStock(UUID tenantId, UUID branchId) {
        return stockRepository.findLowStockByTenantAndBranch(tenantId, branchId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Cuenta productos con stock bajo
     */
    public long countLowStock(UUID tenantId) {
        return stockRepository.countLowStock(tenantId);
    }

    /**
     * Ajusta stock (entrada, salida, ajuste)
     */
    @Transactional
    public StockDto adjustStock(UUID tenantId, UUID userId, StockAdjustmentRequest request) {
        ProductVariant variant = variantRepository.findById(request.getVariantId())
                .orElseThrow(() -> new BusinessException("VARIANT_NOT_FOUND", "Variante no encontrada"));

        // Verificar que pertenece al tenant
        if (!variant.getTenantId().equals(tenantId)) {
            throw new BusinessException("UNAUTHORIZED", "No autorizado");
        }

        // Obtener o crear registro de stock
        Stock stock = stockRepository.findByVariant_IdAndBranchId(
                request.getVariantId(), request.getBranchId())
                .orElseGet(() -> Stock.builder()
                        .tenantId(tenantId)
                        .variant(variant)
                        .branchId(request.getBranchId())
                        .cantidadActual(0)
                        .cantidadReservada(0)
                        .createdAt(Instant.now())
                        .build());

        int stockAnterior = stock.getCantidadActual();
        int nuevaCantidad = calcularNuevaCantidad(stockAnterior, request.getTipo(), request.getCantidad());

        // Validar que no quede negativo
        if (nuevaCantidad < 0) {
            throw new BusinessException("INSUFFICIENT_STOCK",
                    "Stock insuficiente. Disponible: " + stockAnterior);
        }

        // Actualizar stock
        stock.setCantidadActual(nuevaCantidad);
        stock.setUpdatedAt(Instant.now());
        stock = stockRepository.save(stock);

        // Registrar movimiento
        StockMovement movement = StockMovement.builder()
                .tenantId(tenantId)
                .variant(variant)
                .branchId(request.getBranchId())
                .tipo(request.getTipo())
                .cantidad(request.getCantidad())
                .stockAnterior(stockAnterior)
                .stockNuevo(nuevaCantidad)
                .costoUnitario(request.getCostoUnitario())
                .motivo(request.getMotivo())
                .documentoReferencia(request.getDocumentoReferencia())
                .createdBy(userId)
                .createdAt(Instant.now())
                .build();

        movementRepository.save(movement);

        log.info("Stock ajustado: variante={}, tipo={}, cantidad={}, nuevo_stock={}",
                variant.getSku(), request.getTipo(), request.getCantidad(), nuevaCantidad);

        return toDto(stock);
    }

    /**
     * Obtiene historial de movimientos (Kardex)
     */
    public Page<StockMovementDto> getMovements(UUID tenantId, UUID branchId, Pageable pageable) {
        Page<StockMovement> page = movementRepository
                .findByTenantIdAndBranchIdOrderByCreatedAtDesc(tenantId, branchId, pageable);

        List<StockMovementDto> dtos = page.getContent().stream()
                .map(this::toMovementDto)
                .collect(Collectors.toList());

        return new PageImpl<>(dtos, pageable, page.getTotalElements());
    }

    /**
     * Obtiene Kardex de una variante específica
     */
    public List<StockMovementDto> getKardex(UUID variantId) {
        return movementRepository.findKardexByVariant(variantId)
                .stream()
                .map(this::toMovementDto)
                .collect(Collectors.toList());
    }

    // ========== Helpers ==========

    private int calcularNuevaCantidad(int actual, TipoMovimiento tipo, int cantidad) {
        return switch (tipo) {
            case ENTRADA, AJUSTE_POSITIVO, TRANSFERENCIA_ENTRADA, DEVOLUCION -> actual + cantidad;
            case SALIDA, AJUSTE_NEGATIVO, TRANSFERENCIA_SALIDA, MERMA -> actual - cantidad;
        };
    }

    private Stock createEmptyStock(UUID tenantId, UUID variantId, UUID branchId) {
        ProductVariant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new BusinessException("VARIANT_NOT_FOUND", "Variante no encontrada"));

        return Stock.builder()
                .tenantId(tenantId)
                .variant(variant)
                .branchId(branchId)
                .cantidadActual(0)
                .cantidadReservada(0)
                .build();
    }

    private StockDto toDto(Stock stock) {
        ProductVariant v = stock.getVariant();
        return StockDto.builder()
                .id(stock.getId())
                .variantId(v.getId())
                .variantSku(v.getSku())
                .productName(v.getFullName())
                .branchId(stock.getBranchId())
                .cantidadActual(stock.getCantidadActual())
                .cantidadReservada(stock.getCantidadReservada())
                .cantidadDisponible(stock.getCantidadDisponible())
                .stockMinimo(v.getStockMinimo())
                .stockBajo(stock.isStockBajo())
                .updatedAt(stock.getUpdatedAt())
                .build();
    }

    private StockMovementDto toMovementDto(StockMovement m) {
        ProductVariant v = m.getVariant();
        return StockMovementDto.builder()
                .id(m.getId())
                .variantId(v.getId())
                .variantSku(v.getSku())
                .productName(v.getFullName())
                .branchId(m.getBranchId())
                .tipo(m.getTipo())
                .cantidad(m.getCantidad())
                .stockAnterior(m.getStockAnterior())
                .stockNuevo(m.getStockNuevo())
                .costoUnitario(m.getCostoUnitario())
                .motivo(m.getMotivo())
                .documentoReferencia(m.getDocumentoReferencia())
                .createdBy(m.getCreatedBy())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
