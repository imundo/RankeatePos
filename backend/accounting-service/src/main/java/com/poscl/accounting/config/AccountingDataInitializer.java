package com.poscl.accounting.config;

import com.poscl.accounting.domain.entity.Account;
import com.poscl.accounting.domain.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class AccountingDataInitializer implements CommandLineRunner {

    private final AccountRepository accountRepository;

    private static final UUID DEMO_TENANT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Override
    public void run(String... args) {
        if (accountRepository.count() == 0) {
            log.info("Initializing Chilean Chart of Accounts...");
            initializeChileanChartOfAccounts();
            log.info("Chart of Accounts initialized successfully");
        }
    }

    private void initializeChileanChartOfAccounts() {
        // ACTIVOS
        Account activos = createRootAccount("1000", "ACTIVOS", Account.AccountType.ASSET);
        Account activoCorriente = createAccount("1100", "Activo Corriente", Account.AccountType.ASSET, activos, false);
        createAccount("1110", "Caja", Account.AccountType.ASSET, activoCorriente, true);
        createAccount("1120", "Banco", Account.AccountType.ASSET, activoCorriente, true);
        createAccount("1130", "Clientes", Account.AccountType.ASSET, activoCorriente, true);
        createAccount("1140", "Documentos por Cobrar", Account.AccountType.ASSET, activoCorriente, true);
        createAccount("1150", "Inventarios", Account.AccountType.ASSET, activoCorriente, true);
        createAccount("1160", "IVA Crédito Fiscal", Account.AccountType.ASSET, activoCorriente, true);

        Account activoNoCorriente = createAccount("1200", "Activo No Corriente", Account.AccountType.ASSET, activos,
                false);
        createAccount("1210", "Propiedades, Planta y Equipo", Account.AccountType.ASSET, activoNoCorriente, true);
        createAccount("1220", "Depreciación Acumulada", Account.AccountType.ASSET, activoNoCorriente, true);

        // PASIVOS
        Account pasivos = createRootAccount("2000", "PASIVOS", Account.AccountType.LIABILITY);
        Account pasivoCorriente = createAccount("2100", "Pasivo Corriente", Account.AccountType.LIABILITY, pasivos,
                false);
        createAccount("2110", "Proveedores", Account.AccountType.LIABILITY, pasivoCorriente, true);
        createAccount("2120", "Documentos por Pagar", Account.AccountType.LIABILITY, pasivoCorriente, true);
        createAccount("2130", "IVA Débito Fiscal", Account.AccountType.LIABILITY, pasivoCorriente, true);
        createAccount("2140", "Retenciones por Pagar", Account.AccountType.LIABILITY, pasivoCorriente, true);
        createAccount("2150", "Sueldos por Pagar", Account.AccountType.LIABILITY, pasivoCorriente, true);
        createAccount("2160", "AFP por Pagar", Account.AccountType.LIABILITY, pasivoCorriente, true);
        createAccount("2170", "Salud por Pagar", Account.AccountType.LIABILITY, pasivoCorriente, true);

        // PATRIMONIO
        Account patrimonio = createRootAccount("3000", "PATRIMONIO", Account.AccountType.EQUITY);
        createAccount("3100", "Capital", Account.AccountType.EQUITY, patrimonio, true);
        createAccount("3200", "Reservas", Account.AccountType.EQUITY, patrimonio, true);
        createAccount("3300", "Utilidades Retenidas", Account.AccountType.EQUITY, patrimonio, true);
        createAccount("3400", "Resultado del Ejercicio", Account.AccountType.EQUITY, patrimonio, true);

        // INGRESOS
        Account ingresos = createRootAccount("4000", "INGRESOS", Account.AccountType.INCOME);
        createAccount("4100", "Ventas", Account.AccountType.INCOME, ingresos, true);
        createAccount("4200", "Otros Ingresos", Account.AccountType.INCOME, ingresos, true);
        createAccount("4300", "Ingresos Financieros", Account.AccountType.INCOME, ingresos, true);

        // COSTOS Y GASTOS
        Account costos = createRootAccount("5000", "COSTOS Y GASTOS", Account.AccountType.EXPENSE);
        createAccount("5100", "Costo de Ventas", Account.AccountType.EXPENSE, costos, true);
        createAccount("5200", "Gastos de Administración", Account.AccountType.EXPENSE, costos, true);
        createAccount("5300", "Gastos de Ventas", Account.AccountType.EXPENSE, costos, true);
        createAccount("5400", "Remuneraciones", Account.AccountType.EXPENSE, costos, true);
        createAccount("5500", "Gastos Financieros", Account.AccountType.EXPENSE, costos, true);
        createAccount("5600", "Depreciación", Account.AccountType.EXPENSE, costos, true);
    }

    private Account createRootAccount(String code, String name, Account.AccountType type) {
        Account account = Account.builder()
                .tenantId(DEMO_TENANT_ID)
                .code(code)
                .name(name)
                .type(type)
                .nature(type == Account.AccountType.ASSET || type == Account.AccountType.EXPENSE
                        ? Account.AccountNature.DEBIT
                        : Account.AccountNature.CREDIT)
                .level(1)
                .allowsMovements(false)
                .isActive(true)
                .isSystemAccount(true)
                .build();
        return accountRepository.save(account);
    }

    private Account createAccount(String code, String name, Account.AccountType type, Account parent,
            boolean allowsMovements) {
        Account account = Account.builder()
                .tenantId(DEMO_TENANT_ID)
                .code(code)
                .name(name)
                .type(type)
                .nature(type == Account.AccountType.ASSET || type == Account.AccountType.EXPENSE
                        ? Account.AccountNature.DEBIT
                        : Account.AccountNature.CREDIT)
                .level(parent.getLevel() + 1)
                .parent(parent)
                .allowsMovements(allowsMovements)
                .isActive(true)
                .isSystemAccount(true)
                .build();
        return accountRepository.save(account);
    }
}
