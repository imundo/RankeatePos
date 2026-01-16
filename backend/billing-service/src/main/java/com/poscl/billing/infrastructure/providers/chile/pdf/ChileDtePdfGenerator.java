package com.poscl.billing.infrastructure.providers.chile.pdf;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.pdf417.PDF417Writer;
import com.google.zxing.qrcode.QRCodeWriter;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
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
 * Generador profesional de PDF para DTEs chilenos using iText7
 * Diseño estilo recibo térmico con logo, QR y PDF417
 */
@Slf4j
@Component
public class ChileDtePdfGenerator {

        private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

        /**
         * Genera PDF profesional del DTE estilo recibo térmico
         */
        public byte[] generate(Dte dte, String tedData) {
                log.info("📄 Generando PDF estilo recibo para DTE: Tipo={}, Folio={}", dte.getTipoDte(),
                                dte.getFolio());

                try {
                        ByteArrayOutputStream baos = new ByteArrayOutputStream();
                        PdfWriter writer = new PdfWriter(baos);
                        PdfDocument pdf = new PdfDocument(writer);
                        Document document = new Document(pdf, PageSize.A4);
                        document.setMargins(40, 40, 40, 40);

                        // 1. Header estilo recibo con logo y empresa
                        addReceiptHeader(document, dte);

                        // 2. Items table
                        addItemsTable(document, dte);

                        // 3. Totales
                        addTotalsSection(document, dte);

                        // 4. Códigos de barras (PDF417 + QR)
                        if (tedData != null && !tedData.isEmpty()) {
                                addBarcodes(document, tedData);
                        }

                        document.close();

                        log.info("✅ PDF generado exitosamente ({} bytes)", baos.size());
                        return baos.toByteArray();

                } catch (Exception e) {
                        log.error("❌ Error generando PDF: {}", e.getMessage(), e);
                        throw new RuntimeException("Error al generar PDF", e);
                }
        }

        private void addReceiptHeader(Document doc, Dte dte) {
                // Logo - intentar cargar desde URL/path si existe, sino usar placeholder
                try {
                        // Verificar si hay logo URL en el emisor
                        String logoUrl = dte.getEmisorLogoUrl(); // Asumiendo que existe este campo

                        if (logoUrl != null && !logoUrl.isEmpty()) {
                                // Cargar logo real
                                Image logo = new Image(ImageDataFactory.create(logoUrl));
                                logo.setWidth(60);
                                logo.setHeight(60);
                                logo.setHorizontalAlignment(com.itextpdf.layout.properties.HorizontalAlignment.CENTER);
                                logo.setMarginBottom(5);
                                doc.add(logo);
                        } else {
                                // Fallback a placeholder (ícono café)
                                addLogoPlaceholder(doc);
                        }
                } catch (Exception e) {
                        // Si falla la carga del logo, usar placeholder
                        log.warn("No se pudo cargar logo de empresa, usando placeholder: {}", e.getMessage());
                        addLogoPlaceholder(doc);
                }

                // Nombre de empresa - GRANDE y BOLD centrado (DINÁMICO)
                Paragraph companyName = new Paragraph(dte.getEmisorRazonSocial())
                                .setFontSize(18)
                                .setBold()
                                .setTextAlignment(TextAlignment.CENTER)
                                .setMarginBottom(2);
                doc.add(companyName);

                // Giro (DINÁMICO)
                if (dte.getEmisorGiro() != null) {
                        Paragraph giro = new Paragraph(dte.getEmisorGiro())
                                        .setFontSize(9)
                                        .setTextAlignment(TextAlignment.CENTER)
                                        .setMarginBottom(1);
                        doc.add(giro);
                }

                // RUT (DINÁMICO)
                Paragraph rut = new Paragraph("RUT: " + dte.getEmisorRut())
                                .setFontSize(9)
                                .setTextAlignment(TextAlignment.CENTER)
                                .setMarginBottom(1);
                doc.add(rut);

                // Dirección completa (DINÁMICO)
                if (dte.getEmisorDireccion() != null) {
                        String direccionCompleta = dte.getEmisorDireccion();
                        if (dte.getEmisorComuna() != null) {
                                direccionCompleta += ", " + dte.getEmisorComuna();
                        }
                        Paragraph direccion = new Paragraph(direccionCompleta)
                                        .setFontSize(9)
                                        .setTextAlignment(TextAlignment.CENTER)
                                        .setMarginBottom(5);
                        doc.add(direccion);
                }

                // Línea separadora
                doc.add(new Paragraph("- - - - - - - - - - - - - - - - - - - - - - - - - - - -")
                                .setFontSize(8)
                                .setTextAlignment(TextAlignment.CENTER)
                                .setMarginTop(5)
                                .setMarginBottom(5));

                // Tipo de documento y folio
                String docTypeName = dte.getTipoDte().name().replace("_", " ");
                Paragraph docType = new Paragraph(docTypeName + " ELECTRÓNICA")
                                .setFontSize(12)
                                .setBold()
                                .setTextAlignment(TextAlignment.CENTER)
                                .setMarginBottom(2);
                doc.add(docType);

                Paragraph folio = new Paragraph("N° " + String.format("%06d", dte.getFolio()))
                                .setFontSize(11)
                                .setTextAlignment(TextAlignment.CENTER)
                                .setMarginBottom(2);
                doc.add(folio);

                Paragraph fecha = new Paragraph(dte.getFechaEmision().format(DATE_FORMAT))
                                .setFontSize(9)
                                .setTextAlignment(TextAlignment.CENTER)
                                .setMarginBottom(5);
                doc.add(fecha);

                // Otra línea separadora
                doc.add(new Paragraph("- - - - - - - - - - - - - - - - - - - - - - - - - - - -")
                                .setFontSize(8)
                                .setTextAlignment(TextAlignment.CENTER)
                                .setMarginTop(5)
                                .setMarginBottom(10));
        }

