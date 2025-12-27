package com.poscl.payroll.application.service;

import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;

/**
 * Service for generating Payslip PDFs (Liquidaciones de Sueldo)
 */
@Service
public class PayslipPdfService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public byte[] generatePayslip(Map<String, Object> payslip, int year, int month) {
        StringBuilder html = new StringBuilder();
        
        String employeeName = (String) payslip.getOrDefault("employeeName", "Empleado");
        String employeeRut = (String) payslip.getOrDefault("employeeRut", "00.000.000-0");
        int baseSalary = getInt(payslip, "baseSalary");
        int grossSalary = getInt(payslip, "grossSalary");
        int afpAmount = getInt(payslip, "afpAmount");
        int healthAmount = getInt(payslip, "healthAmount");
        int taxAmount = getInt(payslip, "taxAmount");
        int totalDeductions = getInt(payslip, "totalDeductions");
        int netSalary = getInt(payslip, "netSalary");
        
        html.append("<!DOCTYPE html><html><head>");
        html.append("<meta charset='UTF-8'>");
        html.append("<style>");
        html.append("body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }");
        html.append(".header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; }");
        html.append(".header h1 { margin: 0; font-size: 1.5em; }");
        html.append(".header p { margin: 5px 0 0 0; opacity: 0.8; }");
        html.append(".content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }");
        html.append(".employee-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }");
        html.append(".info-item { background: white; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }");
        html.append(".info-label { color: #718096; font-size: 0.85em; }");
        html.append(".info-value { font-weight: bold; color: #1a1a3e; font-size: 1.1em; }");
        html.append("table { width: 100%; border-collapse: collapse; margin-top: 20px; background: white; border-radius: 8px; overflow: hidden; }");
        html.append("th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #e2e8f0; }");
        html.append("th { background: #f7fafc; color: #4a5568; font-weight: 600; text-transform: uppercase; font-size: 0.85em; }");
        html.append(".amount { text-align: right; font-family: monospace; font-size: 1.1em; }");
        html.append(".positive { color: #10b981; }");
        html.append(".negative { color: #ef4444; }");
        html.append(".total-row { background: #edf2f7; font-weight: bold; }");
        html.append(".net-row { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; font-size: 1.2em; }");
        html.append(".footer { text-align: center; padding: 20px; color: #718096; font-size: 0.85em; }");
        html.append("</style></head><body>");
        
        // Header
        html.append("<div class='header'>");
        html.append("<h1>📄 Liquidación de Sueldo</h1>");
        html.append("<p>Período: ").append(getMonthName(month)).append(" ").append(year).append("</p>");
        html.append("</div>");
        
        // Content
        html.append("<div class='content'>");
        
        // Employee Info
        html.append("<div class='employee-info'>");
        html.append("<div class='info-item'><div class='info-label'>Nombre</div><div class='info-value'>").append(employeeName).append("</div></div>");
        html.append("<div class='info-item'><div class='info-label'>RUT</div><div class='info-value'>").append(employeeRut).append("</div></div>");
        html.append("<div class='info-item'><div class='info-label'>Días Trabajados</div><div class='info-value'>").append(payslip.getOrDefault("daysWorked", 30)).append("</div></div>");
        html.append("<div class='info-item'><div class='info-label'>Contrato</div><div class='info-value'>Indefinido</div></div>");
        html.append("</div>");
        
        // HABERES
        html.append("<h3 style='color:#1a1a3e; margin-top:30px;'>💰 HABERES</h3>");
        html.append("<table>");
        html.append("<tr><th>Concepto</th><th class='amount'>Monto</th></tr>");
        html.append("<tr><td>Sueldo Base</td><td class='amount positive'>").append(formatCurrency(baseSalary)).append("</td></tr>");
        html.append("<tr><td>Horas Extra</td><td class='amount positive'>").append(formatCurrency(getInt(payslip, "overtimeAmount"))).append("</td></tr>");
        html.append("<tr><td>Bonificaciones</td><td class='amount positive'>").append(formatCurrency(getInt(payslip, "bonusAmount"))).append("</td></tr>");
        html.append("<tr class='total-row'><td><strong>Total Haberes</strong></td><td class='amount'><strong>").append(formatCurrency(grossSalary)).append("</strong></td></tr>");
        html.append("</table>");
        
        // DESCUENTOS
        html.append("<h3 style='color:#1a1a3e; margin-top:30px;'>📉 DESCUENTOS LEGALES</h3>");
        html.append("<table>");
        html.append("<tr><th>Concepto</th><th class='amount'>Monto</th></tr>");
        html.append("<tr><td>AFP (10.25%)</td><td class='amount negative'>").append(formatCurrency(-afpAmount)).append("</td></tr>");
        html.append("<tr><td>Salud (7%)</td><td class='amount negative'>").append(formatCurrency(-healthAmount)).append("</td></tr>");
        html.append("<tr><td>Seguro Cesantía (0.6%)</td><td class='amount negative'>").append(formatCurrency(-getInt(payslip, "unemploymentAmount"))).append("</td></tr>");
        html.append("<tr><td>Impuesto Único</td><td class='amount negative'>").append(formatCurrency(-taxAmount)).append("</td></tr>");
        html.append("<tr class='total-row'><td><strong>Total Descuentos</strong></td><td class='amount'><strong>").append(formatCurrency(-totalDeductions)).append("</strong></td></tr>");
        html.append("</table>");
        
        // LÍQUIDO
        html.append("<table style='margin-top:30px;'>");
        html.append("<tr class='net-row'><td><strong>💵 SUELDO LÍQUIDO</strong></td><td class='amount'><strong>").append(formatCurrency(netSalary)).append("</strong></td></tr>");
        html.append("</table>");
        
        html.append("</div>");
        
        // Footer
        html.append("<div class='footer'>");
        html.append("<p>Documento generado automáticamente por RankeatePos ERP</p>");
        html.append("<p>Fecha de emisión: ").append(LocalDate.now().format(DATE_FMT)).append("</p>");
        html.append("</div>");
        
        html.append("</body></html>");
        
        return html.toString().getBytes();
    }
    
    private int getInt(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val == null) return 0;
        if (val instanceof Number) return ((Number) val).intValue();
        return 0;
    }
    
    private String formatCurrency(int amount) {
        String formatted = String.format("%,d", Math.abs(amount)).replace(",", ".");
        return (amount < 0 ? "-" : "") + "$" + formatted;
    }
    
    private String getMonthName(int month) {
        String[] months = {"", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                          "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"};
        return months[month];
    }
}
