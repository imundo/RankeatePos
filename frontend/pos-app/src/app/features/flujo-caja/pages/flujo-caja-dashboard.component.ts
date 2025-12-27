import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface CashFlowItem {
    date: string;
    description: string;
    type: 'INFLOW' | 'OUTFLOW';
    amount: number;
    status: 'PROJECTED' | 'CONFIRMED' | 'REALIZED';
}

@Component({
    selector: 'app-flujo-caja-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <h1>💸 Flujo de Caja</h1>
        <p class="subtitle">Proyección y control de flujo de efectivo</p>
      </header>

      <!-- Current Balance -->
      <section class="balance-section">
        <div class="balance-card">
          <span class="balance-label">Saldo Actual</span>
          <span class="balance-value">{{ currentBalance() | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
          <span class="balance-date">Al {{ currentDate }}</span>
        </div>
        <div class="projection-cards">
          <div class="projection-card">
            <span class="projection-label">En 7 días</span>
            <span class="projection-value">{{ balance7Days() | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
          </div>
          <div class="projection-card">
            <span class="projection-label">En 30 días</span>
            <span class="projection-value" [class.negative]="balance30Days() < 0">{{ balance30Days() | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
          </div>
          <div class="projection-card">
            <span class="projection-label">En 90 días</span>
            <span class="projection-value">{{ balance90Days() | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
          </div>
        </div>
      </section>

      <!-- Summary -->
      <section class="summary-section">
        <div class="summary-card inflow">
          <span class="summary-icon">📈</span>
          <div class="summary-content">
            <span class="summary-label">Ingresos Proyectados (30d)</span>
            <span class="summary-value">{{ projectedInflow() | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
          </div>
        </div>
        <div class="summary-card outflow">
          <span class="summary-icon">📉</span>
          <div class="summary-content">
            <span class="summary-label">Egresos Proyectados (30d)</span>
            <span class="summary-value">{{ projectedOutflow() | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
          </div>
        </div>
        <div class="summary-card net">
          <span class="summary-icon">⚖️</span>
          <div class="summary-content">
            <span class="summary-label">Flujo Neto</span>
            <span class="summary-value" [class.positive]="netFlow() >= 0" [class.negative]="netFlow() < 0">
              {{ netFlow() | currency:'CLP':'symbol-narrow':'1.0-0' }}
            </span>
          </div>
        </div>
      </section>

      <!-- Actions -->
      <section class="actions-row">
        <a routerLink="proyeccion" class="action-btn primary">📊 Ver Proyección Detallada</a>
        <button class="action-btn" (click)="addProjection()">➕ Agregar Movimiento</button>
      </section>

      <!-- Upcoming Movements -->
      <section class="movements-section">
        <h3>Próximos Movimientos</h3>
        <div class="movements-list">
          @for (item of upcomingMovements(); track $index) {
            <div class="movement-item" [class.inflow]="item.type === 'INFLOW'" [class.outflow]="item.type === 'OUTFLOW'">
              <span class="movement-date">{{ item.date }}</span>
              <span class="movement-description">{{ item.description }}</span>
              <span class="movement-amount" [class.positive]="item.type === 'INFLOW'" [class.negative]="item.type === 'OUTFLOW'">
                {{ item.type === 'INFLOW' ? '+' : '-' }}{{ item.amount | currency:'CLP':'symbol-narrow':'1.0-0' }}
              </span>
              <span class="movement-status" [class]="item.status.toLowerCase()">{{ getStatusLabel(item.status) }}</span>
            </div>
          }
        </div>
      </section>
    </div>
  `,
    styles: [`
    .dashboard-container { padding: 24px; min-height: 100vh; background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%); }
    .dashboard-header { margin-bottom: 24px; }
    .dashboard-header h1 { color: #fff; font-size: 2rem; margin: 0; }
    .subtitle { color: rgba(255,255,255,0.6); margin-top: 4px; }
    
    .balance-section { display: flex; gap: 24px; margin-bottom: 32px; flex-wrap: wrap; }
    .balance-card { background: linear-gradient(135deg, rgba(102,126,234,0.3) 0%, rgba(118,75,162,0.3) 100%); border: 1px solid rgba(102,126,234,0.5); border-radius: 20px; padding: 32px; flex: 1; min-width: 280px; }
    .balance-label { display: block; color: rgba(255,255,255,0.7); font-size: 0.9rem; margin-bottom: 8px; }
    .balance-value { display: block; color: #fff; font-size: 2.5rem; font-weight: 700; }
    .balance-date { display: block; color: rgba(255,255,255,0.5); font-size: 0.85rem; margin-top: 8px; }
    .projection-cards { display: flex; flex-direction: column; gap: 12px; flex: 1; }
    .projection-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; }
    .projection-label { color: rgba(255,255,255,0.6); }
    .projection-value { color: #fff; font-size: 1.25rem; font-weight: 600; }
    .projection-value.negative { color: #f87171; }
    
    .summary-section { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 32px; }
    .summary-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 20px; display: flex; gap: 16px; }
    .summary-card.inflow { border-left: 4px solid #4ade80; }
    .summary-card.outflow { border-left: 4px solid #f87171; }
    .summary-card.net { border-left: 4px solid #667eea; }
    .summary-icon { font-size: 2rem; }
    .summary-content { display: flex; flex-direction: column; }
    .summary-label { color: rgba(255,255,255,0.6); font-size: 0.85rem; }
    .summary-value { color: #fff; font-size: 1.5rem; font-weight: 700; }
    .summary-value.positive { color: #4ade80; }
    .summary-value.negative { color: #f87171; }
    
    .actions-row { display: flex; gap: 16px; margin-bottom: 32px; }
    .action-btn { padding: 14px 28px; border-radius: 12px; font-weight: 600; border: none; cursor: pointer; text-decoration: none; background: rgba(255,255,255,0.05); color: #fff; }
    .action-btn.primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    
    .movements-section { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; }
    .movements-section h3 { color: #fff; margin: 0 0 16px; }
    .movement-item { display: grid; grid-template-columns: 80px 1fr 150px 100px; gap: 16px; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); align-items: center; }
    .movement-date { color: rgba(255,255,255,0.5); font-size: 0.85rem; }
    .movement-description { color: #fff; }
    .movement-amount { font-weight: 600; text-align: right; }
    .movement-amount.positive { color: #4ade80; }
    .movement-amount.negative { color: #f87171; }
    .movement-status { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; }
    .movement-status.projected { background: rgba(156,163,175,0.2); color: #9ca3af; }
    .movement-status.confirmed { background: rgba(102,126,234,0.2); color: #667eea; }
    .movement-status.realized { background: rgba(74,222,128,0.2); color: #4ade80; }
  `]
})
export class FlujoCajaDashboardComponent {
    currentDate = '27/12/2024';
    currentBalance = signal(15800000);
    balance7Days = signal(14200000);
    balance30Days = signal(12500000);
    balance90Days = signal(18700000);
    projectedInflow = signal(8500000);
    projectedOutflow = signal(11800000);
    netFlow = signal(-3300000);

    upcomingMovements = signal<CashFlowItem[]>([
        { date: '28/12', description: 'Cobro factura F-1234', type: 'INFLOW', amount: 1500000, status: 'CONFIRMED' },
        { date: '30/12', description: 'Pago arriendos', type: 'OUTFLOW', amount: 1200000, status: 'CONFIRMED' },
        { date: '02/01', description: 'Cobro clientes varios', type: 'INFLOW', amount: 3500000, status: 'PROJECTED' },
        { date: '05/01', description: 'Pago proveedores', type: 'OUTFLOW', amount: 2800000, status: 'PROJECTED' },
        { date: '10/01', description: 'Pago sueldos', type: 'OUTFLOW', amount: 4500000, status: 'PROJECTED' }
    ]);

    getStatusLabel(status: string): string {
        return { PROJECTED: 'Proyectado', CONFIRMED: 'Confirmado', REALIZED: 'Realizado' }[status] || status;
    }

    addProjection(): void { console.log('Add projection'); }
}
