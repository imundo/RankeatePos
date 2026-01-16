package com.poscl.billing.infrastructure.providers.chile.validators;

import com.poscl.billing.api.dto.EmitirDteRequest;
import com.poscl.billing.domain.enums.TipoDte;
import com.poscl.billing.infrastructure.providers.chile.utils.MontoCalculator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Validador de reglas de negocio para DTEs chilenos según normativa SII
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ChileDteValidator {

    private final RutValidator rutValidator;
    private final MontoCalculator montoCalculator;

    private static final BigDecimal MONTO_MIN = BigDecimal.ONE;
    private static final int MAX_ITEMS = 60; // Límite SII por documento
    private static final int MAX_DESCRIPCION_LENGTH = 80;

    /**
     * Valida completamente un request de emisión de DTE
     *
     * @param request   Request a validar
     * @param emisorRut RUT del emisor
     * @return Lista de errores (vacía si es válido)
     */
    public List<String> validate(EmitirDteRequest request, String emisorRut) {
        List<String> errors = new ArrayList<>();

        // Validar RUT emisor
        if (!rutValidator.isValid(emisorRut)) {
            errors.add("RUT emisor inválido: " + emisorRut);
        }

        // Validar tipo de DTE
        if (request.getTipoDte() == null) {
            errors.add("Tipo de DTE es requerido");
        }

        // Validar fecha emisión
        if (request.getFechaEmision() == null) {
            errors.add("Fecha de emisión es requerida");
        } else {
            errors.addAll(validateFechaEmision(request.getFechaEmision()));
        }

        // Validar items
        if (request.getItems() == null || request.getItems().isEmpty()) {
            errors.add("Debe incluir al menos un item");
        } else {
            errors.addAll(validateItems(request.getItems()));
        }

        // Validar montos
        if (request.getTotal() == null || request.getTotal().compareTo(MONTO_MIN) < 0) {
            errors.add("Total debe ser mayor a 0");
        }

        // Validar que montos cuadren
        if (request.getTipoDte() != null && !request.getTipoDte().equals(TipoDte.BOLETA_EXENTA)
                && !request.getTipoDte().equals(TipoDte.FACTURA_EXENTA)) {
            errors.addAll(validateMontos(request));
        }

        // Validaciones específicas por tipo
        if (request.getTipoDte() != null) {
            errors.addAll(validateByTipo(request));
        }

        return errors;
    }

    /**
     * Valida que la fecha de emisión sea válida
     */
    private List<String> validateFechaEmision(LocalDate fecha) {
        List<String> errors = new ArrayList<>();
        LocalDate now = LocalDate.now();

        // No puede ser futura
        if (fecha.isAfter(now)) {
            errors.add("Fecha de emisión no puede ser futura");
        }

        // Máximo 6 meses atrás (norma SII)
        LocalDate sixMonthsAgo = now.minusMonths(6);
        if (fecha.isBefore(sixMonthsAgo)) {
            errors.add("Fecha de emisión no puede ser anterior a 6 meses");
        }

        return errors;
    }

    /**
     * Valida los items del documento
     */
    private List<String> validateItems(List<EmitirDteRequest.ItemDto> items) {
        List<String> errors = new ArrayList<>();

        if (items.size() > MAX_ITEMS) {
            errors.add("Máximo " + MAX_ITEMS + " items permitidos");
        }

        for (int i = 0; i < items.size(); i++) {
            EmitirDteRequest.ItemDto item = items.get(i);
            String prefix = "Item " + (i + 1) + ": ";

            // Nombre requerido
            if (item.getNombre() == null || item.getNombre().trim().isEmpty()) {
                errors.add(prefix + "Nombre es requerido");
            } else if (item.getNombre().length() > MAX_DESCRIPCION_LENGTH) {
                errors.add(prefix + "Nombre no puede exceder " + MAX_DESCRIPCION_LENGTH + " caracteres");
            }

            // Cantidad > 0
            if (item.getCantidad() == null || item.getCantidad() <= 0) {
                errors.add(prefix + "Cantidad debe ser mayor a 0");
            }

            // Precio > 0
            if (item.getPrecioUnitario() == null || item.getPrecioUnitario().compareTo(BigDecimal.ZERO) <= 0) {
                errors.add(prefix + "Precio unitario debe ser mayor a 0");
            }

            // Monto total del item
            if (item.getMontoTotal() == null || item.getMontoTotal().compareTo(BigDecimal.ZERO) <= 0) {
                errors.add(prefix + "Monto total debe ser mayor a 0");
            }

            // Validar que monto = cantidad * precio
            if (item.getCantidad() != null && item.getPrecioUnitario() != null && item.getMontoTotal() != null) {
                BigDecimal expectedTotal = item.getPrecioUnitario()
                        .multiply(BigDecimal.valueOf(item.getCantidad()))
                        .setScale(0, java.math.RoundingMode.HALF_UP);

                if (expectedTotal.compareTo(item.getMontoTotal()) != 0) {
                    errors.add(prefix + "Monto total no coincide (esperado: " + expectedTotal + ")");
                }
            }
        }

        return errors;
    }

    /**
     * Valida que los montos cuadren correctamente
     */
    private List<String> validateMontos(EmitirDteRequest request) {
        List<String> errors = new ArrayList<>();

        if (request.getNeto() != null && request.getIva() != null && request.getTotal() != null) {
            BigDecimal expectedTotal = request.getNeto().add(request.getIva());

            if (request.getExento() != null) {
                expectedTotal = expectedTotal.add(request.getExento());
            }

            if (expectedTotal.compareTo(request.getTotal()) != 0) {
                errors.add("Montos no cuadran: neto + IVA + exento debe ser igual al total");
            }

            // Validar que IVA = 19% del neto (con tolerancia de 1 peso por redondeo)
            BigDecimal expectedIva = montoCalculator.redondear(
                    request.getNeto().multiply(new BigDecimal("0.19")));

            if (request.getIva().subtract(expectedIva).abs().compareTo(BigDecimal.ONE) > 0) {
                errors.add("IVA incorrecto: debe ser 19% del neto (esperado aprox: " + expectedIva + ")");
            }
        }

        return errors;
    }

    /**
     * Validaciones específicas por tipo de documento
     */
    private List<String> validateByTipo(EmitirDteRequest request) {
        List<String> errors = new ArrayList<>();

        switch (request.getTipoDte()) {
            case FACTURA_ELECTRONICA:
            case FACTURA_EXENTA:
                // Factura requiere RUT receptor
                if (request.getReceptorRut() == null || request.getReceptorRut().trim().isEmpty()) {
                    errors.add("Factura requiere RUT del receptor");
                } else if (!rutValidator.isValid(request.getReceptorRut())) {
                    errors.add("RUT receptor inválido");
                }

                // Factura requiere razón social receptor
                if (request.getReceptorRazonSocial() == null || request.getReceptorRazonSocial().trim().isEmpty()) {
                    errors.add("Factura requiere razón social del receptor");
                }
                break;

            case NOTA_CREDITO:
            case NOTA_DEBITO:
                // Notas requieren referencia al documento original
                if (request.getDocumentoReferencia() == null) {
                    errors.add("Nota de crédito/débito requiere documento de referencia");
                }
                break;

            case BOLETA_ELECTRONICA:
            case BOLETA_EXENTA:
                // Boleta puede tener o no receptor
                if (request.getReceptorRut() != null && !request.getReceptorRut().trim().isEmpty()) {
                    if (!rutValidator.isValid(request.getReceptorRut())) {
                        errors.add("RUT receptor inválido");
                    }
                }
                break;
        }

        return errors;
    }

    /**
     * Valida solo el formato del RUT (útil para validaciones rápidas)
     */
    public boolean isRutValid(String rut) {
        return rutValidator.isValid(rut);
    }
}
