import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';

export interface SaleEvent {
    id: string;
    numero: string;
    total: number;
    items: SaleItemEvent[];
    timestamp: Date;
    type: 'VENTA' | 'ANULACION' | 'DEVOLUCION';
}

export interface SaleItemEvent {
    variantId: string;
    sku: string;
    nombre: string;
    cantidad: number;
    precioUnitario: number;
}

export interface StockChangeEvent {
    variantId: string;
    sku: string;
    cantidad: number;
    tipo: 'VENTA' | 'COMPRA' | 'AJUSTE' | 'DEVOLUCION';
    referencia?: string;
}

export interface ActivityEvent {
    id: string;
    icon: string;
    title: string;
    description?: string;
    amount: number;
    timestamp: Date;
    type: 'venta' | 'stock' | 'pago' | 'sistema';
}

@Injectable({
    providedIn: 'root'
})
export class SalesEventService {
    // Sale events
    private salesUpdatedSubject = new Subject<SaleEvent>();
    salesUpdated$ = this.salesUpdatedSubject.asObservable();

    // Stock change events
    private stockUpdatedSubject = new Subject<StockChangeEvent>();
    stockUpdated$ = this.stockUpdatedSubject.asObservable();

    // Activity feed events
    private activitySubject = new BehaviorSubject<ActivityEvent[]>([]);
    activity$ = this.activitySubject.asObservable();

    // Dashboard refresh trigger
    private dashboardRefreshSubject = new Subject<void>();
    dashboardRefresh$ = this.dashboardRefreshSubject.asObservable();

    // Last update timestamp for UI animations
    private lastUpdateSubject = new BehaviorSubject<Date>(new Date());
    lastUpdate$ = this.lastUpdateSubject.asObservable();

    /**
     * Notify all subscribers about a new sale
     */
    notifySale(sale: SaleEvent) {
        this.salesUpdatedSubject.next(sale);

        // Add to activity feed
        this.addActivity({
            id: `sale-${sale.id}`,
            icon: '🧾',
            title: `Venta #${sale.numero}`,
            description: `${sale.items.length} productos`,
            amount: sale.total,
            timestamp: sale.timestamp,
            type: 'venta'
        });

        // Trigger stock updates for each item
        sale.items.forEach(item => {
            this.notifyStockChange({
                variantId: item.variantId,
                sku: item.sku,
                cantidad: -item.cantidad,
                tipo: 'VENTA',
                referencia: sale.id
            });
        });

        // Update timestamp
        this.lastUpdateSubject.next(new Date());

        // Trigger dashboard refresh
        this.triggerDashboardRefresh();
    }

    /**
     * Notify about stock changes
     */
    notifyStockChange(change: StockChangeEvent) {
        this.stockUpdatedSubject.next(change);

        // Add to activity feed for significant changes
        if (Math.abs(change.cantidad) > 0) {
            const isDecrease = change.cantidad < 0;
            this.addActivity({
                id: `stock-${change.variantId}-${Date.now()}`,
                icon: isDecrease ? '📦' : '📥',
                title: `Stock ${isDecrease ? 'reducido' : 'aumentado'}`,
                description: change.sku,
                amount: 0, // Stock changes don't have monetary value in feed
                timestamp: new Date(),
                type: 'stock'
            });
        }
    }

    /**
     * Add activity to the feed
     */
    addActivity(activity: ActivityEvent) {
        const current = this.activitySubject.value;
        // Keep last 50 activities
        const updated = [activity, ...current].slice(0, 50);
        this.activitySubject.next(updated);
    }

    /**
     * Get recent activities
     */
    getRecentActivities(limit = 10): ActivityEvent[] {
        return this.activitySubject.value.slice(0, limit);
    }

    /**
     * Clear all activities
     */
    clearActivities() {
        this.activitySubject.next([]);
    }

    /**
     * Trigger a dashboard refresh
     */
    triggerDashboardRefresh() {
        this.dashboardRefreshSubject.next();
    }

    /**
     * Format time ago for display
     */
    formatTimeAgo(date: Date): string {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `Hace ${diffMins} min`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;

        return date.toLocaleDateString('es-CL');
    }
}
