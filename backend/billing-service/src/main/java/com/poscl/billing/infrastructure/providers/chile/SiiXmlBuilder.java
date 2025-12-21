package com.poscl.billing.infrastructure.providers.chile;

import com.poscl.billing.domain.entity.Caf;
import com.poscl.billing.domain.entity.Dte;
import com.poscl.billing.domain.entity.DteDetalle;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * Constructor de XML según esquema DTE del SII de Chile
 * Referencia: https://www.sii.cl/factura_electronica/factura_mercado/formato_dte.htm
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SiiXmlBuilder {

    private static final String ENCODING = "ISO-8859-1";
    private static final String DTE_VERSION = "1.0";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /**
     * Construir XML completo del DTE según esquema SII
     */
    public String buildDteXml(Dte dte, Caf caf) {
        log.debug("Construyendo XML DTE: tipo={}, folio={}", dte.getTipoDte(), dte.getFolio());
        
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"").append(ENCODING).append("\"?>\n");
        xml.append("<DTE version=\"").append(DTE_VERSION).append("\">\n");
        
        // Documento principal
        String documentId = "DTE-" + dte.getTipoDte().getCodigo() + "-" + dte.getFolio();
        xml.append("  <Documento ID=\"").append(documentId).append("\">\n");
        
        // Encabezado
        xml.append(buildEncabezado(dte));
        
        // Detalle
        xml.append(buildDetalle(dte));
        
        // Descuentos/Recargos globales (si aplica)
        // xml.append(buildDscRcgGlobal(dte));
        
        // Referencias (para NC/ND)
        if (dte.getDteReferenciaId() != null) {
            xml.append(buildReferencia(dte));
        }
        
        // TED (Timbre Electrónico del DTE)
        xml.append(buildTed(dte, caf));
        
        // Fecha/Hora firma
        xml.append("    <TmstFirma>").append(java.time.LocalDateTime.now().format(
                DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"))).append("</TmstFirma>\n");
        
        xml.append("  </Documento>\n");
        xml.append("</DTE>");
        
        return xml.toString();
    }

    private String buildEncabezado(Dte dte) {
        StringBuilder sb = new StringBuilder();
        sb.append("    <Encabezado>\n");
        
        // IdDoc
        sb.append("      <IdDoc>\n");
        sb.append("        <TipoDTE>").append(dte.getTipoDte().getCodigo()).append("</TipoDTE>\n");
        sb.append("        <Folio>").append(dte.getFolio()).append("</Folio>\n");
        sb.append("        <FchEmis>").append(formatDate(dte.getFechaEmision())).append("</FchEmis>\n");
        if (dte.getFechaVencimiento() != null) {
            sb.append("        <FchVenc>").append(formatDate(dte.getFechaVencimiento())).append("</FchVenc>\n");
        }
        sb.append("      </IdDoc>\n");
        
        // Emisor
        sb.append("      <Emisor>\n");
        sb.append("        <RUTEmisor>").append(dte.getEmisorRut()).append("</RUTEmisor>\n");
        sb.append("        <RznSoc>").append(escapeXml(dte.getEmisorRazonSocial())).append("</RznSoc>\n");
        if (dte.getEmisorGiro() != null) {
            sb.append("        <GiroEmis>").append(escapeXml(truncate(dte.getEmisorGiro(), 80))).append("</GiroEmis>\n");
        }
        if (dte.getEmisorDireccion() != null) {
            sb.append("        <DirOrigen>").append(escapeXml(truncate(dte.getEmisorDireccion(), 70))).append("</DirOrigen>\n");
        }
        if (dte.getEmisorComuna() != null) {
            sb.append("        <CmnaOrigen>").append(escapeXml(truncate(dte.getEmisorComuna(), 20))).append("</CmnaOrigen>\n");
        }
        if (dte.getEmisorCiudad() != null) {
            sb.append("        <CiudadOrigen>").append(escapeXml(truncate(dte.getEmisorCiudad(), 20))).append("</CiudadOrigen>\n");
        }
        sb.append("      </Emisor>\n");
        
        // Receptor (opcional para boletas)
        if (dte.getReceptorRut() != null && !dte.getReceptorRut().isEmpty()) {
            sb.append("      <Receptor>\n");
            sb.append("        <RUTRecep>").append(dte.getReceptorRut()).append("</RUTRecep>\n");
            if (dte.getReceptorRazonSocial() != null) {
                sb.append("        <RznSocRecep>").append(escapeXml(truncate(dte.getReceptorRazonSocial(), 100))).append("</RznSocRecep>\n");
            }
            if (dte.getReceptorGiro() != null) {
                sb.append("        <GiroRecep>").append(escapeXml(truncate(dte.getReceptorGiro(), 40))).append("</GiroRecep>\n");
            }
            if (dte.getReceptorDireccion() != null) {
                sb.append("        <DirRecep>").append(escapeXml(truncate(dte.getReceptorDireccion(), 70))).append("</DirRecep>\n");
            }
            if (dte.getReceptorComuna() != null) {
                sb.append("        <CmnaRecep>").append(escapeXml(truncate(dte.getReceptorComuna(), 20))).append("</CmnaRecep>\n");
            }
            if (dte.getReceptorCiudad() != null) {
                sb.append("        <CiudadRecep>").append(escapeXml(truncate(dte.getReceptorCiudad(), 20))).append("</CiudadRecep>\n");
            }
            sb.append("      </Receptor>\n");
        }
        
        // Totales
        sb.append("      <Totales>\n");
        if (dte.getMontoNeto() != null) {
            sb.append("        <MntNeto>").append(dte.getMontoNeto().longValue()).append("</MntNeto>\n");
        }
        if (dte.getMontoExento() != null && dte.getMontoExento().longValue() > 0) {
            sb.append("        <MntExe>").append(dte.getMontoExento().longValue()).append("</MntExe>\n");
        }
        if (dte.getTasaIva() != null && dte.getTasaIva() > 0) {
            sb.append("        <TasaIVA>").append(dte.getTasaIva()).append("</TasaIVA>\n");
        }
        if (dte.getMontoIva() != null) {
            sb.append("        <IVA>").append(dte.getMontoIva().longValue()).append("</IVA>\n");
        }
        sb.append("        <MntTotal>").append(dte.getMontoTotal().longValue()).append("</MntTotal>\n");
        sb.append("      </Totales>\n");
        
        sb.append("    </Encabezado>\n");
        return sb.toString();
    }

    private String buildDetalle(Dte dte) {
        StringBuilder sb = new StringBuilder();
        sb.append("    <Detalle>\n");
        
        for (DteDetalle item : dte.getDetalles()) {
            sb.append("      <Item>\n");
            sb.append("        <NroLinDet>").append(item.getNumeroLinea()).append("</NroLinDet>\n");
            
            // Código del item
            if (item.getCodigo() != null && !item.getCodigo().isEmpty()) {
                sb.append("        <CdgItem>\n");
                sb.append("          <TpoCodigo>").append(item.getTipoCodigo() != null ? item.getTipoCodigo() : "INT1").append("</TpoCodigo>\n");
                sb.append("          <VlrCodigo>").append(item.getCodigo()).append("</VlrCodigo>\n");
                sb.append("        </CdgItem>\n");
            }
            
            // Indicador exento
            if (item.isExento()) {
                sb.append("        <IndExe>1</IndExe>\n");
            }
            
            // Nombre del item (max 80 chars - Res. SII N°36)
            sb.append("        <NmbItem>").append(escapeXml(truncate(item.getNombreItem(), 80))).append("</NmbItem>\n");
            
            // Descripción (si excede 80 chars)
            if (item.getDescripcionItem() != null && !item.getDescripcionItem().isEmpty()) {
                sb.append("        <DscItem>").append(escapeXml(truncate(item.getDescripcionItem(), 1000))).append("</DscItem>\n");
            }
            
            // Cantidad
            sb.append("        <QtyItem>").append(formatDecimal(item.getCantidad())).append("</QtyItem>\n");
            
            // Unidad de medida
            if (item.getUnidadMedida() != null && !item.getUnidadMedida().isEmpty()) {
                sb.append("        <UnmdItem>").append(item.getUnidadMedida()).append("</UnmdItem>\n");
            }
            
            // Precio unitario
            sb.append("        <PrcItem>").append(formatDecimal(item.getPrecioUnitario())).append("</PrcItem>\n");
            
            // Descuento (porcentaje o monto)
            if (item.getDescuentoPorcentaje() != null && item.getDescuentoPorcentaje().doubleValue() > 0) {
                sb.append("        <DescuentoPct>").append(formatDecimal(item.getDescuentoPorcentaje())).append("</DescuentoPct>\n");
            }
            if (item.getDescuentoMonto() != null && item.getDescuentoMonto().longValue() > 0) {
                sb.append("        <DescuentoMonto>").append(item.getDescuentoMonto().longValue()).append("</DescuentoMonto>\n");
            }
            
            // Monto del item
            sb.append("        <MontoItem>").append(item.getMontoItem().longValue()).append("</MontoItem>\n");
            
            sb.append("      </Item>\n");
        }
        
        sb.append("    </Detalle>\n");
        return sb.toString();
    }

    private String buildReferencia(Dte dte) {
        StringBuilder sb = new StringBuilder();
        sb.append("    <Referencia>\n");
        sb.append("      <NroLinRef>1</NroLinRef>\n");
        sb.append("      <TpoDocRef>").append(dte.getTipoReferencia()).append("</TpoDocRef>\n");
        sb.append("      <FolioRef>").append(dte.getDteReferenciaId()).append("</FolioRef>\n");
        sb.append("      <FchRef>").append(formatDate(dte.getFechaEmision())).append("</FchRef>\n");
        if (dte.getRazonReferencia() != null) {
            sb.append("      <RazonRef>").append(escapeXml(truncate(dte.getRazonReferencia(), 90))).append("</RazonRef>\n");
        }
        sb.append("    </Referencia>\n");
        return sb.toString();
    }

    /**
     * Construir el TED (Timbre Electrónico del DTE)
     * Este es el elemento que va en el código de barras PDF417
     */
    private String buildTed(Dte dte, Caf caf) {
        StringBuilder sb = new StringBuilder();
        sb.append("    <TED version=\"1.0\">\n");
        
        // DD - Datos del Documento
        sb.append("      <DD>\n");
        sb.append("        <RE>").append(dte.getEmisorRut()).append("</RE>\n");
        sb.append("        <TD>").append(dte.getTipoDte().getCodigo()).append("</TD>\n");
        sb.append("        <F>").append(dte.getFolio()).append("</F>\n");
        sb.append("        <FE>").append(formatDate(dte.getFechaEmision())).append("</FE>\n");
        sb.append("        <RR>").append(dte.getReceptorRut() != null ? dte.getReceptorRut() : "66666666-6").append("</RR>\n");
        sb.append("        <RSR>").append(escapeXml(truncate(
                dte.getReceptorRazonSocial() != null ? dte.getReceptorRazonSocial() : "Sin Receptor", 40)))
                .append("</RSR>\n");
        sb.append("        <MNT>").append(dte.getMontoTotal().longValue()).append("</MNT>\n");
        
        // IT1 - Primer item
        if (!dte.getDetalles().isEmpty()) {
            sb.append("        <IT1>").append(escapeXml(truncate(dte.getDetalles().get(0).getNombreItem(), 40))).append("</IT1>\n");
        }
        
        // CAF - Código de Autorización de Folios (simplificado)
        sb.append("        <CAF version=\"1.0\">\n");
        sb.append("          <DA>\n");
        sb.append("            <RE>").append(dte.getEmisorRut()).append("</RE>\n");
        sb.append("            <RS>").append(escapeXml(truncate(dte.getEmisorRazonSocial(), 40))).append("</RS>\n");
        sb.append("            <TD>").append(dte.getTipoDte().getCodigo()).append("</TD>\n");
        sb.append("            <RNG>\n");
        sb.append("              <D>").append(caf.getFolioDesde()).append("</D>\n");
        sb.append("              <H>").append(caf.getFolioHasta()).append("</H>\n");
        sb.append("            </RNG>\n");
        sb.append("            <FA>").append(formatDate(caf.getFechaAutorizacion())).append("</FA>\n");
        sb.append("            <RSAPK>\n");
        sb.append("              <M>").append(caf.getRsaModulus() != null ? caf.getRsaModulus() : "").append("</M>\n");
        sb.append("              <E>").append(caf.getRsaExponent() != null ? caf.getRsaExponent() : "").append("</E>\n");
        sb.append("            </RSAPK>\n");
        sb.append("            <IDK>1</IDK>\n");
        sb.append("          </DA>\n");
        sb.append("          <FRMA algoritmo=\"SHA1withRSA\"><!-- Firma CAF --></FRMA>\n");
        sb.append("        </CAF>\n");
        
        // TSTED - Timestamp
        sb.append("        <TSTED>").append(java.time.LocalDateTime.now().format(
                DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"))).append("</TSTED>\n");
        
        sb.append("      </DD>\n");
        
        // FRMT - Firma del TED
        sb.append("      <FRMT algoritmo=\"SHA1withRSA\"><!-- Firma TED --></FRMT>\n");
        
        sb.append("    </TED>\n");
        return sb.toString();
    }

    // === Helpers ===
    
    private String formatDate(LocalDate date) {
        return date != null ? date.format(DATE_FORMATTER) : "";
    }

    private String formatDecimal(java.math.BigDecimal value) {
        if (value == null) return "0";
        // SII accepts up to 6 decimals
        return value.stripTrailingZeros().toPlainString();
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
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }
}
