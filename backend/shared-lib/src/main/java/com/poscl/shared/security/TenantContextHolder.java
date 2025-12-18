package com.poscl.shared.security;

/**
 * Holder para el contexto del tenant en el thread actual.
 * Se usa con ThreadLocal para propagación en requests HTTP.
 */
public final class TenantContextHolder {

    private static final ThreadLocal<TenantContext> CONTEXT = new ThreadLocal<>();

    private TenantContextHolder() {
    }

    public static void setContext(TenantContext context) {
        CONTEXT.set(context);
    }

    public static TenantContext getContext() {
        return CONTEXT.get();
    }

    public static void clear() {
        CONTEXT.remove();
    }

    /**
     * Obtiene el tenant ID actual o lanza excepción si no está definido
     */
    public static java.util.UUID requireTenantId() {
        TenantContext ctx = getContext();
        if (ctx == null || ctx.getTenantId() == null) {
            throw new IllegalStateException("Tenant context not initialized");
        }
        return ctx.getTenantId();
    }

    /**
     * Obtiene el user ID actual o lanza excepción si no está definido
     */
    public static java.util.UUID requireUserId() {
        TenantContext ctx = getContext();
        if (ctx == null || ctx.getUserId() == null) {
            throw new IllegalStateException("User context not initialized");
        }
        return ctx.getUserId();
    }
}
