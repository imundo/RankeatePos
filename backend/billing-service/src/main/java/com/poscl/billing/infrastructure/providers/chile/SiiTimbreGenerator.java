package com.poscl.billing.infrastructure.providers.chile;

import com.poscl.billing.domain.entity.Dte;
import com.poscl.billing.domain.entity.DteDetalle;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.pdf417.PDF417Writer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * Generador de Timbre Electrónico en formato PDF417
 * El timbre contiene el TED (Timbre Electrónico del DTE) codificado
 */
@Slf4j
@Component
public class SiiTimbreGenerator {

    private static final int PDF417_WIDTH = 400;
    private static final int PDF417_HEIGHT = 120;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /**
     * Generar código PDF417 con el TED del documento
     * @param dte Documento
     * @param tedXml XML del TED (Timbre Electrónico del DTE)
     * @return Bytes de la imagen PNG del código PDF417
     */
    public byte[] generatePdf417(Dte dte, String tedXml) {
        log.debug("Generando PDF417 para DTE tipo={}, folio={}", dte.getTipoDte(), dte.getFolio());
        
        try {
            PDF417Writer writer = new PDF417Writer();
            
            Map<EncodeHintType, Object> hints = new HashMap<>();
            hints.put(EncodeHintType.MARGIN, 1);
            hints.put(EncodeHintType.ERROR_CORRECTION, 5); // Nivel de corrección de errores
            
            // El contenido del PDF417 es el XML del TED
            String content = tedXml != null ? tedXml : buildSimpleTed(dte);
            
            BitMatrix bitMatrix = writer.encode(content, BarcodeFormat.PDF_417, PDF417_WIDTH, PDF417_HEIGHT, hints);
            BufferedImage image = MatrixToImageWriter.toBufferedImage(bitMatrix);
            
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(image, "PNG", baos);
            
            log.debug("PDF417 generado: {} bytes", baos.size());
            return baos.toByteArray();
            
        } catch (Exception e) {
            log.error("Error generando PDF417: {}", e.getMessage(), e);
            return new byte[0];
        }
    }

    /**
     * Construir TED simplificado si no se proporciona
     */
    private String buildSimpleTed(Dte dte) {
        StringBuilder ted = new StringBuilder();
        ted.append("<TED version=\"1.0\">");
        ted.append("<DD>");
        ted.append("<RE>").append(dte.getEmisorRut()).append("</RE>");
        ted.append("<TD>").append(dte.getTipoDte().getCodigo()).append("</TD>");
        ted.append("<F>").append(dte.getFolio()).append("</F>");
        ted.append("<FE>").append(dte.getFechaEmision().format(DATE_FORMATTER)).append("</FE>");
        ted.append("<RR>").append(dte.getReceptorRut() != null ? dte.getReceptorRut() : "66666666-6").append("</RR>");
        ted.append("<RSR>").append(escapeXml(truncate(
                dte.getReceptorRazonSocial() != null ? dte.getReceptorRazonSocial() : "SIN RECEPTOR", 40)))
                .append("</RSR>");
        ted.append("<MNT>").append(dte.getMontoTotal().longValue()).append("</MNT>");
        
        // Primer item
        if (!dte.getDetalles().isEmpty()) {
            DteDetalle item = dte.getDetalles().get(0);
            ted.append("<IT1>").append(escapeXml(truncate(item.getNombreItem(), 40))).append("</IT1>");
        }
        
        ted.append("</DD>");
        ted.append("</TED>");
        
        return ted.toString();
    }

    /**
     * Generar imagen del timbre como Base64 para incrustar en HTML/PDF
     */
    public String generatePdf417Base64(Dte dte, String tedXml) {
        byte[] imageBytes = generatePdf417(dte, tedXml);
        if (imageBytes.length == 0) return "";
        return java.util.Base64.getEncoder().encodeToString(imageBytes);
    }

    private String truncate(String value, int maxLength) {
        if (value == null) return "";
        return value.length() > maxLength ? value.substring(0, maxLength) : value;
    }

    private String escapeXml(String value) {
        if (value == null) return "";
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;");
    }
}
