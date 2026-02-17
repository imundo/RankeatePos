package com.poscl.marketing.api.controller;

import com.poscl.marketing.application.service.LoyaltyService;
import com.poscl.shared.event.SaleCompletedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/loyalty")
@RequiredArgsConstructor
public class LoyaltyController {

    private final LoyaltyService loyaltyService;

    @PostMapping("/sale-completed")
    public ResponseEntity<Void> handleSaleCompleted(@RequestBody SaleCompletedEvent event) {
        log.info("Recibida notificación de venta completada: SaleId={}, Total={}", event.getSaleId(),
                event.getTotalAmount());
        try {
            loyaltyService.processSale(event);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error procesando venta {}: {}", event.getSaleId(), e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
