import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { StockService, StockDto, StockMovementDto, TipoMovimiento } from '@core/services/stock.service';

@Component({
    selector: 'app-inventory',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
    <div class="inventory-container">
      <header class="inventory-header">
        <div class="header-left">
          <button class="btn-icon" routerLink="/pos">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div class="header-title">
            <h1>Inventario</h1>
            <span class="subtitle">Control de stock</span>
          </div>
        </div>
        <button class="btn-primary" (click)="showAdjustModal = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Ajustar
        </button>
      </header>

      <!-- Tabs -->
      <div class="tabs-bar">
        <button 
          class="tab"
          [class.active]="activeTab === 'stock'"
          (click)="activeTab = 'stock'">
          📦 Stock Actual
        </button>
        <button 
          class="tab"
          [class.active]="activeTab === 'low'"
          (click)="activeTab = 'low'; loadLowStock()">
          ⚠️ Stock Bajo ({{ lowStockCount() }})
        </button>
        <button 
          class="tab"
          [class.active]="activeTab === 'movements'"
          (click)="activeTab = 'movements'; loadMovements()">
          📋 Movimientos
        </button>
      </div>

      <!-- Stock List -->
      @if (activeTab === 'stock' || activeTab === 'low') {
        <div class="stock-list">
          @for (item of displayedStock(); track item.id) {
            <div class="stock-card" [class.low]="item.stockBajo">
              <div class="stock-icon">📦</div>
              <div class="stock-info">
                <h3>{{ item.productName }}</h3>
                <span class="sku">{{ item.variantSku }}</span>
              </div>
              <div class="stock-qty" [class.warning]="item.stockBajo">
                <span class="qty-value">{{ item.cantidadDisponible }}</span>
                <span class="qty-label">disponible</span>
              </div>
              <div class="stock-meta">
                <span class="min">Mín: {{ item.stockMinimo }}</span>
                @if (item.cantidadReservada > 0) {
                  <span class="reserved">Res: {{ item.cantidadReservada }}</span>
                }
              </div>
            </div>
          }

          @if (displayedStock().length === 0) {
            <div class="empty-state">
              <span class="empty-icon">📭</span>
              <p>{{ activeTab === 'low' ? 'Sin productos con stock bajo' : 'Sin datos de stock' }}</p>
            </div>
          }
        </div>
      }

      <!-- Movements List -->
      @if (activeTab === 'movements') {
        <div class="movements-list">
          @for (mov of movements(); track mov.id) {
            <div class="movement-card">
              <div class="movement-icon" [class]="getMovementClass(mov.tipo)">
                {{ getMovementIcon(mov.tipo) }}
              </div>
              <div class="movement-info">
                <h3>{{ mov.productName }}</h3>
                <span class="movement-type">{{ mov.tipo.replace('_', ' ') }}</span>
              </div>
              <div class="movement-qty" [class]="getMovementClass(mov.tipo)">
                {{ isPositive(mov.tipo) ? '+' : '-' }}{{ mov.cantidad }}
              </div>
              <div class="movement-meta">
                <span>{{ mov.stockAnterior }} → {{ mov.stockNuevo }}</span>
                <span class="time">{{ formatDate(mov.createdAt) }}</span>
              </div>
            </div>
          }

          @if (movements().length === 0) {
            <div class="empty-state">
              <span class="empty-icon">📋</span>
              <p>Sin movimientos registrados</p>
            </div>
          }
        </div>
      }

      <!-- Loading -->
      @if (loading()) {
        <div class="loading-overlay">
          <div class="spinner"></div>
        </div>
      }

      <!-- Adjust Modal -->
      @if (showAdjustModal) {
        <div class="modal-overlay" (click)="showAdjustModal = false">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <h2>Ajustar Stock</h2>
            
            <div class="form-group">
              <label>Tipo de Movimiento</label>
              <select [(ngModel)]="adjustForm.tipo">
                <option value="ENTRADA">📥 Entrada</option>
                <option value="SALIDA">📤 Salida</option>
                <option value="AJUSTE_POSITIVO">➕ Ajuste Positivo</option>
                <option value="AJUSTE_NEGATIVO">➖ Ajuste Negativo</option>
                <option value="MERMA">🗑️ Merma</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Cantidad</label>
              <input type="number" [(ngModel)]="adjustForm.cantidad" min="1" placeholder="0">
            </div>
            
            <div class="form-group">
              <label>Motivo (opcional)</label>
              <input type="text" [(ngModel)]="adjustForm.motivo" placeholder="Razón del ajuste...">
            </div>
            
            <div class="modal-actions">
              <button class="btn-cancel" (click)="showAdjustModal = false">Cancelar</button>
              <button class="btn-confirm" (click)="submitAdjustment()">Confirmar</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
    styles: [`
    .inventory-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: white;
    }

    .inventory-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.5rem;
      background: rgba(30, 41, 59, 0.8);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .btn-icon {
      width: 40px;
      height: 40px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      background: transparent;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      
      svg { width: 20px; height: 20px; }
    }

    .header-title h1 { margin: 0; font-size: 1.5rem; }
    .header-title .subtitle { font-size: 0.8rem; color: rgba(255, 255, 255, 0.5); }

    .btn-primary {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      border: none;
      border-radius: 10px;
      color: white;
      font-weight: 500;
      cursor: pointer;
      
      svg { width: 18px; height: 18px; }
    }

    .tabs-bar {
      display: flex;
      gap: 0.5rem;
      padding: 1rem 1.5rem;
      overflow-x: auto;
    }

    .tab {
      padding: 0.75rem 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.85rem;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;
      
      &.active {
        background: linear-gradient(135deg, #6366F1, #8B5CF6);
        border-color: transparent;
        color: white;
      }
    }

    .stock-list, .movements-list {
      padding: 0 1.5rem 2rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .stock-card, .movement-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      
      &.low {
        border-color: rgba(245, 158, 11, 0.4);
        background: rgba(245, 158, 11, 0.1);
      }
    }

    .stock-icon, .movement-icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(99, 102, 241, 0.15);
      border-radius: 12px;
      font-size: 1.5rem;
      
      &.positive { background: rgba(16, 185, 129, 0.15); }
      &.negative { background: rgba(239, 68, 68, 0.15); }
    }

    .stock-info, .movement-info {
      flex: 1;
      min-width: 0;
      
      h3 {
        margin: 0 0 0.25rem;
        font-size: 1rem;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .sku, .movement-type {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
      }
    }

    .stock-qty {
      text-align: right;
      
      .qty-value {
        display: block;
        font-size: 1.5rem;
        font-weight: 700;
        color: #10B981;
      }
      
      .qty-label {
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.5);
      }
      
      &.warning .qty-value { color: #f59e0b; }
    }

    .movement-qty {
      font-size: 1.25rem;
      font-weight: 700;
      
      &.positive { color: #10B981; }
      &.negative { color: #EF4444; }
    }

    .stock-meta, .movement-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.5);
      
      .min { color: rgba(255, 255, 255, 0.4); }
      .reserved { color: #f59e0b; }
      .time { font-size: 0.7rem; }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 4rem 2rem;
      color: rgba(255, 255, 255, 0.5);
      
      .empty-icon { font-size: 4rem; }
    }

    .loading-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-top-color: #6366F1;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .modal-content {
      background: #1e293b;
      border-radius: 16px;
      padding: 1.5rem;
      width: 100%;
      max-width: 400px;
      
      h2 { margin: 0 0 1.5rem; font-size: 1.25rem; }
    }

    .form-group {
      margin-bottom: 1rem;
      
      label {
        display: block;
        margin-bottom: 0.5rem;
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.7);
      }
      
      input, select {
        width: 100%;
        padding: 0.875rem 1rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        color: white;
        font-size: 1rem;
        
        &:focus {
          outline: none;
          border-color: #6366F1;
        }
      }
      
      select option { background: #1e293b; }
    }

    .modal-actions {
      display: flex;
      gap: 1rem;
      margin-top: 1.5rem;
    }

    .btn-cancel {
      flex: 1;
      padding: 0.875rem;
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      color: white;
      cursor: pointer;
    }

    .btn-confirm {
      flex: 1;
      padding: 0.875rem;
      background: linear-gradient(135deg, #10B981, #059669);
      border: none;
      border-radius: 10px;
      color: white;
      font-weight: 500;
      cursor: pointer;
    }
  `]
})
export class InventoryComponent implements OnInit {
    private authService = inject(AuthService);
    private stockService = inject(StockService);

    stock = signal<StockDto[]>([]);
    lowStock = signal<StockDto[]>([]);
    movements = signal<StockMovementDto[]>([]);
    loading = signal(false);
    lowStockCount = signal(0);

    activeTab: 'stock' | 'low' | 'movements' = 'stock';
    showAdjustModal = false;

    adjustForm = {
        tipo: 'ENTRADA' as TipoMovimiento,
        cantidad: 1,
        motivo: ''
    };

    displayedStock = () => this.activeTab === 'low' ? this.lowStock() : this.stock();

    ngOnInit() {
        this.loadStock();
        this.loadLowStockCount();
    }

    async loadStock() {
        this.loading.set(true);
        try {
            // Use first branch from tenant
            const branchId = this.authService.tenant()?.id || '';
            const data = await this.stockService.getStockByBranch(branchId).toPromise();
            this.stock.set(data || []);
        } catch (error) {
            console.error('Error loading stock:', error);
        } finally {
            this.loading.set(false);
        }
    }

    async loadLowStock() {
        this.loading.set(true);
        try {
            const branchId = this.authService.tenant()?.id || '';
            const data = await this.stockService.getLowStock(branchId).toPromise();
            this.lowStock.set(data || []);
        } catch (error) {
            console.error('Error loading low stock:', error);
        } finally {
            this.loading.set(false);
        }
    }

    async loadLowStockCount() {
        try {
            const count = await this.stockService.countLowStock().toPromise();
            this.lowStockCount.set(count || 0);
        } catch (error) {
            console.error('Error loading low stock count:', error);
        }
    }

    async loadMovements() {
        this.loading.set(true);
        try {
            const branchId = this.authService.tenant()?.id || '';
            const response = await this.stockService.getMovements(branchId).toPromise();
            this.movements.set(response?.content || []);
        } catch (error) {
            console.error('Error loading movements:', error);
        } finally {
            this.loading.set(false);
        }
    }

    submitAdjustment() {
        // TODO: Implement with selected variant
        console.log('Adjust:', this.adjustForm);
        this.showAdjustModal = false;
    }

    getMovementIcon(tipo: TipoMovimiento): string {
        const icons: Record<TipoMovimiento, string> = {
            'ENTRADA': '📥',
            'SALIDA': '📤',
            'AJUSTE_POSITIVO': '➕',
            'AJUSTE_NEGATIVO': '➖',
            'TRANSFERENCIA_ENTRADA': '⬇️',
            'TRANSFERENCIA_SALIDA': '⬆️',
            'DEVOLUCION': '↩️',
            'MERMA': '🗑️'
        };
        return icons[tipo] || '📦';
    }

    getMovementClass(tipo: TipoMovimiento): string {
        return this.isPositive(tipo) ? 'positive' : 'negative';
    }

    isPositive(tipo: TipoMovimiento): boolean {
        return ['ENTRADA', 'AJUSTE_POSITIVO', 'TRANSFERENCIA_ENTRADA', 'DEVOLUCION'].includes(tipo);
    }

    formatDate(date: string): string {
        return new Date(date).toLocaleString('es-CL', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}
