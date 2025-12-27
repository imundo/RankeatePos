import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-recepcion-mercaderia',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="page-container">
      <header class="page-header">
        <a routerLink="/compras" class="back-link">← Volver</a>
        <h1>📥 Recepción de Mercadería</h1>
      </header>

      <div class="pending-section">
        <h2>Órdenes Pendientes de Recepción</h2>
        <div class="orders-list">
          @for (order of pendingOrders(); track order.id) {
            <div class="order-card">
              <div class="order-header">
                <span class="order-number">OC-{{ order.number }}</span>
                <span class="order-date">{{ order.expectedDate }}</span>
              </div>
              <div class="order-supplier">{{ order.supplier }}</div>
              <div class="order-items">{{ order.itemCount }} items • {{ order.total | currency:'CLP':'symbol-narrow':'1.0-0' }}</div>
              <button class="btn btn-primary" (click)="receiveOrder(order)">📦 Recepcionar</button>
            </div>
          }
        </div>
      </div>

      <div class="recent-section">
        <h2>Recepciones Recientes</h2>
        <div class="table">
          <div class="table-header">
            <span>N° Recepción</span>
            <span>Fecha</span>
            <span>OC</span>
            <span>Proveedor</span>
            <span>Estado</span>
          </div>
          @for (receipt of recentReceipts(); track receipt.id) {
            <div class="table-row">
              <span class="receipt-number">REC-{{ receipt.number }}</span>
              <span>{{ receipt.date }}</span>
              <span>OC-{{ receipt.orderNumber }}</span>
              <span>{{ receipt.supplier }}</span>
              <span><span class="status-badge" [class]="receipt.status.toLowerCase()">{{ getStatusLabel(receipt.status) }}</span></span>
            </div>
          }
        </div>
      </div>
    </div>
  `,
    styles: [`
    .page-container { padding: 24px; min-height: 100vh; background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%); }
    .page-header { margin-bottom: 24px; }
    .back-link { color: rgba(255,255,255,0.6); text-decoration: none; display: block; margin-bottom: 8px; }
    h1, h2 { color: #fff; margin: 0; }
    h2 { font-size: 1.1rem; margin-bottom: 16px; }
    .pending-section, .recent-section { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; margin-bottom: 24px; }
    .orders-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
    .order-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 16px; }
    .order-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .order-number { color: #667eea; font-weight: 600; }
    .order-date { color: rgba(255,255,255,0.5); font-size: 0.85rem; }
    .order-supplier { color: #fff; font-weight: 500; margin-bottom: 4px; }
    .order-items { color: rgba(255,255,255,0.5); font-size: 0.9rem; margin-bottom: 12px; }
    .btn { padding: 10px 20px; border-radius: 10px; font-weight: 600; border: none; cursor: pointer; width: 100%; }
    .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
    .table-header { display: grid; grid-template-columns: 120px 100px 100px 1fr 100px; gap: 12px; padding: 10px 16px; color: rgba(255,255,255,0.6); font-size: 0.8rem; text-transform: uppercase; }
    .table-row { display: grid; grid-template-columns: 120px 100px 100px 1fr 100px; gap: 12px; padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); color: #fff; }
    .receipt-number { color: #4ade80; font-weight: 600; }
    .status-badge { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; }
    .status-badge.pending { background: rgba(251,191,36,0.2); color: #fbbf24; }
    .status-badge.verified { background: rgba(102,126,234,0.2); color: #667eea; }
    .status-badge.stored { background: rgba(74,222,128,0.2); color: #4ade80; }
  `]
})
export class RecepcionMercaderiaComponent {
    pendingOrders = signal([
        { id: '1', number: 1045, expectedDate: '28/12/2024', supplier: 'Proveedor Central S.A.', itemCount: 12, total: 2500000 },
        { id: '2', number: 1044, expectedDate: '29/12/2024', supplier: 'Distribuidora Norte', itemCount: 8, total: 1800000 }
    ]);

    recentReceipts = signal([
        { id: '1', number: 501, date: '27/12/2024', orderNumber: 1040, supplier: 'Importadora ABC', status: 'STORED' },
        { id: '2', number: 500, date: '26/12/2024', orderNumber: 1039, supplier: 'Suministros Express', status: 'VERIFIED' }
    ]);

    getStatusLabel(status: string): string {
        return { PENDING: 'Pendiente', VERIFIED: 'Verificado', STORED: 'Ingresado' }[status] || status;
    }

    receiveOrder(order: any): void { console.log('Receive:', order.id); }
}
