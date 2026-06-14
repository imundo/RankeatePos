package com.poscl.accounting.api.controller;

import com.poscl.accounting.application.event.SaleEventListener;
import com.poscl.shared.event.SaleCompletedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/accounting/events")
@RequiredArgsConstructor
public class AccountingEventController {

    private final SaleEventListener saleEventListener;

    @PostMapping("/sale-completed")
    public ResponseEntity<Void> onSaleCompleted(@RequestBody SaleCompletedEvent event) {
        saleEventListener.handleSaleCompleted(event);
        return ResponseEntity.ok().build();
    }
}