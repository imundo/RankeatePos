import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

interface JournalEntry {
    id: string;
    entryNumber: number;
    entryDate: string;
    type: 'STANDARD' | 'ADJUSTMENT' | 'OPENING' | 'CLOSING' | 'REVERSAL';
    description: string;
    totalDebit: number;
    totalCredit: number;
    status: 'DRAFT' | 'POSTED' | 'REVERSED';
    isAutomatic: boolean;
}

@Component({
    selector: 'app-libro-diario',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    template: `
    <div class="page-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-left">
          <a routerLink="/contabilidad" class="back-link">← Volver</a>
          <h1>📒 Libro Diario</h1>
        </div>
        <div class="header-actions">
          <div class="date-filter">
            <input type="date" [(ngModel)]="startDate" class="date-input" />
            <span class="date-separator">al</span>
            <input type="date" [(ngModel)]="endDate" class="date-input" />
            <button class="btn btn-secondary" (click)="applyFilter()">Filtrar</button>
          </div>
          <button class="btn btn-primary" routerLink="../asientos/nuevo">
            ➕ Nuevo Asiento
          </button>
        </div>
      </header>

      <!-- Status Tabs -->
      <div class="status-tabs">
        <button 
          class="tab" 
          [class.active]="activeTab === 'all'"
          (click)="setTab('all')"
        >
          Todos
          <span class="tab-badge">{{ entries().length }}</span>
        </button>
        <button 
          class="tab" 
          [class.active]="activeTab === 'draft'"
          (click)="setTab('draft')"
        >
          Borradores
          <span class="tab-badge draft">{{ countByStatus('DRAFT') }}</span>
        </button>
        <button 
          class="tab" 
          [class.active]="activeTab === 'posted'"
          (click)="setTab('posted')"
        >
          Contabilizados
          <span class="tab-badge posted">{{ countByStatus('POSTED') }}</span>
        </button>
      </div>

      <!-- Entries Table -->
      <div class="entries-table">
        <div class="table-header">
          <span class="col-number">#</span>
          <span class="col-date">Fecha</span>
          <span class="col-description">Descripción</span>
          <span class="col-type">Tipo</span>
          <span class="col-debit">Debe</span>
          <span class="col-credit">Haber</span>
          <span class="col-status">Estado</span>
          <span class="col-actions">Acciones</span>
        </div>

        <div class="table-body">
          @for (entry of filteredEntries(); track entry.id) {
            <div class="table-row" [class.draft]="entry.status === 'DRAFT'">
              <span class="col-number">
                <span class="entry-number">{{ entry.entryNumber }}</span>
                @if (entry.isAutomatic) {
                  <span class="auto-badge" title="Generado automáticamente">🤖</span>
                }
              </span>
              <span class="col-date">{{ entry.entryDate }}</span>
              <span class="col-description">{{ entry.description }}</span>
              <span class="col-type">
                <span class="type-chip" [class]="entry.type.toLowerCase()">
                  {{ getTypeLabel(entry.type) }}
                </span>
              </span>
              <span class="col-debit">{{ entry.totalDebit | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
              <span class="col-credit">{{ entry.totalCredit | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
              <span class="col-status">
                <span class="status-chip" [class]="entry.status.toLowerCase()">
                  {{ getStatusLabel(entry.status) }}
                </span>
              </span>
              <span class="col-actions">
                <button class="action-btn" title="Ver detalle" (click)="viewEntry(entry)">👁️</button>
                @if (entry.status === 'DRAFT') {
                  <button class="action-btn post" title="Contabilizar" (click)="postEntry(entry)">✅</button>
                  <button class="action-btn edit" title="Editar" (click)="editEntry(entry)">✏️</button>
                }
                @if (entry.status === 'POSTED') {
                  <button class="action-btn reverse" title="Revertir" (click)="reverseEntry(entry)">↩️</button>
                }
              </span>
            </div>
          } @empty {
            <div class="empty-state">
              <span class="empty-icon">📋</span>
              <span class="empty-text">No hay asientos para mostrar</span>
            </div>
          }
        </div>
      </div>

      <!-- Totals Footer -->
      <div class="totals-footer">
        <div class="total-item">
          <span class="total-label">Total Debe:</span>
          <span class="total-value debit">{{ totalDebit() | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
        </div>
        <div class="total-item">
          <span class="total-label">Total Haber:</span>
          <span class="total-value credit">{{ totalCredit() | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
        </div>
        <div class="total-item" [class.balanced]="isBalanced()" [class.unbalanced]="!isBalanced()">
          <span class="total-label">Diferencia:</span>
          <span class="total-value">{{ difference() | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <button class="page-btn" [disabled]="currentPage === 1" (click)="prevPage()">← Anterior</button>
        <span class="page-info">Página {{ currentPage }} de {{ totalPages }}</span>
        <button class="page-btn" [disabled]="currentPage === totalPages" (click)="nextPage()">Siguiente →</button>
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
      font-size: 0.9rem;
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
      flex-wrap: wrap;
    }

    .date-filter {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .date-input {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      padding: 10px 12px;
      color: #fff;
      font-size: 0.9rem;
    }

    .date-separator {
      color: rgba(255,255,255,0.5);
    }

    .btn {
      padding: 10px 20px;
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

    .btn:hover {
      transform: translateY(-2px);
    }

    /* Status Tabs */
    .status-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 24px;
    }

    .tab {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      color: rgba(255,255,255,0.7);
      cursor: pointer;
      transition: all 0.2s;
    }

    .tab:hover {
      background: rgba(255,255,255,0.1);
    }

    .tab.active {
      background: rgba(102, 126, 234, 0.2);
      border-color: #667eea;
      color: #fff;
    }

    .tab-badge {
      padding: 2px 8px;
      background: rgba(255,255,255,0.1);
      border-radius: 12px;
      font-size: 0.8rem;
    }

    .tab-badge.draft { background: rgba(251, 191, 36, 0.2); color: #fbbf24; }
    .tab-badge.posted { background: rgba(74, 222, 128, 0.2); color: #4ade80; }

    /* Table */
    .entries-table {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      overflow: hidden;
    }

    .table-header {
      display: grid;
      grid-template-columns: 80px 100px 1fr 100px 120px 120px 100px 120px;
      gap: 12px;
      padding: 16px 24px;
      background: rgba(255,255,255,0.05);
      color: rgba(255,255,255,0.6);
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .table-body {
      max-height: 50vh;
      overflow-y: auto;
    }

    .table-row {
      display: grid;
      grid-template-columns: 80px 100px 1fr 100px 120px 120px 100px 120px;
      gap: 12px;
      padding: 14px 24px;
      align-items: center;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      color: #fff;
      transition: background 0.2s;
    }

    .table-row:hover {
      background: rgba(255,255,255,0.05);
    }

    .table-row.draft {
      background: rgba(251, 191, 36, 0.05);
    }

    .entry-number {
      font-weight: 600;
      color: #667eea;
    }

    .auto-badge {
      margin-left: 4px;
      font-size: 0.8rem;
    }

    .type-chip, .status-chip {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .type-chip.standard { background: rgba(102, 126, 234, 0.2); color: #667eea; }
    .type-chip.adjustment { background: rgba(168, 85, 247, 0.2); color: #a855f7; }
    .type-chip.opening { background: rgba(74, 222, 128, 0.2); color: #4ade80; }
    .type-chip.closing { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
    .type-chip.reversal { background: rgba(251, 146, 60, 0.2); color: #fb923c; }

    .status-chip.draft { background: rgba(251, 191, 36, 0.2); color: #fbbf24; }
    .status-chip.posted { background: rgba(74, 222, 128, 0.2); color: #4ade80; }
    .status-chip.reversed { background: rgba(156, 163, 175, 0.2); color: #9ca3af; }

    .col-debit { color: #4ade80; text-align: right; }
    .col-credit { color: #f87171; text-align: right; }

    .col-actions {
      display: flex;
      gap: 6px;
    }

    .action-btn {
      background: rgba(255,255,255,0.05);
      border: none;
      padding: 6px 8px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-btn:hover {
      background: rgba(255,255,255,0.15);
      transform: scale(1.1);
    }

    .empty-state {
      padding: 48px;
      text-align: center;
      color: rgba(255,255,255,0.5);
    }

    .empty-icon {
      font-size: 3rem;
      display: block;
      margin-bottom: 16px;
    }

    /* Totals Footer */
    .totals-footer {
      display: flex;
      justify-content: flex-end;
      gap: 32px;
      padding: 20px 24px;
      margin-top: 24px;
      background: rgba(255,255,255,0.03);
      border-radius: 12px;
    }

    .total-item {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .total-label {
      color: rgba(255,255,255,0.6);
    }

    .total-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: #fff;
    }

    .total-value.debit { color: #4ade80; }
    .total-value.credit { color: #f87171; }

    .total-item.balanced .total-value { color: #4ade80; }
    .total-item.unbalanced .total-value { color: #fbbf24; }

    /* Pagination */
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      margin-top: 24px;
    }

    .page-btn {
      padding: 10px 20px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      color: #fff;
      cursor: pointer;
      transition: all 0.2s;
    }

    .page-btn:hover:not(:disabled) {
      background: rgba(255,255,255,0.1);
    }

    .page-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .page-info {
      color: rgba(255,255,255,0.6);
    }

    @media (max-width: 1200px) {
      .table-header, .table-row {
        grid-template-columns: 60px 90px 1fr 80px 100px 100px 80px 100px;
        font-size: 0.85rem;
      }
    }
  `]
})
export class LibroDiarioComponent implements OnInit {
    startDate = '';
    endDate = '';
    activeTab = 'all';
    currentPage = 1;
    totalPages = 5;

