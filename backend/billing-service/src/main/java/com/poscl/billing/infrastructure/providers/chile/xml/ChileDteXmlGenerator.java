package com.poscl.billing.infrastructure.providers.chile.xml;

import com.poscl.billing.api.dto.EmitirDteRequest;
import com.poscl.billing.domain.entity.Dte;
import com.poscl.billing.domain.enums.TipoDte;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import java.io.StringWriter;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;

/**
 * Generador de XML para DTEs chilenos según esquema SII v1.0
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ChileDteXmlGenerator {

    private static final String XMLNS = "http://www.sii.cl/SiiDte";
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /**
     * Genera XML completo del DTE
     *
     * @param dte               Entidad DTE
     * @param request           Request de emisión
     * @param emisorRut         RUT del emisor
     * @param emisorRazonSocial Razón social del emisor
     * @return XML como String
     */
    public String generarXml(Dte dte, EmitirDteRequest request, String emisorRut,
            String emisorRazonSocial, String emisorGiro,
            String emisorDireccion, String emisorComuna) throws Exception {

        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        DocumentBuilder builder = factory.newDocumentBuilder();
        Document doc = builder.newDocument();

        // Root: DTE
        Element rootElement = doc.createElement("DTE");
        rootElement.setAttribute("version", "1.0");
        rootElement.setAttribute("xmlns", XMLNS);
        doc.appendChild(rootElement);

        // Documento
        Element documento = doc.createElement("Documento");
        String docId = "T" + dte.getTipoDte().getCodigo() + "F" + dte.getFolio();
        documento.setAttribute("ID", docId);
        rootElement.appendChild(documento);

        // Encabezado
        Element encabezado = crearEncabezado(doc, dte, request, emisorRut, emisorRazonSocial,
                emisorGiro, emisorDireccion, emisorComuna);
        documento.appendChild(encabezado);

        // Detalles
        if (request.getItems() != null) {
            for (int i = 0; i < request.getItems().size(); i++) {
                EmitirDteRequest.ItemDto item = request.getItems().get(i);
                Element detalle = crearDetalle(doc, i + 1, item);
                documento.appendChild(detalle);
            }
        }

        // TODO: TED se agregará después por TedGenerator

        return documentToString(doc);
    }

    /**
     * Crea el nodo Encabezado
     */
    private Element crearEncabezado(Document doc, Dte dte, EmitirDteRequest request,
            String emisorRut, String emisorRazonSocial,
            String emisorGiro, String emisorDireccion,
            String emisorComuna) {
        Element encabezado = doc.createElement("Encabezado");

        // IdDoc
        Element idDoc = doc.createElement("IdDoc");

        Element tipoDte = doc.createElement("TipoDTE");
        tipoDte.setTextContent(String.valueOf(dte.getTipoDte().getCodigo()));
        idDoc.appendChild(tipoDte);

        Element folio = doc.createElement("Folio");
        folio.setTextContent(String.valueOf(dte.getFolio()));
        idDoc.appendChild(folio);

        Element fchEmis = doc.createElement("FchEmis");
        fchEmis.setTextContent(dte.getFechaEmision().format(DATE_FORMAT));
        idDoc.appendChild(fchEmis);

        // Indicador de servicio (solo para boletas)
        if (dte.getTipoDte() == TipoDte.BOLETA_ELECTRONICA ||
                dte.getTipoDte() == TipoDte.BOLETA_EXENTA) {
            Element indServicio = doc.createElement("IndServicio");
            indServicio.setTextContent("3"); // 3 = Venta y servicio
            idDoc.appendChild(indServicio);
        }

        encabezado.appendChild(idDoc);

        // Emisor
        Element emisor = doc.createElement("Emisor");

        Element rutEmisor = doc.createElement("RUTEmisor");
        rutEmisor.setTextContent(emisorRut);
        emisor.appendChild(rutEmisor);

        Element rznSoc = doc.createElement("RznSoc");
        rznSoc.setTextContent(emisorRazonSocial);
        emisor.appendChild(rznSoc);

        if (emisorGiro != null && !emisorGiro.isEmpty()) {
            Element giroEmis = doc.createElement("GiroEmis");
            giroEmis.setTextContent(emisorGiro);
            emisor.appendChild(giroEmis);
        }

        if (emisorDireccion != null && !emisorDireccion.isEmpty()) {
            Element dirOrigen = doc.createElement("DirOrigen");
            dirOrigen.setTextContent(emisorDireccion);
            emisor.appendChild(dirOrigen);
        }

        if (emisorComuna != null && !emisorComuna.isEmpty()) {
            Element cmnaOrigen = doc.createElement("CmnaOrigen");
            cmnaOrigen.setTextContent(emisorComuna);
            emisor.appendChild(cmnaOrigen);
        }

        encabezado.appendChild(emisor);

        // Receptor (solo si es factura o tiene datos)
        if (request.getReceptorRut() != null && !request.getReceptorRut().trim().isEmpty()) {
            Element receptor = doc.createElement("Receptor");

            Element rutRecep = doc.createElement("RUTRecep");
            rutRecep.setTextContent(request.getReceptorRut());
            receptor.appendChild(rutRecep);

            if (request.getReceptorRazonSocial() != null && !request.getReceptorRazonSocial().isEmpty()) {
                Element rznSocRecep = doc.createElement("RznSocRecep");
                rznSocRecep.setTextContent(request.getReceptorRazonSocial());
                receptor.appendChild(rznSocRecep);
            }

            if (request.getReceptorDireccion() != null && !request.getReceptorDireccion().isEmpty()) {
                Element dirRecep = doc.createElement("DirRecep");
                dirRecep.setTextContent(request.getReceptorDireccion());
                receptor.appendChild(dirRecep);
            }

            if (request.getReceptorComuna() != null && !request.getReceptorComuna().isEmpty()) {
                Element cmnaRecep = doc.createElement("CmnaRecep");
                cmnaRecep.setTextContent(request.getReceptorComuna());
                receptor.appendChild(cmnaRecep);
            }

            encabezado.appendChild(receptor);
        }

        // Totales
        Element totales = doc.createElement("Totales");

        if (dte.getNeto() != null && dte.getNeto().compareTo(BigDecimal.ZERO) > 0) {
            Element mntNeto = doc.createElement("MntNeto");
            mntNeto.setTextContent(dte.getNeto().setScale(0).toString());
            totales.appendChild(mntNeto);
        }

        if (dte.getExento() != null && dte.getExento().compareTo(BigDecimal.ZERO) > 0) {
            Element mntExe = doc.createElement("MntExe");
            mntExe.setTextContent(dte.getExento().setScale(0).toString());
            totales.appendChild(mntExe);
        }

        if (dte.getIva() != null && dte.getIva().compareTo(BigDecimal.ZERO) > 0) {
            Element iva = doc.createElement("IVA");
            iva.setTextContent(dte.getIva().setScale(0).toString());
            totales.appendChild(iva);
        }

        Element mntTotal = doc.createElement("MntTotal");
        mntTotal.setTextContent(dte.getTotal().setScale(0).toString());
        totales.appendChild(mntTotal);

        encabezado.appendChild(totales);

        return encabezado;
    }

    /**
     * Crea un nodo Detalle (item)
     */
    private Element crearDetalle(Document doc, int nroLinea, EmitirDteRequest.ItemDto item) {
        Element detalle = doc.createElement("Detalle");

        Element nroLinDet = doc.createElement("NroLinDet");
        nroLinDet.setTextContent(String.valueOf(nroLinea));
        detalle.appendChild(nroLinDet);

        Element nmbItem = doc.createElement("NmbItem");
        nmbItem.setTextContent(item.getNombreItem());
        detalle.appendChild(nmbItem);

        if (item.getDescripcionItem() != null && !item.getDescripcionItem().isEmpty()) {
            Element dscItem = doc.createElement("DscItem");
            dscItem.setTextContent(item.getDescripcionItem());
            detalle.appendChild(dscItem);
        }

        Element qtyItem = doc.createElement("QtyItem");
        qtyItem.setTextContent(String.valueOf(item.getCantidad()));
        detalle.appendChild(qtyItem);

        Element prcItem = doc.createElement("PrcItem");
        prcItem.setTextContent(item.getPrecioUnitario().setScale(0).toString());
        detalle.appendChild(prcItem);

        Element montoItem = doc.createElement("MontoItem");
        montoItem.setTextContent(item.getMontoTotal().setScale(0).toString());
        detalle.appendChild(montoItem);

        return detalle;
    }

    /**
     * Convierte Document a String
     */
    private String documentToString(Document doc) throws Exception {
        TransformerFactory tf = TransformerFactory.newInstance();
        Transformer transformer = tf.newTransformer();
        transformer.setOutputProperty(OutputKeys.ENCODING, "ISO-8859-1");
        transformer.setOutputProperty(OutputKeys.INDENT, "yes");
        transformer.setOutputProperty("{http://xml.apache.org/xslt}indent-amount", "2");

        StringWriter writer = new StringWriter();
        transformer.transform(new DOMSource(doc), new StreamResult(writer));
        return writer.toString();
    }
}
