import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-cotizaciones-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <h1>📝 Cotizaciones</h1>
        <p class="subtitle">Gestión de cotizaciones y propuestas comerciales</p>
      </header>

      <!-- KPIs -->
      <section class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-icon">📋</span>
          <div class="kpi-content">
            <span class="kpi-value">{{ pendingQuotes() }}</span>
            <span class="kpi-label">Cotizaciones Pendientes</span>
          </div>
        </div>
        <div class="kpi-card">
          <span class="kpi-icon">✅</span>
          <div class="kpi-content">
            <span class="kpi-value">{{ approvedQuotes() }}</span>
            <span class="kpi-label">Aprobadas este Mes</span>
          </div>
        </div>
        <div class="kpi-card">
          <span class="kpi-icon">💰</span>
          <div class="kpi-content">
            <span class="kpi-value">{{ totalQuoted() | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
            <span class="kpi-label">Total Cotizado</span>
          </div>
        </div>
        <div class="kpi-card">
          <span class="kpi-icon">📊</span>
          <div class="kpi-content">
            <span class="kpi-value">{{ conversionRate() }}%</span>
            <span class="kpi-label">Tasa de Conversión</span>
          </div>
        </div>
      </section>

      <!-- Actions -->
      <section class="actions-grid">
        <a routerLink="nueva" class="action-card primary">
          <span class="action-icon">➕</span>
          <span class="action-label">Nueva Cotización</span>
        </a>
        <a routerLink="lista" class="action-card">
          <span class="action-icon">📋</span>
          <span class="action-label">Ver Cotizaciones</span>
        </a>
        <a href="#" class="action-card">
          <span class="action-icon">📊</span>
          <span class="action-label">Reportes</span>
        </a>
      </section>

      <!-- Recent Quotes -->
      <section class="recent-section">
        <h3>Cotizaciones Recientes</h3>
        <div class="quotes-list">
          @for (quote of recentQuotes(); track quote.id) {
            <div class="quote-item">
              <div class="quote-info">
                <span class="quote-number">COT-{{ quote.number }}</span>
                <span class="quote-customer">{{ quote.customer }}</span>
              </div>
              <span class="quote-amount">{{ quote.amount | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
              <span class="quote-status" [class]="quote.status.toLowerCase()">{{ getStatusLabel(quote.status) }}</span>
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
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 32px; }
    .kpi-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 20px; display: flex; gap: 16px; }
    .kpi-icon { font-size: 2rem; }
    .kpi-content { display: flex; flex-direction: column; }
    .kpi-value { color: #fff; font-size: 1.5rem; font-weight: 700; }
    .kpi-label { color: rgba(255,255,255,0.6); font-size: 0.85rem; }
    .actions-grid { display: flex; gap: 16px; margin-bottom: 32px; }
    .action-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px 32px; text-align: center; text-decoration: none; transition: all 0.3s; }
    .action-card:hover { background: rgba(255,255,255,0.08); }
    .action-card.primary { background: linear-gradient(135deg, rgba(102,126,234,0.2) 0%, rgba(118,75,162,0.2) 100%); border-color: rgba(102,126,234,0.4); }
    .action-icon { font-size: 1.5rem; display: block; margin-bottom: 8px; }
    .action-label { color: #fff; font-weight: 500; }
    .recent-section { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; }
    .recent-section h3 { color: #fff; margin: 0 0 16px; }
    .quote-item { display: flex; align-items: center; gap: 20px; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .quote-info { flex: 1; display: flex; flex-direction: column; }
    .quote-number { color: #667eea; font-weight: 600; }
    .quote-customer { color: rgba(255,255,255,0.6); font-size: 0.85rem; }
    .quote-amount { color: #fff; font-weight: 600; min-width: 120px; text-align: right; }
    .quote-status { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; }
    .quote-status.pending { background: rgba(251,191,36,0.2); color: #fbbf24; }
    .quote-status.approved { background: rgba(74,222,128,0.2); color: #4ade80; }
    .quote-status.rejected { background: rgba(239,68,68,0.2); color: #ef4444; }
    .quote-status.expired { background: rgba(156,163,175,0.2); color: #9ca3af; }
  `]
})
export class CotizacionesDashboardComponent {
    pendingQuotes = signal(12);
    approvedQuotes = signal(8);
    totalQuoted = signal(45000000);
    conversionRate = signal(67);

    recentQuotes = signal([
        { id: '1', number: 2045, customer: 'Empresa ABC Ltda.', amount: 3500000, status: 'PENDING' },
        { id: '2', number: 2044, customer: 'Comercial XYZ', amount: 1200000, status: 'APPROVED' },
        { id: '3', number: 2043, customer: 'Distribuidora Norte', amount: 8500000, status: 'PENDING' },
        { id: '4', number: 2042, customer: 'Local El Trigal', amount: 450000, status: 'REJECTED' }
    ]);

    getStatusLabel(status: string): string {
        return { PENDING: 'Pendiente', APPROVED: 'Aprobada', REJECTED: 'Rechazada', EXPIRED: 'Vencida' }[status] || status;
    }
}
