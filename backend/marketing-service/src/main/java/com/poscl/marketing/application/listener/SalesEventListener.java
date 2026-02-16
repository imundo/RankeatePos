package com.poscl.marketing.application.listener;

import com.poscl.marketing.config.RabbitMQConfig;
import com.poscl.shared.event.SaleCompletedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import com.poscl.marketing.application.service.LoyaltyService;

@Slf4j
@Component
@RequiredArgsConstructor
public class SalesEventListener {

    private final LoyaltyService loyaltyService;

    @RabbitListener(queues = RabbitMQConfig.QUEUE_NAME)
    public void handleSaleCompleted(SaleCompletedEvent event) {
        log.info("Recibido evento de venta completada: SaleId={}, Total={}", event.getSaleId(), event.getTotalAmount());

        try {
            loyaltyService.processSale(event);
            log.info("Procesamiento de evento finalizado para SaleId={}", event.getSaleId());

        } catch (Exception e) {
            log.error("Error procesando evento de venta {}: {}", event.getSaleId(), e.getMessage());
            // Dependiendo de la estrategia de retry, podríamos lanzar la excepción para que
            // RabbitMQ reintente
            // o manejarla y enviarla a una DLQ. Por ahora logueamos.
        }
    }
}
