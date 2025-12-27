package com.poscl.purchases.config;

import com.poscl.purchases.domain.entity.PurchaseOrder;
import com.poscl.purchases.domain.entity.Supplier;
import com.poscl.purchases.domain.repository.PurchaseOrderRepository;
import com.poscl.purchases.domain.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class PurchasesDataInitializer implements CommandLineRunner {

    private final SupplierRepository supplierRepository;
    private final PurchaseOrderRepository orderRepository;
    
    private static final UUID DEMO_TENANT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Override
    public void run(String... args) {
        if (supplierRepository.count() == 0) {
            log.info("Initializing demo purchases data...");
            initializeSuppliers();
            initializeOrders();
            log.info("Demo purchases data initialized successfully");
        }
    }

    private void initializeSuppliers() {
        createSupplier("76.123.456-7", "Distribuidora Nacional SpA", "ventas@distribuidora.cl", 30);
        createSupplier("77.234.567-8", "Importadora del Pacífico Ltda", "compras@importadora.cl", 45);
        createSupplier("78.345.678-9", "Comercial Norte Grande", "info@nortecom.cl", 30);
        createSupplier("79.456.789-0", "Alimentos Premium Chile", "ventas@premium.cl", 15);
        createSupplier("80.567.890-1", "Tecnología y Servicios TI", "contacto@techti.cl", 30);
    }

    private Supplier createSupplier(String rut, String name, String email, int paymentDays) {
        Supplier s = Supplier.builder()
                .tenantId(DEMO_TENANT_ID)
                .rut(rut)
                .businessName(name)
                .name(name)
                .email(email)
                .phone("+56 9 1234 5678")
                .paymentTermDays(paymentDays)
                .isActive(true)
                .build();
        return supplierRepository.save(s);
    }

    private void initializeOrders() {
        createOrder(2045, "Distribuidora Nacional SpA", 3500000, PurchaseOrder.OrderStatus.APPROVED);
        createOrder(2044, "Importadora del Pacífico Ltda", 1800000, PurchaseOrder.OrderStatus.SENT);
        createOrder(2043, "Comercial Norte Grande", 2200000, PurchaseOrder.OrderStatus.RECEIVED);
        createOrder(2042, "Alimentos Premium Chile", 950000, PurchaseOrder.OrderStatus.DRAFT);
        createOrder(2041, "Tecnología y Servicios TI", 4500000, PurchaseOrder.OrderStatus.APPROVED);
    }

    private void createOrder(int number, String supplierName, int amount, PurchaseOrder.OrderStatus status) {
        PurchaseOrder order = PurchaseOrder.builder()
                .tenantId(DEMO_TENANT_ID)
                .orderNumber(number)
                .supplierName(supplierName)
                .orderDate(LocalDate.now().minusDays(number % 10))
                .total(BigDecimal.valueOf(amount))
                .subtotal(BigDecimal.valueOf((int)(amount / 1.19)))
                .tax(BigDecimal.valueOf(amount - (int)(amount / 1.19)))
                .status(status)
                .build();
        orderRepository.save(order);
    }
}
