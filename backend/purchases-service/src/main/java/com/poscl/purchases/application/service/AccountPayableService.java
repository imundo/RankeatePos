package com.poscl.purchases.application.service;

import com.poscl.purchases.api.dto.AccountPayableDto;
import com.poscl.purchases.api.mapper.AccountPayableMapper;
import com.poscl.purchases.domain.entity.AccountPayable;
import com.poscl.purchases.domain.entity.Supplier;
import com.poscl.purchases.domain.repository.AccountPayableRepository;
import com.poscl.purchases.domain.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AccountPayableService {

    private final AccountPayableRepository accountPayableRepository;
    private final SupplierRepository supplierRepository;
    private final AccountPayableMapper mapper;

    @Transactional(readOnly = true)
    public List<AccountPayableDto> getBySupplierId(UUID tenantId, UUID supplierId) {
        return accountPayableRepository.findByTenantIdAndSupplierIdOrderByDueDateAsc(tenantId, supplierId)
                .stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public AccountPayableDto create(UUID tenantId, AccountPayableDto dto) {
        Supplier supplier = supplierRepository.findById(dto.getSupplierId())
                .filter(s -> s.getTenantId().equals(tenantId))
                .orElseGet(() -> {
                     Supplier newSupplier = Supplier.builder()
                             .id(dto.getSupplierId())
                             .tenantId(tenantId)
                             .businessName(dto.getSupplierName() != null ? dto.getSupplierName() : "Proveedor " + dto.getSupplierId())
                             .rut("0-0")
                             .build();
                     return supplierRepository.save(newSupplier);
                });

        AccountPayable entity = mapper.toEntity(dto);
        entity.setTenantId(tenantId);
        entity.setSupplier(supplier);
        
        if (entity.getStatus() == null) {
            entity.setStatus(AccountPayable.AccountPayableStatus.PENDING);
        }
        if (entity.getBalance() == null || entity.getBalance().compareTo(java.math.BigDecimal.ZERO) == 0) {
            entity.setBalance(entity.getAmount());
        }

        return mapper.toDto(accountPayableRepository.save(entity));
    }

    @Transactional
    public AccountPayableDto pay(UUID tenantId, UUID payableId) {
        AccountPayable entity = accountPayableRepository.findById(payableId)
                .filter(ap -> ap.getTenantId().equals(tenantId))
                .orElseThrow(() -> new RuntimeException("Account payable not found"));

        entity.setStatus(AccountPayable.AccountPayableStatus.PAID);
        entity.setBalance(java.math.BigDecimal.ZERO);
        
        return mapper.toDto(accountPayableRepository.save(entity));
    }
}
