package com.poscl.billing.application.service;

import com.itextpdf.barcodes.BarcodePDF417;
import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.PdfCanvas;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.poscl.billing.api.dto.DteResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
public class PdfService {

    private static final String FONT_BOLD = StandardFonts.HELVETICA_BOLD;
    private static final String FONT_REGULAR = StandardFonts.HELVETICA;

    public byte[] generateDtePdf(DteResponse dte) {
        log.info("Generando PDF para DTE folio {}", dte.getFolio());
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf, PageSize.LETTER);
            document.setMargins(20, 20, 20, 20);

            PdfFont fontBold = PdfFontFactory.createFont(FONT_BOLD);
            PdfFont fontRegular = PdfFontFactory.createFont(FONT_REGULAR);

            // 1. Header (Logo + Emisor + Box Folio)
            Table headerTable = new Table(UnitValue.createPercentArray(new float[] { 2, 4, 3 }));
            headerTable.setWidth(UnitValue.createPercentValue(100));

            // Logo Placeholder
            Cell logoCell = new Cell().add(
                    new Paragraph("LOGO ESTABLECIMIENTO").setBold().setFontSize(14).setFontColor(ColorConstants.GRAY));
            logoCell.setBorder(Border.NO_BORDER);
            headerTable.addCell(logoCell);

            // Emisor Info
            Cell emisorCell = new Cell();
            emisorCell.add(new Paragraph(dte.getEmisorRazonSocial() != null ? dte.getEmisorRazonSocial() : "EMISOR")
                    .setFont(fontBold).setFontSize(12));
            emisorCell.add(new Paragraph(dte.getEmisorGiro() != null ? dte.getEmisorGiro() : "Giro Comercial")
                    .setFont(fontRegular).setFontSize(9));
            emisorCell.add(new Paragraph("RUT: " + dte.getEmisorRut()).setFont(fontRegular).setFontSize(9));
            emisorCell.add(new Paragraph(dte.getEmisorDireccion() + ", " + dte.getEmisorComuna()).setFont(fontRegular)
                    .setFontSize(9));
            emisorCell.setBorder(Border.NO_BORDER);
            headerTable.addCell(emisorCell);

            // Recuadro Rojo (RUT + Tipo DTE + Folio)
            Table folioBox = new Table(1);
            folioBox.setBorder(new SolidBorder(ColorConstants.RED, 2));
            folioBox.setWidth(UnitValue.createPercentValue(100));
            folioBox.addCell(new Cell().add(new Paragraph("R.U.T.: " + dte.getEmisorRut())
                    .setFont(fontBold).setFontSize(14).setFontColor(ColorConstants.RED)
                    .setTextAlignment(TextAlignment.CENTER)).setBorder(Border.NO_BORDER));
            folioBox.addCell(new Cell().add(new Paragraph(dte.getTipoDteDescripcion())
                    .setFont(fontBold).setFontSize(12).setFontColor(ColorConstants.RED)
                    .setTextAlignment(TextAlignment.CENTER)).setBorder(Border.NO_BORDER));
            folioBox.addCell(new Cell().add(new Paragraph("N° " + dte.getFolio())
                    .setFont(fontBold).setFontSize(14).setFontColor(ColorConstants.RED)
                    .setTextAlignment(TextAlignment.CENTER)).setBorder(Border.NO_BORDER));

            Cell folioCell = new Cell().add(folioBox);
            folioCell.setBorder(Border.NO_BORDER);
            folioCell.setTextAlignment(TextAlignment.CENTER);
            headerTable.addCell(folioCell);

            document.add(headerTable);

            // 2. Info Receptor y Fecha
            document.add(new Paragraph("\n"));
            Table infoTable = new Table(UnitValue.createPercentArray(new float[] { 1, 3, 1, 3 }));
            infoTable.setWidth(UnitValue.createPercentValue(100));
            infoTable.setBorder(new SolidBorder(ColorConstants.BLACK, 0.5f));

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

            addInfoRow(infoTable, "Fecha Emisión:", dte.getFechaEmision().format(formatter), fontBold, fontRegular);
            addInfoRow(infoTable, "Señor(es):", dte.getReceptorRazonSocial(), fontBold, fontRegular);
            addInfoRow(infoTable, "R.U.T.:", dte.getReceptorRut(), fontBold, fontRegular);
            addInfoRow(infoTable, "Giro:", "Giro Receptor", fontBold, fontRegular); // Placeholder if missing
            addInfoRow(infoTable, "Dirección:", dte.getEmisorDireccion(), fontBold, fontRegular); // Using emisor addr
                                                                                                  // as default to
                                                                                                  // ensure non-null for
                                                                                                  // now, replace with
                                                                                                  // receptor address
                                                                                                  // logic

            document.add(infoTable);

            // 3. Detalle Items
            document.add(new Paragraph("\n"));
            Table detailsTable = new Table(UnitValue.createPercentArray(new float[] { 1, 4, 1, 2, 2 }));
            detailsTable.setWidth(UnitValue.createPercentValue(100));

            // Headers
            detailsTable.addHeaderCell(new Cell().add(new Paragraph("Cant.").setFont(fontBold).setFontSize(9)));
            detailsTable.addHeaderCell(new Cell().add(new Paragraph("Descripción").setFont(fontBold).setFontSize(9)));
            detailsTable.addHeaderCell(new Cell().add(new Paragraph("Unid.").setFont(fontBold).setFontSize(9)));
            detailsTable.addHeaderCell(new Cell().add(new Paragraph("P.Unitario").setFont(fontBold).setFontSize(9)
                    .setTextAlignment(TextAlignment.RIGHT)));
            detailsTable.addHeaderCell(new Cell().add(
                    new Paragraph("Total").setFont(fontBold).setFontSize(9).setTextAlignment(TextAlignment.RIGHT)));

