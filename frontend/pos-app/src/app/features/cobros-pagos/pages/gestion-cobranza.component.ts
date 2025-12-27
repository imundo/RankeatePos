import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-gestion-cobranza',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="page-container">
      <header class="page-header">
        <a routerLink="/cobros-pagos" class="back-link">← Volver</a>
        <h1>📞 Gestión de Cobranza</h1>
      </header>

      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-value">{{ overdueCount() }}</span>
          <span class="stat-label">Cuentas Vencidas</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ overdueTotal() | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
          <span class="stat-label">Monto Vencido</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ pendingReminders() }}</span>
          <span class="stat-label">Recordatorios Pendientes</span>
        </div>
      </div>

      <div class="cobranza-list">
        <h2>Cuentas para Gestionar</h2>
        @for (item of overdueItems(); track item.id) {
          <div class="cobranza-item">
            <div class="item-info">
              <span class="customer-name">{{ item.customer }}</span>
              <span class="document-info">{{ item.documentNumber }} • Vencido hace {{ item.daysOverdue }} días</span>
            </div>
            <div class="item-amount">{{ item.balance | currency:'CLP':'symbol-narrow':'1.0-0' }}</div>
            <div class="item-actions">
              <button class="action-btn" title="Llamar" (click)="callCustomer(item)">📞</button>
              <button class="action-btn" title="WhatsApp" (click)="sendWhatsApp(item)">💬</button>
              <button class="action-btn" title="Email" (click)="sendEmail(item)">📧</button>
              <button class="action-btn primary" (click)="markContacted(item)">✓ Contactado</button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
    styles: [`
    .page-container { padding: 24px; min-height: 100vh; background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%); }
    .page-header { margin-bottom: 24px; }
    .back-link { color: rgba(255,255,255,0.6); text-decoration: none; display: block; margin-bottom: 8px; }
    h1, h2 { color: #fff; margin: 0; }
    h2 { font-size: 1.1rem; margin-bottom: 16px; }
    .stats-row { display: flex; gap: 20px; margin-bottom: 32px; }
    .stat-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; text-align: center; flex: 1; }
    .stat-value { display: block; color: #fbbf24; font-size: 2rem; font-weight: 700; }
    .stat-label { color: rgba(255,255,255,0.6); font-size: 0.85rem; }
    .cobranza-list { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; }
    .cobranza-item { display: flex; align-items: center; gap: 20px; padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .cobranza-item:last-child { border-bottom: none; }
    .item-info { flex: 1; }
    .customer-name { display: block; color: #fff; font-weight: 600; }
    .document-info { color: rgba(255,255,255,0.5); font-size: 0.85rem; }
    .item-amount { color: #fbbf24; font-size: 1.25rem; font-weight: 700; min-width: 150px; text-align: right; }
    .item-actions { display: flex; gap: 8px; }
    .action-btn { background: rgba(255,255,255,0.05); border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; color: #fff; }
    .action-btn:hover { background: rgba(255,255,255,0.15); }
    .action-btn.primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
  `]
})
export class GestionCobranzaComponent {
    overdueCount = signal(5);
    overdueTotal = signal(3550000);
    pendingReminders = signal(3);

    overdueItems = signal([
        { id: '1', customer: 'Empresa ABC Ltda.', documentNumber: 'F-1234', balance: 1500000, daysOverdue: 12 },
        { id: '2', customer: 'Comercial XYZ', documentNumber: 'F-1235', balance: 850000, daysOverdue: 7 },
        { id: '3', customer: 'Distribuidora Sur', documentNumber: 'F-1200', balance: 1200000, daysOverdue: 15 }
    ]);

    callCustomer(item: any): void { console.log('Call:', item.customer); }
    sendWhatsApp(item: any): void { console.log('WhatsApp:', item.customer); }
    sendEmail(item: any): void { console.log('Email:', item.customer); }
    markContacted(item: any): void { console.log('Contacted:', item.customer); }
}
