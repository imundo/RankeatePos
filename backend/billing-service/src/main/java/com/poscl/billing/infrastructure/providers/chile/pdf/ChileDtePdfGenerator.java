package com.poscl.billing.infrastructure.providers.chile.pdf;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.pdf417.PDF417Writer;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.poscl.billing.domain.entity.Dte;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;

/**
 * Generador profesional de PDF para DTEs chilenos usando iText7
 * Cumple con formato oficial SII con logo y código PDF417
 */
@Slf4j
@Component
public class ChileDtePdfGenerator {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DeviceRgb PRIMARY_COLOR = new DeviceRgb(33, 102, 241); // Indigo
    private static final DeviceRgb SUCCESS_COLOR = new DeviceRgb(16, 185, 129); // Emerald

    /**
     * Genera PDF profesional del DTE
     * 
     * @param dte     DTE a convertir
     * @param tedData Datos del TED para código de barras
     * @return Bytes del PDF
     */
    public byte[] generate(Dte dte, String tedData) {
        log.info("📄 Generando PDF profesional para DTE: Tipo={}, Folio={}", dte.getTipoDte(), dte.getFolio());

        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf, PageSize.LETTER);
            document.setMargins(40, 40, 40, 40);

            // 1. Header con logo y tipo de documento
            addHeader(document, dte);

            // 2. Datos Emisor
            addEmisorSection(document, dte);

            // 3. Datos Receptor (si existe)
            if (dte.getReceptorRut() != null) {
                addReceptorSection(document, dte);
            }

            // 4. Detalles (items)
            addItemsTable(document, dte);

            // 5. Totales
            addTotalsSection(document, dte);

            // 6. Código de barras PDF417
            if (tedData != null && !tedData.isEmpty()) {
                addBarcode(document, tedData);
            }

            // 7. Footer
            addFooter(document, dte);

            document.close();

