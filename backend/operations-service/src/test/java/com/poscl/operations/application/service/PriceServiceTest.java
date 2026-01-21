package com.poscl.operations.application.service;

import com.poscl.operations.domain.entity.PriceList;
import com.poscl.operations.domain.entity.PriceListItem;
import com.poscl.operations.domain.repository.PriceListItemRepository;
import com.poscl.operations.domain.repository.PriceListRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("PriceService Tests")
class PriceServiceTest {

        @Mock
        private PriceListRepository priceListRepository;

        @Mock
        private PriceListItemRepository priceListItemRepository;

        @InjectMocks
        private PriceService priceService;

        private UUID tenantId;
        private UUID productoId;
        private UUID sucursalId;
        private UUID clienteId;
        private BigDecimal precioBase;

        @BeforeEach
        void setUp() {
                tenantId = UUID.randomUUID();
                productoId = UUID.randomUUID();
                sucursalId = UUID.randomUUID();
                clienteId = UUID.randomUUID();
                precioBase = new BigDecimal("10000");
        }

        @Test
        @DisplayName("Should return base price when no price lists are applicable")
        void resolvePrice_NoPriceLists_ReturnsBasePrice() {
                // Given
                when(priceListRepository.findAplicables(eq(tenantId), any(), any(), any()))
                                .thenReturn(Collections.emptyList());

                // When
                BigDecimal result = priceService.resolvePrice(
                                tenantId, productoId, precioBase, sucursalId, clienteId);

                // Then
                assertThat(result).isEqualTo(precioBase);
        }

        @Test
        @DisplayName("Should return list price when product is in price list")
        void resolvePrice_ProductInList_ReturnsListPrice() {
                // Given
                UUID priceListId = UUID.randomUUID();
                PriceList priceList = createPriceList(priceListId, PriceList.TipoPrecio.SUCURSAL, 10);
                PriceListItem item = createPriceListItem(priceListId, productoId, new BigDecimal("8500"), null);
                item.setPriceList(priceList);

                when(priceListRepository.findAplicables(eq(tenantId), any(), any(), any()))
                                .thenReturn(List.of(priceList));
                when(priceListItemRepository.findByPriceListIdsAndProductoId(any(), eq(productoId)))
                                .thenReturn(List.of(item));

                // When
                BigDecimal result = priceService.resolvePrice(
                                tenantId, productoId, precioBase, sucursalId, clienteId);

                // Then
                assertThat(result).isEqualTo(new BigDecimal("8500"));
        }

        @Test
        @DisplayName("Should apply discount when price list item has discount")
        void resolvePrice_WithDiscount_AppliesDiscount() {
                // Given
                UUID priceListId = UUID.randomUUID();
                PriceList priceList = createPriceList(priceListId, PriceList.TipoPrecio.CLIENTE, 10);
                PriceListItem item = createPriceListItem(priceListId, productoId, null, new BigDecimal("15"));
                item.setPriceList(priceList);

                when(priceListRepository.findAplicables(eq(tenantId), any(), any(), any()))
                                .thenReturn(List.of(priceList));
                when(priceListItemRepository.findByPriceListIdsAndProductoId(any(), eq(productoId)))
                                .thenReturn(List.of(item));

                // When
                BigDecimal result = priceService.resolvePrice(
                                tenantId, productoId, precioBase, sucursalId, clienteId);

                // Then - 10000 * 0.85 = 8500
                assertThat(result).isEqualByComparingTo(new BigDecimal("8500.00"));
        }

        @Test
        @DisplayName("Should use higher priority list when multiple lists apply")
        void resolvePrice_MultipleLists_UsesHigherPriority() {
                // Given
                UUID listId1 = UUID.randomUUID();
                UUID listId2 = UUID.randomUUID();

                PriceList lowPriority = createPriceList(listId1, PriceList.TipoPrecio.GENERAL, 1);
                PriceList highPriority = createPriceList(listId2, PriceList.TipoPrecio.SUCURSAL, 10);

                PriceListItem itemLow = createPriceListItem(listId1, productoId, new BigDecimal("9000"), null);
                PriceListItem itemHigh = createPriceListItem(listId2, productoId, new BigDecimal("7500"), null);
                itemLow.setPriceList(lowPriority);
                itemHigh.setPriceList(highPriority);

                // Lists returned in priority order (highest first)
                when(priceListRepository.findAplicables(eq(tenantId), any(), any(), any()))
                                .thenReturn(List.of(highPriority, lowPriority));
                when(priceListItemRepository.findByPriceListIdsAndProductoId(any(), eq(productoId)))
                                .thenReturn(List.of(itemLow, itemHigh));

                // When
                BigDecimal result = priceService.resolvePrice(
                                tenantId, productoId, precioBase, sucursalId, clienteId);

                // Then - Should use high priority price
                assertThat(result).isEqualTo(new BigDecimal("7500"));
        }

        @Test
        @DisplayName("Should create price list successfully")
        void create_ValidPriceList_ReturnsCreated() {
                // Given
                PriceList priceList = PriceList.builder()
                                .nombre("Test List")
                                .tipo(PriceList.TipoPrecio.GENERAL)
                                .build();

                when(priceListRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

                // When
                PriceList result = priceService.create(tenantId, priceList);

                // Then
                assertThat(result.getTenantId()).isEqualTo(tenantId);
                assertThat(result.getNombre()).isEqualTo("Test List");
        }

        // Helper methods
        private PriceList createPriceList(UUID id, PriceList.TipoPrecio tipo, int prioridad) {
                PriceList pl = new PriceList();
                pl.setId(id);
                pl.setTenantId(tenantId);
                pl.setNombre("Test List");
                pl.setTipo(tipo);
                pl.setPrioridad(prioridad);
                pl.setActiva(true);
                return pl;
        }

        private PriceListItem createPriceListItem(UUID listId, UUID prodId, BigDecimal precio, BigDecimal descuento) {
                PriceListItem item = new PriceListItem();
                item.setId(UUID.randomUUID());
                item.setProductoId(prodId);
                item.setPrecio(precio != null ? precio : BigDecimal.ZERO);
                item.setDescuento(descuento);
                return item;
        }
}
