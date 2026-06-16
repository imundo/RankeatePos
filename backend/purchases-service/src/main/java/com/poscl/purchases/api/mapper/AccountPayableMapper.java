package com.poscl.purchases.api.mapper;

import com.poscl.purchases.api.dto.AccountPayableDto;
import com.poscl.purchases.domain.entity.AccountPayable;
import org.springframework.stereotype.Component;

@Component
public class AccountPayableMapper {

    public AccountPayableDto toDto(AccountPayable entity) {
        if (entity == null) {
            return null;
        }

        AccountPayableDto dto = new AccountPayableDto();
        dto.setId(entity.getId());
        dto.setTenantId(entity.getTenantId());
        if (entity.getSupplier() != null) {
            dto.setSupplierId(entity.getSupplier().getId());
            dto.setSupplierName(entity.getSupplier().getBusinessName());
        }
        if (entity.getPurchaseOrder() != null) {
            dto.setPurchaseOrderId(entity.getPurchaseOrder().getId());
            dto.setOrderNumber(entity.getPurchaseOrder().getOrderNumber());
        }
        dto.setDocumentNumber(entity.getDocumentNumber());
        dto.setDocumentType(entity.getDocumentType());
        dto.setIssueDate(entity.getIssueDate());
        dto.setDueDate(entity.getDueDate());
        dto.setAmount(entity.getAmount());
        dto.setBalance(entity.getBalance());
        if (entity.getStatus() != null) {
            dto.setStatus(entity.getStatus().name());
        }
        dto.setNotes(entity.getNotes());
        dto.setCreatedAt(entity.getCreatedAt());

        return dto;
    }

    public AccountPayable toEntity(AccountPayableDto dto) {
        if (dto == null) {
            return null;
        }

        AccountPayable entity = new AccountPayable();
        entity.setId(dto.getId());
        entity.setTenantId(dto.getTenantId());
        entity.setDocumentNumber(dto.getDocumentNumber());
        entity.setDocumentType(dto.getDocumentType());
        entity.setIssueDate(dto.getIssueDate());
        entity.setDueDate(dto.getDueDate());
        entity.setAmount(dto.getAmount());
        entity.setBalance(dto.getBalance());
        if (dto.getStatus() != null) {
            try {
                entity.setStatus(AccountPayable.AccountPayableStatus.valueOf(dto.getStatus()));
            } catch (IllegalArgumentException e) {
                entity.setStatus(AccountPayable.AccountPayableStatus.PENDING);
            }
        }
        entity.setNotes(dto.getNotes());
        
        return entity;
    }
}
