import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Tenant {
    id: string;
    rut: string;
    razonSocial: string;
    nombreFantasia: string;
    plan: 'FREE' | 'BASIC' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';
    modules: string[]; // ['pos', 'inventory', 'reservations', 'facturacion', etc.]
    activo: boolean;
    businessType: string;
    logoUrl?: string;
    createdAt?: string;
}

// Alias for backward compatibility
export type AdminTenant = Tenant;

export interface AdminUser {
    id: string;
    tenantId: string;
    nombre: string;
    apellido?: string;
    email: string;
    roles: string[];
    activo: boolean;
}

export interface PlanConfig {
    id?: string;
    code: string;
    name: string;
    price: number;
    currency?: string;
    features?: string[]; // Modules included
    includedModules?: string[];
    description?: string;
    maxUsers?: number;
    maxBranches?: number;
    maxProducts?: number;
}

export interface ModuleConfig {
    id: string;
    code: string;
    name: string;
    description?: string;
    icon: string;
    category: string;
    sortOrder?: number;
    active?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class AdminService {
    private http = inject(HttpClient);
    // Use authUrl since AdminController is in auth-service
    private apiUrl = `${environment.authUrl}/admin`;

    // Pre-configured Plans
    plans: PlanConfig[] = [
        {
            code: 'BASIC',
            name: 'Plan Básico',
            price: 25000,
            features: ['pos', 'inventory', 'sales-report'],
            description: 'Ideal para pequeños comercios que inician'
        },
        {
            code: 'PRO',
            name: 'Plan Pro',
            price: 45000,
            features: ['pos', 'inventory', 'facturacion', 'customer-loyalty', 'reservations'],
            description: 'Gestión completa para negocios en crecimiento'
        },
        {
            code: 'ENTERPRISE',
            name: 'Plan Enterprise',
            price: 80000,
            features: ['pos', 'inventory', 'facturacion', 'customer-loyalty', 'reservations', 'multi-branch', 'kds', 'api-access'],
            description: 'Potencia total para grandes cadenas'
        }
    ];

    // Dashboard Stats
    getDashboardStats(): Observable<{ totalTenants: number; activeTenants: number; totalUsers: number; mrr: number }> {
        return this.getTenants().pipe(
            map(tenants => ({
                totalTenants: tenants.length,
                activeTenants: tenants.filter(t => t.activo).length,
                totalUsers: tenants.length * 2, // Approximate
                mrr: tenants.reduce((sum, t) => {
                    const prices: Record<string, number> = { 'FREE': 0, 'BASIC': 19990, 'PRO': 39990, 'BUSINESS': 79990, 'ENTERPRISE': 149990 };
                    return sum + (prices[t.plan] || 0);
                }, 0)
            }))
        );
    }

    // Tenants
    getTenants(): Observable<Tenant[]> {
        return this.http.get<any>(`${this.apiUrl}/tenants`).pipe(
            map(response => {
                // Handle both paginated and array responses
                if (Array.isArray(response)) return response;
                return response.content || response.data || [];
            })
        );
    }

    getTenant(id: string): Observable<Tenant> {
        return this.http.get<Tenant>(`${this.apiUrl}/tenants/${id}`);
    }

    createTenant(tenant: Partial<Tenant>): Observable<Tenant> {
        // Wizard handles creation usually, but this might be for direct creation
        return this.http.post<Tenant>(`${this.apiUrl}/tenants`, tenant);
    }

    updateTenant(id: string, tenant: Partial<Tenant>): Observable<Tenant> {
        return this.http.put<Tenant>(`${this.apiUrl}/tenants/${id}`, tenant);
    }

    deleteTenant(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/tenants/${id}`);
    }

    // Users Management (Super Admin)
    getTenantUsers(tenantId: string): Observable<AdminUser[]> {
        return this.http.get<any>(`${this.apiUrl}/users?tenantId=${tenantId}`).pipe(
            map(response => response.content || [])
        );
    }

    createUser(tenantId: string, user: any): Observable<AdminUser> {
        return this.http.post<AdminUser>(`${this.apiUrl}/tenants/${tenantId}/users`, user);
    }

    updateUser(userId: string, data: Partial<AdminUser>): Observable<AdminUser> {
        return this.http.put<AdminUser>(`${this.apiUrl}/users/${userId}`, data);
    }

    // Get user by ID
    getUser(userId: string): Observable<AdminUser> {
        return this.http.get<AdminUser>(`${this.apiUrl}/users/${userId}`);
    }

    // Delete user
    deleteUser(userId: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/users/${userId}`);
    }

