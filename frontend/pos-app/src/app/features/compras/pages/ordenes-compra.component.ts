import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-ordenes-compra',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="page-container">
      <header class="page-header">
        <a routerLink="/compras" class="back-link">← Volver</a>
        <h1>📋 Órdenes de Compra</h1>
        <button class="btn btn-primary" routerLink="nueva">➕ Nueva Orden</button>
      </header>

      <div class="filters">
        <button class="filter-btn" [class.active]="activeFilter() === 'all'" (click)="setFilter('all')">Todas</button>
        <button class="filter-btn" [class.active]="activeFilter() === 'draft'" (click)="setFilter('draft')">Borrador</button>
        <button class="filter-btn" [class.active]="activeFilter() === 'approved'" (click)="setFilter('approved')">Aprobadas</button>
        <button class="filter-btn" [class.active]="activeFilter() === 'sent'" (click)="setFilter('sent')">Enviadas</button>
      </div>

      <div class="orders-table">
        <div class="table-header">
          <span>N°</span>
          <span>Fecha</span>
          <span>Proveedor</span>
          <span>Total</span>
          <span>Estado</span>
          <span>Acciones</span>
        </div>
        <div class="table-body">
          @for (order of filteredOrders(); track order.id) {
            <div class="table-row">
              <span class="order-number">OC-{{ order.number }}</span>
              <span>{{ order.date }}</span>
              <span>{{ order.supplier }}</span>
              <span class="order-total">{{ order.total | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
              <span><span class="status-badge" [class]="order.status.toLowerCase()">{{ getStatusLabel(order.status) }}</span></span>
              <span class="actions">
                <button class="action-btn" (click)="viewOrder(order)">👁️</button>
                @if (order.status === 'DRAFT') {
                  <button class="action-btn" (click)="approveOrder(order)">✅</button>
                }
              </span>
            </div>
          }
        </div>
      </div>
    </div>
  `,
    styles: [`
    .page-container { padding: 24px; min-height: 100vh; background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%); }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; gap: 16px; }
    .back-link { color: rgba(255,255,255,0.6); text-decoration: none; }
    h1 { color: #fff; margin: 0; flex: 1; }
    .btn { padding: 10px 20px; border-radius: 10px; font-weight: 600; border: none; cursor: pointer; }
    .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
    .filters { display: flex; gap: 12px; margin-bottom: 24px; }
    .filter-btn { padding: 10px 20px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: rgba(255,255,255,0.7); cursor: pointer; }
    .filter-btn.active { background: rgba(102,126,234,0.2); border-color: #667eea; color: #fff; }
    .orders-table { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; overflow: hidden; }
    .table-header { display: grid; grid-template-columns: 100px 100px 2fr 130px 120px 100px; gap: 12px; padding: 14px 20px; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.6); font-size: 0.8rem; text-transform: uppercase; }
    .table-body { max-height: 50vh; overflow-y: auto; }
    .table-row { display: grid; grid-template-columns: 100px 100px 2fr 130px 120px 100px; gap: 12px; padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); color: #fff; align-items: center; }
    .order-number { color: #667eea; font-weight: 600; }
    .order-total { font-weight: 600; }
    .status-badge { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; }
    .status-badge.draft { background: rgba(156,163,175,0.2); color: #9ca3af; }
    .status-badge.approved { background: rgba(74,222,128,0.2); color: #4ade80; }
    .status-badge.sent { background: rgba(102,126,234,0.2); color: #667eea; }
    .actions { display: flex; gap: 8px; }
    .action-btn { background: rgba(255,255,255,0.05); border: none; padding: 6px 8px; border-radius: 6px; cursor: pointer; }
  `]
})
export class OrdenesCompraComponent {
    activeFilter = signal('all');

    orders = signal([
        { id: '1', number: 1045, date: '27/12/2024', supplier: 'Proveedor Central S.A.', total: 2500000, status: 'APPROVED' },
        { id: '2', number: 1044, date: '26/12/2024', supplier: 'Distribuidora Norte', total: 1800000, status: 'SENT' },
        { id: '3', number: 1043, date: '25/12/2024', supplier: 'Importadora ABC', total: 3200000, status: 'DRAFT' },
        { id: '4', number: 1042, date: '24/12/2024', supplier: 'Suministros Express', total: 450000, status: 'DRAFT' }
    ]);

    filteredOrders = signal<any[]>([]);

    constructor() { this.filterOrders(); }

    setFilter(filter: string): void {
        this.activeFilter.set(filter);
        this.filterOrders();
    }

    filterOrders(): void {
        let filtered = this.orders();
        if (this.activeFilter() !== 'all') {
            filtered = filtered.filter(o => o.status.toLowerCase() === this.activeFilter());
        }
        this.filteredOrders.set(filtered);
    }

    getStatusLabel(status: string): string {
        return { DRAFT: 'Borrador', APPROVED: 'Aprobada', SENT: 'Enviada', RECEIVED: 'Recibida' }[status] || status;
    }

    viewOrder(order: any): void { console.log('View:', order.id); }
    approveOrder(order: any): void { console.log('Approve:', order.id); }
}