        /**
         * Logo placeholder cuando no hay logo de empresa configurado
         */
        private void addLogoPlaceholder(Document doc) {
                Paragraph logoPlaceholder = new Paragraph("☕")
                                .setFontSize(40)
                                .setTextAlignment(TextAlignment.CENTER)
                                .setMarginBottom(5);
                doc.add(logoPlaceholder);
        }

        private void addItemsTable(Document doc, Dte dte) {
                // Tabla simple estilo recibo
                Table itemsTable = new Table(UnitValue.createPercentArray(new float[] { 10, 50, 20, 20 }));
                itemsTable.setWidth(UnitValue.createPercentValue(100));

                // Items sin header, directo
                if (dte.getDetalles() != null && !dte.getDetalles().isEmpty()) {
                        dte.getDetalles().forEach(detalle -> {
                                // Cantidad
                                itemsTable.addCell(new Paragraph(formatNumber(detalle.getCantidad()) + "x")
                                                .setFontSize(9)
                                                .setTextAlignment(TextAlignment.LEFT));

                                // Nombre
                                itemsTable.addCell(new Paragraph(detalle.getNombre())
                                                .setFontSize(9)
                                                .setTextAlignment(TextAlignment.LEFT));

                                // Precio unitario
                                itemsTable.addCell(new Paragraph(formatMoney(detalle.getPrecioUnitario()))
                                                .setFontSize(9)
                                                .setTextAlignment(TextAlignment.RIGHT));

                                // Total
                                itemsTable.addCell(new Paragraph(formatMoney(detalle.getMontoTotal()))
                                                .setFontSize(9)
                                                .setBold()
                                                .setTextAlignment(TextAlignment.RIGHT));
                        });
                }

                doc.add(itemsTable);
                doc.add(new Paragraph("\n").setFontSize(6));
        }

