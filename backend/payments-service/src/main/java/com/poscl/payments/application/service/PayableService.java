package com.poscl.payments.application.service;

import com.poscl.payments.domain.entity.Payable;
import com.poscl.payments.domain.entity.PaymentReceipt;
import com.poscl.payments.domain.entity.PaymentVoucher;
import com.poscl.payments.domain.repository.PayableRepository;
import com.poscl.payments.domain.repository.PaymentVoucherRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PayableService {

    private final PayableRepository payableRepository;
    private final PaymentVoucherRepository paymentVoucherRepository;

    @Transactional(readOnly = true)
    public Page<Payable> getPayables(UUID tenantId, Pageable pageable) {
        return payableRepository.findByTenantIdOrderByDueDateAsc(tenantId, pageable);
    }

    @Transactional(readOnly = true)
    public Page<Payable> getPayablesByStatus(UUID tenantId, Payable.PayableStatus status, Pageable pageable) {
        return payableRepository.findByTenantIdAndStatusOrderByDueDateAsc(tenantId, status, pageable);
    }

    @Transactional(readOnly = true)
    public Payable getPayableById(UUID tenantId, UUID id) {
        return payableRepository.findById(id)
            .filter(p -> p.getTenantId().equals(tenantId))
            .orElseThrow(() -> new IllegalArgumentException("Cuenta por pagar no encontrada"));
    }

    public Payable createPayable(UUID tenantId, Payable payable) {
        payable.setTenantId(tenantId);
        payable.setBalance(payable.getOriginalAmount());
        payable.setPaidAmount(BigDecimal.ZERO);
        payable.setStatus(Payable.PayableStatus.PENDING);
        return payableRepository.save(payable);
    }

    public PaymentVoucher makePayment(UUID tenantId, UUID payableId, BigDecimal amount,
            PaymentReceipt.PaymentMethod method, String referenceNumber, String notes, UUID userId) {
        
        Payable payable = getPayableById(tenantId, payableId);
        
        if (amount.compareTo(payable.getBalance()) > 0) {
            throw new IllegalArgumentException("El monto excede el saldo pendiente: " + payable.getBalance());
        }

        // Update payable
        payable.setPaidAmount(payable.getPaidAmount().add(amount));
        payable.recalculateBalance();
        payableRepository.save(payable);

        // Create voucher
        PaymentVoucher voucher = PaymentVoucher.builder()
            .tenantId(tenantId)
            .voucherNumber(paymentVoucherRepository.getNextVoucherNumber(tenantId))
            .paymentDate(LocalDate.now())
            .payable(payable)
            .supplierId(payable.getSupplierId())
            .supplierName(payable.getSupplierName())
            .amount(amount)
            .paymentMethod(method)
            .referenceNumber(referenceNumber)
            .notes(notes)
            .createdBy(userId)
            .build();

        voucher = paymentVoucherRepository.save(voucher);
        log.info("Created payment voucher #{} for payable {} - Amount: {}", 
            voucher.getVoucherNumber(), payableId, amount);
        return voucher;
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalPendingBalance(UUID tenantId) {
        BigDecimal total = payableRepository.getTotalPendingBalance(tenantId);
        return total != null ? total : BigDecimal.ZERO;
    }

    @Transactional(readOnly = true)
    public Long countOverdue(UUID tenantId) {
        return payableRepository.countOverdue(tenantId);
    }
}
