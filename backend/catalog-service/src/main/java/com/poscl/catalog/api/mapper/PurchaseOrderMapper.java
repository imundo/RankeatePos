package com.poscl.catalog.api.mapper;

import com.poscl.catalog.api.dto.CreatePurchaseOrderRequest;
import com.poscl.catalog.api.dto.PurchaseOrderDto;
import com.poscl.catalog.api.dto.PurchaseOrderItemDto;
import com.poscl.catalog.domain.entity.PurchaseOrder;
import com.poscl.catalog.domain.entity.PurchaseOrderItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;

@Mapper(componentModel = "spring", uses = { SupplierMapper.class })
public interface PurchaseOrderMapper {

    @Mapping(target = "items", source = "items")
    PurchaseOrderDto toDto(PurchaseOrder purchaseOrder);

    @Mappings({
            @Mapping(source = "productVariant.id", target = "productVariantId"),
            @Mapping(source = "productVariant.fullName", target = "productVariantName"),
            @Mapping(source = "productVariant.sku", target = "sku")
    })
    PurchaseOrderItemDto toDto(PurchaseOrderItem purchaseOrderItem);

    // Initial creation mapping (simplified, logic usually in service for complex
    // object graphs)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "orderNumber", ignore = true)
    @Mapping(target = "supplier", ignore = true) // Set manually in service
    @Mapping(target = "status", constant = "DRAFT")
    @Mapping(target = "totalAmount", ignore = true) // Calculated
    @Mapping(target = "items", ignore = true) // Set manually
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    PurchaseOrder toEntity(CreatePurchaseOrderRequest request);
}
