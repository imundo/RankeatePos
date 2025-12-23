package com.poscl.billing.infrastructure.sii;

import com.poscl.billing.domain.entity.Dte;
import com.poscl.billing.domain.entity.DteDetalle;
import com.poscl.billing.domain.enums.TipoDte;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

/**
 * Generador del Set de Pruebas para Certificación SII
 * 
 * El SII requiere un conjunto específico de documentos para aprobar la
 * certificación.
 * Este servicio genera automáticamente todos los casos de prueba requeridos.
 * 
 * Referencia: https://www.sii.cl/factura_electronica/
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SiiCertificationService {

    private static final BigDecimal IVA_RATE = new BigDecimal("0.19");
    private static final String RUT_SII = "60803000-K"; // RUT del SII para pruebas

    /**
     * Genera el set completo de documentos de prueba para certificación
     */
    public List<CertificationTestCase> generateTestSet(String emisorRut, String emisorRazonSocial) {
        log.info("Generando set de pruebas de certificación para {}", emisorRut);

        List<CertificationTestCase> testCases = new ArrayList<>();

        // === FACTURAS ELECTRÓNICAS (33) ===
        testCases.add(createFacturaAfecta(1, emisorRut, emisorRazonSocial));
        testCases.add(createFacturaExenta(2, emisorRut, emisorRazonSocial));
        testCases.add(createFacturaConDescuento(3, emisorRut, emisorRazonSocial));
        testCases.add(createFacturaConRecargo(4, emisorRut, emisorRazonSocial));

        // === BOLETAS ELECTRÓNICAS (39) ===
        testCases.add(createBoletaSimple(5, emisorRut, emisorRazonSocial));
        testCases.add(createBoletaConDescuento(6, emisorRut, emisorRazonSocial));

        // === NOTAS DE CRÉDITO (61) ===
        testCases.add(createNotaCreditoAnulacion(7, emisorRut, emisorRazonSocial));
        testCases.add(createNotaCreditoDescuento(8, emisorRut, emisorRazonSocial));

        // === NOTAS DE DÉBITO (56) ===
        testCases.add(createNotaDebitoIntereses(9, emisorRut, emisorRazonSocial));

        // === GUÍAS DE DESPACHO (52) ===
        testCases.add(createGuiaDespacho(10, emisorRut, emisorRazonSocial));

        log.info("Set de pruebas generado: {} casos", testCases.size());
        return testCases;
    }

    // === FACTURAS ===

    private CertificationTestCase createFacturaAfecta(int num, String rut, String razonSocial) {
        Dte dte = buildBaseDte(TipoDte.FACTURA_ELECTRONICA, num, rut, razonSocial);

        // Receptor
        dte.setReceptorRut("76.XXX.XXX-X"); // Se reemplaza con RUT real
        dte.setReceptorRazonSocial("EMPRESA RECEPTORA DE PRUEBA");
        dte.setReceptorGiro("COMERCIO AL POR MAYOR");
        dte.setReceptorDireccion("AV. PRUEBA 123");
        dte.setReceptorComuna("SANTIAGO");

        // Items afectos a IVA
        List<DteDetalle> detalles = new ArrayList<>();
        detalles.add(createDetalle(1, "PRODUCTO AFECTO 1", 2, new BigDecimal("10000"), false));
        detalles.add(createDetalle(2, "PRODUCTO AFECTO 2", 1, new BigDecimal("15000"), false));
        detalles.add(createDetalle(3, "SERVICIO AFECTO", 3, new BigDecimal("5000"), false));
        dte.setDetalles(detalles);

        // Calcular montos
        calculateTotals(dte, false);

        return CertificationTestCase.builder()
                .numero(num)
                .nombre("Factura Afecta Simple")
                .descripcion("Factura con múltiples productos afectos a IVA")
                .tipoDte(TipoDte.FACTURA_ELECTRONICA)
                .dte(dte)
                .expectedResult("Documento debe ser aceptado por el SII")
                .build();
    }

    private CertificationTestCase createFacturaExenta(int num, String rut, String razonSocial) {
        Dte dte = buildBaseDte(TipoDte.FACTURA_EXENTA, num, rut, razonSocial);

        dte.setReceptorRut("77.XXX.XXX-X");
        dte.setReceptorRazonSocial("EMPRESA EXENTA LTDA");
        dte.setReceptorGiro("SERVICIOS EXENTOS");
        dte.setReceptorDireccion("CALLE EXENTA 456");
        dte.setReceptorComuna("PROVIDENCIA");

        List<DteDetalle> detalles = new ArrayList<>();
        detalles.add(createDetalle(1, "SERVICIO EXENTO DE IVA", 1, new BigDecimal("50000"), true));
        detalles.add(createDetalle(2, "PRODUCTO EXENTO", 2, new BigDecimal("25000"), true));
        dte.setDetalles(detalles);

        calculateTotals(dte, true);

        return CertificationTestCase.builder()
                .numero(num)
                .nombre("Factura Exenta")
                .descripcion("Factura con productos exentos de IVA")
                .tipoDte(TipoDte.FACTURA_EXENTA)
                .dte(dte)
                .expectedResult("Documento exento debe ser aceptado")
                .build();
    }

    private CertificationTestCase createFacturaConDescuento(int num, String rut, String razonSocial) {
        Dte dte = buildBaseDte(TipoDte.FACTURA_ELECTRONICA, num, rut, razonSocial);

        dte.setReceptorRut("78.XXX.XXX-X");
        dte.setReceptorRazonSocial("CLIENTE CON DESCUENTO SA");
        dte.setReceptorGiro("RETAIL");

        List<DteDetalle> detalles = new ArrayList<>();
        DteDetalle item = createDetalle(1, "PRODUCTO CON DESCUENTO", 5, new BigDecimal("20000"), false);
        item.setDescuentoPorcentaje(new BigDecimal("10")); // 10% descuento
        item.setDescuentoMonto(new BigDecimal("10000")); // $10.000 de descuento total
        detalles.add(item);
        dte.setDetalles(detalles);

        calculateTotals(dte, false);

        return CertificationTestCase.builder()
                .numero(num)
                .nombre("Factura con Descuento")
                .descripcion("Factura con descuento porcentual en línea")
                .tipoDte(TipoDte.FACTURA_ELECTRONICA)
                .dte(dte)
                .expectedResult("Descuento debe reflejarse correctamente")
                .build();
    }

    private CertificationTestCase createFacturaConRecargo(int num, String rut, String razonSocial) {
        Dte dte = buildBaseDte(TipoDte.FACTURA_ELECTRONICA, num, rut, razonSocial);

        dte.setReceptorRut("79.XXX.XXX-X");
        dte.setReceptorRazonSocial("CLIENTE CON RECARGO LTDA");
        dte.setReceptorGiro("DISTRIBUIDORA");

        List<DteDetalle> detalles = new ArrayList<>();
        detalles.add(createDetalle(1, "PRODUCTO BASE", 1, new BigDecimal("100000"), false));
        detalles.add(createDetalle(2, "RECARGO POR FLETE", 1, new BigDecimal("5000"), false));
        dte.setDetalles(detalles);

        calculateTotals(dte, false);

        return CertificationTestCase.builder()
                .numero(num)
                .nombre("Factura con Recargo")
                .descripcion("Factura con recargo por flete")
                .tipoDte(TipoDte.FACTURA_ELECTRONICA)
                .dte(dte)
                .expectedResult("Recargo debe sumarse al total")
                .build();
    }

    // === BOLETAS ===

    private CertificationTestCase createBoletaSimple(int num, String rut, String razonSocial) {
        Dte dte = buildBaseDte(TipoDte.BOLETA_ELECTRONICA, num, rut, razonSocial);

        // Boleta sin receptor obligatorio
        dte.setReceptorRut("66666666-6"); // RUT genérico
        dte.setReceptorRazonSocial("CONSUMIDOR FINAL");

        List<DteDetalle> detalles = new ArrayList<>();
        detalles.add(createDetalle(1, "PRODUCTO VENTA", 2, new BigDecimal("5990"), false));
        detalles.add(createDetalle(2, "SERVICIO", 1, new BigDecimal("3990"), false));
        dte.setDetalles(detalles);

        // Boleta: monto total incluye IVA
        calculateBoletaTotals(dte);

        return CertificationTestCase.builder()
                .numero(num)
                .nombre("Boleta Simple")
                .descripcion("Boleta electrónica a consumidor final")
                .tipoDte(TipoDte.BOLETA_ELECTRONICA)
                .dte(dte)
                .expectedResult("Boleta con IVA incluido")
                .build();
    }

    private CertificationTestCase createBoletaConDescuento(int num, String rut, String razonSocial) {
        Dte dte = buildBaseDte(TipoDte.BOLETA_ELECTRONICA, num, rut, razonSocial);

        dte.setReceptorRut("66666666-6");
        dte.setReceptorRazonSocial("CONSUMIDOR FINAL");

        List<DteDetalle> detalles = new ArrayList<>();
        DteDetalle item = createDetalle(1, "PRODUCTO EN OFERTA", 1, new BigDecimal("9990"), false);
        item.setDescuentoPorcentaje(new BigDecimal("15"));
        detalles.add(item);
        dte.setDetalles(detalles);

        calculateBoletaTotals(dte);

        return CertificationTestCase.builder()
                .numero(num)
                .nombre("Boleta con Descuento")
                .descripcion("Boleta con descuento promocional")
                .tipoDte(TipoDte.BOLETA_ELECTRONICA)
                .dte(dte)
                .expectedResult("Descuento aplicado correctamente")
                .build();
    }

    // === NOTAS DE CRÉDITO ===

    private CertificationTestCase createNotaCreditoAnulacion(int num, String rut, String razonSocial) {
        Dte dte = buildBaseDte(TipoDte.NOTA_CREDITO, num, rut, razonSocial);

        dte.setReceptorRut("76.XXX.XXX-X");
        dte.setReceptorRazonSocial("EMPRESA RECEPTORA DE PRUEBA");

        // Referencia a documento original (campos de referencia se añadirán después)

        List<DteDetalle> detalles = new ArrayList<>();
        detalles.add(createDetalle(1, "ANULACION FACTURA 1", 1, new BigDecimal("50000"), false));
        dte.setDetalles(detalles);

        calculateTotals(dte, false);

        return CertificationTestCase.builder()
                .numero(num)
                .nombre("Nota de Crédito - Anulación")
                .descripcion("NC que anula completamente una factura")
                .tipoDte(TipoDte.NOTA_CREDITO)
                .dte(dte)
                .referenciaFolio(1)
                .expectedResult("NC debe referenciar documento original")
                .build();
    }

    private CertificationTestCase createNotaCreditoDescuento(int num, String rut, String razonSocial) {
        Dte dte = buildBaseDte(TipoDte.NOTA_CREDITO, num, rut, razonSocial);

        dte.setReceptorRut("76.XXX.XXX-X");
        dte.setReceptorRazonSocial("EMPRESA RECEPTORA DE PRUEBA");

        // Referencia a documento original (campos de referencia se añadirán después)

        List<DteDetalle> detalles = new ArrayList<>();
        detalles.add(createDetalle(1, "DESCUENTO 10%", 1, new BigDecimal("5000"), false));
        dte.setDetalles(detalles);

        calculateTotals(dte, false);

        return CertificationTestCase.builder()
                .numero(num)
                .nombre("Nota de Crédito - Descuento")
                .descripcion("NC por descuento comercial posterior")
                .tipoDte(TipoDte.NOTA_CREDITO)
                .dte(dte)
                .referenciaFolio(1)
                .expectedResult("NC parcial por descuento")
                .build();
    }

    // === NOTAS DE DÉBITO ===

    private CertificationTestCase createNotaDebitoIntereses(int num, String rut, String razonSocial) {
        Dte dte = buildBaseDte(TipoDte.NOTA_DEBITO, num, rut, razonSocial);

        dte.setReceptorRut("76.XXX.XXX-X");
        dte.setReceptorRazonSocial("EMPRESA RECEPTORA DE PRUEBA");

        // Referencia a documento original (campos de referencia se añadirán después)

        List<DteDetalle> detalles = new ArrayList<>();
        detalles.add(createDetalle(1, "INTERESES MORATORIOS", 1, new BigDecimal("2500"), false));
        dte.setDetalles(detalles);

        calculateTotals(dte, false);

        return CertificationTestCase.builder()
                .numero(num)
                .nombre("Nota de Débito - Intereses")
                .descripcion("ND por cobro de intereses moratorios")
                .tipoDte(TipoDte.NOTA_DEBITO)
                .dte(dte)
                .referenciaFolio(1)
                .expectedResult("ND debe agregar valor")
                .build();
    }

    // === GUÍA DE DESPACHO ===

    private CertificationTestCase createGuiaDespacho(int num, String rut, String razonSocial) {
        Dte dte = buildBaseDte(TipoDte.GUIA_DESPACHO, num, rut, razonSocial);

        dte.setReceptorRut("80.XXX.XXX-X");
        dte.setReceptorRazonSocial("CLIENTE DESPACHO SA");
        dte.setReceptorDireccion("BODEGA NORTE 789");
        dte.setReceptorComuna("QUILICURA");

        List<DteDetalle> detalles = new ArrayList<>();
        detalles.add(createDetalle(1, "MERCADERIA PARA TRASLADO", 10, new BigDecimal("50000"), false));
        dte.setDetalles(detalles);

        calculateTotals(dte, false);

        return CertificationTestCase.builder()
                .numero(num)
                .nombre("Guía de Despacho")
                .descripcion("GD para traslado de mercadería")
                .tipoDte(TipoDte.GUIA_DESPACHO)
                .dte(dte)
                .expectedResult("GD debe incluir dirección de despacho")
                .build();
    }

    // === HELPERS ===

    private Dte buildBaseDte(TipoDte tipo, int folio, String rut, String razonSocial) {
        Dte dte = new Dte();
        dte.setId(UUID.randomUUID());
        dte.setTipoDte(tipo);
        dte.setFolio(folio);
        dte.setFechaEmision(LocalDate.now());
        dte.setEmisorRut(rut);
        dte.setEmisorRazonSocial(razonSocial);
        dte.setEmisorGiro("COMERCIO");
        dte.setEmisorDireccion("DIRECCION EMISOR");
        dte.setEmisorComuna("SANTIAGO");
        dte.setEmisorCiudad("SANTIAGO");
        dte.setTasaIva(19);
        return dte;
    }

    private DteDetalle createDetalle(int linea, String nombre, int cantidad, BigDecimal precio, boolean exento) {
        DteDetalle detalle = new DteDetalle();
        detalle.setNumeroLinea(linea);
        detalle.setNombreItem(nombre);
        detalle.setCodigo("PROD-" + linea);
        detalle.setCantidad(new BigDecimal(cantidad));
        detalle.setPrecioUnitario(precio);
        detalle.setIndicadorExento(exento ? 1 : null);

        BigDecimal total = precio.multiply(new BigDecimal(cantidad));
        detalle.setMontoItem(total);

        return detalle;
    }

    private void calculateTotals(Dte dte, boolean isExento) {
        BigDecimal subtotal = dte.getDetalles().stream()
                .map(DteDetalle::getMontoItem)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (isExento) {
            dte.setMontoExento(subtotal);
            dte.setMontoNeto(BigDecimal.ZERO);
            dte.setMontoIva(BigDecimal.ZERO);
        } else {
            dte.setMontoNeto(subtotal);
            dte.setMontoIva(subtotal.multiply(IVA_RATE).setScale(0, RoundingMode.HALF_UP));
            dte.setMontoExento(BigDecimal.ZERO);
        }

        dte.setMontoTotal(dte.getMontoNeto().add(dte.getMontoIva()).add(dte.getMontoExento()));
    }

    private void calculateBoletaTotals(Dte dte) {
        // Para boletas, el precio ya incluye IVA
        BigDecimal totalConIva = dte.getDetalles().stream()
                .map(DteDetalle::getMontoItem)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal neto = totalConIva.divide(new BigDecimal("1.19"), 0, RoundingMode.HALF_UP);
        BigDecimal iva = totalConIva.subtract(neto);

        dte.setMontoNeto(neto);
        dte.setMontoIva(iva);
        dte.setMontoExento(BigDecimal.ZERO);
        dte.setMontoTotal(totalConIva);
    }

    /**
     * Validar resultados del set de pruebas
     */
    public CertificationResult validateTestSet(List<CertificationTestCase> testCases) {
        int passed = 0;
        int failed = 0;
        List<String> errors = new ArrayList<>();

        for (CertificationTestCase testCase : testCases) {
            if (testCase.isValid()) {
                passed++;
            } else {
                failed++;
                errors.add("Caso " + testCase.getNumero() + ": " + testCase.getErrorMessage());
            }
        }

        boolean allPassed = failed == 0;
        String message = allPassed
                ? "✅ Todos los casos de prueba pasaron. Listo para certificación."
                : "❌ " + failed + " casos fallaron. Revisar errores.";

        return CertificationResult.builder()
                .passed(passed)
                .failed(failed)
                .total(testCases.size())
                .allPassed(allPassed)
                .message(message)
                .errors(errors)
                .build();
    }

    // === Inner Classes ===

    @Data
    @Builder
    public static class CertificationTestCase {
        private int numero;
        private String nombre;
        private String descripcion;
        private TipoDte tipoDte;
        private Dte dte;
        private Integer referenciaFolio;
        private String expectedResult;

        // Resultado de la prueba
        private boolean valid;
        private String trackId;
        private String estadoSii;
        private String errorMessage;
    }

    @Data
    @Builder
    public static class CertificationResult {
        private int passed;
        private int failed;
        private int total;
        private boolean allPassed;
        private String message;
        private List<String> errors;
    }
}