    // Toggle user status
    toggleUserStatus(userId: string, active: boolean): Observable<AdminUser> {
        return this.http.patch<AdminUser>(`${this.apiUrl}/users/${userId}/status`, { active });
    }

    getModulesList(): { key: string, label: string, category: string }[] {
        return [
            { key: 'dashboard', label: '📊 Dashboard', category: 'General' },
            { key: 'pos', label: '💰 Nueva Venta (POS)', category: 'Ventas' },
            { key: 'sales-history', label: '📜 Historial de Ventas', category: 'Ventas' },
            { key: 'cash-close', label: '🔒 Cierre de Caja', category: 'Ventas' },
            { key: 'quotes', label: '📝 Cotizaciones', category: 'Ventas' },

            { key: 'inventory', label: '📦 Lista de Productos', category: 'Inventario' },
            { key: 'stock-movements', label: '🚚 Movimientos de Stock', category: 'Inventario' },
            { key: 'suppliers', label: '🏭 Proveedores', category: 'Inventario' },
            { key: 'purchases', label: '🛒 Órdenes de Compra', category: 'Inventario' },

            { key: 'invoices', label: '📄 Facturas Emitidas', category: 'Finanzas' },
            { key: 'expenses', label: '💸 Gastos y Pagos', category: 'Finanzas' },
            { key: 'cash-flow', label: '📈 Flujo de Caja', category: 'Finanzas' },
            { key: 'banks', label: '🏦 Cuentas Bancarias', category: 'Finanzas' },

            { key: 'reservations', label: '📅 Agenda y Reservas', category: 'Operaciones' },
            { key: 'kds', label: '🍳 Pantalla Cocina (KDS)', category: 'Operaciones' },
            { key: 'menu-digital', label: '📱 Menú Digital (QR)', category: 'Operaciones' },

            { key: 'crm', label: '👥 Base de Clientes', category: 'Marketing' },
            { key: 'loyalty', label: '🌟 Programa Lealtad', category: 'Marketing' },
            { key: 'email-marketing', label: '📧 Campañas Email', category: 'Marketing' },
            { key: 'whatsapp', label: '💬 Mensajería WhatsApp', category: 'Marketing' },

            { key: 'users', label: '👤 Gestión Usuarios', category: 'Configuración' },
            { key: 'company', label: '🏢 Datos Empresa', category: 'Configuración' },
            { key: 'printers', label: '🖨️ Impresoras', category: 'Configuración' }
        ];
    }

    // API: Get plans from backend
    getPlansFromApi(): Observable<PlanConfig[]> {
        return this.http.get<PlanConfig[]>(`${this.apiUrl}/plans`);
    }

    // API: Get modules from backend
    getModulesFromApi(): Observable<ModuleConfig[]> {
        return this.http.get<ModuleConfig[]>(`${this.apiUrl}/modules`);
    }

    // API: Get modules grouped by category
    getModulesGrouped(): Observable<Record<string, ModuleConfig[]>> {
        return this.http.get<Record<string, ModuleConfig[]>>(`${this.apiUrl}/modules/grouped`);
    }

    // API: Get user permissions
    getUserPermissions(userId: string): Observable<{ userId: string; modules: any[] }> {
        return this.http.get<{ userId: string; modules: any[] }>(`${this.apiUrl}/users/${userId}/modules`);
    }

    // API: Update user permissions
    updateUserPermissions(userId: string, moduleStates: Record<string, boolean>): Observable<any> {
        return this.http.put(`${this.apiUrl}/users/${userId}/modules`, moduleStates);
    }

    // API: Apply preset to user
    applyUserPreset(userId: string, preset: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/users/${userId}/modules/preset`, { preset });
    }

    // API: Toggle single module
    toggleUserModule(userId: string, moduleCode: string, enabled: boolean): Observable<any> {
        return this.http.post(`${this.apiUrl}/users/${userId}/modules/toggle`, { moduleCode, enabled });
    }
}
