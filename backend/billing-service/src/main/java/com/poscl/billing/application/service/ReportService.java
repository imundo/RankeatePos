package com.poscl.billing.application.service;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.poscl.billing.domain.entity.Dte;
import com.poscl.billing.domain.repository.DteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final DteRepository dteRepository;
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public byte[] generateLibroVentasExcel(UUID tenantId, LocalDate from, LocalDate to) {
        List<Dte> dtes = dteRepository.findAllByTenantIdAndFechaEmisionBetween(tenantId, from, to);

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Libro de Ventas");

            // Header Style
            CellStyle headerStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Create Header
            Row header = sheet.createRow(0);
            String[] headers = { "Tipo Doc", "Folio", "Fecha", "RUT Receptor", "Razón Social", "Monto Neto",
                    "Monto IVA", "Monto Total", "Estado" };
            for (int i = 0; i < headers.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = header.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Fill Data
            int rowIdx = 1;
            for (Dte dte : dtes) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(dte.getTipoDte().getCodigo());
                row.createCell(1).setCellValue(dte.getFolio());
                row.createCell(2).setCellValue(dte.getFechaEmision().format(DATE_FMT));
                row.createCell(3).setCellValue(dte.getReceptorRut() != null ? dte.getReceptorRut() : "—");
                row.createCell(4)
                        .setCellValue(dte.getReceptorRazonSocial() != null ? dte.getReceptorRazonSocial() : "—");

                // Handle BigDecimals for Excel (double)
                row.createCell(5).setCellValue(dte.getMontoNeto() != null ? dte.getMontoNeto().doubleValue() : 0.0);
                row.createCell(6).setCellValue(dte.getMontoIva() != null ? dte.getMontoIva().doubleValue() : 0.0);
                row.createCell(7).setCellValue(dte.getMontoTotal() != null ? dte.getMontoTotal().doubleValue() : 0.0);

                row.createCell(8).setCellValue(dte.getEstado().name());
            }

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Error generating Excel report", e);
            throw new RuntimeException("Error generating Excel report", e);
        }
    }

    public byte[] generateLibroVentasPdf(UUID tenantId, LocalDate from, LocalDate to) {
        List<Dte> dtes = dteRepository.findAllByTenantIdAndFechaEmisionBetween(tenantId, from, to);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(out);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf, PageSize.A4.rotate()); // Landscape
            document.setMargins(20, 20, 20, 20);

            // Title
            Paragraph title = new Paragraph("LIBRO DE VENTAS")
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontSize(16)
                    .setBold();
            document.add(title);

            Paragraph subtitle = new Paragraph("Período: " + from.format(DATE_FMT) + " al " + to.format(DATE_FMT))
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontSize(12)
                    .setMarginBottom(20);
            document.add(subtitle);

            // Table
            float[] columnWidths = { 3, 2, 2, 3, 5, 2, 2, 2, 2 };
            Table table = new Table(UnitValue.createPercentArray(columnWidths));
            table.setWidth(UnitValue.createPercentValue(100));

            // Headers
            String[] headers = { "Tipo", "Folio", "Fecha", "RUT", "Razón Social", "Neto", "IVA", "Total", "Estado" };
            for (String h : headers) {
                table.addHeaderCell(new Cell().add(new Paragraph(h).setBold().setFontSize(9))
                        .setBackgroundColor(ColorConstants.LIGHT_GRAY));
            }

            // Data
            BigDecimal totalNeto = BigDecimal.ZERO;
            BigDecimal totalIva = BigDecimal.ZERO;
            BigDecimal totalGral = BigDecimal.ZERO;

            for (Dte dte : dtes) {
                table.addCell(new Paragraph(String.valueOf(dte.getTipoDte().getCodigo())).setFontSize(8));
                table.addCell(new Paragraph(String.valueOf(dte.getFolio())).setFontSize(8)); // Fixed:
                                                                                             // String.valueOf(int)
                table.addCell(new Paragraph(dte.getFechaEmision().format(DATE_FMT)).setFontSize(8));
                table.addCell(new Paragraph(dte.getReceptorRut() != null ? dte.getReceptorRut() : "—").setFontSize(8));
                table.addCell(new Paragraph(dte.getReceptorRazonSocial() != null ? dte.getReceptorRazonSocial() : "—")
                        .setFontSize(8));

                BigDecimal neto = dte.getMontoNeto() != null ? dte.getMontoNeto() : BigDecimal.ZERO;
                BigDecimal iva = dte.getMontoIva() != null ? dte.getMontoIva() : BigDecimal.ZERO;
                BigDecimal total = dte.getMontoTotal() != null ? dte.getMontoTotal() : BigDecimal.ZERO;

                table.addCell(new Paragraph(formatCurrency(neto)).setFontSize(8).setTextAlignment(TextAlignment.RIGHT));
                table.addCell(new Paragraph(formatCurrency(iva)).setFontSize(8).setTextAlignment(TextAlignment.RIGHT));
                table.addCell(
                        new Paragraph(formatCurrency(total)).setFontSize(8).setTextAlignment(TextAlignment.RIGHT));
                table.addCell(new Paragraph(dte.getEstado().name()).setFontSize(8));

                totalNeto = totalNeto.add(neto);
                totalIva = totalIva.add(iva);
                totalGral = totalGral.add(total);
            }

            // Totals Row
            table.addCell(
                    new Cell(1, 4).add(new Paragraph("TOTALES").setBold()).setTextAlignment(TextAlignment.CENTER));
            table.addCell(new Paragraph("").setBold()); // Empty for Razon Social
            table.addCell(new Paragraph(formatCurrency(totalNeto)).setBold().setFontSize(8)
                    .setTextAlignment(TextAlignment.RIGHT));
            table.addCell(new Paragraph(formatCurrency(totalIva)).setBold().setFontSize(8)
                    .setTextAlignment(TextAlignment.RIGHT));
            table.addCell(new Paragraph(formatCurrency(totalGral)).setBold().setFontSize(8)
                    .setTextAlignment(TextAlignment.RIGHT));
            table.addCell("");

            document.add(table);
            document.close();

            return out.toByteArray();
        } catch (Exception e) {
            log.error("Error generating PDF report", e);
            throw new RuntimeException("Error generating PDF report", e);
        }
    }

    private String formatCurrency(BigDecimal amount) {
        return "$ " + amount.longValue(); // Simple formatting for now
    }
}
