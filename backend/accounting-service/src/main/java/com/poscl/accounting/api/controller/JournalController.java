package com.poscl.accounting.api.controller;

import com.poscl.accounting.api.dto.JournalDtos.*;
import com.poscl.accounting.application.service.JournalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/journal-entries")
@RequiredArgsConstructor
@Tag(name = "Asientos Contables", description = "Libro diario y gestión de asientos contables")
public class JournalController {

    private final JournalService journalService;

    @PostMapping
    @Operation(summary = "Crear asiento contable")
    public ResponseEntity<JournalEntryResponse> createJournalEntry(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @Valid @RequestBody CreateJournalEntryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(journalService.createJournalEntry(tenantId, request));
    }

    @GetMapping
    @Operation(summary = "Listar asientos contables (libro diario)")
    public ResponseEntity<Page<JournalEntryResponse>> getJournalEntries(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(journalService.getJournalEntries(tenantId, pageable));
    }

    @GetMapping("/period")
    @Operation(summary = "Listar asientos por rango de fechas")
    public ResponseEntity<Page<JournalEntryResponse>> getJournalEntriesByDateRange(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(
            journalService.getJournalEntriesByDateRange(tenantId, startDate, endDate, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener asiento por ID con sus líneas")
    public ResponseEntity<JournalEntryResponse> getJournalEntry(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(journalService.getJournalEntry(tenantId, id));
    }

    @PostMapping("/{id}/post")
    @Operation(summary = "Contabilizar asiento (cambiar de borrador a contabilizado)")
    public ResponseEntity<JournalEntryResponse> postJournalEntry(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(journalService.postJournalEntry(tenantId, id, userId));
    }

    @PostMapping("/{id}/reverse")
    @Operation(summary = "Revertir asiento contabilizado")
    public ResponseEntity<JournalEntryResponse> reverseJournalEntry(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(journalService.reverseJournalEntry(tenantId, id, userId));
    }
}
