import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface ReceivableItem {
    id: string;
    customer: string;
    documentNumber: string;
    dueDate: string;
    originalAmount: number;
    balance: number;
    status: 'PENDING' | 'PARTIAL' | 'OVERDUE';
    daysOverdue: number;
}

@Component({
    selector: 'app-cuentas-por-cobrar',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="page-container">
      <header class="page-header">
        <a routerLink="/cobros-pagos" class="back-link">← Volver</a>
        <h1>📋 Cuentas por Cobrar</h1>
        <div class="header-actions">
          <button class="btn btn-primary" routerLink="../registrar-cobro">💵 Registrar Cobro</button>
        </div>
      </header>

      <div class="filters-bar">
        <button class="filter-btn" [class.active]="activeFilter() === 'all'" (click)="setFilter('all')">Todas</button>
        <button class="filter-btn" [class.active]="activeFilter() === 'pending'" (click)="setFilter('pending')">Pendientes</button>
        <button class="filter-btn overdue" [class.active]="activeFilter() === 'overdue'" (click)="setFilter('overdue')">Vencidas ({{ overdueCount() }})</button>
      </div>

      <div class="receivables-table">
        <div class="table-header">
          <span class="col-customer">Cliente</span>
          <span class="col-doc">Documento</span>
          <span class="col-due">Vencimiento</span>
          <span class="col-original">Original</span>
          <span class="col-balance">Saldo</span>
          <span class="col-status">Estado</span>
          <span class="col-actions">Acciones</span>
        </div>
        <div class="table-body">
          @for (item of filteredItems(); track item.id) {
            <div class="table-row" [class.overdue]="item.status === 'OVERDUE'">
              <span class="col-customer">{{ item.customer }}</span>
              <span class="col-doc">{{ item.documentNumber }}</span>
              <span class="col-due">
                {{ item.dueDate }}
                @if (item.daysOverdue > 0) {
                  <span class="overdue-badge">{{ item.daysOverdue }} días</span>
                }
              </span>
              <span class="col-original">{{ item.originalAmount | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
              <span class="col-balance">{{ item.balance | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
              <span class="col-status">
                <span class="status-badge" [class]="item.status.toLowerCase()">{{ getStatusLabel(item.status) }}</span>
              </span>
              <span class="col-actions">
                <button class="action-btn" title="Cobrar" (click)="collectPayment(item)">💵</button>
                <button class="action-btn" title="Recordatorio" (click)="sendReminder(item)">📞</button>
              </span>
            </div>
          }
        </div>
      </div>

      <div class="totals-bar">
        <span class="total-label">Total Pendiente:</span>
        <span class="total-value">{{ totalBalance() | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
      </div>
    </div>
  `,
    styles: [`
    .page-container { padding: 24px; min-height: 100vh; background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%); }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .back-link { color: rgba(255,255,255,0.6); text-decoration: none; position: absolute; top: 24px; }
    h1 { color: #fff; margin: 0; font-size: 1.5rem; }
    .btn { padding: 10px 20px; border-radius: 10px; font-weight: 600; border: none; cursor: pointer; }
    .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
    .filters-bar { display: flex; gap: 12px; margin-bottom: 24px; }
    .filter-btn { padding: 10px 20px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: rgba(255,255,255,0.7); cursor: pointer; }
    .filter-btn.active { background: rgba(102,126,234,0.2); border-color: #667eea; color: #fff; }
    .filter-btn.overdue.active { background: rgba(251,191,36,0.2); border-color: #fbbf24; }
    .receivables-table { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; overflow: hidden; }
    .table-header { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 100px 100px; gap: 12px; padding: 14px 20px; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.6); font-size: 0.8rem; text-transform: uppercase; }
    .table-body { max-height: 50vh; overflow-y: auto; }
    .table-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 100px 100px; gap: 12px; padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); color: #fff; align-items: center; }
    .table-row.overdue { background: rgba(251,191,36,0.05); }
    .col-balance { font-weight: 600; color: #4ade80; }
    .overdue-badge { background: rgba(251,191,36,0.2); color: #fbbf24; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; margin-left: 8px; }
    .status-badge { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; }
    .status-badge.pending { background: rgba(102,126,234,0.2); color: #667eea; }
    .status-badge.partial { background: rgba(168,85,247,0.2); color: #a855f7; }
    .status-badge.overdue { background: rgba(251,191,36,0.2); color: #fbbf24; }
    .col-actions { display: flex; gap: 8px; }
    .action-btn { background: rgba(255,255,255,0.05); border: none; padding: 6px 8px; border-radius: 6px; cursor: pointer; }
    .action-btn:hover { background: rgba(255,255,255,0.15); }
    .totals-bar { display: flex; justify-content: flex-end; gap: 16px; padding: 16px; margin-top: 16px; background: rgba(255,255,255,0.03); border-radius: 12px; }
    .total-label { color: rgba(255,255,255,0.6); }
    .total-value { color: #4ade80; font-size: 1.25rem; font-weight: 700; }
  `]
})
export class CuentasPorCobrarComponent {
    activeFilter = signal('all');

    items = signal<ReceivableItem[]>([
        { id: '1', customer: 'Empresa ABC Ltda.', documentNumber: 'F-1234', dueDate: '15/12/2024', originalAmount: 1500000, balance: 1500000, status: 'OVERDUE', daysOverdue: 12 },
        { id: '2', customer: 'Comercial XYZ', documentNumber: 'F-1235', dueDate: '20/12/2024', originalAmount: 850000, balance: 850000, status: 'OVERDUE', daysOverdue: 7 },
        { id: '3', customer: 'Distribuidora Norte', documentNumber: 'F-1240', dueDate: '28/12/2024', originalAmount: 2200000, balance: 1100000, status: 'PARTIAL', daysOverdue: 0 },
        { id: '4', customer: 'Local El Trigal', documentNumber: 'F-1242', dueDate: '30/12/2024', originalAmount: 450000, balance: 450000, status: 'PENDING', daysOverdue: 0 }
    ]);

    filteredItems = signal<ReceivableItem[]>([]);
    overdueCount = signal(0);
    totalBalance = signal(0);

    constructor() {
        this.filterItems();
    }

    setFilter(filter: string): void {
        this.activeFilter.set(filter);
        this.filterItems();
    }

    filterItems(): void {
        let filtered = this.items();
        if (this.activeFilter() === 'pending') {
            filtered = filtered.filter(i => i.status === 'PENDING' || i.status === 'PARTIAL');
        } else if (this.activeFilter() === 'overdue') {
            filtered = filtered.filter(i => i.status === 'OVERDUE');
        }
        this.filteredItems.set(filtered);
        this.overdueCount.set(this.items().filter(i => i.status === 'OVERDUE').length);
        this.totalBalance.set(filtered.reduce((sum, i) => sum + i.balance, 0));
    }

    getStatusLabel(status: string): string {
        return { PENDING: 'Pendiente', PARTIAL: 'Parcial', OVERDUE: 'Vencida' }[status] || status;
    }

    collectPayment(item: ReceivableItem): void { console.log('Collect:', item.id); }
    sendReminder(item: ReceivableItem): void { console.log('Reminder:', item.id); }
}
