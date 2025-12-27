package com.poscl.payroll.api.controller;

import com.poscl.payroll.application.service.PreviredExportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/v1/payroll")
public class PayrollController {

    private final PreviredExportService previredExportService;

    public PayrollController(PreviredExportService previredExportService) {
        this.previredExportService = previredExportService;
    }

    @GetMapping("/previred/{periodId}")
    public ResponseEntity<byte[]> exportPrevired(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable String periodId) {
        
        // TODO: Get actual payslips from database
        // For demo, using mock data
        List<Map<String, Object>> payslips = getMockPayslips();
        LocalDate periodDate = LocalDate.now().withDayOfMonth(1);
        
        String content = previredExportService.generatePreviredFile(payslips, periodDate);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", 
            String.format("previred_%s_%s.txt", periodDate.getMonthValue(), periodDate.getYear()));
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(content.getBytes());
    }

    @GetMapping("/periods")
    public ResponseEntity<List<Map<String, Object>>> getPayrollPeriods(
            @RequestHeader("X-Tenant-Id") String tenantId) {
        // Demo data
        List<Map<String, Object>> periods = new ArrayList<>();
        
        Map<String, Object> current = new HashMap<>();
        current.put("id", UUID.randomUUID().toString());
        current.put("periodYear", 2025);
        current.put("periodMonth", 12);
        current.put("periodName", "Diciembre 2025");
        current.put("status", "PROCESSING");
        current.put("totalGross", 45000000);
        current.put("totalDeductions", 12500000);
        current.put("totalNet", 32500000);
        periods.add(current);
        
        Map<String, Object> previous = new HashMap<>();
        previous.put("id", UUID.randomUUID().toString());
        previous.put("periodYear", 2025);
        previous.put("periodMonth", 11);
        previous.put("periodName", "Noviembre 2025");
        previous.put("status", "PAID");
        previous.put("totalGross", 44500000);
        previous.put("totalDeductions", 12350000);
        previous.put("totalNet", 32150000);
        periods.add(previous);
        
        return ResponseEntity.ok(periods);
    }

    @GetMapping("/employees")
    public ResponseEntity<List<Map<String, Object>>> getEmployees(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestParam(required = false) Boolean active) {
        
        List<Map<String, Object>> employees = new ArrayList<>();
        
        employees.add(createEmployee("12.345.678-9", "María", "González", "Gerente", 2800000, true));
        employees.add(createEmployee("11.222.333-4", "Juan", "Pérez", "Desarrollador", 2200000, true));
        employees.add(createEmployee("10.111.222-3", "Ana", "López", "Contadora", 2000000, true));
        employees.add(createEmployee("9.888.777-6", "Pedro", "Martínez", "Vendedor", 1200000, true));
        employees.add(createEmployee("8.777.666-5", "Carmen", "Torres", "Administrativa", 950000, true));
        
        if (active != null) {
            employees = employees.stream()
                    .filter(e -> active.equals(e.get("isActive")))
                    .toList();
        }
        
        return ResponseEntity.ok(employees);
    }

    @GetMapping("/periods/{periodId}/payslips")
    public ResponseEntity<List<Map<String, Object>>> getPayslips(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable String periodId) {
        
        return ResponseEntity.ok(getMockPayslips());
    }

    private Map<String, Object> createEmployee(String rut, String firstName, String lastName, 
            String position, int baseSalary, boolean active) {
        Map<String, Object> emp = new HashMap<>();
        emp.put("id", UUID.randomUUID().toString());
        emp.put("rut", rut);
        emp.put("firstName", firstName);
        emp.put("lastName", lastName);
        emp.put("fullName", firstName + " " + lastName);
        emp.put("position", position);
        emp.put("baseSalary", baseSalary);
        emp.put("contractType", "INDEFINIDO");
        emp.put("afpCode", "033"); // Habitat
        emp.put("healthCode", "FNS"); // FONASA
        emp.put("isActive", active);
        emp.put("hireDate", "2023-03-15");
        return emp;
    }

    private List<Map<String, Object>> getMockPayslips() {
        List<Map<String, Object>> payslips = new ArrayList<>();
        
        payslips.add(createPayslip("María González", "12.345.678-9", 2800000));
        payslips.add(createPayslip("Juan Pérez", "11.222.333-4", 2200000));
        payslips.add(createPayslip("Ana López", "10.111.222-3", 2000000));
        payslips.add(createPayslip("Pedro Martínez", "9.888.777-6", 1200000));
        payslips.add(createPayslip("Carmen Torres", "8.777.666-5", 950000));
        
        return payslips;
    }

    private Map<String, Object> createPayslip(String name, String rut, int baseSalary) {
        Map<String, Object> payslip = new HashMap<>();
        payslip.put("id", UUID.randomUUID().toString());
        payslip.put("employeeName", name);
        payslip.put("employeeRut", rut);
        payslip.put("baseSalary", baseSalary);
        payslip.put("daysWorked", 30);
        payslip.put("overtimeAmount", 0);
        payslip.put("bonusAmount", 0);
        payslip.put("grossSalary", baseSalary);
        
        // Chilean deductions
        int afpAmount = (int) (baseSalary * 0.1025); // 10.25% AFP
        int healthAmount = (int) (baseSalary * 0.07); // 7% Salud
        int unemploymentAmount = (int) (baseSalary * 0.006); // 0.6% Seguro Cesantía
        int taxAmount = calculateTax(baseSalary - afpAmount - healthAmount);
        int totalDeductions = afpAmount + healthAmount + unemploymentAmount + taxAmount;
        
        payslip.put("afpAmount", afpAmount);
        payslip.put("afpCode", "033");
        payslip.put("healthAmount", healthAmount);
        payslip.put("healthCode", "FNS");
        payslip.put("unemploymentAmount", unemploymentAmount);
        payslip.put("taxAmount", taxAmount);
        payslip.put("totalDeductions", totalDeductions);
        payslip.put("netSalary", baseSalary - totalDeductions);
        
        return payslip;
    }

    private int calculateTax(int taxableIncome) {
        // Simplified Chilean tax calculation
        // Real calculation uses UTM brackets
        if (taxableIncome <= 800000) return 0;
        if (taxableIncome <= 1600000) return (int) ((taxableIncome - 800000) * 0.04);
        if (taxableIncome <= 2400000) return (int) (32000 + (taxableIncome - 1600000) * 0.08);
        if (taxableIncome <= 3200000) return (int) (96000 + (taxableIncome - 2400000) * 0.135);
        return (int) (204000 + (taxableIncome - 3200000) * 0.23);
    }
}
