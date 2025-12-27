package com.poscl.accounting.application.service;

import com.poscl.accounting.api.dto.JournalDtos.*;
import com.poscl.accounting.domain.entity.Account;
import com.poscl.accounting.domain.entity.JournalEntry;
import com.poscl.accounting.domain.entity.JournalLine;
import com.poscl.accounting.domain.repository.AccountRepository;
import com.poscl.accounting.domain.repository.JournalEntryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class JournalService {

    private final JournalEntryRepository journalEntryRepository;
    private final AccountRepository accountRepository;

    public JournalEntryResponse createJournalEntry(UUID tenantId, CreateJournalEntryRequest request) {
        // Validar que las líneas cuadren
        BigDecimal totalDebit = request.getLines().stream()
            .map(JournalLineRequest::getDebit)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCredit = request.getLines().stream()
            .map(JournalLineRequest::getCredit)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalDebit.compareTo(totalCredit) != 0) {
            throw new IllegalArgumentException(
                String.format("El asiento no cuadra. Debe: %s, Haber: %s", totalDebit, totalCredit));
        }

        if (totalDebit.compareTo(BigDecimal.ZERO) == 0) {
            throw new IllegalArgumentException("El asiento no puede tener monto cero");
        }

        JournalEntry entry = JournalEntry.builder()
            .tenantId(tenantId)
            .branchId(request.getBranchId())
            .entryNumber(journalEntryRepository.getNextEntryNumber(tenantId))
            .entryDate(request.getEntryDate())
            .type(request.getType())
            .description(request.getDescription())
            .referenceType(request.getReferenceType())
            .referenceId(request.getReferenceId())
            .referenceNumber(request.getReferenceNumber())
            .status(JournalEntry.JournalStatus.DRAFT)
            .isAutomatic(false)
            .build();

        // Agregar líneas
        int lineOrder = 1;
        for (JournalLineRequest lineReq : request.getLines()) {
            Account account = accountRepository.findById(lineReq.getAccountId())
                .orElseThrow(() -> new IllegalArgumentException("Cuenta no encontrada: " + lineReq.getAccountId()));

            if (!account.getAllowsMovements()) {
                throw new IllegalArgumentException("La cuenta " + account.getCode() + " no permite movimientos");
            }

            JournalLine line = JournalLine.builder()
                .account(account)
                .debit(lineReq.getDebit())
                .credit(lineReq.getCredit())
                .description(lineReq.getDescription())
                .costCenterId(lineReq.getCostCenterId())
                .lineOrder(lineOrder++)
                .build();

            entry.addLine(line);
        }

        entry = journalEntryRepository.save(entry);
        log.info("Created journal entry #{} for tenant {}", entry.getEntryNumber(), tenantId);
        return toResponse(entry);
    }

    @Transactional(readOnly = true)
    public Page<JournalEntryResponse> getJournalEntries(UUID tenantId, Pageable pageable) {
        return journalEntryRepository
            .findByTenantIdOrderByEntryDateDescEntryNumberDesc(tenantId, pageable)
            .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<JournalEntryResponse> getJournalEntriesByDateRange(
            UUID tenantId, LocalDate startDate, LocalDate endDate, Pageable pageable) {
        return journalEntryRepository
            .findByTenantIdAndEntryDateBetweenOrderByEntryDateDescEntryNumberDesc(
                tenantId, startDate, endDate, pageable)
            .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public JournalEntryResponse getJournalEntry(UUID tenantId, UUID entryId) {
        JournalEntry entry = journalEntryRepository.findByIdWithLines(entryId)
            .filter(e -> e.getTenantId().equals(tenantId))
            .orElseThrow(() -> new IllegalArgumentException("Asiento no encontrado"));
        return toResponse(entry);
    }

    public JournalEntryResponse postJournalEntry(UUID tenantId, UUID entryId, UUID postedBy) {
        JournalEntry entry = journalEntryRepository.findByIdWithLines(entryId)
            .filter(e -> e.getTenantId().equals(tenantId))
            .orElseThrow(() -> new IllegalArgumentException("Asiento no encontrado"));

        if (entry.getStatus() != JournalEntry.JournalStatus.DRAFT) {
            throw new IllegalArgumentException("Solo se pueden contabilizar asientos en borrador");
        }

        if (!entry.isBalanced()) {
            throw new IllegalArgumentException("El asiento no está cuadrado");
        }

        entry.setStatus(JournalEntry.JournalStatus.POSTED);
        entry.setPostedAt(LocalDateTime.now());
        entry.setPostedBy(postedBy);

        entry = journalEntryRepository.save(entry);
        log.info("Posted journal entry #{} for tenant {}", entry.getEntryNumber(), tenantId);
        return toResponse(entry);
    }

    public JournalEntryResponse reverseJournalEntry(UUID tenantId, UUID entryId, UUID reversedBy) {
        JournalEntry original = journalEntryRepository.findByIdWithLines(entryId)
            .filter(e -> e.getTenantId().equals(tenantId))
            .orElseThrow(() -> new IllegalArgumentException("Asiento no encontrado"));

        if (original.getStatus() != JournalEntry.JournalStatus.POSTED) {
            throw new IllegalArgumentException("Solo se pueden revertir asientos contabilizados");
        }

        // Crear asiento de reversión
        JournalEntry reversal = JournalEntry.builder()
            .tenantId(tenantId)
            .branchId(original.getBranchId())
            .entryNumber(journalEntryRepository.getNextEntryNumber(tenantId))
            .entryDate(LocalDate.now())
            .type(JournalEntry.JournalType.REVERSAL)
            .description("Reversión de asiento #" + original.getEntryNumber() + " - " + original.getDescription())
            .referenceType("REVERSAL")
            .referenceId(original.getId())
            .status(JournalEntry.JournalStatus.POSTED)
            .postedAt(LocalDateTime.now())
            .postedBy(reversedBy)
            .isAutomatic(true)
            .build();

        // Invertir débitos y créditos
        int lineOrder = 1;
        for (JournalLine originalLine : original.getLines()) {
            JournalLine reversalLine = JournalLine.builder()
                .account(originalLine.getAccount())
                .debit(originalLine.getCredit())
                .credit(originalLine.getDebit())
                .description("Reversión: " + originalLine.getDescription())
                .costCenterId(originalLine.getCostCenterId())
                .lineOrder(lineOrder++)
                .build();
            reversal.addLine(reversalLine);
        }

        // Marcar original como revertido
        original.setStatus(JournalEntry.JournalStatus.REVERSED);
        journalEntryRepository.save(original);

        reversal = journalEntryRepository.save(reversal);
        original.setReversedByEntryId(reversal.getId());
        journalEntryRepository.save(original);

        log.info("Reversed journal entry #{} with new entry #{}", 
            original.getEntryNumber(), reversal.getEntryNumber());
        return toResponse(reversal);
    }

    private JournalEntryResponse toResponse(JournalEntry entry) {
        return JournalEntryResponse.builder()
            .id(entry.getId())
            .entryNumber(entry.getEntryNumber())
            .entryDate(entry.getEntryDate())
            .type(entry.getType())
            .description(entry.getDescription())
            .referenceType(entry.getReferenceType())
            .referenceId(entry.getReferenceId())
            .referenceNumber(entry.getReferenceNumber())
            .totalDebit(entry.getTotalDebit())
            .totalCredit(entry.getTotalCredit())
            .status(entry.getStatus())
            .isAutomatic(entry.getIsAutomatic())
            .postedAt(entry.getPostedAt())
            .createdAt(entry.getCreatedAt())
            .lines(entry.getLines().stream()
                .map(this::toLineResponse)
                .collect(Collectors.toList()))
            .build();
    }

    private JournalLineResponse toLineResponse(JournalLine line) {
        return JournalLineResponse.builder()
            .id(line.getId())
            .accountId(line.getAccount().getId())
            .accountCode(line.getAccount().getCode())
            .accountName(line.getAccount().getName())
            .debit(line.getDebit())
            .credit(line.getCredit())
            .description(line.getDescription())
            .lineOrder(line.getLineOrder())
            .build();
    }
}
