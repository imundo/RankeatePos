import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface AccountNode {
    id: string;
    code: string;
    name: string;
    type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE' | 'COST';
    level: number;
    allowsMovements: boolean;
    isActive: boolean;
    isExpanded: boolean;
    children: AccountNode[];
}

@Component({
    selector: 'app-plan-cuentas',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="page-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-left">
          <a routerLink="/contabilidad" class="back-link">← Volver</a>
          <h1>📑 Plan de Cuentas</h1>
        </div>
        <div class="header-actions">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Buscar cuenta..." 
              [(ngModel)]="searchQuery"
              (input)="onSearch()"
            />
          </div>
          <button class="btn btn-primary" (click)="showNewAccountModal = true">
            ➕ Nueva Cuenta
          </button>
        </div>
      </header>

      <!-- Stats Bar -->
      <div class="stats-bar">
        <div class="stat">
          <span class="stat-value">{{ totalAccounts() }}</span>
          <span class="stat-label">Cuentas Totales</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ movableAccounts() }}</span>
          <span class="stat-label">Con Movimientos</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ activeAccounts() }}</span>
          <span class="stat-label">Activas</span>
        </div>
      </div>

      <!-- Tree View -->
      <div class="tree-container">
        <div class="tree-header">
          <span class="col-code">Código</span>
          <span class="col-name">Nombre</span>
          <span class="col-type">Tipo</span>
          <span class="col-status">Estado</span>
          <span class="col-actions">Acciones</span>
        </div>
        
        <div class="tree-body">
          @for (node of accounts(); track node.id) {
            <ng-container *ngTemplateOutlet="treeNode; context: { $implicit: node }"></ng-container>
          }
        </div>
      </div>

      <!-- Tree Node Template -->
      <ng-template #treeNode let-node>
        <div 
          class="tree-row" 
          [class.level-1]="node.level === 1"
          [class.level-2]="node.level === 2"
          [class.level-3]="node.level === 3"
          [class.level-4]="node.level === 4"
          [style.--indent]="(node.level - 1) * 24 + 'px'"
        >
          <span class="col-code">
            <button 
              *ngIf="node.children?.length" 
              class="expand-btn"
              (click)="toggleExpand(node)"
            >
              {{ node.isExpanded ? '▼' : '▶' }}
            </button>
            <span class="code-text">{{ node.code }}</span>
          </span>
          <span class="col-name">{{ node.name }}</span>
          <span class="col-type">
            <span class="type-badge" [class]="node.type.toLowerCase()">
              {{ getTypeLabel(node.type) }}
            </span>
          </span>
          <span class="col-status">
            <span class="status-badge" [class.active]="node.isActive" [class.inactive]="!node.isActive">
              {{ node.isActive ? 'Activa' : 'Inactiva' }}
            </span>
          </span>
          <span class="col-actions">
            @if (node.allowsMovements) {
              <button class="action-btn" title="Ver mayor" (click)="viewLedger(node)">📖</button>
            }
            <button class="action-btn" title="Editar" (click)="editAccount(node)">✏️</button>
            <button class="action-btn" title="Agregar subcuenta" (click)="addSubAccount(node)">➕</button>
          </span>
        </div>
        
        @if (node.isExpanded && node.children?.length) {
          @for (child of node.children; track child.id) {
            <ng-container *ngTemplateOutlet="treeNode; context: { $implicit: child }"></ng-container>
          }
        }
      </ng-template>

      <!-- Legend -->
      <div class="legend">
        <span class="legend-title">Tipos de Cuenta:</span>
        <span class="legend-item"><span class="type-badge asset">Activo</span></span>
        <span class="legend-item"><span class="type-badge liability">Pasivo</span></span>
        <span class="legend-item"><span class="type-badge equity">Patrimonio</span></span>
        <span class="legend-item"><span class="type-badge income">Ingresos</span></span>
        <span class="legend-item"><span class="type-badge expense">Gastos</span></span>
        <span class="legend-item"><span class="type-badge cost">Costos</span></span>
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
      align-items: center;
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

    .back-link:hover {
      color: #667eea;
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

    .search-box {
      display: flex;
      align-items: center;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 8px 16px;
    }

    .search-icon {
      margin-right: 8px;
    }

    .search-box input {
      background: none;
      border: none;
      color: #fff;
      outline: none;
      font-size: 0.95rem;
      width: 200px;
    }

    .btn {
      padding: 12px 20px;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }

    /* Stats Bar */
    .stats-bar {
      display: flex;
      gap: 24px;
      margin-bottom: 24px;
      padding: 16px 24px;
      background: rgba(255,255,255,0.03);
      border-radius: 12px;
    }

    .stat {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .stat-value {
      color: #fff;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .stat-label {
      color: rgba(255,255,255,0.5);
      font-size: 0.85rem;
    }

    /* Tree View */
    .tree-container {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      overflow: hidden;
    }

    .tree-header {
      display: grid;
      grid-template-columns: 150px 1fr 120px 100px 120px;
      gap: 16px;
      padding: 16px 24px;
      background: rgba(255,255,255,0.05);
      color: rgba(255,255,255,0.6);
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .tree-body {
      max-height: 60vh;
      overflow-y: auto;
    }

    .tree-row {
      display: grid;
      grid-template-columns: 150px 1fr 120px 100px 120px;
      gap: 16px;
      padding: 12px 24px;
      padding-left: calc(24px + var(--indent, 0px));
      align-items: center;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      transition: background 0.2s;
    }

    .tree-row:hover {
      background: rgba(255,255,255,0.05);
    }

    .tree-row.level-1 {
      background: rgba(102, 126, 234, 0.1);
      font-weight: 600;
    }

    .tree-row.level-2 {
      background: rgba(102, 126, 234, 0.05);
    }

    .expand-btn {
      background: none;
      border: none;
      color: rgba(255,255,255,0.6);
      cursor: pointer;
      padding: 0;
      margin-right: 8px;
      font-size: 0.75rem;
    }

    .code-text {
      color: #667eea;
      font-family: monospace;
      font-size: 0.95rem;
    }

    .col-name {
      color: #fff;
    }

    .type-badge {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .type-badge.asset { background: rgba(74, 222, 128, 0.2); color: #4ade80; }
    .type-badge.liability { background: rgba(248, 113, 113, 0.2); color: #f87171; }
    .type-badge.equity { background: rgba(102, 126, 234, 0.2); color: #667eea; }
    .type-badge.income { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
    .type-badge.expense { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
    .type-badge.cost { background: rgba(251, 146, 60, 0.2); color: #fb923c; }

    .status-badge {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
    }

    .status-badge.active {
      background: rgba(74, 222, 128, 0.2);
      color: #4ade80;
    }

    .status-badge.inactive {
      background: rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.5);
    }

    .col-actions {
      display: flex;
      gap: 8px;
    }

    .action-btn {
      background: rgba(255,255,255,0.05);
      border: none;
      padding: 6px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-btn:hover {
      background: rgba(255,255,255,0.15);
      transform: scale(1.1);
    }

    /* Legend */
    .legend {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-top: 24px;
      padding: 16px;
      background: rgba(255,255,255,0.02);
      border-radius: 12px;
      flex-wrap: wrap;
    }

    .legend-title {
      color: rgba(255,255,255,0.6);
      font-size: 0.9rem;
    }

    .legend-item {
      display: flex;
      align-items: center;
    }
  `]
})
export class PlanCuentasComponent implements OnInit {
    searchQuery = '';
    showNewAccountModal = false;

    accounts = signal<AccountNode[]>([
        {
            id: '1', code: '1', name: 'ACTIVO', type: 'ASSET', level: 1, allowsMovements: false, isActive: true, isExpanded: true,
            children: [
                {
                    id: '1.1', code: '1.1', name: 'Activo Corriente', type: 'ASSET', level: 2, allowsMovements: false, isActive: true, isExpanded: true,
                    children: [
                        { id: '1.1.1', code: '1.1.1', name: 'Caja', type: 'ASSET', level: 3, allowsMovements: true, isActive: true, isExpanded: false, children: [] },
                        { id: '1.1.2', code: '1.1.2', name: 'Bancos', type: 'ASSET', level: 3, allowsMovements: true, isActive: true, isExpanded: false, children: [] },
                        { id: '1.1.3', code: '1.1.3', name: 'Clientes', type: 'ASSET', level: 3, allowsMovements: true, isActive: true, isExpanded: false, children: [] },
                        { id: '1.1.4', code: '1.1.4', name: 'Inventario', type: 'ASSET', level: 3, allowsMovements: true, isActive: true, isExpanded: false, children: [] },
                        { id: '1.1.5', code: '1.1.5', name: 'IVA Crédito Fiscal', type: 'ASSET', level: 3, allowsMovements: true, isActive: true, isExpanded: false, children: [] }
                    ]
                }
            ]
        },
        {
            id: '2', code: '2', name: 'PASIVO', type: 'LIABILITY', level: 1, allowsMovements: false, isActive: true, isExpanded: false,
            children: [
                {
                    id: '2.1', code: '2.1', name: 'Pasivo Corriente', type: 'LIABILITY', level: 2, allowsMovements: false, isActive: true, isExpanded: false,
                    children: [
                        { id: '2.1.1', code: '2.1.1', name: 'Proveedores', type: 'LIABILITY', level: 3, allowsMovements: true, isActive: true, isExpanded: false, children: [] },
                        { id: '2.1.2', code: '2.1.2', name: 'IVA Débito Fiscal', type: 'LIABILITY', level: 3, allowsMovements: true, isActive: true, isExpanded: false, children: [] }
                    ]
                }
            ]
        },
        {
            id: '3', code: '3', name: 'PATRIMONIO', type: 'EQUITY', level: 1, allowsMovements: false, isActive: true, isExpanded: false, children: []
        },
        {
            id: '4', code: '4', name: 'INGRESOS', type: 'INCOME', level: 1, allowsMovements: false, isActive: true, isExpanded: false, children: []
        },
        {
            id: '5', code: '5', name: 'COSTOS', type: 'COST', level: 1, allowsMovements: false, isActive: true, isExpanded: false, children: []
        },
        {
            id: '6', code: '6', name: 'GASTOS', type: 'EXPENSE', level: 1, allowsMovements: false, isActive: true, isExpanded: false, children: []
        }
    ]);

    totalAccounts = computed(() => this.countAccounts(this.accounts()));
    movableAccounts = computed(() => this.countMovableAccounts(this.accounts()));
    activeAccounts = computed(() => this.countActiveAccounts(this.accounts()));

    ngOnInit(): void {
        // Load real data from API
    }

    toggleExpand(node: AccountNode): void {
        node.isExpanded = !node.isExpanded;
        this.accounts.update(accounts => [...accounts]);
    }

    getTypeLabel(type: string): string {
        const labels: Record<string, string> = {
            ASSET: 'Activo',
            LIABILITY: 'Pasivo',
            EQUITY: 'Patrimonio',
            INCOME: 'Ingresos',
            EXPENSE: 'Gastos',
            COST: 'Costos'
        };
        return labels[type] || type;
    }

    viewLedger(node: AccountNode): void {
        console.log('View ledger for:', node.code);
    }

    editAccount(node: AccountNode): void {
        console.log('Edit account:', node.code);
    }

    addSubAccount(node: AccountNode): void {
        console.log('Add sub-account to:', node.code);
    }

    onSearch(): void {
        console.log('Search:', this.searchQuery);
    }

    private countAccounts(nodes: AccountNode[]): number {
        return nodes.reduce((sum, node) => sum + 1 + this.countAccounts(node.children || []), 0);
    }

    private countMovableAccounts(nodes: AccountNode[]): number {
        return nodes.reduce((sum, node) =>
            sum + (node.allowsMovements ? 1 : 0) + this.countMovableAccounts(node.children || []), 0);
    }

    private countActiveAccounts(nodes: AccountNode[]): number {
        return nodes.reduce((sum, node) =>
            sum + (node.isActive ? 1 : 0) + this.countActiveAccounts(node.children || []), 0);
    }
}