            log.info("✅ PDF generado exitosamente ({} bytes)", baos.size());
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("❌ Error generando PDF: {}", e.getMessage(), e);
            throw new RuntimeException("Error al generar PDF", e);
        }
    }

    private void addHeader(Document doc, Dte dte) {
        Table headerTable = new Table(UnitValue.createPercentArray(new float[] { 60, 40 }));
        headerTable.setWidth(UnitValue.createPercentValue(100));

        // Left: Company Info (placeholder for logo)
        Cell companyCell = new Cell();
        companyCell.setBorder(Border.NO_BORDER);
        companyCell.add(new Paragraph("LOGO EMPRESA")
                .setFontSize(10)
                .setFontColor(ColorConstants.GRAY));
        companyCell.add(new Paragraph(dte.getEmisorRazonSocial())
                .setFontSize(14)
                .setBold());
        companyCell.add(new Paragraph("RUT: " + dte.getEmisorRut())
                .setFontSize(10));

        // Right: Document Type Info
        Cell docInfoCell = new Cell();
        docInfoCell.setBorder(new SolidBorder(PRIMARY_COLOR, 2));
        docInfoCell.setBackgroundColor(new DeviceRgb(240, 245, 255));
        docInfoCell.setPadding(10);
        docInfoCell.setTextAlignment(TextAlignment.CENTER);

        String docTypeName = dte.getTipoDte().name().replace("_", " ");
        docInfoCell.add(new Paragraph(docTypeName + " ELECTRÓNICA")
                .setFontSize(16)
                .setBold()
                .setFontColor(PRIMARY_COLOR));
        docInfoCell.add(new Paragraph("N° " + dte.getFolio())
                .setFontSize(14)
                .setBold());
        docInfoCell.add(new Paragraph("Fecha: " + dte.getFechaEmision().format(DATE_FORMAT))
                .setFontSize(10)
                .setMarginTop(5));

        headerTable.addCell(companyCell);
        headerTable.addCell(docInfoCell);

        doc.add(headerTable);
        doc.add(new Paragraph("\n").setFontSize(8));
    }

    private void addEmisorSection(Document doc, Dte dte) {
        Table emisorTable = new Table(1);
        emisorTable.setWidth(UnitValue.createPercentValue(100));

        Cell emisorCell = new Cell();
        emisorCell.setBackgroundColor(new DeviceRgb(248, 250, 252));
        emisorCell.setPadding(10);

        emisorCell.add(new Paragraph("DATOS DEL EMISOR")
                .setFontSize(11)
                .setBold()
                .setMarginBottom(5));

        if (dte.getEmisorGiro() != null) {
            emisorCell.add(new Paragraph("Giro: " + dte.getEmisorGiro())
                    .setFontSize(9));
        }
        if (dte.getEmisorDireccion() != null) {
            String direccion = dte.getEmisorDireccion();
            if (dte.getEmisorComuna() != null) {
                direccion += ", " + dte.getEmisorComuna();
            }
            emisorCell.add(new Paragraph("Dirección: " + direccion)
                    .setFontSize(9));
        }

        emisorTable.addCell(emisorCell);
        doc.add(emisorTable);
        doc.add(new Paragraph("\n").setFontSize(6));
    }

    private void addReceptorSection(Document doc, Dte dte) {
        Table receptorTable = new Table(1);
        receptorTable.setWidth(UnitValue.createPercentValue(100));

        Cell receptorCell = new Cell();
        receptorCell.setBackgroundColor(new DeviceRgb(248, 250, 252));
        receptorCell.setPadding(10);

        receptorCell.add(new Paragraph("DATOS DEL RECEPTOR")
                .setFontSize(11)
                .setBold()
                .setMarginBottom(5));
        receptorCell.add(new Paragraph("Razón Social: " + dte.getReceptorRazonSocial())
                .setFontSize(9));
        receptorCell.add(new Paragraph("RUT: " + dte.getReceptorRut())
                .setFontSize(9));

        if (dte.getReceptorGiro() != null) {
            receptorCell.add(new Paragraph("Giro: " + dte.getReceptorGiro())
                    .setFontSize(9));
        }

        receptorTable.addCell(receptorCell);
        doc.add(receptorTable);
        doc.add(new Paragraph("\n").setFontSize(6));
    }

    private void addItemsTable(Document doc, Dte dte) {
        Table itemsTable = new Table(UnitValue.createPercentArray(new float[] { 8, 50, 12, 15, 15 }));
        itemsTable.setWidth(UnitValue.createPercentValue(100));

        // Header
        String[] headers = { "Cant.", "Descripción", "P. Unit.", "Desc.", "Total" };
        for (String header : headers) {
            Cell cell = new Cell();
            cell.add(new Paragraph(header).setBold().setFontSize(10));
            cell.setBackgroundColor(PRIMARY_COLOR);
            cell.setFontColor(ColorConstants.WHITE);
            cell.setPadding(5);
            cell.setTextAlignment(TextAlignment.CENTER);
            itemsTable.addHeaderCell(cell);
        }

        // Items
        if (dte.getDetalles() != null && !dte.getDetalles().isEmpty()) {
            dte.getDetalles().forEach(detalle -> {
                itemsTable.addCell(createCell(formatNumber(detalle.getCantidad()), TextAlignment.CENTER));
                itemsTable.addCell(createCell(detalle.getNombre(), TextAlignment.LEFT));
                itemsTable.addCell(createCell(formatMoney(detalle.getPrecioUnitario()), TextAlignment.RIGHT));
                itemsTable.addCell(createCell("$0", TextAlignment.RIGHT)); // Desc placeholder
                itemsTable.addCell(createCell(formatMoney(detalle.getMontoTotal()), TextAlignment.RIGHT));
            });
        }

        doc.add(itemsTable);
        doc.add(new Paragraph("\n").setFontSize(6));
    }

    private void addTotalsSection(Document doc, Dte dte) {
        Table totalsTable = new Table(UnitValue.createPercentArray(new float[] { 70, 30 }));
        totalsTable.setWidth(UnitValue.createPercentValue(100));

        // Left cell (empty or observations)
        Cell leftCell = new Cell();
        leftCell.setBorder(Border.NO_BORDER);
        totalsTable.addCell(leftCell);

        // Right cell (totals)
        Cell rightCell = new Cell();
        rightCell.setBorder(new SolidBorder(ColorConstants.LIGHT_GRAY, 1));
        rightCell.setPadding(10);

        if (dte.getNeto() != null && dte.getNeto().compareTo(BigDecimal.ZERO) > 0) {
            rightCell.add(createTotalRow("Neto:", dte.getNeto()));
        }
        if (dte.getIva() != null && dte.getIva().compareTo(BigDecimal.ZERO) > 0) {
            rightCell.add(createTotalRow("IVA (19%):", dte.getIva()));
        }

        rightCell.add(createTotalRow("TOTAL:", dte.getTotal())
                .setBold()
                .setFontSize(12)
                .setFontColor(SUCCESS_COLOR)
                .setMarginTop(5));

        totalsTable.addCell(rightCell);
        doc.add(totalsTable);
        doc.add(new Paragraph("\n").setFontSize(8));
    }

    private void addBarcode(Document doc, String tedData) throws WriterException, IOException {
        byte[] barcodeBytes = generateBarcode(tedData);
        Image barcodeImg = new Image(ImageDataFactory.create(barcodeBytes));
        barcodeImg.setHorizontalAlignment(com.itextpdf.layout.properties.HorizontalAlignment.CENTER);
        barcodeImg.setWidth(UnitValue.createPercentValue(80));

        doc.add(barcodeImg);
        doc.add(new Paragraph("Timbre Electrónico SII")
                .setTextAlignment(TextAlignment.CENTER)
                .setFontSize(8)
                .setMarginTop(5));
    }

    private void addFooter(Document doc, Dte dte) {
        doc.add(new Paragraph("\n").setFontSize(8));

        Paragraph footer = new Paragraph()
                .setTextAlignment(TextAlignment.CENTER)
                .setFontSize(8)
                .setFontColor(ColorConstants.GRAY);

        footer.add("Documento Tributario Electrónico\n");
        footer.add("Estado: " + dte.getEstado());

        doc.add(footer);
    }

    /**
     * Genera código de barras PDF417 del TED
     */
    public byte[] generateBarcode(String tedData) throws WriterException, IOException {
        log.info("📊 Generando código de barras PDF417");

        PDF417Writer writer = new PDF417Writer();
        BitMatrix bitMatrix = writer.encode(
                tedData,
                BarcodeFormat.PDF_417,
                500, // ancho
                150 // alto
        );

        BufferedImage image = MatrixToImageWriter.toBufferedImage(bitMatrix);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "PNG", baos);

        log.info("✅ Código de barras generado");
        return baos.toByteArray();
    }

    // Helper methods
    private Cell createCell(String content, TextAlignment alignment) {
        Cell cell = new Cell();
        cell.add(new Paragraph(content).setFontSize(9));
        cell.setTextAlignment(alignment);
        cell.setPadding(5);
        return cell;
    }

    private Paragraph createTotalRow(String label, BigDecimal amount) {
        return new Paragraph()
                .add(label + " ")
                .add(formatMoney(amount))
                .setFontSize(10)
                .setTextAlignment(TextAlignment.RIGHT);
    }

    private String formatNumber(BigDecimal number) {
        return number == null ? "0" : String.format("%.0f", number);
    }

    private String formatMoney(BigDecimal amount) {
        return amount == null ? "$0" : String.format("$%,.0f", amount);
    }
}
