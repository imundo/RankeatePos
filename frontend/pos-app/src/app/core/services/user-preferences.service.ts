import { Injectable, signal, computed } from '@angular/core';

export interface UserPreferences {
    favoriteModules: string[];
    moduleUsage: Record<string, number>;
    dashboardLayout: 'compact' | 'expanded';
    quickActions: string[];
    theme: 'dark' | 'light' | 'system';
    activityFilter: 'all' | 'ventas' | 'stock' | 'pagos';
}

export interface ModuleInfo {
    id: string;
    name: string;
    icon: string;
    route: string;
    description: string;
    color: string;
    badge?: number | string;
    isNew?: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
    favoriteModules: ['pos', 'catalog', 'inventory', 'earnings'],
    moduleUsage: {},
    dashboardLayout: 'expanded',
    quickActions: ['pos', 'catalog', 'inventory', 'reports'],
    theme: 'dark',
    activityFilter: 'all'
};

const ALL_MODULES: ModuleInfo[] = [
    { id: 'pos', name: 'Nueva Venta', icon: '🛒', route: '/pos', description: 'Punto de venta', color: '#10B981' },
    { id: 'catalog', name: 'Catálogo', icon: '📦', route: '/catalog', description: 'Gestión de productos', color: '#6366F1' },
    { id: 'inventory', name: 'Inventario', icon: '📋', route: '/inventory', description: 'Control de stock', color: '#F59E0B' },
    { id: 'reports', name: 'Reportes', icon: '📊', route: '/reports', description: 'Análisis y reportes', color: '#8B5CF6' },
    { id: 'earnings', name: 'Ganancias', icon: '💰', route: '/earnings', description: 'Calendario de ventas', color: '#10B981' },
    { id: 'loyalty', name: 'Lealtad', icon: '🎁', route: '/loyalty', description: 'Puntos y recompensas', color: '#EC4899' },
    { id: 'kds', name: 'Cocina (KDS)', icon: '🍳', route: '/kds', description: 'Gestión de pedidos', color: '#F59E0B' },
    { id: 'whatsapp', name: 'WhatsApp', icon: '💬', route: '/whatsapp', description: 'Notificaciones y pedidos', color: '#25D366' },
    { id: 'reservations', name: 'Reservas', icon: '📅', route: '/reservations', description: 'Mesas y citas', color: '#6366F1' },
    { id: 'subscriptions', name: 'Suscripciones', icon: '🔄', route: '/subscriptions', description: 'Pedidos recurrentes', color: '#3B82F6' },
    { id: 'facturacion', name: 'Facturación', icon: '🧾', route: '/facturacion', description: 'DTE electrónico', color: '#8B5CF6' },
    { id: 'menu-generator', name: 'Menú Digital', icon: '🖼️', route: '/menu-generator', description: 'Generador de menús', color: '#0EA5E9' },
    { id: 'contabilidad', name: 'Contabilidad', icon: '📒', route: '/contabilidad', description: 'Plan de cuentas', color: '#14B8A6' },
    { id: 'cobros-pagos', name: 'Cobros y Pagos', icon: '💳', route: '/cobros-pagos', description: 'Gestión financiera', color: '#EF4444' },
    { id: 'compras', name: 'Compras', icon: '🛍️', route: '/compras', description: 'Órdenes de compra', color: '#F97316' },
    { id: 'presupuesto', name: 'Presupuesto', icon: '📑', route: '/presupuesto', description: 'Control presupuestario', color: '#84CC16' },
    { id: 'flujo-caja', name: 'Flujo de Caja', icon: '💵', route: '/flujo-caja', description: 'Proyección de efectivo', color: '#06B6D4' },
    { id: 'remuneraciones', name: 'Remuneraciones', icon: '👥', route: '/remuneraciones', description: 'Gestión de nómina', color: '#A855F7' },
    { id: 'cotizaciones', name: 'Cotizaciones', icon: '📝', route: '/cotizaciones', description: 'Propuestas comerciales', color: '#EC4899' },
    { id: 'settings', name: 'Configuración', icon: '⚙️', route: '/settings', description: 'Ajustes del sistema', color: '#64748B' }
];

