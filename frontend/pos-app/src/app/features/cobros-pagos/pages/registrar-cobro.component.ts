import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-registrar-cobro',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    template: `
    <div class="page-container">
      <header class="page-header">
        <a routerLink="/cobros-pagos" class="back-link">← Volver</a>
        <h1>💵 Registrar Cobro</h1>
      </header>

      <div class="form-container">
        <div class="form-section">
          <h2>Seleccionar Cuenta por Cobrar</h2>
          <select [(ngModel)]="selectedReceivable" class="form-control">
            <option value="">Seleccionar...</option>
            @for (item of receivables(); track item.id) {
              <option [value]="item.id">{{ item.customer }} - {{ item.documentNumber }} - Saldo: {{ item.balance | currency:'CLP':'symbol-narrow':'1.0-0' }}</option>
            }
          </select>
        </div>

        <div class="form-section">
          <h2>Datos del Cobro</h2>
          <div class="form-grid">
            <div class="form-group">
              <label>Monto a Cobrar</label>
              <input type="number" [(ngModel)]="amount" class="form-control" placeholder="0" />
            </div>
            <div class="form-group">
              <label>Método de Pago</label>
              <select [(ngModel)]="paymentMethod" class="form-control">
                <option value="TRANSFER">Transferencia</option>
                <option value="CASH">Efectivo</option>
                <option value="CHECK">Cheque</option>
                <option value="CREDIT_CARD">Tarjeta Crédito</option>
                <option value="WEBPAY">Webpay</option>
              </select>
            </div>
            <div class="form-group">
              <label>Número Referencia</label>
              <input type="text" [(ngModel)]="referenceNumber" class="form-control" placeholder="Ej: N° transferencia" />
            </div>
            <div class="form-group full-width">
              <label>Notas</label>
              <textarea [(ngModel)]="notes" class="form-control" rows="3"></textarea>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button class="btn btn-outline" routerLink="/cobros-pagos">Cancelar</button>
          <button class="btn btn-primary" (click)="saveReceipt()">💾 Registrar Cobro</button>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .page-container { padding: 24px; min-height: 100vh; background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%); }
    .page-header { margin-bottom: 24px; }
    .back-link { color: rgba(255,255,255,0.6); text-decoration: none; display: block; margin-bottom: 8px; }
    h1 { color: #fff; margin: 0; }
    .form-container { max-width: 800px; }
    .form-section { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; margin-bottom: 24px; }
    .form-section h2 { color: #fff; font-size: 1.1rem; margin: 0 0 16px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .form-group.full-width { grid-column: span 2; }
    .form-group label { color: rgba(255,255,255,0.7); font-size: 0.9rem; }
    .form-control { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; padding: 12px 16px; color: #fff; font-size: 0.95rem; width: 100%; }
    .form-control:focus { outline: none; border-color: #667eea; }
    .form-control option { background: #1a1a3e; }
    textarea.form-control { resize: none; }
    .form-actions { display: flex; justify-content: flex-end; gap: 16px; }
    .btn { padding: 12px 24px; border-radius: 10px; font-weight: 600; border: none; cursor: pointer; }
    .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
    .btn-outline { background: transparent; border: 1px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.7); }
  `]
})
export class RegistrarCobroComponent {
    selectedReceivable = '';
    amount = 0;
    paymentMethod = 'TRANSFER';
    referenceNumber = '';
    notes = '';

    receivables = signal([
        { id: '1', customer: 'Empresa ABC Ltda.', documentNumber: 'F-1234', balance: 1500000 },
        { id: '2', customer: 'Comercial XYZ', documentNumber: 'F-1235', balance: 850000 },
        { id: '3', customer: 'Distribuidora Norte', documentNumber: 'F-1240', balance: 1100000 }
    ]);

    saveReceipt(): void {
        console.log('Save receipt:', { receivable: this.selectedReceivable, amount: this.amount, method: this.paymentMethod });
    }
}