            // Rows
            if (dte.getDetalles() != null) {
                for (DteResponse.DetalleDto item : dte.getDetalles()) {
                    detailsTable.addCell(new Cell().add(
                            new Paragraph(String.valueOf(item.getCantidad())).setFont(fontRegular).setFontSize(9)));
                    detailsTable.addCell(
                            new Cell().add(new Paragraph(item.getNombreItem()).setFont(fontRegular).setFontSize(9)));
                    detailsTable.addCell(
                            new Cell().add(new Paragraph(item.getUnidadMedida()).setFont(fontRegular).setFontSize(9)));
                    detailsTable.addCell(new Cell().add(new Paragraph(formatCurrency(item.getPrecioUnitario()))
                            .setFont(fontRegular).setFontSize(9).setTextAlignment(TextAlignment.RIGHT)));
                    detailsTable.addCell(new Cell().add(new Paragraph(formatCurrency(item.getMontoItem()))
                            .setFont(fontRegular).setFontSize(9).setTextAlignment(TextAlignment.RIGHT)));
                }
            }

            document.add(detailsTable);

            // 4. Totales
            document.add(new Paragraph("\n"));
            Table totalsTable = new Table(UnitValue.createPercentArray(new float[] { 4, 1 }));
            totalsTable.setWidth(UnitValue.createPercentValue(40));
            totalsTable.setHorizontalAlignment(com.itextpdf.layout.properties.HorizontalAlignment.RIGHT);

            totalsTable.addCell(new Cell().add(new Paragraph("Monto Neto:").setFont(fontBold).setFontSize(10))
                    .setBorder(Border.NO_BORDER).setTextAlignment(TextAlignment.RIGHT));
            totalsTable.addCell(new Cell()
                    .add(new Paragraph(formatCurrency(dte.getMontoNeto())).setFont(fontRegular).setFontSize(10))
                    .setBorder(Border.NO_BORDER).setTextAlignment(TextAlignment.RIGHT));

            totalsTable.addCell(new Cell().add(new Paragraph("IVA (19%):").setFont(fontBold).setFontSize(10))
                    .setBorder(Border.NO_BORDER).setTextAlignment(TextAlignment.RIGHT));
            totalsTable.addCell(new Cell()
                    .add(new Paragraph(formatCurrency(dte.getMontoIva())).setFont(fontRegular).setFontSize(10))
                    .setBorder(Border.NO_BORDER).setTextAlignment(TextAlignment.RIGHT));

            totalsTable.addCell(new Cell().add(new Paragraph("Total:").setFont(fontBold).setFontSize(12))
                    .setBorder(Border.NO_BORDER).setTextAlignment(TextAlignment.RIGHT));
            totalsTable.addCell(
                    new Cell().add(new Paragraph(formatCurrency(dte.getMontoTotal())).setFont(fontBold).setFontSize(12))
                            .setBorder(Border.NO_BORDER).setTextAlignment(TextAlignment.RIGHT));

            document.add(totalsTable);

            // 5. Timbre Electrónico (Simulado con PDF417)
            document.add(new Paragraph("\n\n"));
            String timbreData = "<TED version=\"1.0\"><DD><RE>...</RE><TD>39</TD><F>1</F><FE>2024-01-30</FE><RR>...</RR><RSR>...</RSR><MNT>1000</MNT><IT1>Detalle</IT1><CAF version=\"1.0\"><DA><RE>...</RE><RS>...</RS><TD>39</TD><RNG><D>1</D><H>100</H></RNG><FA>2023-01-01</FA><RSAPK><M>...</M><E>...</E></RSAPK><IDK>100</IDK></DA><FRMA algorithm=\"SHA1withRSA\">...</FRMA></CAF><TSTED>2024-01-30T12:00:00</TSTED></DD><FRMT algorithm=\"SHA1withRSA\">...</FRMT></TED>";

            BarcodePDF417 pdf417 = new BarcodePDF417();
            pdf417.setCode(timbreData);
            // Configuración básica para simular apariencia
            pdf417.setLenCodewords(999);

            // Convertir a imagen
            // Note: En un caso real, se generaría la imagen del barcode y se añadiría.
            // Por simplicidad en este paso, añadimos un texto placeholder si la librería de
            // barcode necesita más config.

            Paragraph timbreLabel = new Paragraph(
                    "Timbre Electrónico SII\nRes. 80 de 2014 - Verifique documento: www.sii.cl")
                    .setFontSize(8)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontColor(ColorConstants.RED);
            document.add(timbreLabel);

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Error generando PDF", e);
            throw new RuntimeException("Error generando PDF", e);
        }
    }

    private void addInfoRow(Table table, String label, String value, PdfFont fontBold, PdfFont fontRegular) {
        table.addCell(
                new Cell().add(new Paragraph(label).setFont(fontBold).setFontSize(9)).setBorder(Border.NO_BORDER));
        table.addCell(new Cell().add(new Paragraph(value != null ? value : "").setFont(fontRegular).setFontSize(9))
                .setBorder(Border.NO_BORDER));
    }

    private String formatCurrency(BigDecimal amount) {
        if (amount == null)
            return "$0";
        return String.format("$%,.0f", amount);
    }
}
