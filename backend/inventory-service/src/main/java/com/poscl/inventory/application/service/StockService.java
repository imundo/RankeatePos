package com.poscl.inventory.application.service;

import com.poscl.inventory.api.dto.StockAdjustmentRequest;
import com.poscl.inventory.api.dto.StockDto;
import com.poscl.inventory.api.dto.StockMovementDto;
import com.poscl.inventory.domain.model.ProductVariant;
import com.poscl.inventory.domain.model.Stock;
import com.poscl.inventory.domain.model.StockMovement;
import com.poscl.inventory.domain.model.StockMovement.TipoMovimiento;
import com.poscl.inventory.domain.repository.StockMovementRepository;
import com.poscl.inventory.domain.repository.StockRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StockService {

    private final StockRepository stockRepository;
    private final StockMovementRepository movementRepository;
    private final EntityManager entityManager;

    public List<StockDto> getStockByBranch(UUID tenantId, UUID branchId) {
        return stockRepository.findByTenantIdAndBranchId(tenantId, branchId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<StockDto> getLowStock(UUID tenantId, UUID branchId) {
        return stockRepository.findLowStock(tenantId, branchId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public long countLowStock(UUID tenantId) {
        return stockRepository.countLowStock(tenantId);
    }

    public StockDto getStock(UUID tenantId, UUID variantId, UUID branchId) {
        return stockRepository.findByTenantIdAndVariantIdAndBranchId(tenantId, variantId, branchId)
                .map(this::toDto)
                .orElse(StockDto.builder()
                        .variantId(variantId)
                        .branchId(branchId)
                        .cantidadActual(0)
                        .cantidadDisponible(0)
                        .cantidadReservada(0)
                        .stockMinimo(0)
                        .build());
    }

    @Transactional
    public StockDto adjustStock(UUID tenantId, UUID userId, StockAdjustmentRequest request) {
        Stock stock = stockRepository
                .findByTenantIdAndVariantIdAndBranchId(tenantId, request.getVariantId(), request.getBranchId())
                .orElseGet(() -> {
                    // Create new stock record if not exists
                    ProductVariant variantRef = entityManager.getReference(ProductVariant.class,
                            request.getVariantId());
                    return Stock.builder()
                            .tenantId(tenantId)
                            .variant(variantRef)
                            .branchId(request.getBranchId())
                            .build();
                });

        // Update logic
        int cantidad = request.getCantidad();
        int stockAnterior = stock.getCantidadActual();
        int nuevaCantidad = stockAnterior;

        switch (request.getTipo()) {
            case ENTRADA:
            case AJUSTE_POSITIVO:
            case TRANSFERENCIA_ENTRADA:
            case DEVOLUCION:
                nuevaCantidad += cantidad;
                break;
            case SALIDA:
            case AJUSTE_NEGATIVO:
            case TRANSFERENCIA_SALIDA:
            case MERMA:
                nuevaCantidad -= cantidad;
                break;
        }

        if (nuevaCantidad < 0) {
            log.warn("Stock resultante negativo para variantId={}: {}", request.getVariantId(), nuevaCantidad);
        }

        stock.setCantidadActual(nuevaCantidad);
        stock = stockRepository.save(stock);

        // Record Movement
        StockMovement movement = StockMovement.builder()
                .tenantId(tenantId)
                .variant(stock.getVariant())
                .branchId(request.getBranchId())
                .tipo(request.getTipo())
                .cantidad(request.getCantidad())
                .stockAnterior(stockAnterior)
                .stockNuevo(nuevaCantidad)
                .costoUnitario(request.getCostoUnitario())
                .motivo(request.getMotivo())
                .documentoReferencia(request.getDocumentoReferencia())
                .createdBy(userId)
                .build();

        movementRepository.save(movement);

        log.info("Stock ajustado: variantId={}, tipo={}, cantidad={}, nuevo_stock={}",
                request.getVariantId(), request.getTipo(), request.getCantidad(), nuevaCantidad);

        return toDto(stock);
    }

    @Transactional
    public List<StockDto> adjustStockBatch(UUID tenantId, UUID userId, List<StockAdjustmentRequest> requests) {
        return requests.stream()
                .map(req -> adjustStock(tenantId, userId, req))
                .collect(Collectors.toList());
    }

    public Page<StockMovementDto> getMovements(UUID tenantId, UUID branchId, Pageable pageable) {
        return movementRepository.findByTenantIdAndBranchIdOrderByCreatedAtDesc(tenantId, branchId, pageable)
                .map(this::toMovementDto);
    }

    public List<StockMovementDto> getKardex(UUID variantId) {
        return movementRepository.findByVariantIdOrderByCreatedAtDesc(variantId).stream()
                .map(this::toMovementDto)
                .collect(Collectors.toList());
    }

    // Mappers

    private StockDto toDto(Stock stock) {
        return StockDto.builder()
                .id(stock.getId())
                .variantId(stock.getVariantId())
                .variantSku(stock.getVariantSku())
                .productName(stock.getProductName())
                .branchId(stock.getBranchId())
                .cantidadActual(stock.getCantidadActual())
                .cantidadReservada(stock.getCantidadReservada())
                .cantidadDisponible(stock.getCantidadDisponible())
                .stockMinimo(stock.getStockMinimo())
                .stockBajo(stock.isStockBajo())
                .updatedAt(stock.getUpdatedAt())
                .build();
    }

    private StockMovementDto toMovementDto(StockMovement movement) {
        return StockMovementDto.builder()
                .id(movement.getId())
                .variantId(movement.getVariantId())
                .variantSku(movement.getVariantSku())
                .productName(movement.getProductName())
                .branchId(movement.getBranchId())
                .tipo(movement.getTipo())
                .cantidad(movement.getCantidad())
                .stockAnterior(movement.getStockAnterior())
                .stockNuevo(movement.getStockNuevo())
                .costoUnitario(movement.getCostoUnitario())
                .motivo(movement.getMotivo())
                .documentoReferencia(movement.getDocumentoReferencia())
                .createdBy(movement.getCreatedBy())
                .createdAt(movement.getCreatedAt())
                .build();
    }
}
