import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PurchaseOrderService, PurchaseOrder } from '../../../core/services/purchase-order.service';

@Component({
  selector: 'app-recepcion-mercaderia',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div class="header-left">
            <a routerLink="/compras" class="back-link">← Volver</a>
            <h1>📥 Recepción de Mercadería</h1>
        </div>
      </header>

      <!-- Pendientes -->
      <div class="pending-section">
        <h2>⏳ Órdenes Pendientes de Recepción</h2>
        @if (loading()) {
            <div class="loading">Cargando...</div>
        } @else {
            <div class="orders-list">
              @for (order of pendingOrders(); track order.id) {
                <div class="order-card">
                  <div class="order-header">
                    <span class="order-number">OC-{{ order.orderNumber }}</span>
                    <span class="order-date">{{ order.expectedDeliveryDate | date:'dd/MM/yyyy' }}</span>
                  </div>
                  <div class="order-supplier">{{ order.supplier?.nombre }}</div>
                  <div class="order-items">
                        {{ order.items?.length || 0 }} items
                        • {{ order.totalAmount | currency:'CLP':'symbol-narrow':'1.0-0' }}
                  </div>
                  <div class="card-actions">
                      <button class="btn btn-primary" (click)="receiveOrder(order)">📦 Recepcionar Todo</button>
                  </div>
                </div>
              } @empty {
                <div class="empty-message">No hay órdenes pendientes de recepción</div>
              }
            </div>
        }
      </div>

      <!-- Historial -->
      <div class="recent-section">
        <h2>✅ Recepciones Recientes</h2>
        <div class="table-container">
          <table class="receipts-table">
            <thead>
                <tr>
                    <th>N° OC</th>
                    <th>Fecha Recepción</th>
                    <th>Proveedor</th>
                    <th>Total</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
              @for (order of recentReceipts(); track order.id) {
                <tr>
                  <td class="receipt-number">OC-{{ order.orderNumber }}</td>
                  <td>{{ order.updatedAt | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td>{{ order.supplier?.nombre }}</td>
                  <td>{{ order.totalAmount | currency:'CLP':'symbol-narrow':'1.0-0' }}</td>
                  <td><span class="status-badge received">RECIBIDA</span></td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="empty-cell">No hay recepciones recientes</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; min-height: 100vh; background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%); }
    .page-header { margin-bottom: 24px; }
    .header-left { display: flex; flex-direction: column; gap: 4px; }
    .back-link { color: rgba(255,255,255,0.6); text-decoration: none; font-size: 0.9rem; }
    h1, h2 { color: #fff; margin: 0; }
    h2 { font-size: 1.1rem; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; }
    
    .pending-section, .recent-section { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; margin-bottom: 24px; }
    
    .orders-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .order-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; transition: transform 0.2s; }
    .order-card:hover { transform: translateY(-2px); background: rgba(255,255,255,0.08); }
    
    .order-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .order-number { color: #667eea; font-weight: 600; font-family: monospace; font-size: 1.1rem; }
    .order-date { color: rgba(255,255,255,0.5); font-size: 0.85rem; }
    .order-supplier { color: #fff; font-weight: 500; margin-bottom: 6px; font-size: 1rem; }
    .order-items { color: rgba(255,255,255,0.6); font-size: 0.9rem; margin-bottom: 12px; }
    
    .btn { padding: 10px 20px; border-radius: 8px; font-weight: 600; border: none; cursor: pointer; width: 100%; transition: all 0.2s; }
    .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
    .btn-primary:hover { box-shadow: 0 4px 12px rgba(102,126,234,0.4); }

    .table-container { overflow-x: auto; }
    .receipts-table { width: 100%; border-collapse: collapse; color: #fff; }
    .receipts-table th { text-align: left; padding: 12px; color: rgba(255,255,255,0.6); font-size: 0.8rem; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .receipts-table td { padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.9rem; }
    .receipts-table tr:last-child td { border-bottom: none; }
    
    .receipt-number { color: #4ade80; font-family: monospace; font-weight: 600; }
    .status-badge { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; }
    .status-badge.received { background: rgba(74,222,128,0.2); color: #4ade80; }
    
    .loading, .empty-message, .empty-cell { text-align: center; color: rgba(255,255,255,0.4); padding: 20px; font-style: italic; }
  `]
})
export class RecepcionMercaderiaComponent implements OnInit {
  pendingOrders = signal<PurchaseOrder[]>([]);
  recentReceipts = signal<PurchaseOrder[]>([]);
  loading = signal(true);

  constructor(private purchaseOrderService: PurchaseOrderService) { }

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.loading.set(true);
    this.purchaseOrderService.getOrders(0, 50).subscribe({
      next: (data) => {
        const allOrders: PurchaseOrder[] = data.content || [];
        // Filter SENT orders locally for now (Better to have API filter)
        this.pendingOrders.set(allOrders.filter(o => o.status === 'SENT'));

        // Filter RECEIVED orders
        this.recentReceipts.set(allOrders.filter(o => o.status === 'RECEIVED')
          .sort((a, b) => new Date(b.updatedAt || '').getTime() - new Date(a.updatedAt || '').getTime()) // Sort by updated (received) date
          .slice(0, 10)); // Top 10

        this.loading.set(false);
      },
      error: (e) => {
        console.error('Error loading orders', e);
        this.loading.set(false);
      }
    });
  }

  receiveOrder(order: PurchaseOrder) {
    if (!confirm(`¿Confirmar recepción de OC-${order.orderNumber}? Se actualizará el stock de ${order.items.length} productos.`)) return;

    this.purchaseOrderService.receiveOrder(order.id).subscribe({
      next: () => {
        // Reload or move order locally
        this.loadOrders();
        alert('Orden recepcionada exitosamente');
      },
      error: (e) => console.error('Error receiving order', e)
    });
  }
}
