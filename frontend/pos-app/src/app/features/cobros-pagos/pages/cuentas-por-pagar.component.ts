import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-cuentas-por-pagar',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="page-container">
      <header class="page-header">
        <a routerLink="/cobros-pagos" class="back-link">← Volver</a>
        <h1>📝 Cuentas por Pagar</h1>
        <button class="btn btn-primary" routerLink="../registrar-pago">💳 Registrar Pago</button>
      </header>

      <div class="payables-table">
        <div class="table-header">
          <span>Proveedor</span>
          <span>Documento</span>
          <span>Vencimiento</span>
          <span>Original</span>
          <span>Saldo</span>
          <span>Estado</span>
          <span>Acciones</span>
        </div>
        <div class="table-body">
          @for (item of items(); track item.id) {
            <div class="table-row" [class.overdue]="item.status === 'OVERDUE'">
              <span>{{ item.supplier }}</span>
              <span>{{ item.documentNumber }}</span>
              <span>{{ item.dueDate }}</span>
              <span>{{ item.originalAmount | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
              <span class="balance">{{ item.balance | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
              <span><span class="status-badge" [class]="item.status.toLowerCase()">{{ getStatusLabel(item.status) }}</span></span>
              <span><button class="action-btn" (click)="makePayment(item)">💳</button></span>
            </div>
          }
        </div>
      </div>

      <div class="totals-bar">
        <span>Total Pendiente:</span>
        <span class="total-value">{{ totalBalance() | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
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
    .payables-table { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; overflow: hidden; }
    .table-header { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 100px 80px; gap: 12px; padding: 14px 20px; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.6); font-size: 0.8rem; text-transform: uppercase; }
    .table-body { max-height: 50vh; overflow-y: auto; }
    .table-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 100px 80px; gap: 12px; padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); color: #fff; align-items: center; }
    .table-row.overdue { background: rgba(239,68,68,0.05); }
    .balance { font-weight: 600; color: #f87171; }
    .status-badge { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; }
    .status-badge.pending { background: rgba(102,126,234,0.2); color: #667eea; }
    .status-badge.overdue { background: rgba(239,68,68,0.2); color: #ef4444; }
    .action-btn { background: rgba(255,255,255,0.05); border: none; padding: 6px 8px; border-radius: 6px; cursor: pointer; }
    .totals-bar { display: flex; justify-content: flex-end; gap: 16px; padding: 16px; margin-top: 16px; background: rgba(255,255,255,0.03); border-radius: 12px; color: rgba(255,255,255,0.6); }
    .total-value { color: #f87171; font-size: 1.25rem; font-weight: 700; }
  `]
})
export class CuentasPorPagarComponent {
    items = signal([
        { id: '1', supplier: 'Proveedor Central S.A.', documentNumber: 'FC-5678', dueDate: '25/12/2024', originalAmount: 1200000, balance: 1200000, status: 'OVERDUE' },
        { id: '2', supplier: 'Distribuidora Norte', documentNumber: 'FC-5680', dueDate: '28/12/2024', originalAmount: 650000, balance: 650000, status: 'PENDING' },
        { id: '3', supplier: 'Importadora ABC', documentNumber: 'FC-5685', dueDate: '02/01/2025', originalAmount: 2500000, balance: 2500000, status: 'PENDING' }
    ]);

    totalBalance = signal(4350000);

    getStatusLabel(status: string): string {
        return { PENDING: 'Pendiente', OVERDUE: 'Vencida' }[status] || status;
    }

    makePayment(item: any): void { console.log('Pay:', item.id); }
}
