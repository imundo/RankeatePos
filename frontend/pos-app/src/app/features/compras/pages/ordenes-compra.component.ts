import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PurchaseOrderService, PurchaseOrder } from '../../../core/services/purchase-order.service';

@Component({
  selector: 'app-ordenes-compra',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div class="header-left">
          <a routerLink="/compras" class="back-link">← Volver al Dashboard</a>
          <h1>📋 Órdenes de Compra</h1>
          <p class="subtitle">Gestiona y monitorea los pedidos a tus proveedores</p>
        </div>
        <button class="btn btn-primary shadow-glow" routerLink="nueva">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nueva Orden
        </button>
      </header>

      <!-- KPIs -->
      <div class="kpi-row">
        <div class="kpi-card glass-panel">
          <div class="kpi-icon blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></div>
          <div class="kpi-data">
            <span class="kpi-val">{{ totalOrders() }}</span>
            <span class="kpi-lbl">Total Registradas</span>
          </div>
        </div>
        <div class="kpi-card glass-panel">
          <div class="kpi-icon amber"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
          <div class="kpi-data">
            <span class="kpi-val">{{ draftOrders() }}</span>
            <span class="kpi-lbl">Borradores Pendientes</span>
          </div>
        </div>
        <div class="kpi-card glass-panel">
          <div class="kpi-icon indigo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></div>
          <div class="kpi-data">
            <span class="kpi-val">{{ inTransitOrders() }}</span>
            <span class="kpi-lbl">Enviadas / En Tránsito</span>
          </div>
        </div>
        <div class="kpi-card glass-panel">
          <div class="kpi-icon green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
          <div class="kpi-data">
            <span class="kpi-val">{{ receivedOrders() }}</span>
            <span class="kpi-lbl">Recibidas con Éxito</span>
          </div>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="toolbar glass-panel">
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="applyFilters()" placeholder="Buscar por OC o Proveedor...">
        </div>
        <div class="filter-chips">
          <button class="chip" [class.active]="statusFilter() === 'ALL'" (click)="setStatusFilter('ALL')">Todas</button>
          <button class="chip" [class.active]="statusFilter() === 'DRAFT'" (click)="setStatusFilter('DRAFT')">Borrador</button>
          <button class="chip" [class.active]="statusFilter() === 'APPROVED'" (click)="setStatusFilter('APPROVED')">Aprobadas</button>
          <button class="chip" [class.active]="statusFilter() === 'SENT'" (click)="setStatusFilter('SENT')">Enviadas</button>
          <button class="chip" [class.active]="statusFilter() === 'RECEIVED'" (click)="setStatusFilter('RECEIVED')">Recibidas</button>
        </div>
      </div>

      <!-- Grid -->
      @if (loading()) {
        <div class="loading-state">
           <div class="spinner"></div>
           <p>Sincronizando con base de datos...</p>
        </div>
      } @else {
        <div class="modern-grid glass-panel">
          <div class="grid-header">
            <div class="col-id">N° Orden</div>
            <div class="col-date">Fecha</div>
            <div class="col-supplier">Proveedor</div>
            <div class="col-amount">Monto Total</div>
            <div class="col-status">Estado</div>
            <div class="col-actions">Acciones</div>
          </div>
          
          <div class="grid-body">
            @for (order of filteredOrders(); track order.id) {
              <div class="grid-row">
                <div class="col-id">
                  <span class="oc-badge">OC-{{ order.orderNumber }}</span>
                </div>
                <div class="col-date">
                  <div class="date-stacked">
                    <span class="date-main">{{ order.createdAt | date:'dd MMM yyyy' }}</span>
                    <span class="date-sub">{{ order.createdAt | date:'HH:mm' }}</span>
                  </div>
                </div>
                <div class="col-supplier">
                  <div class="supplier-info">
                    <div class="supplier-avatar">{{ order.supplier?.nombre?.charAt(0) || '?' }}</div>
                    <span class="supplier-name">{{ order.supplier?.nombre || 'Desconocido' }}</span>
                  </div>
                </div>
                <div class="col-amount">
                  <span class="amount-val">{{ order.totalAmount | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
                  <span class="items-count">{{ order.items?.length || 0 }} items</span>
                </div>
                <div class="col-status">
                  <span class="neon-tag" [class]="order.status.toLowerCase()">{{ getStatusLabel(order.status) }}</span>
                </div>
                <div class="col-actions">
                  <button class="icon-btn" title="Ver Detalle" (click)="viewOrder(order)">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                  
                  @if (order.status === 'DRAFT') {
                    <button class="icon-btn success" title="Aprobar Orden" (click)="submitOrder(order)">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                    </button>
                    <button class="icon-btn danger" title="Eliminar" (click)="deleteOrder(order)">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  }
                  
                  @if (order.status === 'APPROVED') {
                    <button class="icon-btn primary" title="Marcar como Enviada" (click)="sendOrder(order)">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    </button>
                  }

                  @if (order.status === 'SENT') {
                    <button class="icon-btn success" title="Recibir Mercadería" (click)="receiveOrder(order)">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                    </button>
                  }
                </div>
              </div>
            } @empty {
              <div class="empty-state">
                <div class="empty-icon">📁</div>
                <h3>No hay órdenes de compra</h3>
                <p>No se encontraron órdenes que coincidan con los filtros seleccionados.</p>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; min-height: 100vh; background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%); font-family: 'Inter', sans-serif; padding-top: calc(24px + env(safe-area-inset-top)); padding-bottom: calc(24px + env(safe-area-inset-bottom)); }
    @media (max-width: 768px) { .page-container { padding: 16px; padding-top: calc(16px + env(safe-area-inset-top)); } }
    
    .glass-panel { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); border-radius: 16px; }
    
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .header-left { display: flex; flex-direction: column; gap: 6px; }
    .back-link { color: #818cf8; text-decoration: none; font-size: 0.9rem; font-weight: 500; display: inline-flex; align-items: center; transition: color 0.2s; min-height: 44px; }
    .back-link:hover { color: #a5b4fc; }
    h1 { color: #fff; margin: 0; font-size: 2rem; font-weight: 700; letter-spacing: -0.5px; }
    @media (max-width: 768px) { h1 { font-size: 1.5rem; } }
    .subtitle { color: rgba(255,255,255,0.6); margin: 0; font-size: 0.95rem; }
    
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 24px; border-radius: 12px; font-weight: 600; border: none; cursor: pointer; transition: all 0.3s; font-size: 0.95rem; min-height: 48px; }
    @media (max-width: 768px) { .btn { width: 100%; } }
    .btn-primary { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4); }
    .shadow-glow { box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3); }

    /* KPIs */
    .kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px; }
    @media (max-width: 768px) { .kpi-row { grid-template-columns: repeat(2, 1fr); } .kpi-lbl { font-size: 0.75rem !important; } .kpi-val { font-size: 1.25rem !important; } }
    .kpi-card { padding: 20px; display: flex; align-items: center; gap: 16px; transition: transform 0.2s; }
    .kpi-card:hover { transform: translateY(-3px); background: rgba(255,255,255,0.05); }
    .kpi-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    @media (max-width: 768px) { .kpi-card { padding: 12px; gap: 12px; flex-direction: column; text-align: center; } .kpi-icon { width: 40px; height: 40px; } }
    .kpi-icon svg { width: 24px; height: 24px; }
    .kpi-icon.blue { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
    .kpi-icon.amber { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
    .kpi-icon.indigo { background: rgba(99, 102, 241, 0.15); color: #818cf8; }
    .kpi-icon.green { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
    .kpi-data { display: flex; flex-direction: column; gap: 4px; }
    .kpi-val { font-size: 1.5rem; font-weight: 700; color: #fff; line-height: 1; }
    .kpi-lbl { font-size: 0.85rem; color: rgba(255,255,255,0.6); font-weight: 500; line-height: 1.2; }

    /* Toolbar */
    .toolbar { display: flex; justify-content: space-between; align-items: center; padding: 16px; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
    .search-box { position: relative; flex: 1; min-width: 250px; }
    .search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.4); width: 18px; height: 18px; }
    .search-box input { width: 100%; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); padding: 12px 16px 12px 44px; border-radius: 12px; color: #fff; font-size: 1rem; outline: none; transition: all 0.2s; min-height: 48px; }
    .search-box input:focus { border-color: #6366f1; background: rgba(0,0,0,0.3); box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1); }
    .search-box input::placeholder { color: rgba(255,255,255,0.3); }
    
    .filter-chips { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; width: 100%; }
    .filter-chips::-webkit-scrollbar { display: none; }
    @media (min-width: 768px) { .filter-chips { width: auto; flex-wrap: wrap; } }
    .chip { padding: 8px 16px; border-radius: 20px; background: rgba(255,255,255,0.05); border: 1px solid transparent; color: rgba(255,255,255,0.7); font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; white-space: nowrap; min-height: 40px; }
    .chip:hover { background: rgba(255,255,255,0.1); color: #fff; }
    .chip.active { background: rgba(99, 102, 241, 0.2); border-color: rgba(99, 102, 241, 0.5); color: #a5b4fc; }

    /* Grid */
    .modern-grid { display: flex; flex-direction: column; overflow: hidden; }
    .grid-header { display: grid; grid-template-columns: 120px 140px 2fr 150px 120px 140px; gap: 16px; padding: 16px 24px; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.8rem; font-weight: 600; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.5px; }
    .grid-body { display: flex; flex-direction: column; }
    .grid-row { display: grid; grid-template-columns: 120px 140px 2fr 150px 120px 140px; gap: 16px; padding: 16px 24px; border-bottom: 1px solid rgba(255,255,255,0.03); align-items: center; transition: background 0.2s; }
    .grid-row:hover { background: rgba(255,255,255,0.02); }
    .grid-row:last-child { border-bottom: none; }

    .oc-badge { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); padding: 6px 10px; border-radius: 8px; font-family: 'Inter', monospace; font-size: 0.85rem; color: #a5b4fc; font-weight: 600; }
    
    .date-stacked { display: flex; flex-direction: column; gap: 2px; }
    .date-main { color: #fff; font-weight: 500; font-size: 0.95rem; }
    .date-sub { color: rgba(255,255,255,0.4); font-size: 0.8rem; }

    .supplier-info { display: flex; align-items: center; gap: 12px; }
    .supplier-avatar { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #38bdf8, #818cf8); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 1.1rem; flex-shrink: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
    .supplier-name { color: #fff; font-weight: 600; font-size: 0.95rem; }

    .col-amount { display: flex; flex-direction: column; gap: 2px; }
    .amount-val { color: #fff; font-weight: 700; font-size: 1.05rem; }
    .items-count { color: rgba(255,255,255,0.5); font-size: 0.8rem; }

    .neon-tag { padding: 6px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; text-align: center; border: 1px solid transparent; }
    .neon-tag.draft { background: rgba(156,163,175,0.1); color: #9ca3af; border-color: rgba(156,163,175,0.2); }
    .neon-tag.approved { background: rgba(56,189,248,0.1); color: #38bdf8; border-color: rgba(56,189,248,0.2); box-shadow: 0 0 10px rgba(56,189,248,0.1); }
    .neon-tag.sent { background: rgba(99,102,241,0.1); color: #818cf8; border-color: rgba(99,102,241,0.2); box-shadow: 0 0 10px rgba(99,102,241,0.1); }
    .neon-tag.received { background: rgba(34,197,94,0.1); color: #4ade80; border-color: rgba(34,197,94,0.2); box-shadow: 0 0 10px rgba(34,197,94,0.1); }
    .neon-tag.cancelled { background: rgba(239,68,68,0.1); color: #f87171; border-color: rgba(239,68,68,0.2); }

    .col-actions { display: flex; gap: 8px; align-items: center; justify-content: flex-end; }
    .icon-btn { width: 44px; height: 44px; border-radius: 12px; border: none; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.7); cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
    .icon-btn:hover { background: rgba(255,255,255,0.1); color: #fff; transform: translateY(-2px); }
    .icon-btn.success:hover { background: rgba(34,197,94,0.2); color: #4ade80; }
    .icon-btn.primary:hover { background: rgba(56,189,248,0.2); color: #38bdf8; }
    .icon-btn.danger:hover { background: rgba(239,68,68,0.2); color: #f87171; }
    @media (max-width: 768px) { .icon-btn { flex: 1; } }

    .loading-state { padding: 60px 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: rgba(255,255,255,0.5); gap: 16px; }
    .spinner { width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state { padding: 80px 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
    .empty-icon { font-size: 4rem; margin-bottom: 16px; opacity: 0.5; filter: grayscale(1); }
    .empty-state h3 { color: #fff; font-size: 1.5rem; margin: 0 0 8px; }
    .empty-state p { color: rgba(255,255,255,0.5); margin: 0; max-width: 400px; }

    @media (max-width: 1024px) {
      .grid-header { display: none; }
      .grid-body { padding: 0; gap: 16px; background: transparent; }
      .grid-row { 
        display: flex; flex-direction: column; gap: 16px; 
        background: rgba(255,255,255,0.03); 
        border: 1px solid rgba(255,255,255,0.05); 
        border-radius: 16px; 
        padding: 20px; 
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      }
      .grid-row:hover { background: rgba(255,255,255,0.04); transform: translateY(-2px); }
      .col-actions { flex-direction: row; justify-content: flex-start; margin-top: 8px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.05); width: 100%; }
      .date-stacked { flex-direction: row; align-items: center; gap: 8px; }
      .col-amount { flex-direction: row; align-items: baseline; gap: 8px; }
      
      /* Reorder for mobile */
      .col-supplier { order: -1; margin-bottom: 8px; }
      .col-id { position: absolute; top: 20px; right: 20px; }
      .col-status { position: absolute; top: 60px; right: 20px; }
      .grid-row { position: relative; }
      .supplier-info .supplier-name { font-size: 1.1rem; }
    }
  `]
})
export class OrdenesCompraComponent implements OnInit {
  orders = signal<PurchaseOrder[]>([]);
  filteredOrders = signal<PurchaseOrder[]>([]);
  loading = signal(true);
  
  // Filters
  statusFilter = signal('ALL');
  searchQuery = '';

  // KPIs
  totalOrders = computed(() => this.orders().length);
  draftOrders = computed(() => this.orders().filter(o => o.status === 'DRAFT').length);
  inTransitOrders = computed(() => this.orders().filter(o => o.status === 'SENT' || o.status === 'APPROVED').length);
  receivedOrders = computed(() => this.orders().filter(o => o.status === 'RECEIVED').length);

  constructor(private purchaseOrderService: PurchaseOrderService) { }

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.loading.set(true);
    this.purchaseOrderService.getOrders().subscribe({
      next: (data) => {
        // Backend returns List<PurchaseOrder> directly now
        this.orders.set(data || []);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (e) => {
        console.error('Error loading orders', e);
        this.loading.set(false);
      }
    });
  }

  setStatusFilter(filter: string) {
    this.statusFilter.set(filter);
    this.applyFilters();
  }

  applyFilters() {
    let filtered = this.orders();
    const status = this.statusFilter();
    const search = this.searchQuery.toLowerCase().trim();

    if (status !== 'ALL') {
      filtered = filtered.filter(o => o.status === status);
    }

    if (search) {
      filtered = filtered.filter(o => 
        o.orderNumber.toString().includes(search) || 
        (o.supplier?.nombre && o.supplier.nombre.toLowerCase().includes(search))
      );
    }

    // Sort by date desc
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    this.filteredOrders.set(filtered);
  }

  getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      'DRAFT': 'Borrador',
      'APPROVED': 'Aprobada',
      'SENT': 'Enviada',
      'RECEIVED': 'Recibida',
      'CANCELLED': 'Cancelada'
    };
    return statusMap[status] || status;
  }

  viewOrder(order: PurchaseOrder) {
    console.log('View order detail', order);
    // Future enhancement: Open order detail slideover or navigate
  }

  submitOrder(order: PurchaseOrder) {
    if (!confirm('¿Aprobar Orden #' + order.orderNumber + '? Esto permitirá su envío.')) return;

    // Use specific endpoint to approve if your backend has it, otherwise submit
    this.purchaseOrderService.submitOrder(order.id).subscribe({
      next: () => this.loadOrders(), // Reload to get fresh state
      error: (e) => alert('Error al aprobar la orden.')
    });
  }

  sendOrder(order: PurchaseOrder) {
    if (!confirm('¿Marcar Orden #' + order.orderNumber + ' como enviada al proveedor?')) return;

    this.purchaseOrderService.sendOrder(order.id).subscribe({
       next: () => this.loadOrders(),
       error: (e) => alert('Error al enviar la orden.')
    });
  }

  receiveOrder(order: PurchaseOrder) {
    if (!confirm('¿Confirmar recepción de Orden #' + order.orderNumber + '? Esto actualizará el stock de inventario automáticamente.')) return;

    this.purchaseOrderService.receiveOrder(order.id).subscribe({
      next: () => {
        alert('Stock actualizado exitosamente y orden marcada como Recibida.');
        this.loadOrders();
      },
      error: (e) => alert('Error al recibir la orden.')
    });
  }

  deleteOrder(order: PurchaseOrder) {
    if (!confirm('¿Eliminar el borrador #' + order.orderNumber + ' de forma permanente?')) return;

    this.purchaseOrderService.deleteOrder(order.id).subscribe({
      next: () => this.loadOrders(),
      error: (e) => alert('Error al eliminar orden.')
    });
  }
}
