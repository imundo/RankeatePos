package com.poscl.payroll.api.controller;

import com.poscl.payroll.application.service.EmployeeService;
import com.poscl.payroll.application.service.PayrollPeriodService;
import com.poscl.payroll.application.service.PreviredExportService;
import com.poscl.payroll.application.service.PayslipPdfService;
import com.poscl.payroll.domain.entity.Employee;
import com.poscl.payroll.domain.entity.PayrollPeriod;
import com.poscl.payroll.domain.entity.Payslip;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/v1/payroll")
@RequiredArgsConstructor
public class PayrollController {

    private final PreviredExportService previredExportService;
    private final PayslipPdfService payslipPdfService;
    private final EmployeeService employeeService;
    private final PayrollPeriodService periodService;

    // ==================== EMPLOYEES ====================

    @GetMapping("/employees")
    public ResponseEntity<List<Map<String, Object>>> getEmployees(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestParam(required = false) Boolean active) {

        UUID tid = parseTenantId(tenantId);
        List<Employee> employees = active != null && active
                ? employeeService.findActive(tid)
                : employeeService.findAll(tid);

        List<Map<String, Object>> result = employees.stream()
                .map(this::mapEmployee)
                .toList();

        return ResponseEntity.ok(result);
    }

    @GetMapping("/employees/{id}")
    public ResponseEntity<?> getEmployee(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable UUID id) {

        UUID tid = parseTenantId(tenantId);
        return employeeService.findById(tid, id)
                .map(emp -> ResponseEntity.ok(mapEmployee(emp)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/employees")
    public ResponseEntity<?> createEmployee(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestBody Employee employee) {

        UUID tid = parseTenantId(tenantId);
        Employee created = employeeService.create(tid, employee);
        return ResponseEntity.ok(mapEmployee(created));
    }

    // ==================== PERIODS ====================

    @GetMapping("/periods")
    public ResponseEntity<List<Map<String, Object>>> getPayrollPeriods(
            @RequestHeader("X-Tenant-Id") String tenantId) {

        UUID tid = parseTenantId(tenantId);
        List<PayrollPeriod> periods = periodService.findAll(tid);

        List<Map<String, Object>> result = periods.stream()
                .map(this::mapPeriod)
                .toList();

        return ResponseEntity.ok(result);
    }

    @PostMapping("/periods")
    public ResponseEntity<?> createPeriod(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @RequestBody Map<String, Integer> request) {

        UUID tid = parseTenantId(tenantId);
        int year = request.getOrDefault("year", LocalDate.now().getYear());
        int month = request.getOrDefault("month", LocalDate.now().getMonthValue());

        PayrollPeriod period = periodService.create(tid, year, month);
        return ResponseEntity.ok(mapPeriod(period));
    }

    @PostMapping("/periods/{periodId}/process")
    public ResponseEntity<?> processPeriod(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable UUID periodId) {

        UUID tid = parseTenantId(tenantId);
        PayrollPeriod processed = periodService.process(tid, periodId);
        return ResponseEntity.ok(mapPeriod(processed));
    }

    // ==================== PAYSLIPS ====================

    @GetMapping("/periods/{periodId}/payslips")
    public ResponseEntity<List<Map<String, Object>>> getPayslips(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable UUID periodId) {

        UUID tid = parseTenantId(tenantId);
        List<Payslip> payslips = periodService.getPayslips(periodId);

        // Enrich with employee names
        List<Map<String, Object>> result = payslips.stream()
                .map(p -> {
                    Map<String, Object> map = mapPayslip(p);
                    if (p.getEmployee() != null) {
                        map.put("employeeName", p.getEmployee().getFullName());
                        map.put("employeeRut", p.getEmployee().getRut());
                    }
                    return map;
                })
                .toList();

        return ResponseEntity.ok(result);
    }

    // ==================== PREVIRED EXPORT ====================

    @GetMapping("/previred/{periodId}")
    public ResponseEntity<byte[]> exportPrevired(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable UUID periodId) {

        UUID tid = parseTenantId(tenantId);
        List<Payslip> payslips = periodService.getPayslips(periodId);

        // Convert to maps for export service
        List<Map<String, Object>> payslipMaps = payslips.stream()
                .map(p -> {
                    Map<String, Object> map = mapPayslip(p);
                    if (p.getEmployee() != null) {
                        map.put("employeeName", p.getEmployee().getFullName());
                        map.put("employeeRut", p.getEmployee().getRut());
                    }
                    return map;
                })
                .toList();

        LocalDate periodDate = LocalDate.now().withDayOfMonth(1);
        String content = previredExportService.generatePreviredFile(payslipMaps, periodDate);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment",
                String.format("previred_%s_%s.txt", periodDate.getMonthValue(), periodDate.getYear()));

        return ResponseEntity.ok()
                .headers(headers)
                .body(content.getBytes());
    }

    // ==================== PAYSLIP PDF ====================

    @GetMapping("/payslips/{payslipId}/pdf")
    public ResponseEntity<byte[]> getPayslipPdf(
            @RequestHeader("X-Tenant-Id") String tenantId,
            @PathVariable UUID payslipId) {

        UUID tid = parseTenantId(tenantId);

        Payslip payslip = periodService.getPayslip(tid, payslipId)
                .orElseThrow(() -> new RuntimeException("Payslip not found or access denied"));

        Map<String, Object> payslipData = mapPayslip(payslip);

        // Enrich with employee and period data for PDF
        if (payslip.getEmployee() != null) {
            payslipData.put("employeeName", payslip.getEmployee().getFullName());
            payslipData.put("employeeRut", payslip.getEmployee().getRut());
        }

        int year = 2025;
        int month = 1;

        if (payslip.getPayrollPeriod() != null) {
            year = payslip.getPayrollPeriod().getPeriodYear();
            month = payslip.getPayrollPeriod().getPeriodMonth();
        }

        byte[] content = payslipPdfService.generatePayslip(payslipData, year, month);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_HTML);
        headers.set("Content-Disposition", "inline; filename=liquidacion_" + month + "_" + year + ".html");

        return ResponseEntity.ok().headers(headers).body(content);
    }

    // ==================== HELPER METHODS ====================

    private UUID parseTenantId(String tenantId) {
        try {
            return UUID.fromString(tenantId);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid Tenant ID format: " + tenantId);
        }
    }

    private Map<String, Object> mapEmployee(Employee emp) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", emp.getId());
        map.put("rut", emp.getRut());
        map.put("firstName", emp.getFirstName());
        map.put("lastName", emp.getLastName());
        map.put("fullName", emp.getFullName());
        map.put("email", emp.getEmail());
        map.put("position", emp.getPosition());
        map.put("department", emp.getDepartment());
        map.put("baseSalary", emp.getBaseSalary());
        map.put("contractType", emp.getContractType());
        map.put("afpCode", emp.getAfpCode());
        map.put("healthCode", emp.getHealthInsuranceCode());
        map.put("isActive", emp.getIsActive());
        map.put("hireDate", emp.getHireDate());
        return map;
    }

    private Map<String, Object> mapPeriod(PayrollPeriod p) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", p.getId());
        map.put("periodYear", p.getPeriodYear());
        map.put("periodMonth", p.getPeriodMonth());
        map.put("periodName", getMonthName(p.getPeriodMonth()) + " " + p.getPeriodYear());
        map.put("status", p.getStatus());
        map.put("totalGross", p.getTotalGross());
        map.put("totalNet", p.getTotalNet());
        return map;
    }

    private Map<String, Object> mapPayslip(Payslip p) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", p.getId());
        map.put("baseSalary", p.getBaseSalary());
        map.put("grossSalary", p.getGrossSalary());
        map.put("afpAmount", p.getAfpAmount());
        map.put("healthAmount", p.getHealthAmount());
        map.put("unemploymentAmount", p.getUnemploymentAmount());
        map.put("taxAmount", p.getTaxAmount());
        map.put("totalDeductions", p.getTotalDeductions());
        map.put("netSalary", p.getNetSalary());
        map.put("daysWorked", p.getDaysWorked());
        return map;
    }

    private String getMonthName(int month) {
        String[] names = { "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre" };
        return names[month];
    }
}
