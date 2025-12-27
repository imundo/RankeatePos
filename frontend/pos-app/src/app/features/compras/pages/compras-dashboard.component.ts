import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-compras-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <h1>🛒 Compras</h1>
        <p class="subtitle">Gestión de proveedores y órdenes de compra</p>
      </header>

      <!-- KPIs -->
      <section class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-icon">📦</span>
          <div class="kpi-content">
            <span class="kpi-value">{{ pendingOrders() }}</span>
            <span class="kpi-label">Órdenes Pendientes</span>
          </div>
        </div>
        <div class="kpi-card">
          <span class="kpi-icon">✅</span>
          <div class="kpi-content">
            <span class="kpi-value">{{ monthlyOrders() }}</span>
            <span class="kpi-label">Órdenes del Mes</span>
          </div>
        </div>
        <div class="kpi-card">
          <span class="kpi-icon">👥</span>
          <div class="kpi-content">
            <span class="kpi-value">{{ activeSuppliers() }}</span>
            <span class="kpi-label">Proveedores Activos</span>
          </div>
        </div>
        <div class="kpi-card">
          <span class="kpi-icon">💰</span>
          <div class="kpi-content">
            <span class="kpi-value">{{ monthlyTotal() | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
            <span class="kpi-label">Compras del Mes</span>
          </div>
        </div>
      </section>

      <!-- Quick Actions -->
      <section class="actions-grid">
        <a routerLink="proveedores" class="action-card">
          <span class="action-icon">👥</span>
          <span class="action-label">Proveedores</span>
        </a>
        <a routerLink="ordenes-compra" class="action-card">
          <span class="action-icon">📋</span>
          <span class="action-label">Órdenes de Compra</span>
        </a>
        <a routerLink="ordenes-compra/nueva" class="action-card primary">
          <span class="action-icon">➕</span>
          <span class="action-label">Nueva Orden</span>
        </a>
        <a routerLink="recepcion" class="action-card">
          <span class="action-icon">📥</span>
          <span class="action-label">Recepción Mercadería</span>
        </a>
      </section>

      <!-- Recent Orders -->
      <section class="recent-section">
        <h3>Órdenes Recientes</h3>
        <div class="orders-list">
          @for (order of recentOrders(); track order.id) {
            <div class="order-item">
              <div class="order-info">
                <span class="order-number">OC-{{ order.number }}</span>
                <span class="order-supplier">{{ order.supplier }}</span>
              </div>
              <span class="order-total">{{ order.total | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
              <span class="order-status" [class]="order.status.toLowerCase()">{{ getStatusLabel(order.status) }}</span>
            </div>
          }
        </div>
      </section>
    </div>
  `,
    styles: [`
    .dashboard-container { padding: 24px; min-height: 100vh; background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%); }
    .dashboard-header { margin-bottom: 32px; }
    .dashboard-header h1 { color: #fff; font-size: 2rem; margin: 0; }
    .subtitle { color: rgba(255,255,255,0.6); margin-top: 4px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 32px; }
    .kpi-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; display: flex; gap: 16px; }
    .kpi-icon { font-size: 2.5rem; }
    .kpi-content { display: flex; flex-direction: column; }
    .kpi-value { color: #fff; font-size: 1.75rem; font-weight: 700; }
    .kpi-label { color: rgba(255,255,255,0.6); font-size: 0.85rem; }
    .actions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .action-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; text-align: center; text-decoration: none; transition: all 0.3s; }
    .action-card:hover { background: rgba(255,255,255,0.08); transform: translateY(-2px); }
    .action-card.primary { background: linear-gradient(135deg, rgba(102,126,234,0.2) 0%, rgba(118,75,162,0.2) 100%); border-color: rgba(102,126,234,0.4); }
    .action-icon { font-size: 2rem; display: block; margin-bottom: 8px; }
    .action-label { color: #fff; font-weight: 500; }
    .recent-section { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; }
    .recent-section h3 { color: #fff; margin: 0 0 16px; }
    .orders-list { display: flex; flex-direction: column; gap: 12px; }
    .order-item { display: flex; align-items: center; gap: 20px; padding: 12px 16px; background: rgba(255,255,255,0.02); border-radius: 10px; }
    .order-info { flex: 1; display: flex; flex-direction: column; }
    .order-number { color: #667eea; font-weight: 600; }
    .order-supplier { color: rgba(255,255,255,0.6); font-size: 0.85rem; }
    .order-total { color: #fff; font-weight: 600; min-width: 120px; text-align: right; }
    .order-status { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; }
    .order-status.draft { background: rgba(156,163,175,0.2); color: #9ca3af; }
    .order-status.approved { background: rgba(74,222,128,0.2); color: #4ade80; }
    .order-status.sent { background: rgba(102,126,234,0.2); color: #667eea; }
    .order-status.received { background: rgba(34,197,94,0.2); color: #22c55e; }
  `]
})
export class ComprasDashboardComponent {
    pendingOrders = signal(8);
    monthlyOrders = signal(25);
    activeSuppliers = signal(42);
    monthlyTotal = signal(12500000);

    recentOrders = signal([
        { id: '1', number: 1045, supplier: 'Proveedor Central S.A.', total: 2500000, status: 'APPROVED' },
        { id: '2', number: 1044, supplier: 'Distribuidora Norte', total: 1800000, status: 'SENT' },
        { id: '3', number: 1043, supplier: 'Importadora ABC', total: 3200000, status: 'RECEIVED' },
        { id: '4', number: 1042, supplier: 'Suministros Express', total: 450000, status: 'DRAFT' }
    ]);

    getStatusLabel(status: string): string {
        return { DRAFT: 'Borrador', APPROVED: 'Aprobada', SENT: 'Enviada', RECEIVED: 'Recibida' }[status] || status;
    }
}
