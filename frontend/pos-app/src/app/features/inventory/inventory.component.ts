import { Component, inject, signal, computed, OnInit, HostListener, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { StockService, StockDto, StockMovementDto, TipoMovimiento, StockAdjustmentRequest } from '@core/services/stock.service';
import { OfflineService, CachedProduct } from '@core/offline/offline.service';
import { CatalogService } from '@core/services/catalog.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="inventory-container">
      <!-- Header -->
      <header class="inventory-header">
        <div class="header-left">
          <button class="btn-back" routerLink="/pos">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div class="header-info">
            <h1>Inventario</h1>
            <span class="subtitle">Gestión de Stock Premium</span>
          </div>
        </div>
        
        <div class="header-actions">
           <button class="btn-scan" [class.active]="scanningMode" (click)="toggleScanMode()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
                <rect x="7" y="9" width="10" height="6" />
              </svg>
              <span>{{ scanningMode ? 'Escaneando...' : 'Escanear' }}</span>
           </button>
           
           <button class="btn-primary" (click)="openAdjustModal()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              <span>Ajustar Stock</span>
           </button>
        </div>
      </header>

      <!-- Stats Dashboard -->
      <div class="dashboard-grid">
         <div class="stat-card primary" (click)="filterBy('all')">
            <div class="stat-icon">📦</div>
            <div class="stat-info">
               <span class="value">{{ stock().length }}</span>
               <span class="label">Total Productos</span>
            </div>
         </div>
         
         <div class="stat-card warning" [class.active]="filterMode() === 'low'" (click)="filterBy('low')">
            <div class="stat-icon">⚠️</div>
            <div class="stat-info">
               <span class="value">{{ lowStockCount() }}</span>
               <span class="label">Stock Crítico</span>
            </div>
         </div>
         
         <div class="stat-card success">
            <div class="stat-icon">💰</div>
            <div class="stat-info">
               <span class="value">{{ calculateTotalValue() }}</span>
               <span class="label">Valor Inventario</span>
            </div>
         </div>
      </div>

      <!-- Toolbar -->
      <div class="toolbar-section">
         <div class="search-field">
            <i class="pi pi-search">🔍</i>
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              placeholder="Buscar por nombre, SKU o escanear código..." 
              #searchInput
            />
         </div>
         
         <button class="filter-btn" [class.active]="filterMode() === 'movements'" (click)="filterBy('movements')">
            <span>📋 Movimientos</span>
         </button>
      </div>

      <!-- Main Content Area -->
      <div class="content-area">
         @if (loading()) {
            <div class="empty-state">
               <div class="icon">⌛</div>
               <h3>Cargando inventario...</h3>
            </div>
         } @else {
            @if (filterMode() === 'movements') {
               <!-- MOVEMENTS VIEW -->
               <div class="stock-grid">
                  @for (mov of filteredMovements(); track mov.id) {
                     <div class="product-card">
                        <div class="card-header">
                           <div class="product-icon">{{ getMovementIcon(mov.tipo) }}</div>
                           <div class="card-title">
                              <h3>{{ mov.productName }}</h3>
                              <span class="sku">{{ formatMovementType(mov.tipo) }} • {{ formatDate(mov.createdAt) }}</span>
                           </div>
                           <div class="movement-amount" [style.color]="isPositive(mov.tipo) ? '#10b981' : '#ef4444'">
                              {{ isPositive(mov.tipo) ? '+' : '-' }}{{ mov.cantidad }}
                           </div>
                        </div>
                        <div class="stock-status">
                           <div class="status-header">
                              <span>Stock: {{ mov.stockAnterior }} ➝ {{ mov.stockNuevo }}</span>
                              <span>{{ mov.motivo || 'Sin nota' }}</span>
                           </div>
                        </div>
                     </div>
                  }
               </div>
            } @else {
               <!-- STOCK VIEW -->
               <div class="stock-grid">
                  @for (item of filteredStock(); track item.id) {
                     <div class="product-card" 
                          [class.low-stock]="item.stockBajo"
                          [class.out-of-stock]="item.cantidadDisponible <= 0">
                        
                        <div class="card-header">
                           <div class="product-icon">
                              {{ item.stockBajo ? '⚠️' : '📦' }}
                           </div>
                           <div class="card-title">
                              <h3>{{ item.productName }}</h3>
                              <span class="sku">{{ item.variantSku }}</span>
                           </div>
                        </div>

                        <div class="stock-status">
                           <div class="status-header">
                              <span>Disponible: {{ item.cantidadDisponible }}</span>
                              <span>Mín: {{ item.stockMinimo }}</span>
                           </div>
                           <div class="progress-bar">
                              <div class="fill" 
                                   [style.width.%]="calculateProgress(item)"
                                   [class.low]="item.stockBajo"
                                   [class.medium]="!item.stockBajo && item.cantidadDisponible < item.stockMinimo * 2"
                                   [class.good]="!item.stockBajo && item.cantidadDisponible >= item.stockMinimo * 2">
                              </div>
                           </div>
                        </div>

                        <div class="card-actions">
                           <button (click)="openAdjustModalForStock(item, $event)"> Ajustar</button>
                           <button class="btn-restock" (click)="quickRestock(item, $event)">+ Reponer</button>
                        </div>
                     </div>
                  }
               </div>
               
               @if (filteredStock().length === 0) {
                  <div class="empty-state">
                     <div class="icon">📭</div>
                     <h3>No se encontraron productos</h3>
                     <p>Intenta con otra búsqueda o filtro</p>
                  </div>
               }
            }
         }
      </div>

      <!-- Quick Restock Modal / Adjust Modal (Reused) -->
      @if (showAdjustModal) {
         <div class="modal-overlay" (click)="closeAdjustModal()">
            <div class="modal-content" (click)="$event.stopPropagation()">
               <h2>{{ selectedStockItem ? 'Ajustar ' + selectedStockItem.productName : 'Nuevo Movimiento' }}</h2>
               
               @if (!selectedStockItem) {
                  <div class="form-group">
                     <label>Buscar Producto</label>
                     <input type="text" [(ngModel)]="productSearch" (input)="searchProducts()" placeholder="Escribe nombre o SKU..." autofocus>
                     <!-- Results dropdown would go here -->
                     @if (searchedProducts().length > 0) {
                        <div class="search-results-list" style="margin-top:0.5rem; background:rgba(0,0,0,0.3); border-radius:8px; overflow:hidden;">
                           @for(p of searchedProducts(); track p.id) {
                              <div style="padding:0.75rem; cursor:pointer; border-bottom:1px solid rgba(255,255,255,0.05)"
                                   (click)="selectProduct(p)">
                                 {{ p.productName }} (Stock: {{p.cantidadDisponible}})
                              </div>
                           }
                        </div>
                     }
                  </div>
               }

               <div class="form-group">
                  <label>Tipo Movimiento</label>
                  <select [(ngModel)]="adjustForm.tipo">
                     <option value="ENTRADA">📥 Entrada (Compra/Repo)</option>
                     <option value="SALIDA">📤 Salida</option>
                     <option value="AJUSTE_POSITIVO">➕ Ajuste (+)</option>
                     <option value="MERMA">🗑️ Merma/Pérdida</option>
                  </select>
               </div>

               <div class="form-group">
                  <label>Cantidad</label>
                  <input type="number" [(ngModel)]="adjustForm.cantidad" min="1">
                  <div class="quick-amounts">
                     <button (click)="adjustForm.cantidad = 5">+5</button>
                     <button (click)="adjustForm.cantidad = 10">+10</button>
                     <button (click)="adjustForm.cantidad = 50">+50</button>
                  </div>
               </div>
               
               <div class="form-group">
                  <label>Nota / Motivo</label>
                  <input type="text" [(ngModel)]="adjustForm.motivo" placeholder="Opcional">
               </div>

               <div class="modal-actions">
                  <button class="btn-cancel" (click)="closeAdjustModal()">Cancelar</button>
                  <button class="btn-confirm" (click)="submitAdjustment()">Confirmar</button>
               </div>
            </div>
         </div>
      }
    </div>
  `,
  styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent implements OnInit {
  private authService = inject(AuthService);
  private stockService = inject(StockService);
  private offlineService = inject(OfflineService);

  // Signals
  stock = signal<StockDto[]>([]);
  lowStockCount = signal(0);
  movements = signal<StockMovementDto[]>([]);
  loading = signal(false);
  filterMode = signal<'all' | 'low' | 'movements'>('all'); // Filter state

  searchQuery = '';
  scanningMode = false;

  // Modal State
  showAdjustModal = false;
  selectedStockItem: StockDto | null = null;
  productSearch = '';
  searchedProducts = signal<StockDto[]>([]);

  adjustForm = {
    tipo: 'ENTRADA' as TipoMovimiento,
    cantidad: 1,
    motivo: '',
    documentoReferencia: ''
  };

  // Computed
  filteredStock = computed(() => {
    let items = this.stock();
    if (this.filterMode() === 'low') {
      items = items.filter(i => i.stockBajo);
    }

    if (!this.searchQuery.trim()) return items;
    const q = this.searchQuery.toLowerCase();
    return items.filter(s =>
      s.productName.toLowerCase().includes(q) ||
      s.variantSku.toLowerCase().includes(q)
    );
  });

  filteredMovements = computed(() => {
    if (!this.searchQuery.trim()) return this.movements();
    const q = this.searchQuery.toLowerCase();
    return this.movements().filter(m =>
      m.productName.toLowerCase().includes(q) ||
      m.variantSku.toLowerCase().includes(q)
    );
  });

  // --- Barcode Scanner Listener ---
  // Listens for fast keystrokes typical of USB barcode scanners
  private buffer = '';
  private lastKeyTime = 0;

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Ignore input fields
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    const currentTime = Date.now();
    // Re-set buffer if keystrokes are too slow (manual typing)
    if (currentTime - this.lastKeyTime > 100) {
      this.buffer = '';
    }

    this.lastKeyTime = currentTime;

    if (event.key === 'Enter') {
      if (this.buffer.length > 2) {
        this.handleScan(this.buffer);
        this.buffer = '';
      }
    } else if (event.key.length === 1) {
      this.buffer += event.key;
    }
  }

  handleScan(code: string) {
    console.log('Scanned:', code);
    this.searchQuery = code;
    // Auto-select if exact match found
    const match = this.stock().find(s => s.variantSku === code || s.productName.includes(code)); // assuming barcode might be in sku or separately
    if (match) {
      // Maybe open adjust modal automatically? 
      // For now just filter.
    }
  }

  toggleScanMode() {
    this.scanningMode = !this.scanningMode;
    if (this.scanningMode) {
      // Here we would activate camera scanning logic if available
      // For now it focuses the search input to accept manual entry or USB scan
      const input = document.querySelector('input') as HTMLInputElement;
      if (input) input.focus();
    }
  }

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    const branchId = this.authService.tenant()?.id || '';

    try {
      // 1. Try Cache First (Matches POS)
      const cached = await this.offlineService.getCachedProducts();

      if (cached && cached.length > 0) {
        const mapped: StockDto[] = cached.flatMap(p => p.variants.map(v => ({
          id: v.id,
          variantId: v.id,
          variantSku: v.sku, // Required by StockDto
          productName: `${p.nombre} ${v.nombre || ''}`.trim(),
          branchId: branchId,
          cantidadActual: v.stock ?? 0,
          cantidadReservada: 0,
          cantidadDisponible: v.stock ?? 0,
          stockMinimo: v.stockMinimo ?? 5,
          stockBajo: (v.stock ?? 0) <= (v.stockMinimo ?? 5),
          updatedAt: p.syncedAt?.toISOString() || new Date().toISOString()
        })));

        this.stock.set(mapped);
        this.lowStockCount.set(mapped.filter(x => x.stockBajo).length);
        console.log('Loaded inventory from cache:', mapped.length);
        return;
      }

      // 2. Fallback to API (Only get Stock, don't count low stock to avoid 404)
      const stockData = await this.stockService.getStockByBranch(branchId).toPromise().catch(e => {
        console.warn('Failed to load stock from API', e);
        return [];
      });

      this.stock.set(stockData || []);
      const manualCount = (stockData || []).filter(i => i.stockBajo).length;
      this.lowStockCount.set(manualCount);

    } catch (e) {
      console.error('Critical error loading inventory', e);
    } finally {
      this.loading.set(false);
    }
  }

  filterBy(mode: 'all' | 'low' | 'movements') {
    this.filterMode.set(mode);
    if (mode === 'movements' && this.movements().length === 0) {
      this.loadMovements();
    }
  }

  async loadMovements() {
    this.loading.set(true);
    try {
      const branchId = this.authService.tenant()?.id || '';
      const res = await this.stockService.getMovements(branchId).toPromise();
      this.movements.set(res?.content || []);
    } catch (e) { console.error(e); }
    finally { this.loading.set(false); }
  }

  // Quick Restock Logic
  quickRestock(item: StockDto, event: Event) {
    event.stopPropagation();
    this.selectedStockItem = item;
    this.adjustForm = {
      tipo: 'ENTRADA',
      cantidad: 10, // Default quick restock amount
      motivo: 'Reposición rápida',
      documentoReferencia: ''
    };
    this.showAdjustModal = true;
  }

  openAdjustModal() {
    this.selectedStockItem = null;
    this.productSearch = '';
    this.searchedProducts.set([]);
    this.adjustForm = { tipo: 'ENTRADA', cantidad: 1, motivo: '', documentoReferencia: '' };
    this.showAdjustModal = true;
  }

  openAdjustModalForStock(item: StockDto, event: Event) {
    event.stopPropagation();
    this.selectedStockItem = item;
    this.adjustForm = { tipo: 'AJUSTE_POSITIVO', cantidad: 1, motivo: 'Ajuste manual', documentoReferencia: '' };
    this.showAdjustModal = true;
  }

  closeAdjustModal() {
    this.showAdjustModal = false;
    this.selectedStockItem = null;
  }

  searchProducts() {
    if (!this.productSearch) { this.searchedProducts.set([]); return; }
    const q = this.productSearch.toLowerCase();
    this.searchedProducts.set(
      this.stock().filter(s => s.productName.toLowerCase().includes(q) || s.variantSku.toLowerCase().includes(q)).slice(0, 5)
    );
  }

  selectProduct(item: StockDto) {
    this.selectedStockItem = item;
    this.searchedProducts.set([]);
  }

  async submitAdjustment() {
    if (!this.selectedStockItem) return;
    const branchId = this.authService.tenant()?.id || '';
    const req: StockAdjustmentRequest = {
      variantId: this.selectedStockItem.variantId,
      branchId,
      tipo: this.adjustForm.tipo,
      cantidad: this.adjustForm.cantidad,
      motivo: this.adjustForm.motivo,
      documentoReferencia: this.adjustForm.documentoReferencia
    };

    this.loading.set(true);
    try {
      await this.stockService.adjustStock(req).toPromise();
      this.closeAdjustModal();
      this.loadData(); // Reload all to refresh stats
    } catch (e) { console.error(e); alert('Error al ajustar stock'); }
    finally { this.loading.set(false); }
  }

  // Helpers
  calculateTotalValue(): string {
    // Mock calculation as cost price might not be in StockDto, assumes $1000 avg for demo
    return '$' + (this.stock().reduce((acc, i) => acc + i.cantidadDisponible, 0) * 1000).toLocaleString();
  }

  calculateProgress(item: StockDto): number {
    const max = Math.max(item.stockMinimo * 3, item.cantidadDisponible);
    return max > 0 ? (item.cantidadDisponible / max) * 100 : 0;
  }

  getMovementIcon(tipo: TipoMovimiento) {
    if (tipo.includes('ENTRADA') || tipo.includes('POSITIVO')) return '📥';
    if (tipo.includes('SALIDA') || tipo.includes('NEGATIVO') || tipo.includes('MERMA')) return '📤';
    return '🔄';
  }

  isPositive(tipo: TipoMovimiento) {
    return ['ENTRADA', 'AJUSTE_POSITIVO', 'TRANSFERENCIA_ENTRADA', 'DEVOLUCION'].includes(tipo);
  }

  formatMovementType(t: string) { return t.replace(/_/g, ' '); }

  formatDate(d: string) { return new Date(d).toLocaleDateString(); }
}