    entries = signal<JournalEntry[]>([
        { id: '1', entryNumber: 1045, entryDate: '2024-12-27', type: 'STANDARD', description: 'Venta productos varios - Factura 1234', totalDebit: 1011500, totalCredit: 1011500, status: 'POSTED', isAutomatic: true },
        { id: '2', entryNumber: 1044, entryDate: '2024-12-27', type: 'STANDARD', description: 'Pago arriendo local comercial', totalDebit: 450000, totalCredit: 450000, status: 'POSTED', isAutomatic: false },
        { id: '3', entryNumber: 1043, entryDate: '2024-12-26', type: 'STANDARD', description: 'Compra suministros oficina', totalDebit: 148750, totalCredit: 148750, status: 'DRAFT', isAutomatic: false },
        { id: '4', entryNumber: 1042, entryDate: '2024-12-26', type: 'ADJUSTMENT', description: 'Ajuste inventario - Toma física', totalDebit: 25000, totalCredit: 25000, status: 'DRAFT', isAutomatic: false },
        { id: '5', entryNumber: 1041, entryDate: '2024-12-25', type: 'STANDARD', description: 'Depósito cliente - Anticipo proyecto', totalDebit: 595000, totalCredit: 595000, status: 'POSTED', isAutomatic: true },
        { id: '6', entryNumber: 1040, entryDate: '2024-12-25', type: 'REVERSAL', description: 'Reversión asiento #1035', totalDebit: 120000, totalCredit: 120000, status: 'POSTED', isAutomatic: true }
    ]);

