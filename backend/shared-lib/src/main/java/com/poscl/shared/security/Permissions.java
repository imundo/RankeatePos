package com.poscl.shared.security;

/**
 * Constantes de permisos del sistema
 */
public final class Permissions {

    private Permissions() {
    }

    // Catálogo
    public static final String CATALOG_READ = "catalog:read";
    public static final String CATALOG_WRITE = "catalog:write";
    public static final String CATALOG_DELETE = "catalog:delete";

    // Inventario
    public static final String INVENTORY_READ = "inventory:read";
    public static final String INVENTORY_WRITE = "inventory:write";
    public static final String INVENTORY_ADJUST = "inventory:adjust";

    // Ventas
    public static final String SALES_CREATE = "sales:create";
    public static final String SALES_READ = "sales:read";
    public static final String SALES_CANCEL = "sales:cancel";
    public static final String SALES_DISCOUNT = "sales:discount";
    public static final String SALES_DISCOUNT_UNLIMITED = "sales:discount:unlimited";

    // Caja
    public static final String CASH_OPEN = "cash:open";
    public static final String CASH_CLOSE = "cash:close";
    public static final String CASH_READ = "cash:read";

    // Clientes/Proveedores
    public static final String PARTNERS_READ = "partners:read";
    public static final String PARTNERS_WRITE = "partners:write";

    // Compras
    public static final String PURCHASE_CREATE = "purchase:create";
    public static final String PURCHASE_RECEIVE = "purchase:receive";

    // Reportes
    public static final String REPORTS_READ = "reports:read";
    public static final String REPORTS_EXPORT = "reports:export";

    // Configuración
    public static final String CONFIG_READ = "config:read";
    public static final String CONFIG_WRITE = "config:write";

    // Usuarios
    public static final String USERS_READ = "users:read";
    public static final String USERS_WRITE = "users:write";
}
