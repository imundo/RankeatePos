package com.poscl.accounting.application.event;

import com.poscl.accounting.domain.service.AccountingService;
import com.poscl.accounting.domain.service.TreasuryService;
import com.poscl.shared.event.SaleCompletedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class SaleEventListener {

    private final AccountingService accountingService;
    private final TreasuryService treasuryService;

    @Async
    @EventListener
    public void handleSaleCompleted(SaleCompletedEvent event) {
        log.info("Received SaleCompletedEvent for sale {}", event.getSaleId());
        try {
            // Determine branchId (using a placeholder or fetching if not in event)
            UUID branchId = UUID.randomUUID(); // TODO: get from event or context

            accountingService.generateSaleJournalEntry(
                    event.getTenantId(),
                    branchId,
                    event.getSaleId(),
                    event.getTotalAmount(),
                    event.getNetAmount(),
                    event.getTaxAmount()
            );

            treasuryService.registerSaleIncome(event.getTenantId(), event.getSaleId(), event.getTotalAmount());
        } catch (Exception e) {
            log.error("Failed to generate journal entry for sale {}", event.getSaleId(), e);
        }
    }
}
