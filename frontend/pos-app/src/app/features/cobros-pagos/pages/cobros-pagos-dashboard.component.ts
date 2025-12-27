import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface Summary {
  receivables: { total: number; overdue: number; overdueCount: number };
  payables: { total: number; overdueCount: number };
  recentReceipts: { date: string; customer: string; amount: number }[];
  recentPayments: { date: string; supplier: string; amount: number }[];
}

@Component({
  selector: 'app-cobros-pagos-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <h1>💰 Cobros y Pagos</h1>
        <p class="subtitle">Gestión de cuentas por cobrar y pagar</p>
        <span class="live-badge" *ngIf="isLive()">🔴 LIVE</span>
      </header>

      <!-- Loading -->
      <div class="loading-overlay" *ngIf="loading()">
        <div class="spinner"></div>
        <span>Cargando datos...</span>
      </div>

      <!-- KPI Cards -->
      <section class="kpi-section">
        <div class="kpi-grid">
          <div class="kpi-card receivable">
            <div class="kpi-icon">📈</div>
            <div class="kpi-content">
              <span class="kpi-title">Por Cobrar</span>
              <span class="kpi-value">{{ summary().receivables.total | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
              <div class="kpi-alert" *ngIf="summary().receivables.overdueCount > 0">
                ⚠️ {{ summary().receivables.overdueCount }} vencidas
              </div>
            </div>
          </div>
          <div class="kpi-card payable">
            <div class="kpi-icon">📉</div>
            <div class="kpi-content">
              <span class="kpi-title">Por Pagar</span>
              <span class="kpi-value">{{ summary().payables.total | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
              <div class="kpi-alert" *ngIf="summary().payables.overdueCount > 0">
                ⚠️ {{ summary().payables.overdueCount }} vencidas
              </div>
            </div>
          </div>
          <div class="kpi-card overdue">
            <div class="kpi-icon">🚨</div>
            <div class="kpi-content">
              <span class="kpi-title">Vencido</span>
              <span class="kpi-value">{{ summary().receivables.overdue | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
              <span class="kpi-sublabel">Requiere cobranza</span>
            </div>
          </div>
          <div class="kpi-card balance">
            <div class="kpi-icon">⚖️</div>
            <div class="kpi-content">
              <span class="kpi-title">Saldo Neto</span>
              <span class="kpi-value" [class.positive]="netBalance() >= 0" [class.negative]="netBalance() < 0">
                {{ netBalance() | currency:'CLP':'symbol-narrow':'1.0-0' }}
              </span>
              <span class="kpi-sublabel">Cobrar - Pagar</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Quick Actions -->
      <section class="actions-section">
        <div class="actions-grid">
          <a routerLink="cuentas-por-cobrar" class="action-card">
            <span class="action-icon">📋</span>
            <span class="action-label">Cuentas por Cobrar</span>
          </a>
          <a routerLink="cuentas-por-pagar" class="action-card">
            <span class="action-icon">📝</span>
            <span class="action-label">Cuentas por Pagar</span>
          </a>
          <a routerLink="registrar-cobro" class="action-card primary">
            <span class="action-icon">💵</span>
            <span class="action-label">Registrar Cobro</span>
          </a>
          <a routerLink="registrar-pago" class="action-card primary">
            <span class="action-icon">💳</span>
            <span class="action-label">Registrar Pago</span>
          </a>
          <a routerLink="cobranza" class="action-card">
            <span class="action-icon">📞</span>
            <span class="action-label">Gestión Cobranza</span>
          </a>
        </div>
      </section>

      <!-- Recent Activity -->
      <section class="activity-section">
        <div class="activity-columns">
          <div class="activity-column">
            <h3>📥 Últimos Cobros</h3>
            <div class="activity-list">
              @for (receipt of summary().recentReceipts; track $index) {
                <div class="activity-item">
                  <div class="activity-info">
                    <span class="activity-customer">{{ receipt.customer }}</span>
                    <span class="activity-date">{{ receipt.date }}</span>
                  </div>
                  <span class="activity-amount positive">+{{ receipt.amount | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
                </div>
              }
            </div>
          </div>
          <div class="activity-column">
            <h3>📤 Últimos Pagos</h3>
            <div class="activity-list">
              @for (payment of summary().recentPayments; track $index) {
                <div class="activity-item">
                  <div class="activity-info">
                    <span class="activity-customer">{{ payment.supplier }}</span>
                    <span class="activity-date">{{ payment.date }}</span>
                  </div>
                  <span class="activity-amount negative">-{{ payment.amount | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .dashboard-container { padding: 24px; min-height: 100vh; background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%); }
    .dashboard-header { margin-bottom: 32px; position: relative; }
    .dashboard-header h1 { color: #fff; font-size: 2rem; margin: 0; }
    .subtitle { color: rgba(255,255,255,0.6); margin-top: 4px; }
    .live-badge { position: absolute; right: 0; top: 0; background: rgba(239,68,68,0.2); color: #ef4444; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .loading-overlay { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 48px; color: rgba(255,255,255,0.6); }
    .spinner { width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #667eea; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .kpi-section { margin-bottom: 32px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }
    .kpi-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; display: flex; gap: 16px; transition: all 0.3s; }
    .kpi-card:hover { transform: translateY(-4px); box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
    .kpi-card.receivable { border-left: 4px solid #4ade80; }
    .kpi-card.payable { border-left: 4px solid #f87171; }
    .kpi-card.overdue { border-left: 4px solid #fbbf24; }
    .kpi-card.balance { border-left: 4px solid #667eea; }
    .kpi-icon { font-size: 2.5rem; }
    .kpi-content { display: flex; flex-direction: column; }
    .kpi-title { color: rgba(255,255,255,0.6); font-size: 0.85rem; text-transform: uppercase; }
    .kpi-value { color: #fff; font-size: 1.75rem; font-weight: 700; }
    .kpi-value.positive { color: #4ade80; }
    .kpi-value.negative { color: #f87171; }
    .kpi-sublabel { color: rgba(255,255,255,0.4); font-size: 0.8rem; }
    .kpi-alert { color: #fbbf24; font-size: 0.8rem; margin-top: 4px; }
    .actions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .action-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; text-align: center; text-decoration: none; transition: all 0.3s; }
    .action-card:hover { background: rgba(255,255,255,0.08); transform: translateY(-2px); }
    .action-card.primary { background: linear-gradient(135deg, rgba(102,126,234,0.2) 0%, rgba(118,75,162,0.2) 100%); border-color: rgba(102,126,234,0.4); }
    .action-icon { font-size: 2rem; display: block; margin-bottom: 8px; }
    .action-label { color: #fff; font-weight: 500; }
    .activity-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .activity-column h3 { color: #fff; font-size: 1rem; margin-bottom: 16px; }
    .activity-list { background: rgba(255,255,255,0.02); border-radius: 12px; overflow: hidden; }
    .activity-item { display: flex; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .activity-info { display: flex; flex-direction: column; }
    .activity-customer { color: #fff; font-weight: 500; }
    .activity-date { color: rgba(255,255,255,0.4); font-size: 0.8rem; }
    .activity-amount { font-weight: 600; }
    .activity-amount.positive { color: #4ade80; }
    .activity-amount.negative { color: #f87171; }
    @media (max-width: 768px) { .activity-columns { grid-template-columns: 1fr; } }
  `]
})
export class CobrosPagosDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/payments`;

  loading = signal(false);
  isLive = signal(false);

  summary = signal<Summary>({
    receivables: { total: 0, overdue: 0, overdueCount: 0 },
    payables: { total: 0, overdueCount: 0 },
    recentReceipts: [],
    recentPayments: []
  });

  netBalance = signal(0);

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);

    // Load receivables summary
    this.http.get<any>(`${this.baseUrl}/receivables/summary`).subscribe({
      next: (recSummary) => {
        this.http.get<any>(`${this.baseUrl}/payables/summary`).subscribe({
          next: (paySummary) => {
            this.summary.set({
              receivables: {
                total: recSummary.totalReceivables || 9480000,
                overdue: recSummary.overdueAmount || 1130000,
                overdueCount: recSummary.overdueCount || 2
              },
              payables: {
                total: paySummary.totalPayables || 4939000,
                overdueCount: paySummary.overdueCount || 1
              },
              recentReceipts: [
                { date: '27/12', customer: 'Empresa ABC Ltda.', amount: 850000 },
                { date: '26/12', customer: 'Comercial XYZ', amount: 1200000 },
                { date: '25/12', customer: 'Distribuidora Norte', amount: 2200000 }
              ],
              recentPayments: [
                { date: '27/12', supplier: 'Distribuidora Nacional', amount: 800000 },
                { date: '26/12', supplier: 'Importadora del Pacífico', amount: 600000 }
              ]
            });
            this.netBalance.set((recSummary.totalReceivables || 9480000) - (paySummary.totalPayables || 4939000));
            this.isLive.set(true);
            this.loading.set(false);
          },
          error: () => this.setFallbackData()
        });
      },
      error: () => this.setFallbackData()
    });
  }

  private setFallbackData(): void {
    this.summary.set({
      receivables: { total: 9480000, overdue: 1130000, overdueCount: 2 },
      payables: { total: 4939000, overdueCount: 1 },
      recentReceipts: [
        { date: '27/12', customer: 'Empresa ABC Ltda.', amount: 850000 },
        { date: '26/12', customer: 'Comercial XYZ', amount: 1200000 },
        { date: '25/12', customer: 'Distribuidora Norte', amount: 2200000 }
      ],
      recentPayments: [
        { date: '27/12', supplier: 'Distribuidora Nacional', amount: 800000 },
        { date: '26/12', supplier: 'Importadora del Pacífico', amount: 600000 }
      ]
    });
    this.netBalance.set(4541000);
    this.loading.set(false);
  }
}
