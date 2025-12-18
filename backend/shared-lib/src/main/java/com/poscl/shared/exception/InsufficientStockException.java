package com.poscl.shared.exception;

import org.springframework.http.HttpStatus;

/**
 * Stock insuficiente (409)
 */
public class InsufficientStockException extends DomainException {

    private final String productSku;
    private final int requested;
    private final int available;

    public InsufficientStockException(String productSku, int requested, int available) {
        super(
                "INSUFFICIENT_STOCK",
                String.format("Stock insuficiente para '%s'. Solicitado: %d, Disponible: %d",
                        productSku, requested, available),
                HttpStatus.CONFLICT);
        this.productSku = productSku;
        this.requested = requested;
        this.available = available;
    }

    public String getProductSku() {
        return productSku;
    }

    public int getRequested() {
        return requested;
    }

    public int getAvailable() {
        return available;
    }
}