@Injectable({
    providedIn: 'root'
})
export class UserPreferencesService {
    private readonly STORAGE_KEY = 'pos_user_preferences';

    // Reactive state
    private preferencesSignal = signal<UserPreferences>(this.loadPreferences());

    // Public computed values
    preferences = computed(() => this.preferencesSignal());
    favoriteModules = computed(() => this.preferencesSignal().favoriteModules);
    moduleUsage = computed(() => this.preferencesSignal().moduleUsage);
    dashboardLayout = computed(() => this.preferencesSignal().dashboardLayout);
    activityFilter = computed(() => this.preferencesSignal().activityFilter);

    /**
     * Get all available modules
     */
    getAllModules(): ModuleInfo[] {
        return ALL_MODULES;
    }

    /**
     * Get modules sorted by usage
     */
    getSortedModules(): ModuleInfo[] {
        const usage = this.moduleUsage();
        return [...ALL_MODULES].sort((a, b) => {
            const usageA = usage[a.id] || 0;
            const usageB = usage[b.id] || 0;
            return usageB - usageA;
        });
    }

    /**
     * Get favorite modules with full info
     */
    getFavoriteModulesInfo(): ModuleInfo[] {
        const favorites = this.favoriteModules();
        return favorites
            .map(id => ALL_MODULES.find(m => m.id === id))
            .filter((m): m is ModuleInfo => m !== undefined);
    }

    /**
     * Get most used modules (top N)
     */
    getMostUsedModules(limit = 6): ModuleInfo[] {
        return this.getSortedModules().slice(0, limit);
    }

    /**
     * Check if a module is favorite
     */
    isFavorite(moduleId: string): boolean {
        return this.favoriteModules().includes(moduleId);
    }

    /**
     * Toggle favorite status
     */
    toggleFavorite(moduleId: string) {
        const current = this.preferencesSignal();
        const favorites = current.favoriteModules;

        const newFavorites = favorites.includes(moduleId)
            ? favorites.filter(id => id !== moduleId)
            : [...favorites, moduleId];

        this.updatePreferences({ favoriteModules: newFavorites });
    }

    /**
     * Set favorite modules
     */
    setFavoriteModules(moduleIds: string[]) {
        this.updatePreferences({ favoriteModules: moduleIds });
    }

    /**
     * Record module usage (called when user navigates to a module)
     */
    recordModuleUsage(moduleId: string) {
        const current = this.preferencesSignal();
        const usage = { ...current.moduleUsage };
        usage[moduleId] = (usage[moduleId] || 0) + 1;
        this.updatePreferences({ moduleUsage: usage });
    }

    /**
     * Get usage count for a module
     */
    getModuleUsageCount(moduleId: string): number {
        return this.moduleUsage()[moduleId] || 0;
    }

    /**
     * Set dashboard layout
     */
    setDashboardLayout(layout: 'compact' | 'expanded') {
        this.updatePreferences({ dashboardLayout: layout });
    }

    /**
     * Set quick actions
     */
    setQuickActions(actions: string[]) {
        this.updatePreferences({ quickActions: actions });
    }

    /**
     * Set activity filter
     */
    setActivityFilter(filter: 'all' | 'ventas' | 'stock' | 'pagos') {
        this.updatePreferences({ activityFilter: filter });
    }

    /**
     * Reset preferences to defaults
     */
    resetPreferences() {
        this.preferencesSignal.set(DEFAULT_PREFERENCES);
        this.savePreferences();
    }

    /**
     * Load preferences from localStorage
     */
    private loadPreferences(): UserPreferences {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                return { ...DEFAULT_PREFERENCES, ...parsed };
            }
        } catch (e) {
            console.warn('Error loading user preferences:', e);
        }
        return DEFAULT_PREFERENCES;
    }

    /**
     * Save preferences to localStorage
     */
    private savePreferences() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.preferencesSignal()));
        } catch (e) {
            console.warn('Error saving user preferences:', e);
        }
    }

    /**
     * Update specific preference fields
     */
    private updatePreferences(updates: Partial<UserPreferences>) {
        this.preferencesSignal.update(current => ({ ...current, ...updates }));
        this.savePreferences();
    }
}
