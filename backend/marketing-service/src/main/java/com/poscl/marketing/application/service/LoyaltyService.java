package com.poscl.marketing.application.service;

import com.poscl.marketing.domain.entity.Customer;
import com.poscl.marketing.domain.repository.CustomerRepository;
import com.poscl.shared.event.SaleCompletedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class LoyaltyService {

    private final CustomerRepository customerRepository;

    @Transactional
    public void processSale(SaleCompletedEvent event) {
        UUID customerId = event.getCustomerId();

        // Si no hay cliente asociado, no hacemos nada (o podríamos guardar "invitado")
        if (customerId == null) {
            log.info("Venta sin cliente registrado. Saltando fidelización.");
            return;
        }

        customerRepository.findById(customerId).ifPresentOrElse(customer -> {
            updateCustomerStats(customer, event);
            customerRepository.save(customer);
            log.info("Cliente {} actualizado. Puntos: {}, Tier: {}", customer.getId(), customer.getLoyaltyPoints(),
                    customer.getLoyaltyTier());
        }, () -> {
            log.warn("Cliente {} no encontrado para venta {}", customerId, event.getSaleId());
        });
    }

    private void updateCustomerStats(Customer customer, SaleCompletedEvent event) {
        // Actualizar totales
        customer.setTotalPurchases(customer.getTotalPurchases() + 1);
        customer.setTotalSpent(customer.getTotalSpent().add(event.getTotalAmount()));

        if (customer.getFirstPurchaseDate() == null) {
            customer.setFirstPurchaseDate(LocalDate.now());
        }
        customer.setLastPurchaseDate(LocalDate.now());

        // Calcular Ticket Promedio
        if (customer.getTotalPurchases() > 0) {
            customer.setAverageTicket(customer.getTotalSpent().divide(BigDecimal.valueOf(customer.getTotalPurchases()),
                    2, java.math.RoundingMode.HALF_UP));
        }

        // Calcular Puntos (1 punto por cada 100 unidades de moneda)
        int newPoints = event.getTotalAmount().divide(BigDecimal.valueOf(100), 0, java.math.RoundingMode.FLOOR)
                .intValue();
        if (newPoints > 0) {
            customer.setLoyaltyPoints(customer.getLoyaltyPoints() + newPoints);
        }

        // Actualizar Tier
        updateTier(customer);

        // Actualizar Segmento
        updateSegment(customer);
    }

    private void updateTier(Customer customer) {
        int points = customer.getLoyaltyPoints();
        if (points >= 10000) {
            customer.setLoyaltyTier(Customer.LoyaltyTier.PLATINUM);
        } else if (points >= 5000) {
            customer.setLoyaltyTier(Customer.LoyaltyTier.GOLD);
        } else if (points >= 1000) {
            customer.setLoyaltyTier(Customer.LoyaltyTier.SILVER);
        } else {
            customer.setLoyaltyTier(Customer.LoyaltyTier.BRONZE);
        }
    }

    private void updateSegment(Customer customer) {
        // Reglas simples de segmentación
        // VIP: Gasto > 1.000.000 o Platinum
        if (customer.getTotalSpent().compareTo(BigDecimal.valueOf(1000000)) > 0
                || customer.getLoyaltyTier() == Customer.LoyaltyTier.PLATINUM) {
            customer.setSegment(Customer.CustomerSegment.VIP);
        } else if (customer.getTotalPurchases() == 1) {
            customer.setSegment(Customer.CustomerSegment.NEW);
        } else {
            customer.setSegment(Customer.CustomerSegment.REGULAR);
        }
    }
}