    filteredEntries = signal<JournalEntry[]>([]);

    totalDebit = signal(0);
    totalCredit = signal(0);
    difference = signal(0);

    ngOnInit(): void {
        this.filterEntries();
        this.calculateTotals();
    }

    setTab(tab: string): void {
        this.activeTab = tab;
        this.filterEntries();
    }

    filterEntries(): void {
        let filtered = this.entries();

        if (this.activeTab === 'draft') {
            filtered = filtered.filter(e => e.status === 'DRAFT');
        } else if (this.activeTab === 'posted') {
            filtered = filtered.filter(e => e.status === 'POSTED');
        }

        this.filteredEntries.set(filtered);
        this.calculateTotals();
    }

    calculateTotals(): void {
        const entries = this.filteredEntries();
        const debit = entries.reduce((sum, e) => sum + e.totalDebit, 0);
        const credit = entries.reduce((sum, e) => sum + e.totalCredit, 0);

        this.totalDebit.set(debit);
        this.totalCredit.set(credit);
        this.difference.set(Math.abs(debit - credit));
    }

    isBalanced(): boolean {
        return this.difference() === 0;
    }

    countByStatus(status: string): number {
        return this.entries().filter(e => e.status === status).length;
    }

    getTypeLabel(type: string): string {
        const labels: Record<string, string> = {
            STANDARD: 'Normal',
            ADJUSTMENT: 'Ajuste',
            OPENING: 'Apertura',
            CLOSING: 'Cierre',
            REVERSAL: 'Reversión'
        };
        return labels[type] || type;
    }

    getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            DRAFT: 'Borrador',
            POSTED: 'Contabilizado',
            REVERSED: 'Revertido'
        };
        return labels[status] || status;
    }

    applyFilter(): void {
        console.log('Apply filter:', this.startDate, this.endDate);
        this.filterEntries();
    }

    viewEntry(entry: JournalEntry): void {
        console.log('View entry:', entry.entryNumber);
    }

    editEntry(entry: JournalEntry): void {
        console.log('Edit entry:', entry.entryNumber);
    }

    postEntry(entry: JournalEntry): void {
        entry.status = 'POSTED';
        this.entries.update(entries => [...entries]);
        this.filterEntries();
    }

    reverseEntry(entry: JournalEntry): void {
        console.log('Reverse entry:', entry.entryNumber);
    }

    prevPage(): void {
        if (this.currentPage > 1) this.currentPage--;
    }

    nextPage(): void {
        if (this.currentPage < this.totalPages) this.currentPage++;
    }
}
