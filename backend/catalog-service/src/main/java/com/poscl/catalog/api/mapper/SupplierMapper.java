package com.poscl.catalog.api.mapper;

import com.poscl.catalog.api.dto.SupplierDto;
import com.poscl.catalog.domain.entity.Supplier;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface SupplierMapper {

    @Mapping(target = "businessName", source = "nombre")
    @Mapping(target = "address", source = "direccion")
    @Mapping(target = "contactName", source = "contacto")
    @Mapping(target = "phone", source = "telefono")
    @Mapping(target = "isActive", source = "activo")
    SupplierDto toDto(Supplier supplier);

    @Mapping(target = "nombre", source = "businessName")
    @Mapping(target = "direccion", source = "address")
    @Mapping(target = "contacto", source = "contactName")
    @Mapping(target = "telefono", source = "phone")
    @Mapping(target = "activo", source = "isActive", nullValueCheckStrategy = org.mapstruct.NullValueCheckStrategy.ALWAYS, nullValuePropertyMappingStrategy = org.mapstruct.NullValuePropertyMappingStrategy.IGNORE)
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
    @Mapping(target = "nombre", source = "businessName")
    @Mapping(target = "direccion", source = "address")
    @Mapping(target = "contacto", source = "contactName")
    @Mapping(target = "telefono", source = "phone")
    @Mapping(target = "activo", source = "isActive", nullValueCheckStrategy = org.mapstruct.NullValueCheckStrategy.ALWAYS, nullValuePropertyMappingStrategy = org.mapstruct.NullValuePropertyMappingStrategy.IGNORE)
    void updateEntityFromDto(SupplierDto dto, @MappingTarget Supplier supplier);
}
