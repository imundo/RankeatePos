package com.poscl.catalog.api.mapper;

import com.poscl.catalog.api.dto.SupplierDto;
import com.poscl.catalog.domain.entity.Supplier;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface SupplierMapper {

    SupplierDto toDto(Supplier supplier);

    Supplier toEntity(SupplierDto dto);

    @Mapping(source = "productVariant.fullName", target = "productVariantName")
    @Mapping(source = "productVariant.id", target = "productVariantId")
    @Mapping(source = "supplier.id", target = "supplierId")
    com.poscl.catalog.api.dto.SupplierProductDto toDto(com.poscl.catalog.domain.entity.SupplierProduct entity);

    @Mapping(target = "supplier", ignore = true)
    @Mapping(target = "productVariant", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    com.poscl.catalog.domain.entity.SupplierProduct toEntity(com.poscl.catalog.api.dto.SupplierProductDto dto);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    void updateEntityFromDto(SupplierDto dto, @MappingTarget Supplier supplier);
}
