package com.poscl.payments.config;

import com.poscl.payments.domain.entity.Payable;
import com.poscl.payments.domain.entity.Receivable;
import com.poscl.payments.domain.repository.PayableRepository;
import com.poscl.payments.domain.repository.ReceivableRepository;
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
public class PaymentsDataInitializer implements CommandLineRunner {

    private final ReceivableRepository receivableRepository;
    private final PayableRepository payableRepository;
    
    private static final UUID DEMO_TENANT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Override
    public void run(String... args) {
        if (receivableRepository.count() == 0) {
            log.info("Initializing demo payments data...");
            initializeReceivables();
            initializePayables();
            log.info("Demo payments data initialized successfully");
        }
    }

    private void initializeReceivables() {
        createReceivable("F-2045", "Empresa ABC Ltda.", 1500000, LocalDate.now().plusDays(15));
        createReceivable("F-2044", "Comercial XYZ", 850000, LocalDate.now().plusDays(7));
        createReceivable("F-2043", "Distribuidora Norte", 2200000, LocalDate.now().minusDays(3));
        createReceivable("F-2042", "Local El Trigal", 450000, LocalDate.now().minusDays(10));
        createReceivable("F-2041", "Servicios Integrales SpA", 3800000, LocalDate.now().plusDays(30));
    }

    private void createReceivable(String docNumber, String customer, int amount, LocalDate dueDate) {
        Receivable r = Receivable.builder()
                .tenantId(DEMO_TENANT_ID)
                .documentNumber(docNumber)
                .customerName(customer)
                .originalAmount(BigDecimal.valueOf(amount))
                .balance(BigDecimal.valueOf(amount))
                .paidAmount(BigDecimal.ZERO)
                .dueDate(dueDate)
                .documentDate(LocalDate.now().minusDays(30))
                .status(dueDate.isBefore(LocalDate.now()) 
                    ? Receivable.ReceivableStatus.OVERDUE 
                    : Receivable.ReceivableStatus.PENDING)
                .build();
        receivableRepository.save(r);
    }

    private void initializePayables() {
        createPayable("OC-1045", "Distribuidora Nacional SpA", 2500000, LocalDate.now().plusDays(20));
        createPayable("OC-1044", "Importadora del Pacífico", 1200000, LocalDate.now().plusDays(10));
        createPayable("OC-1043", "Comercial Norte Grande", 800000, LocalDate.now().minusDays(5));
        createPayable("OC-1042", "Servicios Eléctricos", 350000, LocalDate.now().minusDays(8));
        createPayable("OC-1041", "Internet Empresarial", 89000, LocalDate.now().plusDays(5));
    }

    private void createPayable(String docNumber, String supplier, int amount, LocalDate dueDate) {
        Payable p = Payable.builder()
                .tenantId(DEMO_TENANT_ID)
                .documentNumber(docNumber)
                .supplierName(supplier)
                .originalAmount(BigDecimal.valueOf(amount))
                .balance(BigDecimal.valueOf(amount))
                .paidAmount(BigDecimal.ZERO)
                .dueDate(dueDate)
                .documentDate(LocalDate.now().minusDays(30))
                .status(dueDate.isBefore(LocalDate.now()) 
                    ? Payable.PayableStatus.OVERDUE 
                    : Payable.PayableStatus.PENDING)
                .build();
        payableRepository.save(p);
    }
}
