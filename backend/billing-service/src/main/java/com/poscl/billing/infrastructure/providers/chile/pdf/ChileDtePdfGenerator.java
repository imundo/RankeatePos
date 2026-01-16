package com.poscl.billing.infrastructure.providers.chile.pdf;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.pdf417.PDF417Writer;
import com.poscl.billing.domain.entity.Dte;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;

/**
 * Generador de PDF para DTEs chilenos
 * Versión simplificada con texto plano + código de barras PDF417
 */
@Slf4j
@Component
public class ChileDtePdfGenerator {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATETIME_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    /**
     * Genera PDF del DTE (versión simplificada sin iText, solo mock)
     * En producción: Usar iText7 para layout profesional
     * 
     * @param dte     DTE a convertir
     * @param tedData Datos del TED para código de barras
     * @return Bytes del PDF
     */
    public byte[] generate(Dte dte, String tedData) {
        log.info("📄 Generando PDF para DTE: Tipo={}, Folio={}", dte.getTipoDte(), dte.getFolio());

        try {
            // Por ahora, generar PDF mock como texto
            String pdfContent = generatePdfContent(dte);

            log.info("✅ PDF generado exitosamente");

            // Retornar como bytes UTF-8 (en producción sería PDF real)
            return pdfContent.getBytes(StandardCharsets.UTF_8);

        } catch (Exception e) {
            log.error("❌ Error generando PDF: {}", e.getMessage());
            throw new RuntimeException("Error al generar PDF", e);
        }
    }

    /**
     * Genera código de barras PDF417 del TED
     * 
     * @param tedData Datos del TED en formato string
     * @return Bytes de la imagen PNG
     */
    public byte[] generateBarcode(String tedData) {
        log.info("📊 Generando código de barras PDF417");

        try {
            PDF417Writer writer = new PDF417Writer();
            BitMatrix bitMatrix = writer.encode(
                    tedData,
                    BarcodeFormat.PDF_417,
                    400, // ancho
                    100 // alto
            );

            BufferedImage image = MatrixToImageWriter.toBufferedImage(bitMatrix);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(image, "PNG", baos);

            log.info("✅ Código de barras generado");
            return baos.toByteArray();

        } catch (WriterException | IOException e) {
            log.error("❌ Error generando código de barras: {}", e.getMessage());
            throw new RuntimeException("Error al generar código de barras", e);
        }
    }

    /**
     * Genera contenido del PDF en formato texto (MOCK)
     * En producción: Usar iText7 para layout real
     */
    private String generatePdfContent(Dte dte) {
        StringBuilder pdf = new StringBuilder();

        pdf.append("═══════════════════════════════════════════════════════════\n");
        pdf.append(String.format("          %s ELECTRÓNICA Nº %d\n",
                dte.getTipoDte().name().replace("_", " "),
                dte.getFolio()));
        pdf.append("═══════════════════════════════════════════════════════════\n\n");

        // Emisor
        pdf.append("EMISOR:\n");
        pdf.append(String.format("  Razón Social: %s\n", dte.getEmisorRazonSocial()));
        pdf.append(String.format("  RUT: %s\n", dte.getEmisorRut()));
        if (dte.getEmisorGiro() != null) {
            pdf.append(String.format("  Giro: %s\n", dte.getEmisorGiro()));
        }
        if (dte.getEmisorDireccion() != null) {
            pdf.append(String.format("  Dirección: %s", dte.getEmisorDireccion()));
            if (dte.getEmisorComuna() != null) {
                pdf.append(String.format(", %s", dte.getEmisorComuna()));
            }
            pdf.append("\n");
        }
        pdf.append("\n");

        // Receptor (si existe)
        if (dte.getReceptorRut() != null) {
            pdf.append("RECEPTOR:\n");
            pdf.append(String.format("  Razón Social: %s\n", dte.getReceptorRazonSocial()));
            pdf.append(String.format("  RUT: %s\n", dte.getReceptorRut()));
            pdf.append("\n");
        }

        // Fecha
        pdf.append(String.format("Fecha Emisión: %s\n", dte.getFechaEmision().format(DATE_FORMAT)));
        pdf.append("\n");

        // Detalle
        pdf.append("───────────────────────────────────────────────────────────\n");
        pdf.append(" CANT  DESCRIPCIÓN                      P.UNIT    TOTAL\n");
        pdf.append("───────────────────────────────────────────────────────────\n");

        if (dte.getDetalles() != null) {
            dte.getDetalles().forEach(detalle -> {
                pdf.append(String.format(" %4s  %-30s  %8s  %8s\n",
                        formatNumber(detalle.getCantidad()),
                        truncate(detalle.getNombre(), 30),
                        formatMoney(detalle.getPrecioUnitario()),
                        formatMoney(detalle.getMontoTotal())));
            });
        }

        pdf.append("───────────────────────────────────────────────────────────\n\n");

        // Totales
        if (dte.getNeto() != null && dte.getNeto().compareTo(BigDecimal.ZERO) > 0) {
            pdf.append(String.format("                                  Neto:  $%,10.0f\n", dte.getNeto()));
        }
        if (dte.getIva() != null && dte.getIva().compareTo(BigDecimal.ZERO) > 0) {
            pdf.append(String.format("                               IVA 19%%:  $%,10.0f\n", dte.getIva()));
        }
        pdf.append(String.format("                                 TOTAL:  $%,10.0f\n", dte.getTotal()));
        pdf.append("\n");

        // Footer
        pdf.append("───────────────────────────────────────────────────────────\n");
        pdf.append("  [CÓDIGO DE BARRAS PDF417 AQUÍ - TED]\n");
        pdf.append("   Timbre Electrónico SII\n");
        pdf.append(String.format("   Documento %s\n", dte.getEstado()));
        pdf.append("───────────────────────────────────────────────────────────\n");

        return pdf.toString();
    }

    private String formatNumber(BigDecimal number) {
        return number == null ? "0" : String.format("%.0f", number);
    }

    private String formatMoney(BigDecimal amount) {
        return amount == null ? "$0" : String.format("$%,.0f", amount);
    }

    private String truncate(String text, int maxLength) {
        if (text == null)
            return "";
        return text.length() > maxLength ? text.substring(0, maxLength - 3) + "..." : text;
    }
}
