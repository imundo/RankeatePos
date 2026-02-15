import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PurchaseOrderService, PurchaseOrder, PurchaseOrderStatus } from '../../../core/services/purchase-order.service';

@Component({
  selector: 'app-ordenes-compra',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div class="header-left">
          <a routerLink="/compras" class="back-link">← Volver</a>
          <h1>📋 Órdenes de Compra</h1>
        </div>
        <button class="btn btn-primary" routerLink="nueva">➕ Nueva Orden</button>
      </header>

      <div class="filters">
        <button class="filter-btn" [class.active]="activeFilter() === 'ALL'" (click)="setFilter('ALL')">Todas</button>
        <button class="filter-btn" [class.active]="activeFilter() === 'DRAFT'" (click)="setFilter('DRAFT')">Borrador</button>
        <button class="filter-btn" [class.active]="activeFilter() === 'SENT'" (click)="setFilter('SENT')">Enviadas</button>
        <button class="filter-btn" [class.active]="activeFilter() === 'RECEIVED'" (click)="setFilter('RECEIVED')">Recibidas</button>
      </div>

      @if (loading()) {
        <div class="loading-state">
           <div class="spinner"></div>
           <p>Cargando órdenes...</p>
        </div>
      } @else {
        <div class="orders-table">
          <div class="table-header">
            <span>N°</span>
            <span>Fecha</span>
            <span>Proveedor</span>
            <span>Items</span>
            <span>Total</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>
          <div class="table-body">
            @for (order of filteredOrders(); track order.id) {
              <div class="table-row">
                <span class="order-number">OC-{{ order.orderNumber }}</span>
                <span>{{ order.createdAt | date:'dd/MM/yyyy' }}</span>
                <span class="supplier-name">{{ order.supplier?.nombre || 'Desconocido' }}</span>
                <span>{{ order.items?.length || 0 }} items</span>
                <span class="order-total">{{ order.totalAmount | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
                <span>
                    <span class="status-badge" [class]="order.status.toLowerCase()">
                        {{ getStatusLabel(order.status) }}
                    </span>
                </span>
                <span class="actions">
                  <button class="action-btn" title="Ver Detalle" (click)="viewOrder(order)">👁️</button>
                  
                  @if (order.status === 'DRAFT') {
                    <button class="action-btn success" title="Enviar / Aprobar" (click)="submitOrder(order)">✅</button>
                    <button class="action-btn danger" title="Eliminar" (click)="deleteOrder(order)">🗑️</button>
                  }
                  
                  @if (order.status === 'SENT') {
                    <button class="action-btn primary" title="Recibir Mercadería" (click)="receiveOrder(order)">📦</button>
                    <button class="action-btn danger" title="Cancelar" (click)="cancelOrder(order)">🚫</button>
                  }
                </span>
              </div>
            } @empty {
              <div class="empty-state">
                <p>No hay órdenes de compra registradas</p>
              </div>
            }
          </div>
          
          <!-- Pagination can be added here -->
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; min-height: 100vh; background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%); }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; gap: 16px; }
    .header-left { display: flex; flex-direction: column; gap: 4px; }
    .back-link { color: rgba(255,255,255,0.6); text-decoration: none; font-size: 0.9rem; }
    .back-link:hover { color: #fff; }
    h1 { color: #fff; margin: 0; font-size: 1.8rem; }
    
    .btn { padding: 10px 20px; border-radius: 10px; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s; }
    .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102,126,234,0.4); }

    .filters { display: flex; gap: 12px; margin-bottom: 24px; overflow-x: auto; padding-bottom: 8px; }
    .filter-btn { padding: 8px 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; color: rgba(255,255,255,0.7); cursor: pointer; white-space: nowrap; transition: all 0.2s; }
    .filter-btn:hover { background: rgba(255,255,255,0.1); }
    .filter-btn.active { background: rgba(102,126,234,0.2); border-color: #667eea; color: #fff; }

    .orders-table { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; }
    .table-header { display: grid; grid-template-columns: 100px 100px 1.5fr 100px 120px 120px 140px; gap: 12px; padding: 14px 20px; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.6); font-size: 0.8rem; text-transform: uppercase; }
    .table-body { overflow-y: auto; max-height: 60vh; }
    .table-row { display: grid; grid-template-columns: 100px 100px 1.5fr 100px 120px 120px 140px; gap: 12px; padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); color: #fff; align-items: center; transition: background 0.2s; }
    .table-row:hover { background: rgba(255,255,255,0.05); }
    
    .order-number { color: #667eea; font-weight: 600; font-family: monospace; font-size: 1rem; }
    .supplier-name { font-weight: 500; }
    .order-total { font-weight: 600; color: #60a5fa; }
    
    .status-badge { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .status-badge.draft { background: rgba(156,163,175,0.2); color: #9ca3af; }
    .status-badge.sent { background: rgba(59,130,246,0.2); color: #60a5fa; }
    .status-badge.received { background: rgba(74,222,128,0.2); color: #4ade80; }
    .status-badge.cancelled { background: rgba(239,68,68,0.2); color: #f87171; }

    .actions { display: flex; gap: 8px; }
    .action-btn { background: rgba(255,255,255,0.05); border: none; padding: 6px; border-radius: 6px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; font-size: 1.1rem; }
    .action-btn:hover { background: rgba(255,255,255,0.15); transform: translateY(-1px); }
    .action-btn.success:hover { background: rgba(74,222,128,0.2); color: #4ade80; }
    .action-btn.danger:hover { background: rgba(239,68,68,0.2); color: #f87171; }
    .action-btn.primary:hover { background: rgba(96,165,250,0.2); color: #60a5fa; }

    .empty-state { padding: 60px; text-align: center; color: rgba(255,255,255,0.5); }
    
    .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; color: rgba(255,255,255,0.6); }
    .spinner { width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #667eea; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 1024px) {
        .table-header, .table-row { grid-template-columns: 80px 90px 1fr 100px 100px 100px; }
        .table-header span:nth-child(4), .table-row span:nth-child(4) { display: none; } /* Hide Items count */
    }
  `]
})
export class OrdenesCompraComponent implements OnInit {
  orders = signal<PurchaseOrder[]>([]);
  filteredOrders = signal<PurchaseOrder[]>([]);
  loading = signal(true);
  activeFilter = signal('ALL');

  constructor(private purchaseOrderService: PurchaseOrderService) { }

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.loading.set(true);
    this.purchaseOrderService.getOrders(0, 50).subscribe({
      next: (data) => {
        this.orders.set(data.content || []);
        this.filterOrders();
        this.loading.set(false);
      },
      error: (e) => {
        console.error('Error loading orders', e);
        this.loading.set(false);
      }
    });
  }

  setFilter(filter: string) {
    this.activeFilter.set(filter);
    this.filterOrders();
  }

  filterOrders() {
    let filtered = this.orders();
    const filter = this.activeFilter();

    if (filter !== 'ALL') {
      filtered = filtered.filter(o => o.status === filter);
    }

    // Sort by date desc
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    this.filteredOrders.set(filtered);
  }

  getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      'DRAFT': 'Borrador',
      'SENT': 'Enviada',
      'RECEIVED': 'Recibida',
      'CANCELLED': 'Cancelada'
    };
    return statusMap[status] || status;
  }

  viewOrder(order: PurchaseOrder) {
    // Navigate to details or open modal
    // For now, no detail view implemented, maybe reuse Create (Edit) if Draft
    console.log('View', order);
  }

  submitOrder(order: PurchaseOrder) {
    if (!confirm(`¿Confirmar envío de Orden #${order.orderNumber}?`)) return;

    this.purchaseOrderService.submitOrder(order.id).subscribe({
      next: (updated) => {
        this.replaceOrder(updated);
      },
      error: (e) => console.error('Error submitting order', e)
    });
  }

  receiveOrder(order: PurchaseOrder) {
    if (!confirm(`¿Confirmar recepción de Orden #${order.orderNumber}? Esto actualizará el stock.`)) return;

    this.purchaseOrderService.receiveOrder(order.id).subscribe({
      next: (updated) => {
        this.replaceOrder(updated);
        alert('Stock actualizado exitosamente');
      },
      error: (e) => console.error('Error receiving order', e)
    });
  }

  cancelOrder(order: PurchaseOrder) {
    if (!confirm(`¿Anular Orden #${order.orderNumber}?`)) return;

    this.purchaseOrderService.cancelOrder(order.id).subscribe({
      next: (updated) => {
        this.replaceOrder(updated);
      },
      error: (e) => console.error('Error cancelling order', e)
    });
  }

  deleteOrder(order: PurchaseOrder) {
    if (!confirm(`¿Eliminar borrador #${order.orderNumber}? No se puede deshacer.`)) return;

    this.purchaseOrderService.deleteOrder(order.id).subscribe({
      next: () => {
        this.orders.update(orders => orders.filter(o => o.id !== order.id));
        this.filterOrders();
      },
      error: (e) => console.error('Error deleting order', e)
    });
  }

  private replaceOrder(updated: PurchaseOrder) {
    this.orders.update(orders => orders.map(o => o.id === updated.id ? updated : o));
    this.filterOrders();
  }
}
