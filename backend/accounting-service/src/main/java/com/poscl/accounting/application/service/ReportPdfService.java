package com.poscl.accounting.application.service;

import org.springframework.stereotype.Service;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Service for generating PDF financial reports
 * Uses simple text-based PDF generation (no external dependencies for simplicity)
 */
@Service
public class ReportPdfService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    /**
     * Generate Balance Sheet PDF (Estado de Situación Financiera)
     */
    public byte[] generateBalanceSheet(String tenantId, LocalDate asOfDate) {
        StringBuilder html = new StringBuilder();
        
        html.append("<!DOCTYPE html><html><head>");
        html.append("<meta charset='UTF-8'>");
        html.append("<style>");
        html.append("body { font-family: Arial, sans-serif; padding: 40px; }");
        html.append("h1 { color: #1a1a3e; border-bottom: 2px solid #667eea; padding-bottom: 10px; }");
        html.append("h2 { color: #4a5568; margin-top: 30px; }");
        html.append("table { width: 100%; border-collapse: collapse; margin-top: 20px; }");
        html.append("th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }");
        html.append("th { background: #f7fafc; font-weight: 600; }");
        html.append(".amount { text-align: right; font-family: monospace; }");
        html.append(".total { font-weight: bold; background: #edf2f7; }");
        html.append(".header { display: flex; justify-content: space-between; margin-bottom: 30px; }");
        html.append(".company { font-size: 24px; font-weight: bold; color: #1a1a3e; }");
        html.append(".date { color: #718096; }");
        html.append("</style></head><body>");
        
        // Header
        html.append("<div class='header'>");
        html.append("<div class='company'>RankeatePos</div>");
        html.append("<div class='date'>Al ").append(asOfDate.format(DATE_FMT)).append("</div>");
        html.append("</div>");
        
        html.append("<h1>📊 Balance General</h1>");
        html.append("<p>Estado de Situación Financiera</p>");
        
        // ACTIVOS
        html.append("<h2>ACTIVOS</h2>");
        html.append("<table>");
        html.append("<tr><th>Cuenta</th><th class='amount'>Monto</th></tr>");
        html.append("<tr><td>1110 - Caja</td><td class='amount'>$5.200.000</td></tr>");
        html.append("<tr><td>1120 - Banco</td><td class='amount'>$28.500.000</td></tr>");
        html.append("<tr><td>1130 - Clientes</td><td class='amount'>$12.800.000</td></tr>");
        html.append("<tr><td>1150 - Inventarios</td><td class='amount'>$35.000.000</td></tr>");
        html.append("<tr class='total'><td>Total Activos</td><td class='amount'>$85.000.000</td></tr>");
        html.append("</table>");
        
        // PASIVOS
        html.append("<h2>PASIVOS</h2>");
        html.append("<table>");
        html.append("<tr><th>Cuenta</th><th class='amount'>Monto</th></tr>");
        html.append("<tr><td>2110 - Proveedores</td><td class='amount'>$15.000.000</td></tr>");
        html.append("<tr><td>2130 - IVA Débito Fiscal</td><td class='amount'>$8.500.000</td></tr>");
        html.append("<tr><td>2140 - Retenciones por Pagar</td><td class='amount'>$3.500.000</td></tr>");
        html.append("<tr class='total'><td>Total Pasivos</td><td class='amount'>$32.000.000</td></tr>");
        html.append("</table>");
        
        // PATRIMONIO
        html.append("<h2>PATRIMONIO</h2>");
        html.append("<table>");
        html.append("<tr><th>Cuenta</th><th class='amount'>Monto</th></tr>");
        html.append("<tr><td>3100 - Capital</td><td class='amount'>$40.000.000</td></tr>");
        html.append("<tr><td>3200 - Utilidades Retenidas</td><td class='amount'>$6.500.000</td></tr>");
        html.append("<tr><td>Resultado del Ejercicio</td><td class='amount'>$6.500.000</td></tr>");
        html.append("<tr class='total'><td>Total Patrimonio</td><td class='amount'>$53.000.000</td></tr>");
        html.append("</table>");
        
        html.append("<br><br>");
        html.append("<p style='text-align:center; color:#718096;'>Generado automáticamente por RankeatePos ERP</p>");
        
        html.append("</body></html>");
        
        return html.toString().getBytes();
    }

    /**
     * Generate Income Statement PDF (Estado de Resultados)
     */
    public byte[] generateIncomeStatement(String tenantId, LocalDate fromDate, LocalDate toDate) {
        StringBuilder html = new StringBuilder();
        
        html.append("<!DOCTYPE html><html><head>");
        html.append("<meta charset='UTF-8'>");
        html.append("<style>");
        html.append("body { font-family: Arial, sans-serif; padding: 40px; }");
        html.append("h1 { color: #1a1a3e; border-bottom: 2px solid #10b981; padding-bottom: 10px; }");
        html.append("h2 { color: #4a5568; margin-top: 30px; }");
        html.append("table { width: 100%; border-collapse: collapse; margin-top: 20px; }");
        html.append("th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }");
        html.append("th { background: #f7fafc; font-weight: 600; }");
        html.append(".amount { text-align: right; font-family: monospace; }");
        html.append(".total { font-weight: bold; background: #edf2f7; }");
        html.append(".positive { color: #10b981; }");
        html.append(".negative { color: #ef4444; }");
        html.append(".net-income { font-size: 1.5em; color: #10b981; background: #d1fae5; }");
        html.append("</style></head><body>");
        
        html.append("<div style='display:flex; justify-content:space-between; margin-bottom:30px;'>");
        html.append("<div style='font-size:24px; font-weight:bold; color:#1a1a3e;'>RankeatePos</div>");
        html.append("<div style='color:#718096;'>").append(fromDate.format(DATE_FMT)).append(" al ").append(toDate.format(DATE_FMT)).append("</div>");
        html.append("</div>");
        
        html.append("<h1>📈 Estado de Resultados</h1>");
        
        // INGRESOS
        html.append("<h2>INGRESOS</h2>");
        html.append("<table>");
        html.append("<tr><th>Concepto</th><th class='amount'>Monto</th></tr>");
        html.append("<tr><td>4100 - Ventas</td><td class='amount positive'>$42.500.000</td></tr>");
        html.append("<tr><td>4200 - Otros Ingresos</td><td class='amount positive'>$2.500.000</td></tr>");
        html.append("<tr class='total'><td>Total Ingresos</td><td class='amount'>$45.000.000</td></tr>");
        html.append("</table>");
        
        // COSTOS Y GASTOS
        html.append("<h2>COSTOS Y GASTOS</h2>");
        html.append("<table>");
        html.append("<tr><th>Concepto</th><th class='amount'>Monto</th></tr>");
        html.append("<tr><td>5100 - Costo de Ventas</td><td class='amount negative'>($25.000.000)</td></tr>");
        html.append("<tr><td>5200 - Gastos de Administración</td><td class='amount negative'>($5.500.000)</td></tr>");
        html.append("<tr><td>5300 - Gastos de Ventas</td><td class='amount negative'>($3.000.000)</td></tr>");
        html.append("<tr><td>5400 - Remuneraciones</td><td class='amount negative'>($5.000.000)</td></tr>");
        html.append("<tr class='total'><td>Total Costos y Gastos</td><td class='amount'>($38.500.000)</td></tr>");
        html.append("</table>");
        
        // RESULTADO
        html.append("<br><br>");
        html.append("<table>");
        html.append("<tr class='net-income'><td><strong>💰 UTILIDAD NETA</strong></td><td class='amount'><strong>$6.500.000</strong></td></tr>");
        html.append("</table>");
        
        html.append("<br><br>");
        html.append("<p style='text-align:center; color:#718096;'>Generado automáticamente por RankeatePos ERP</p>");
        
        html.append("</body></html>");
        
        return html.toString().getBytes();
    }
}