        private void addTotalsSection(Document doc, Dte dte) {
                // Línea separadora
                doc.add(new Paragraph("- - - - - - - - - - - - - - - - - - - - - - - - - - - -")
                                .setFontSize(8)
                                .setTextAlignment(TextAlignment.CENTER)
                                .setMarginTop(5)
                                .setMarginBottom(10));

                // Tabla de totales alineada a la derecha
                Table totalsTable = new Table(UnitValue.createPercentArray(new float[] { 50, 50 }));
                totalsTable.setWidth(UnitValue.createPercentValue(100));

                // Subtotal
                if (dte.getNeto() != null && dte.getNeto().compareTo(BigDecimal.ZERO) > 0) {
                        totalsTable.addCell(new Paragraph("Subtotal:")
                                        .setFontSize(10)
                                        .setTextAlignment(TextAlignment.RIGHT));
                        totalsTable.addCell(new Paragraph(formatMoney(dte.getNeto()))
                                        .setFontSize(10)
                                        .setTextAlignment(TextAlignment.RIGHT));
                }

                // IVA
                if (dte.getIva() != null && dte.getIva().compareTo(BigDecimal.ZERO) > 0) {
                        totalsTable.addCell(new Paragraph("IVA (19%):")
                                        .setFontSize(10)
                                        .setTextAlignment(TextAlignment.RIGHT));
                        totalsTable.addCell(new Paragraph(formatMoney(dte.getIva()))
                                        .setFontSize(10)
                                        .setTextAlignment(TextAlignment.RIGHT));
                }

                // TOTAL grande y bold
                totalsTable.addCell(new Paragraph("Total:")
                                .setFontSize(12)
                                .setBold()
                                .setTextAlignment(TextAlignment.RIGHT));
                totalsTable.addCell(new Paragraph(formatMoney(dte.getTotal()))
                                .setFontSize(12)
                                .setBold()
                                .setTextAlignment(TextAlignment.RIGHT));

                doc.add(totalsTable);
                doc.add(new Paragraph("\n").setFontSize(10));
        }

        private void addBarcodes(Document doc, String tedData) throws WriterException, IOException {
                // PDF417 Barcode
                byte[] pdf417Bytes = generatePDF417Barcode(tedData);
                Image pdf417Img = new Image(ImageDataFactory.create(pdf417Bytes));
                pdf417Img.setHorizontalAlignment(com.itextpdf.layout.properties.HorizontalAlignment.CENTER);
                pdf417Img.setWidth(UnitValue.createPercentValue(90));

                doc.add(pdf417Img);
                doc.add(new Paragraph("High-density PDF-417")
                                .setTextAlignment(TextAlignment.CENTER)
                                .setFontSize(7)
                                .setFontColor(ColorConstants.GRAY)
                                .setMarginTop(3)
                                .setMarginBottom(10));

                // QR Code
                byte[] qrBytes = generateQRCode(tedData);
                Image qrImg = new Image(ImageDataFactory.create(qrBytes));
                qrImg.setHorizontalAlignment(com.itextpdf.layout.properties.HorizontalAlignment.CENTER);
                qrImg.setWidth(120);
                qrImg.setHeight(120);

                doc.add(qrImg);
                doc.add(new Paragraph("Timbre Electrónico SII")
                                .setTextAlignment(TextAlignment.CENTER)
                                .setFontSize(8)
                                .setMarginTop(5));
        }

        /**
         * Genera código de barras PDF417
         */
        public byte[] generatePDF417Barcode(String tedData) throws WriterException, IOException {
                log.info("📊 Generando código de barras PDF417");

                PDF417Writer writer = new PDF417Writer();
                BitMatrix bitMatrix = writer.encode(
                                tedData,
                                BarcodeFormat.PDF_417,
                                500,
                                150);

                BufferedImage image = MatrixToImageWriter.toBufferedImage(bitMatrix);
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                ImageIO.write(image, "PNG", baos);

                log.info("✅ PDF417 generado");
                return baos.toByteArray();
        }

        /**
         * Genera código QR
         */
        public byte[] generateQRCode(String tedData) throws WriterException, IOException {
                log.info("📊 Generando código QR");

                QRCodeWriter writer = new QRCodeWriter();
                BitMatrix bitMatrix = writer.encode(
                                tedData,
                                BarcodeFormat.QR_CODE,
                                200,
                                200);

                BufferedImage image = MatrixToImageWriter.toBufferedImage(bitMatrix);
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                ImageIO.write(image, "PNG", baos);

                log.info("✅ QR generado");
                return baos.toByteArray();
        }

        /**
         * Método de compatibilidad
         */
        public byte[] generateBarcode(String tedData) throws WriterException, IOException {
                return generatePDF417Barcode(tedData);
        }

        // Helper methods
        private String formatNumber(BigDecimal number) {
                return number == null ? "0" : String.format("%.0f", number);
        }

        private String formatMoney(BigDecimal amount) {
                return amount == null ? "$0" : String.format("$%,.0f", amount);
        }
}
