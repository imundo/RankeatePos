package com.poscl.billing.infrastructure.providers.chile;

import com.poscl.billing.domain.entity.Dte;
import com.poscl.billing.domain.entity.DteDetalle;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Generador de PDF para DTEs del SII Chile
 * Genera HTML que puede ser convertido a PDF
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SiiPdfGenerator {

    private final SiiTimbreGenerator timbreGenerator;
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final NumberFormat CURRENCY_FORMAT = NumberFormat.getCurrencyInstance(new Locale("es", "CL"));

    /**
     * Generar HTML del documento para impresión/PDF
     */
    public String generateHtml(Dte dte, String tedXml) {
        log.debug("Generando HTML para DTE tipo={}, folio={}", dte.getTipoDte(), dte.getFolio());
        
        String timbreBase64 = timbreGenerator.generatePdf417Base64(dte, tedXml);
        
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html>\n");
        html.append("<html lang=\"es\">\n");
        html.append("<head>\n");
        html.append("  <meta charset=\"UTF-8\">\n");
        html.append("  <title>").append(dte.getTipoDte().getDescripcion())
           .append(" N° ").append(dte.getFolio()).append("</title>\n");
        html.append(getStyles());
        html.append("</head>\n");
        html.append("<body>\n");
        
        html.append("<div class=\"document\">\n");
        
        // Cabecera con datos del emisor y tipo de documento
        html.append(buildHeader(dte));
        
        // Datos del receptor
        html.append(buildReceptor(dte));
        
        // Tabla de detalle
        html.append(buildDetalle(dte));
        
        // Totales
        html.append(buildTotales(dte));
        
        // Timbre electrónico
        html.append(buildTimbre(dte, timbreBase64));
        
        // Pie con información del SII
        html.append(buildFooter(dte));
        
        html.append("</div>\n");
        html.append("</body>\n");
        html.append("</html>");
        
        return html.toString();
    }

    private String getStyles() {
        return """
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #333; }
                .document { max-width: 800px; margin: 20px auto; padding: 20px; }
                .header { display: flex; justify-content: space-between; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #333; }
                .emisor { flex: 1; }
                .emisor h1 { font-size: 18px; margin-bottom: 5px; }
                .emisor p { margin: 2px 0; color: #555; }
                .tipo-doc { text-align: center; border: 2px solid #c00; padding: 10px 20px; color: #c00; }
                .tipo-doc h2 { font-size: 14px; margin-bottom: 5px; }
                .tipo-doc .folio { font-size: 20px; font-weight: bold; }
                .receptor { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 4px; }
                .receptor h3 { margin-bottom: 10px; font-size: 13px; color: #666; }
                .receptor-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
                .receptor-item label { font-weight: bold; color: #666; }
                .detalle { margin-bottom: 20px; }
                .detalle table { width: 100%; border-collapse: collapse; }
                .detalle th { background: #333; color: white; padding: 10px; text-align: left; }
                .detalle td { padding: 8px 10px; border-bottom: 1px solid #ddd; }
                .detalle tr:nth-child(even) { background: #f9f9f9; }
                .detalle .right { text-align: right; }
                .totales { display: flex; justify-content: flex-end; margin-bottom: 20px; }
                .totales-box { background: #333; color: white; padding: 15px 25px; min-width: 250px; }
                .totales-row { display: flex; justify-content: space-between; margin: 5px 0; }
                .totales-row.total { font-size: 16px; font-weight: bold; margin-top: 10px; padding-top: 10px; border-top: 1px solid #555; }
                .timbre { text-align: center; margin: 20px 0; padding: 15px; border: 1px dashed #999; }
                .timbre img { max-width: 400px; }
                .timbre p { margin-top: 10px; font-size: 10px; color: #666; }
                .footer { text-align: center; font-size: 10px; color: #999; border-top: 1px solid #ddd; padding-top: 15px; }
                @media print { .document { margin: 0; } }
            </style>
            """;
    }

    private String buildHeader(Dte dte) {
        StringBuilder sb = new StringBuilder();
        sb.append("<div class=\"header\">\n");
        
        // Datos del emisor
        sb.append("  <div class=\"emisor\">\n");
        sb.append("    <h1>").append(escapeHtml(dte.getEmisorRazonSocial())).append("</h1>\n");
        sb.append("    <p><strong>RUT:</strong> ").append(dte.getEmisorRut()).append("</p>\n");
        if (dte.getEmisorGiro() != null) {
            sb.append("    <p><strong>Giro:</strong> ").append(escapeHtml(dte.getEmisorGiro())).append("</p>\n");
        }
        if (dte.getEmisorDireccion() != null) {
            sb.append("    <p>").append(escapeHtml(dte.getEmisorDireccion()));
            if (dte.getEmisorComuna() != null) {
                sb.append(", ").append(escapeHtml(dte.getEmisorComuna()));
            }
            sb.append("</p>\n");
        }
        sb.append("  </div>\n");
        
        // Tipo de documento y folio
        sb.append("  <div class=\"tipo-doc\">\n");
        sb.append("    <h2>").append(dte.getTipoDte().getDescripcion().toUpperCase()).append("</h2>\n");
        sb.append("    <div class=\"folio\">N° ").append(dte.getFolio()).append("</div>\n");
        sb.append("    <p>").append(dte.getFechaEmision().format(DATE_FORMATTER)).append("</p>\n");
        sb.append("  </div>\n");
        
        sb.append("</div>\n");
        return sb.toString();
    }

    private String buildReceptor(Dte dte) {
        StringBuilder sb = new StringBuilder();
        sb.append("<div class=\"receptor\">\n");
        sb.append("  <h3>DATOS DEL RECEPTOR</h3>\n");
        sb.append("  <div class=\"receptor-grid\">\n");
        
        if (dte.getReceptorRut() != null) {
            sb.append("    <div class=\"receptor-item\"><label>RUT:</label> ").append(dte.getReceptorRut()).append("</div>\n");
        }
        if (dte.getReceptorRazonSocial() != null) {
            sb.append("    <div class=\"receptor-item\"><label>Razón Social:</label> ").append(escapeHtml(dte.getReceptorRazonSocial())).append("</div>\n");
        }
        if (dte.getReceptorGiro() != null) {
            sb.append("    <div class=\"receptor-item\"><label>Giro:</label> ").append(escapeHtml(dte.getReceptorGiro())).append("</div>\n");
        }
        if (dte.getReceptorDireccion() != null) {
            sb.append("    <div class=\"receptor-item\"><label>Dirección:</label> ").append(escapeHtml(dte.getReceptorDireccion()));
            if (dte.getReceptorComuna() != null) {
                sb.append(", ").append(escapeHtml(dte.getReceptorComuna()));
            }
            sb.append("</div>\n");
        }
        
        sb.append("  </div>\n");
        sb.append("</div>\n");
        return sb.toString();
    }

    private String buildDetalle(Dte dte) {
        StringBuilder sb = new StringBuilder();
        sb.append("<div class=\"detalle\">\n");
        sb.append("  <table>\n");
        sb.append("    <thead>\n");
        sb.append("      <tr>\n");
        sb.append("        <th>Código</th>\n");
        sb.append("        <th>Descripción</th>\n");
        sb.append("        <th class=\"right\">Cant.</th>\n");
        sb.append("        <th class=\"right\">P. Unit.</th>\n");
        sb.append("        <th class=\"right\">Total</th>\n");
        sb.append("      </tr>\n");
        sb.append("    </thead>\n");
        sb.append("    <tbody>\n");
        
        for (DteDetalle item : dte.getDetalles()) {
            sb.append("      <tr>\n");
            sb.append("        <td>").append(item.getCodigo() != null ? item.getCodigo() : "-").append("</td>\n");
            sb.append("        <td>").append(escapeHtml(item.getNombreItem())).append("</td>\n");
            sb.append("        <td class=\"right\">").append(item.getCantidad().stripTrailingZeros().toPlainString()).append("</td>\n");
            sb.append("        <td class=\"right\">").append(formatCurrency(item.getPrecioUnitario().longValue())).append("</td>\n");
            sb.append("        <td class=\"right\">").append(formatCurrency(item.getMontoItem().longValue())).append("</td>\n");
            sb.append("      </tr>\n");
        }
        
        sb.append("    </tbody>\n");
        sb.append("  </table>\n");
        sb.append("</div>\n");
        return sb.toString();
    }

    private String buildTotales(Dte dte) {
        StringBuilder sb = new StringBuilder();
        sb.append("<div class=\"totales\">\n");
        sb.append("  <div class=\"totales-box\">\n");
        
        if (dte.getMontoNeto() != null && dte.getMontoNeto().longValue() > 0) {
            sb.append("    <div class=\"totales-row\"><span>Neto</span><span>")
              .append(formatCurrency(dte.getMontoNeto().longValue())).append("</span></div>\n");
        }
        if (dte.getMontoExento() != null && dte.getMontoExento().longValue() > 0) {
            sb.append("    <div class=\"totales-row\"><span>Exento</span><span>")
              .append(formatCurrency(dte.getMontoExento().longValue())).append("</span></div>\n");
        }
        if (dte.getMontoIva() != null && dte.getMontoIva().longValue() > 0) {
            sb.append("    <div class=\"totales-row\"><span>IVA (").append(dte.getTasaIva()).append("%)</span><span>")
              .append(formatCurrency(dte.getMontoIva().longValue())).append("</span></div>\n");
        }
        sb.append("    <div class=\"totales-row total\"><span>TOTAL</span><span>")
          .append(formatCurrency(dte.getMontoTotal().longValue())).append("</span></div>\n");
        
        sb.append("  </div>\n");
        sb.append("</div>\n");
        return sb.toString();
    }

    private String buildTimbre(Dte dte, String timbreBase64) {
        StringBuilder sb = new StringBuilder();
        sb.append("<div class=\"timbre\">\n");
        
        if (timbreBase64 != null && !timbreBase64.isEmpty()) {
            sb.append("  <img src=\"data:image/png;base64,").append(timbreBase64).append("\" alt=\"Timbre Electrónico\" />\n");
        } else {
            sb.append("  <p style=\"color: #999;\">[Timbre Electrónico]</p>\n");
        }
        
        sb.append("  <p>Timbre Electrónico SII - Res. ").append(dte.getFechaEmision().getYear())
          .append(" - Verifique en www.sii.cl</p>\n");
        sb.append("</div>\n");
        return sb.toString();
    }

    private String buildFooter(Dte dte) {
        return """
            <div class="footer">
                <p>Este documento tributario electrónico ha sido emitido de acuerdo a la Ley 19.799</p>
                <p>Puede verificar su autenticidad en www.sii.cl</p>
            </div>
            """;
    }

    private String formatCurrency(long value) {
        return "$" + String.format("%,d", value).replace(',', '.');
    }

    private String escapeHtml(String value) {
        if (value == null) return "";
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
