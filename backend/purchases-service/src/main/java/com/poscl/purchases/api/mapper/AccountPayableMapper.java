package com.poscl.purchases.api.mapper;

import com.poscl.purchases.api.dto.AccountPayableDto;
import com.poscl.purchases.domain.entity.AccountPayable;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface AccountPayableMapper {

    @Mapping(source = "supplier.id", target = "supplierId")
    @Mapping(source = "supplier.businessName", target = "supplierName")
    @Mapping(source = "purchaseOrder.id", target = "purchaseOrderId")
    @Mapping(source = "purchaseOrder.orderNumber", target = "orderNumber")
    AccountPayableDto toDto(AccountPayable entity);

    @Mapping(target = "supplier", ignore = true)
    @Mapping(target = "purchaseOrder", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    AccountPayable toEntity(AccountPayableDto dto);
}
