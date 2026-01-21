package com.poscl.operations.domain.repository;

import com.poscl.operations.domain.entity.PriceListItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PriceListItemRepository extends JpaRepository<PriceListItem, UUID> {

    List<PriceListItem> findByPriceListId(UUID priceListId);

    Optional<PriceListItem> findByPriceListIdAndProductoId(UUID priceListId, UUID productoId);

    @Query("SELECT pli FROM PriceListItem pli WHERE pli.priceList.id IN :priceListIds AND pli.productoId = :productoId")
    List<PriceListItem> findByPriceListIdsAndProductoId(
            @Param("priceListIds") List<UUID> priceListIds,
            @Param("productoId") UUID productoId);

    void deleteByPriceListId(UUID priceListId);

    long countByPriceListId(UUID priceListId);
}
