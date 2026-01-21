package com.poscl.operations.application.service;

import com.poscl.operations.domain.entity.PriceList;
import com.poscl.operations.domain.entity.PriceListItem;
import com.poscl.operations.domain.repository.PriceListItemRepository;
import com.poscl.operations.domain.repository.PriceListRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Servicio para resolver precios según contexto (sucursal, cliente, fecha)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PriceService {

    private final PriceListRepository priceListRepository;
    private final PriceListItemRepository priceListItemRepository;

    /**
     * Resuelve el precio de un producto según el contexto
     * 
     * @param tenantId   ID del tenant
     * @param productoId ID del producto
     * @param precioBase Precio base del producto
     * @param sucursalId ID de la sucursal (opcional)
     * @param clienteId  ID del cliente (opcional)
     * @return Precio resuelto (puede ser el base si no hay listas aplicables)
     */
    @Transactional(readOnly = true)
    public BigDecimal resolvePrice(
            UUID tenantId,
            UUID productoId,
            BigDecimal precioBase,
            UUID sucursalId,
            UUID clienteId) {
        LocalDate hoy = LocalDate.now();

        // Buscar listas aplicables ordenadas por prioridad
        List<PriceList> listasAplicables = priceListRepository.findAplicables(
                tenantId, sucursalId, clienteId, hoy);

        if (listasAplicables.isEmpty()) {
            return precioBase;
        }

        // Buscar precio en las listas, respetando prioridad
        List<UUID> priceListIds = listasAplicables.stream().map(PriceList::getId).toList();
        List<PriceListItem> items = priceListItemRepository.findByPriceListIdsAndProductoId(
                priceListIds, productoId);

        for (PriceList lista : listasAplicables) {
            Optional<PriceListItem> item = items.stream()
                    .filter(i -> i.getPriceList().getId().equals(lista.getId()))
                    .findFirst();

            if (item.isPresent()) {
                BigDecimal precioFinal = item.get().getPrecioFinal(precioBase);
                log.debug("Precio resuelto para producto {} en lista {}: {}",
                        productoId, lista.getNombre(), precioFinal);
                return precioFinal;
            }
        }

        return precioBase;
    }

    /**
     * Obtiene todas las listas de un tenant
     */
    @Transactional(readOnly = true)
    public List<PriceList> findAll(UUID tenantId) {
        return priceListRepository.findByTenantId(tenantId);
    }

    /**
     * Obtiene listas activas de un tenant
     */
    @Transactional(readOnly = true)
    public List<PriceList> findActive(UUID tenantId) {
        return priceListRepository.findByTenantIdAndActivaTrue(tenantId);
    }

    /**
     * Crea una nueva lista de precios
     */
    @Transactional
    public PriceList create(UUID tenantId, PriceList priceList) {
        priceList.setTenantId(tenantId);
        return priceListRepository.save(priceList);
    }

    /**
     * Agrega o actualiza un item en una lista
     */
    @Transactional
    public PriceListItem setPrice(UUID priceListId, UUID productoId, BigDecimal precio, BigDecimal descuento) {
        PriceListItem item = priceListItemRepository
                .findByPriceListIdAndProductoId(priceListId, productoId)
                .orElse(PriceListItem.builder()
                        .priceList(priceListRepository.getReferenceById(priceListId))
                        .productoId(productoId)
                        .build());

        item.setPrecio(precio);
        item.setDescuento(descuento);
        return priceListItemRepository.save(item);
    }

    /**
     * Obtiene items de una lista
     */
    @Transactional(readOnly = true)
    public List<PriceListItem> getItems(UUID priceListId) {
        return priceListItemRepository.findByPriceListId(priceListId);
    }

    /**
     * Cuenta productos en una lista
     */
    @Transactional(readOnly = true)
    public long countItems(UUID priceListId) {
        return priceListItemRepository.countByPriceListId(priceListId);
    }
}
