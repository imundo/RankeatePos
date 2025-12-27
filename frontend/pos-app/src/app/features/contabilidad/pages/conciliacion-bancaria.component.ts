import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface BankTransactionItem {
    id: string;
    date: string;
    description: string;
    amount: number;
    status: 'pending' | 'reconciled' | 'ignored';
}

interface JournalLineItem {
    id: string;
    date: string;
    accountName: string;
    description: string;
    amount: number;
    isReconciled: boolean;
}

@Component({
    selector: 'app-conciliacion-bancaria',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="page-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-left">
          <a routerLink="/contabilidad" class="back-link">← Volver</a>
          <h1>🏦 Conciliación Bancaria</h1>
        </div>
        <div class="header-actions">
          <select class="bank-select" (change)="onBankChange($event)">
            <option value="1">Banco de Chile - Cta. Cte. *4521</option>
            <option value="2">Santander - Cta. Vista *7890</option>
          </select>
          <button class="btn btn-secondary">
            📥 Importar Cartola
          </button>
        </div>
      </header>

      <!-- Stats -->
      <div class="stats-bar">
        <div class="stat">
          <span class="stat-icon">💰</span>
          <div class="stat-content">
            <span class="stat-value">$12.450.000</span>
            <span class="stat-label">Saldo Banco</span>
          </div>
        </div>
        <div class="stat">
          <span class="stat-icon">📚</span>
          <div class="stat-content">
            <span class="stat-value">$12.325.000</span>
            <span class="stat-label">Saldo Contable</span>
          </div>
        </div>
        <div class="stat difference">
          <span class="stat-icon">⚠️</span>
          <div class="stat-content">
            <span class="stat-value">$125.000</span>
            <span class="stat-label">Diferencia</span>
          </div>
        </div>
        <div class="stat pending">
          <span class="stat-icon">⏳</span>
          <div class="stat-content">
            <span class="stat-value">{{ pendingBankItems() }}</span>
            <span class="stat-label">Pendientes Banco</span>
          </div>
        </div>
      </div>

      <!-- Two-column reconciliation view -->
      <div class="reconciliation-container">
        <!-- Bank Transactions Column -->
        <div class="column bank-column">
          <div class="column-header">
            <h2>📄 Movimientos Bancarios</h2>
            <span class="item-count">{{ bankTransactions().length }} items</span>
          </div>
          <div class="items-list">
            @for (tx of bankTransactions(); track tx.id) {
              <div 
                class="item-card" 
                [class.reconciled]="tx.status === 'reconciled'"
                [class.selected]="selectedBankItem() === tx.id"
                [class.dragging]="draggingItem() === tx.id"
                (click)="selectBankItem(tx)"
                draggable="true"
                (dragstart)="onDragStart($event, tx.id, 'bank')"
              >
                <div class="item-date">{{ tx.date }}</div>
                <div class="item-description">{{ tx.description }}</div>
                <div class="item-amount" [class.positive]="tx.amount > 0" [class.negative]="tx.amount < 0">
                  {{ tx.amount | currency:'CLP':'symbol-narrow':'1.0-0' }}
                </div>
                @if (tx.status === 'reconciled') {
                  <span class="reconciled-badge">✓</span>
                }
              </div>
            }
          </div>
        </div>

        <!-- Match Zone -->
        <div class="match-zone"
             (dragover)="onDragOver($event)"
             (drop)="onDrop($event)">
          <div class="match-content">
            <span class="match-icon">🔗</span>
            <span class="match-text">Arrastra items aquí para conciliar</span>
            @if (selectedBankItem() && selectedJournalItem()) {
              <button class="btn btn-primary" (click)="reconcileSelected()">
                ✅ Conciliar Seleccionados
              </button>
            }
          </div>
        </div>

        <!-- Journal Entries Column -->
        <div class="column journal-column">
          <div class="column-header">
            <h2>📒 Movimientos Contables</h2>
            <span class="item-count">{{ journalLines().length }} items</span>
          </div>
          <div class="items-list">
            @for (line of journalLines(); track line.id) {
              <div 
                class="item-card"
                [class.reconciled]="line.isReconciled"
                [class.selected]="selectedJournalItem() === line.id"
                (click)="selectJournalItem(line)"
                draggable="true"
                (dragstart)="onDragStart($event, line.id, 'journal')"
              >
                <div class="item-date">{{ line.date }}</div>
                <div class="item-account">{{ line.accountName }}</div>
                <div class="item-description">{{ line.description }}</div>
                <div class="item-amount" [class.positive]="line.amount > 0" [class.negative]="line.amount < 0">
                  {{ line.amount | currency:'CLP':'symbol-narrow':'1.0-0' }}
                </div>
                @if (line.isReconciled) {
                  <span class="reconciled-badge">✓</span>
                }
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <button class="btn btn-secondary" (click)="autoReconcile()">
          🤖 Conciliar Automáticamente
        </button>
        <button class="btn btn-outline" (click)="showUnreconciled()">
          📋 Ver Solo Pendientes
        </button>
      </div>
    </div>
  `,
    styles: [`
    .page-container {
      padding: 24px;
      min-height: 100vh;
      background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%);
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .header-left {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .back-link {
      color: rgba(255,255,255,0.6);
      text-decoration: none;
    }

    h1 {
      color: #fff;
      font-size: 1.75rem;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 16px;
      align-items: center;
    }

    .bank-select {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 10px;
      padding: 12px 16px;
      color: #fff;
      font-size: 0.95rem;
      min-width: 250px;
    }

    .bank-select option {
      background: #1a1a3e;
    }

    .btn {
      padding: 12px 20px;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-secondary {
      background: rgba(255,255,255,0.1);
      color: #fff;
    }

    .btn-outline {
      background: transparent;
      border: 1px solid rgba(255,255,255,0.2);
      color: rgba(255,255,255,0.7);
    }

    /* Stats Bar */
    .stats-bar {
      display: flex;
      gap: 20px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 16px 20px;
      flex: 1;
      min-width: 200px;
    }

    .stat.difference {
      border-color: rgba(251, 191, 36, 0.3);
      background: rgba(251, 191, 36, 0.05);
    }

    .stat.pending {
      border-color: rgba(102, 126, 234, 0.3);
      background: rgba(102, 126, 234, 0.05);
    }

    .stat-icon {
      font-size: 2rem;
    }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      color: #fff;
      font-size: 1.25rem;
      font-weight: 700;
    }

    .stat-label {
      color: rgba(255,255,255,0.5);
      font-size: 0.85rem;
    }

    /* Reconciliation Container */
    .reconciliation-container {
      display: grid;
      grid-template-columns: 1fr 100px 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }

    .column {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      overflow: hidden;
    }

    .column-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: rgba(255,255,255,0.05);
    }

    .column-header h2 {
      color: #fff;
      font-size: 1rem;
      margin: 0;
    }

    .item-count {
      color: rgba(255,255,255,0.5);
      font-size: 0.85rem;
    }

    .items-list {
      padding: 12px;
      max-height: 400px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .item-card {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      padding: 12px 16px;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
    }

    .item-card:hover {
      background: rgba(255,255,255,0.05);
      border-color: rgba(255,255,255,0.15);
    }

    .item-card.selected {
      border-color: #667eea;
      background: rgba(102, 126, 234, 0.1);
    }

    .item-card.reconciled {
      opacity: 0.5;
      background: rgba(74, 222, 128, 0.05);
    }

    .item-card.dragging {
      opacity: 0.5;
      transform: scale(0.95);
    }

    .item-date {
      color: rgba(255,255,255,0.5);
      font-size: 0.8rem;
      margin-bottom: 4px;
    }

    .item-description {
      color: #fff;
      font-size: 0.9rem;
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-account {
      color: #667eea;
      font-size: 0.8rem;
      margin-bottom: 2px;
    }

    .item-amount {
      font-weight: 600;
      font-size: 1rem;
    }

    .item-amount.positive { color: #4ade80; }
    .item-amount.negative { color: #f87171; }

    .reconciled-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(74, 222, 128, 0.2);
      color: #4ade80;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
    }

    /* Match Zone */
    .match-zone {
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(102, 126, 234, 0.05);
      border: 2px dashed rgba(102, 126, 234, 0.3);
      border-radius: 12px;
      min-height: 200px;
    }

    .match-content {
      text-align: center;
      padding: 16px;
    }

    .match-icon {
      font-size: 2rem;
      display: block;
      margin-bottom: 8px;
    }

    .match-text {
      color: rgba(255,255,255,0.5);
      font-size: 0.85rem;
      display: block;
      margin-bottom: 16px;
    }

    /* Quick Actions */
    .quick-actions {
      display: flex;
      gap: 16px;
      justify-content: center;
    }

    @media (max-width: 1024px) {
      .reconciliation-container {
        grid-template-columns: 1fr;
      }

      .match-zone {
        min-height: 80px;
      }
    }
  `]
})
export class ConciliacionBancariaComponent implements OnInit {
    selectedBankItem = signal<string | null>(null);
    selectedJournalItem = signal<string | null>(null);
    draggingItem = signal<string | null>(null);

    bankTransactions = signal<BankTransactionItem[]>([
        { id: '1', date: '27/12/2024', description: 'TRANSF RECIBIDA DE CLI 7654321', amount: 850000, status: 'pending' },
        { id: '2', date: '27/12/2024', description: 'PAC ARRIENDO LOCAL', amount: -450000, status: 'pending' },
        { id: '3', date: '26/12/2024', description: 'COMPRA POS COM OFICINA', amount: -125000, status: 'pending' },
        { id: '4', date: '26/12/2024', description: 'TRANSF RECIBIDA ANTICIPO', amount: 1200000, status: 'reconciled' },
        { id: '5', date: '25/12/2024', description: 'DEPOSITO EFECTIVO', amount: 500000, status: 'reconciled' }
    ]);

    journalLines = signal<JournalLineItem[]>([
        { id: '1', date: '27/12/2024', accountName: 'Bancos', description: 'Cobro factura 1234', amount: 850000, isReconciled: false },
        { id: '2', date: '27/12/2024', accountName: 'Bancos', description: 'Pago arriendo local', amount: -450000, isReconciled: false },
        { id: '3', date: '26/12/2024', accountName: 'Bancos', description: 'Compra suministros', amount: -125000, isReconciled: false },
        { id: '4', date: '26/12/2024', accountName: 'Bancos', description: 'Anticipo cliente', amount: 1200000, isReconciled: true },
        { id: '5', date: '25/12/2024', accountName: 'Bancos', description: 'Depósito', amount: 500000, isReconciled: true }
    ]);

    pendingBankItems = signal(3);

    ngOnInit(): void { }

    onBankChange(event: Event): void {
        const select = event.target as HTMLSelectElement;
        console.log('Bank changed:', select.value);
    }

    selectBankItem(tx: BankTransactionItem): void {
        if (tx.status !== 'reconciled') {
            this.selectedBankItem.set(tx.id);
        }
    }

    selectJournalItem(line: JournalLineItem): void {
        if (!line.isReconciled) {
            this.selectedJournalItem.set(line.id);
        }
    }

    onDragStart(event: DragEvent, id: string, type: 'bank' | 'journal'): void {
        this.draggingItem.set(id);
        event.dataTransfer?.setData('text/plain', JSON.stringify({ id, type }));
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        this.draggingItem.set(null);
        const data = event.dataTransfer?.getData('text/plain');
        if (data) {
            const { id, type } = JSON.parse(data);
            console.log('Dropped:', id, type);
        }
    }

    reconcileSelected(): void {
        console.log('Reconcile:', this.selectedBankItem(), this.selectedJournalItem());
        // Mark as reconciled
        this.selectedBankItem.set(null);
        this.selectedJournalItem.set(null);
    }

    autoReconcile(): void {
        console.log('Auto reconcile started');
    }

    showUnreconciled(): void {
        console.log('Filter unreconciled');
    }
}
