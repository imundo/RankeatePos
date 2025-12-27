package com.poscl.accounting.domain.repository;

import com.poscl.accounting.domain.entity.JournalEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface JournalEntryRepository extends JpaRepository<JournalEntry, UUID> {

    Page<JournalEntry> findByTenantIdOrderByEntryDateDescEntryNumberDesc(UUID tenantId, Pageable pageable);

    Page<JournalEntry> findByTenantIdAndEntryDateBetweenOrderByEntryDateDescEntryNumberDesc(
        UUID tenantId, LocalDate startDate, LocalDate endDate, Pageable pageable);

    Page<JournalEntry> findByTenantIdAndStatusOrderByEntryDateDescEntryNumberDesc(
        UUID tenantId, JournalEntry.JournalStatus status, Pageable pageable);

    Optional<JournalEntry> findByTenantIdAndReferenceTypeAndReferenceId(
        UUID tenantId, String referenceType, UUID referenceId);

    @Query("SELECT COALESCE(MAX(j.entryNumber), 0) + 1 FROM JournalEntry j WHERE j.tenantId = :tenantId")
    Long getNextEntryNumber(UUID tenantId);

    @Query("SELECT j FROM JournalEntry j LEFT JOIN FETCH j.lines WHERE j.id = :id")
    Optional<JournalEntry> findByIdWithLines(UUID id);

    @Query("SELECT COUNT(j) FROM JournalEntry j WHERE j.tenantId = :tenantId AND j.status = :status")
    Long countByTenantIdAndStatus(UUID tenantId, JournalEntry.JournalStatus status);
}
