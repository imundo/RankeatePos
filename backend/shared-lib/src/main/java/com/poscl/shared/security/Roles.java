package com.poscl.shared.security;

/**
 * Constantes de roles del sistema
 */
public final class Roles {

    private Roles() {
    }

    // Roles de negocio
    public static final String OWNER_ADMIN = "OWNER_ADMIN";
    public static final String MANAGER = "MANAGER";
    public static final String CASHIER = "CASHIER";
    public static final String STOCKKEEPER = "STOCKKEEPER";
    public static final String ACCOUNTANT = "ACCOUNTANT";
    public static final String MARKETER = "MARKETER";

    // Roles de plataforma SaaS
    public static final String SAAS_ADMIN = "SAAS_ADMIN";
}
