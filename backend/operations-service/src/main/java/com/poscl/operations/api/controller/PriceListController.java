package com.poscl.operations.api.controller;

import com.poscl.operations.application.service.PriceService;
import com.poscl.operations.domain.entity.PriceList;
import com.poscl.operations.domain.entity.PriceListItem;
import com.poscl.operations.domain.repository.PriceListRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Controller for Price Lists CRUD and price resolution
 */
@Slf4j
@RestController
@RequestMapping("/api/price-lists")
@RequiredArgsConstructor
@Tag(name = "Listas de Precios", description = "Gestión de precios diferenciados")
public class PriceListController {

    private final PriceService priceService;
    private final PriceListRepository priceListRepository;

    @GetMapping
    @Operation(summary = "Listar listas de precios", description = "Obtiene todas las listas del tenant")
    public ResponseEntity<List<PriceListDto>> findAll(
            @RequestHeader("X-Tenant-Id") UUID tenantId) {

        List<PriceList> lists = priceService.findAll(tenantId);
        List<PriceListDto> dtos = lists.stream()
                .map(this::toDto)
                .toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/active")
    @Operation(summary = "Listar listas activas", description = "Obtiene solo las listas activas")
    public ResponseEntity<List<PriceListDto>> findActive(
            @RequestHeader("X-Tenant-Id") UUID tenantId) {

        List<PriceList> lists = priceService.findActive(tenantId);
        List<PriceListDto> dtos = lists.stream()
                .map(this::toDto)
                .toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener lista", description = "Obtiene una lista por ID")
    public ResponseEntity<PriceListDto> findById(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id) {

        return priceListRepository.findByIdAndTenantId(id, tenantId)
                .map(this::toDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Operation(summary = "Crear lista", description = "Crea una nueva lista de precios")
    public ResponseEntity<PriceListDto> create(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @Valid @RequestBody CreatePriceListRequest request) {

        log.info("POST /api/price-lists - Tipo: {}", request.tipo());

        PriceList priceList = PriceList.builder()
                .nombre(request.nombre())
                .descripcion(request.descripcion())
                .tipo(request.tipo())
                .sucursalId(request.sucursalId())
                .clienteId(request.clienteId())
                .fechaInicio(request.fechaInicio())
                .fechaFin(request.fechaFin())
                .prioridad(request.prioridad() != null ? request.prioridad() : 0)
                .activa(true)
                .build();

        PriceList created = priceService.create(tenantId, priceList);
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar lista", description = "Actualiza una lista existente")
    public ResponseEntity<PriceListDto> update(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePriceListRequest request) {

        return priceListRepository.findByIdAndTenantId(id, tenantId)
                .map(priceList -> {
                    if (request.nombre() != null)
                        priceList.setNombre(request.nombre());
                    if (request.descripcion() != null)
                        priceList.setDescripcion(request.descripcion());
                    if (request.fechaInicio() != null)
                        priceList.setFechaInicio(request.fechaInicio());
                    if (request.fechaFin() != null)
                        priceList.setFechaFin(request.fechaFin());
                    if (request.prioridad() != null)
                        priceList.setPrioridad(request.prioridad());
                    if (request.activa() != null)
                        priceList.setActiva(request.activa());
                    return priceListRepository.save(priceList);
                })
                .map(this::toDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar lista", description = "Desactiva una lista de precios")
    public ResponseEntity<Void> delete(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id) {

        return priceListRepository.findByIdAndTenantId(id, tenantId)
                .map(priceList -> {
                    priceList.setActiva(false);
                    priceListRepository.save(priceList);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ============ ITEMS ============

    @GetMapping("/{id}/items")
    @Operation(summary = "Listar items", description = "Obtiene los productos/precios de una lista")
    public ResponseEntity<List<PriceListItemDto>> getItems(@PathVariable UUID id) {
        List<PriceListItem> items = priceService.getItems(id);
        List<PriceListItemDto> dtos = items.stream()
                .map(this::toItemDto)
                .toList();
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/{id}/items")
    @Operation(summary = "Agregar precio", description = "Agrega o actualiza precio de un producto")
    public ResponseEntity<PriceListItemDto> setPrice(
            @PathVariable UUID id,
            @Valid @RequestBody SetPriceRequest request) {

        PriceListItem item = priceService.setPrice(
                id, request.productoId(), request.precio(), request.descuento());
        return ResponseEntity.ok(toItemDto(item));
    }

    // ============ PRICE RESOLUTION ============

    @GetMapping("/resolve")
    @Operation(summary = "Resolver precio", description = "Obtiene el precio resuelto según contexto")
    public ResponseEntity<BigDecimal> resolvePrice(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestParam UUID productoId,
            @RequestParam BigDecimal precioBase,
            @RequestParam(required = false) UUID sucursalId,
            @RequestParam(required = false) UUID clienteId) {

        BigDecimal precio = priceService.resolvePrice(
                tenantId, productoId, precioBase, sucursalId, clienteId);
        return ResponseEntity.ok(precio);
    }

    // ============ DTOs ============

    private PriceListDto toDto(PriceList pl) {
        return new PriceListDto(
                pl.getId(),
                pl.getNombre(),
                pl.getDescripcion(),
                pl.getTipo().name(),
                pl.getSucursalId(),
                pl.getClienteId(),
                pl.getFechaInicio(),
                pl.getFechaFin(),
                pl.getPrioridad(),
                pl.getActiva(),
                priceService.countItems(pl.getId()),
                pl.getCreatedAt() != null ? pl.getCreatedAt().toString() : null);
    }

    private PriceListItemDto toItemDto(PriceListItem item) {
        return new PriceListItemDto(
                item.getId(),
                item.getProductoId(),
                item.getPrecio(),
                item.getDescuento(),
                item.getPrecioMinimo());
    }

    // Records
    public record PriceListDto(
            UUID id, String nombre, String descripcion, String tipo,
            UUID sucursalId, UUID clienteId, LocalDate fechaInicio, LocalDate fechaFin,
            Integer prioridad, Boolean activa, Long productCount, String createdAt) {
    }

    public record PriceListItemDto(
            UUID id, UUID productoId, BigDecimal precio, BigDecimal descuento, BigDecimal precioMinimo) {
    }

    public record CreatePriceListRequest(
            String nombre, String descripcion, PriceList.TipoPrecio tipo,
            UUID sucursalId, UUID clienteId, LocalDate fechaInicio, LocalDate fechaFin, Integer prioridad) {
    }

    public record UpdatePriceListRequest(
            String nombre, String descripcion, LocalDate fechaInicio, LocalDate fechaFin,
            Integer prioridad, Boolean activa) {
    }

    public record SetPriceRequest(UUID productoId, BigDecimal precio, BigDecimal descuento) {
    }
}
