package com.poscl.accounting.api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/v1/accounts")
public class AccountController {

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAccounts(
            @RequestHeader("X-Tenant-Id") String tenantId) {
        
        List<Map<String, Object>> accounts = new ArrayList<>();
        
        // Chilean Chart of Accounts (Plan de Cuentas)
        accounts.add(createAccount("1", "1000", "ACTIVOS", "ASSET", null));
        accounts.add(createAccount("2", "1100", "Activo Corriente", "ASSET", "1"));
        accounts.add(createAccount("3", "1110", "Caja", "ASSET", "2"));
        accounts.add(createAccount("4", "1120", "Banco", "ASSET", "2"));
        accounts.add(createAccount("5", "1130", "Clientes", "ASSET", "2"));
        accounts.add(createAccount("6", "1140", "Documentos por Cobrar", "ASSET", "2"));
        accounts.add(createAccount("7", "1150", "Inventarios", "ASSET", "2"));
        
        accounts.add(createAccount("8", "2000", "PASIVOS", "LIABILITY", null));
        accounts.add(createAccount("9", "2100", "Pasivo Corriente", "LIABILITY", "8"));
        accounts.add(createAccount("10", "2110", "Proveedores", "LIABILITY", "9"));
        accounts.add(createAccount("11", "2120", "Documentos por Pagar", "LIABILITY", "9"));
        accounts.add(createAccount("12", "2130", "IVA Débito Fiscal", "LIABILITY", "9"));
        accounts.add(createAccount("13", "2140", "Retenciones por Pagar", "LIABILITY", "9"));
        
        accounts.add(createAccount("14", "3000", "PATRIMONIO", "EQUITY", null));
        accounts.add(createAccount("15", "3100", "Capital", "EQUITY", "14"));
        accounts.add(createAccount("16", "3200", "Utilidades Retenidas", "EQUITY", "14"));
        
        accounts.add(createAccount("17", "4000", "INGRESOS", "REVENUE", null));
        accounts.add(createAccount("18", "4100", "Ventas", "REVENUE", "17"));
        accounts.add(createAccount("19", "4200", "Otros Ingresos", "REVENUE", "17"));
        
        accounts.add(createAccount("20", "5000", "COSTOS Y GASTOS", "EXPENSE", null));
        accounts.add(createAccount("21", "5100", "Costo de Ventas", "EXPENSE", "20"));
        accounts.add(createAccount("22", "5200", "Gastos de Administración", "EXPENSE", "20"));
        accounts.add(createAccount("23", "5300", "Gastos de Ventas", "EXPENSE", "20"));
        accounts.add(createAccount("24", "5400", "Remuneraciones", "EXPENSE", "20"));
        
        return ResponseEntity.ok(accounts);
    }

    @GetMapping("/tree")
    public ResponseEntity<List<Map<String, Object>>> getAccountsTree(
            @RequestHeader("X-Tenant-Id") String tenantId) {
        return getAccounts(tenantId);
    }

    @GetMapping("/balances")
    public ResponseEntity<Map<String, Object>> getBalances(
            @RequestHeader("X-Tenant-Id") String tenantId) {
        
        Map<String, Object> balances = new HashMap<>();
        
        balances.put("totalAssets", 85000000);
        balances.put("totalLiabilities", 32000000);
        balances.put("totalEquity", 53000000);
        balances.put("totalRevenue", 45000000);
        balances.put("totalExpenses", 38500000);
        balances.put("netIncome", 6500000);
        
        List<Map<String, Object>> keyAccounts = new ArrayList<>();
        keyAccounts.add(createAccountBalance("1110", "Caja", 5200000));
        keyAccounts.add(createAccountBalance("1120", "Banco", 28500000));
        keyAccounts.add(createAccountBalance("1130", "Clientes", 12800000));
        keyAccounts.add(createAccountBalance("1150", "Inventarios", 35000000));
        keyAccounts.add(createAccountBalance("2110", "Proveedores", -15000000));
        balances.put("keyAccounts", keyAccounts);
        
        return ResponseEntity.ok(balances);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createAccount(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestBody Map<String, Object> request) {
        Map<String, Object> account = new HashMap<>(request);
        account.put("id", UUID.randomUUID().toString());
        account.put("isActive", true);
        return ResponseEntity.ok(account);
    }

    private Map<String, Object> createAccount(String id, String code, String name, String type, String parentId) {
        Map<String, Object> account = new HashMap<>();
        account.put("id", id);
        account.put("code", code);
        account.put("name", name);
        account.put("type", type);
        account.put("parentId", parentId);
        account.put("isActive", true);
        account.put("level", code.length() == 4 ? 1 : (parentId == null ? 0 : 2));
        return account;
    }

    private Map<String, Object> createAccountBalance(String code, String name, int balance) {
        Map<String, Object> ab = new HashMap<>();
        ab.put("code", code);
        ab.put("name", name);
        ab.put("balance", balance);
        return ab;
    }
}
