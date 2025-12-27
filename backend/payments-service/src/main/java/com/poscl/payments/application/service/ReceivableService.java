package com.poscl.payments.application.service;

import com.poscl.payments.domain.entity.PaymentReceipt;
import com.poscl.payments.domain.entity.Receivable;
import com.poscl.payments.domain.repository.PaymentReceiptRepository;
import com.poscl.payments.domain.repository.ReceivableRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ReceivableService {

    private final ReceivableRepository receivableRepository;
    private final PaymentReceiptRepository paymentReceiptRepository;

    @Transactional(readOnly = true)
    public Page<Receivable> getReceivables(UUID tenantId, Pageable pageable) {
        return receivableRepository.findByTenantIdOrderByDueDateAsc(tenantId, pageable);
    }

    @Transactional(readOnly = true)
    public Page<Receivable> getReceivablesByStatus(UUID tenantId, Receivable.ReceivableStatus status, Pageable pageable) {
        return receivableRepository.findByTenantIdAndStatusOrderByDueDateAsc(tenantId, status, pageable);
    }

    @Transactional(readOnly = true)
    public Receivable getReceivableById(UUID tenantId, UUID id) {
        return receivableRepository.findById(id)
            .filter(r -> r.getTenantId().equals(tenantId))
            .orElseThrow(() -> new IllegalArgumentException("Cuenta por cobrar no encontrada"));
    }

    public Receivable createReceivable(UUID tenantId, Receivable receivable) {
        receivable.setTenantId(tenantId);
        receivable.setBalance(receivable.getOriginalAmount());
        receivable.setPaidAmount(BigDecimal.ZERO);
        receivable.setStatus(Receivable.ReceivableStatus.PENDING);
        return receivableRepository.save(receivable);
    }

    public PaymentReceipt collectPayment(UUID tenantId, UUID receivableId, BigDecimal amount, 
            PaymentReceipt.PaymentMethod method, String referenceNumber, String notes, UUID userId) {
        
        Receivable receivable = getReceivableById(tenantId, receivableId);
        
        if (amount.compareTo(receivable.getBalance()) > 0) {
            throw new IllegalArgumentException("El monto excede el saldo pendiente: " + receivable.getBalance());
        }

        // Update receivable
        receivable.setPaidAmount(receivable.getPaidAmount().add(amount));
        receivable.recalculateBalance();
        receivableRepository.save(receivable);

        // Create receipt
        PaymentReceipt receipt = PaymentReceipt.builder()
            .tenantId(tenantId)
            .receiptNumber(paymentReceiptRepository.getNextReceiptNumber(tenantId))
            .paymentDate(LocalDate.now())
            .receivable(receivable)
            .customerId(receivable.getCustomerId())
            .customerName(receivable.getCustomerName())
            .amount(amount)
            .paymentMethod(method)
            .referenceNumber(referenceNumber)
            .notes(notes)
            .createdBy(userId)
            .build();

        receipt = paymentReceiptRepository.save(receipt);
        log.info("Created payment receipt #{} for receivable {} - Amount: {}", 
            receipt.getReceiptNumber(), receivableId, amount);
        return receipt;
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalPendingBalance(UUID tenantId) {
        BigDecimal total = receivableRepository.getTotalPendingBalance(tenantId);
        return total != null ? total : BigDecimal.ZERO;
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalOverdueBalance(UUID tenantId) {
        BigDecimal total = receivableRepository.getTotalOverdueBalance(tenantId);
        return total != null ? total : BigDecimal.ZERO;
    }

    @Transactional(readOnly = true)
    public Long countOverdue(UUID tenantId) {
        return receivableRepository.countOverdue(tenantId);
    }

    public void updateOverdueDays(UUID tenantId) {
        List<Receivable> overdue = receivableRepository.findByTenantIdAndDueDateBeforeAndStatusNot(
            tenantId, LocalDate.now(), Receivable.ReceivableStatus.PAID);
        for (Receivable r : overdue) {
            r.updateOverdueDays();
        }
        receivableRepository.saveAll(overdue);
    }
}
