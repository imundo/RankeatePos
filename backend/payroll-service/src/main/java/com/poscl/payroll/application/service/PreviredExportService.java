package com.poscl.payroll.application.service;

import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * Service for generating Previred-compatible payroll files for Chilean social security
 */
@Service
public class PreviredExportService {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("ddMMyyyy");
    
    /**
     * Generate Previred file content in the required format
     * Format: Fixed-width columns as per Previred specifications
     */
    public String generatePreviredFile(List<Map<String, Object>> payslips, LocalDate periodDate) {
        StringBuilder sb = new StringBuilder();
        
        // Header line (Type 1)
        sb.append(generateHeader(periodDate, payslips.size()));
        sb.append("\n");
        
        // Detail lines (Type 2) - one per employee
        for (Map<String, Object> payslip : payslips) {
            sb.append(generateDetailLine(payslip, periodDate));
            sb.append("\n");
        }
        
        return sb.toString();
    }
    
    private String generateHeader(LocalDate periodDate, int totalRecords) {
        StringBuilder line = new StringBuilder();
        
        // Position 1: Record type (1 = header)
        line.append("1");
        
        // Position 2-9: Period (MMYYYY format)
        line.append(String.format("%02d%04d", periodDate.getMonthValue(), periodDate.getYear()));
        
        // Position 10-15: Total records
        line.append(String.format("%06d", totalRecords));
        
        // Position 16-23: Generation date
        line.append(LocalDate.now().format(DATE_FORMAT));
        
        // Fill remaining with spaces to complete 80 chars
        while (line.length() < 80) {
            line.append(" ");
        }
        
        return line.toString();
    }
    
    private String generateDetailLine(Map<String, Object> payslip, LocalDate periodDate) {
        StringBuilder line = new StringBuilder();
        
        // Position 1: Record type (2 = detail)
        line.append("2");
        
        // Position 2-12: RUT (without dots, with hyphen)
        String rut = (String) payslip.getOrDefault("employeeRut", "00000000-0");
        line.append(padRight(rut.replace(".", ""), 11));
        
        // Position 13-18: Period (MMYYYY)
        line.append(String.format("%02d%04d", periodDate.getMonthValue(), periodDate.getYear()));
        
        // Position 19-28: Taxable income (10 digits, no decimals)
        BigDecimal grossSalary = getBigDecimal(payslip, "grossSalary");
        line.append(String.format("%010d", grossSalary.longValue()));
        
        // Position 29-38: AFP amount (10 digits)
        BigDecimal afpAmount = getBigDecimal(payslip, "afpAmount");
        line.append(String.format("%010d", afpAmount.longValue()));
        
        // Position 39-41: AFP code (3 chars)
        String afpCode = (String) payslip.getOrDefault("afpCode", "033"); // Default: Habitat
        line.append(padRight(afpCode, 3));
        
        // Position 42-51: Health contribution (10 digits)
        BigDecimal healthAmount = getBigDecimal(payslip, "healthAmount");
        line.append(String.format("%010d", healthAmount.longValue()));
        
        // Position 52-54: Health institution code (3 chars)
        String healthCode = (String) payslip.getOrDefault("healthCode", "FNS"); // Default: FONASA
        line.append(padRight(healthCode, 3));
        
        // Position 55-64: Unemployment insurance (10 digits)
        BigDecimal unemploymentAmount = getBigDecimal(payslip, "unemploymentAmount");
        line.append(String.format("%010d", unemploymentAmount.longValue()));
        
        // Position 65-74: Tax withholding (10 digits)
        BigDecimal taxAmount = getBigDecimal(payslip, "taxAmount");
        line.append(String.format("%010d", taxAmount.longValue()));
        
        // Fill remaining with spaces
        while (line.length() < 120) {
            line.append(" ");
        }
        
        return line.toString();
    }
    
    private BigDecimal getBigDecimal(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal) return (BigDecimal) value;
        if (value instanceof Number) return BigDecimal.valueOf(((Number) value).doubleValue());
        return BigDecimal.ZERO;
    }
    
    private String padRight(String s, int length) {
        if (s == null) s = "";
        if (s.length() >= length) return s.substring(0, length);
        StringBuilder sb = new StringBuilder(s);
        while (sb.length() < length) {
            sb.append(" ");
        }
        return sb.toString();
    }
}
