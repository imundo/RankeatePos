import { Component, inject, signal, computed, OnInit, HostListener, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { StockService, StockDto, StockMovementDto, TipoMovimiento, StockAdjustmentRequest } from '@core/services/stock.service';
import { OfflineService, CachedProduct } from '@core/offline/offline.service';
import { BranchContextService } from '@core/services/branch-context.service';
import { BranchService } from '@core/services/branches.service';
import { CatalogService, ProductRequest, Tax } from '@core/services/catalog.service';
import { BranchSwitcherComponent } from '@shared/components/branch-switcher/branch-switcher.component';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, BranchSwitcherComponent],
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
        
        <app-branch-switcher [autoReload]="false" (branchChanged)="onBranchChanged($event)"></app-branch-switcher>
        
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
         
         <button class="btn-primary" style="margin-left: auto;" (click)="openNewProductModal()">
            <span>+ Nuevo Artículo</span>
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
                        
                        <div class="product-image-container">
                           @if (item.imageUrl) {
                              <img [src]="item.imageUrl" [alt]="item.productName">
                           } @else {
                              <div class="product-icon">
                                 {{ item.stockBajo ? '⚠️' : '📦' }}
                              </div>
                           }
                        </div>
                        <div class="card-header">
                           <div class="card-title">
                              <h3>{{ item.productName }}</h3>
                              <span class="sku">{{ item.variantSku }}</span>
                           </div>
                        </div>

                        @if ((item as any).precioBruto > 0) {
                           <div class="card-price">
                              <span class="price-value">${{ (item as any).precioBruto | number }}</span>
                              @if ((item as any).marginPercentage > 0) {
                                 <span class="price-margin">+{{ (item as any).marginPercentage | number:'1.0-1' }}%</span>
                              }
                           </div>
                        }

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
                           <button class="btn-restock" (click)="quickRestock(item, $event)">Reponer</button>
                           <button class="btn-edit-small" (click)="openEditProductModal(item, $event)">Editar</button>
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

      <!-- New Product Modal -->
      @if (showNewProductModal) {
         <div class="modal-overlay" (click)="closeNewProductModal()">
            <div class="modal-content" (click)="$event.stopPropagation()" style="max-height: 90vh; overflow-y: auto;">
               <h2>Nuevo Artículo</h2>
               
               <div class="form-group">
                  <label>Nombre del Artículo</label>
                  <input type="text" [(ngModel)]="newProductForm.nombre" placeholder="Ej: Coca Cola Zero 500ml" autofocus>
               </div>

               <div class="form-group">
                  <label>Código (SKU / Barcode)</label>
                  <div style="display: flex; gap: 0.5rem;">
                     <input type="text" [(ngModel)]="newProductForm.sku" placeholder="Escanear o generar..." style="flex: 1;">
                     <button class="filter-btn" style="height: auto; padding: 0.5rem;" (click)="generateSku()" title="Generar SKU aleatorio">
                        🎲
                     </button>
                     <button class="filter-btn" style="height: auto; padding: 0.5rem;" (click)="scanBarcodeForNewProduct()" title="Escanear con cámara">
                        📷
                     </button>
                  </div>
               </div>

               <div class="form-group">
                  <label>Foto</label>
                  <div style="display: flex; gap: 0.5rem;">
                      <input type="text" [(ngModel)]="newProductForm.imageUrl" placeholder="Sube una foto o pon URL" style="flex: 1;" disabled>
                      <input type="file" #fileInput accept="image/*" capture="environment" style="display: none;" (change)="onFileSelected($event)">
                      <button class="filter-btn" style="height: auto; padding: 0.5rem;" (click)="fileInput.click()" title="Tomar foto o elegir galería">
                          📸
                      </button>
                  </div>
                  @if (newProductForm.imageUrl) {
                      <div style="margin-top: 0.5rem; height: 100px; border-radius: 8px; overflow: hidden; display: inline-block;">
                          <img [src]="newProductForm.imageUrl" style="height: 100%; object-fit: cover;">
                      </div>
                  }
               </div>

               <div class="form-group">
                  <label>Costo (Precio de Compra)</label>
                  <input type="number" [(ngModel)]="newProductForm.costo" min="0" placeholder="0" (ngModelChange)="recalcNewProduct()">
               </div>

               <div class="form-group">
                  <label>Precio de Venta (Neto sin IVA)</label>
                  <input type="number" [(ngModel)]="newProductForm.precioNeto" min="0" placeholder="0" (ngModelChange)="recalcNewProduct()">
               </div>

               <div class="form-group">
                  <label>Impuesto (IVA)</label>
                  <select [(ngModel)]="newProductForm.taxId" (ngModelChange)="recalcNewProduct()">
                     <option value="">Sin impuesto</option>
                     @for (tax of taxes(); track tax.id) {
                        <option [value]="tax.id">{{ tax.nombre }} ({{ tax.porcentaje }}%)</option>
                     }
                  </select>
               </div>

               <div class="form-group" style="display: flex; gap: 1rem;">
                  <div style="flex: 1;">
                     <label>Precio Bruto</label>
                     <input type="number" [ngModel]="newProductForm.precioBruto" disabled style="opacity: 0.7; cursor: not-allowed;">
                  </div>
                  <div style="flex: 1;">
                     <label>Margen</label>
                     <input type="text" [value]="newProductForm.margen" disabled style="opacity: 0.7; cursor: not-allowed;">
                  </div>
               </div>

               <div class="form-group">
                  <label>Stock Inicial</label>
                  <input type="number" [(ngModel)]="newProductForm.stockInicial" min="0">
               </div>

               <div class="modal-actions">
                  <button class="btn-cancel" (click)="closeNewProductModal()">Cancelar</button>
                  <button class="btn-confirm" (click)="submitNewProduct()">Guardar</button>
               </div>
            </div>
         </div>
      }

      <!-- Edit Product Modal -->
      @if (showEditProductModal) {
         <div class="modal-overlay" (click)="closeEditProductModal()">
            <div class="modal-content" (click)="$event.stopPropagation()" style="max-height: 90vh; overflow-y: auto;">
               <h2>Editar Artículo</h2>
               
               <div class="form-group">
                  <label>Nombre del Artículo</label>
                  <input type="text" [(ngModel)]="editProductForm.nombre" placeholder="Nombre" autofocus>
               </div>

               <div class="form-group">
                  <label>Código (SKU)</label>
                  <input type="text" [ngModel]="editProductForm.sku" disabled style="opacity: 0.7; cursor: not-allowed;">
               </div>

               <div class="form-group">
                  <label>Foto</label>
                  <div style="display: flex; gap: 0.5rem;">
                      <input type="text" [(ngModel)]="editProductForm.imageUrl" placeholder="Sube una foto" style="flex: 1;" disabled>
                      <input type="file" #editFileInput accept="image/*" capture="environment" style="display: none;" (change)="onEditFileSelected($event)">
                      <button class="filter-btn" style="height: auto; padding: 0.5rem;" (click)="editFileInput.click()" title="Cambiar foto">
                          📸
                      </button>
                  </div>
                  @if (editProductForm.imageUrl) {
                      <div style="margin-top: 0.5rem; height: 100px; border-radius: 8px; overflow: hidden; display: inline-block;">
                          <img [src]="editProductForm.imageUrl" style="height: 100%; object-fit: cover;">
                      </div>
                  }
               </div>

               <div class="form-group">
                  <label>Costo (Precio de Compra)</label>
                  <input type="number" [(ngModel)]="editProductForm.costo" min="0" placeholder="0" (ngModelChange)="recalcEditProduct()">
               </div>

               <div class="form-group">
                  <label>Precio de Venta (Neto sin IVA)</label>
                  <input type="number" [(ngModel)]="editProductForm.precioNeto" min="0" placeholder="0" (ngModelChange)="recalcEditProduct()">
               </div>

               <div class="form-group">
                  <label>Impuesto (IVA)</label>
                  <select [(ngModel)]="editProductForm.taxId" (ngModelChange)="recalcEditProduct()">
                     <option value="">Sin impuesto</option>
                     @for (tax of taxes(); track tax.id) {
                        <option [value]="tax.id">{{ tax.nombre }} ({{ tax.porcentaje }}%)</option>
                     }
                  </select>
               </div>

               <div class="form-group" style="display: flex; gap: 1rem;">
                  <div style="flex: 1;">
                     <label>Precio Bruto</label>
                     <input type="number" [ngModel]="editProductForm.precioBruto" disabled style="opacity: 0.7; cursor: not-allowed;">
                  </div>
                  <div style="flex: 1;">
                     <label>Margen</label>
                     <input type="text" [value]="editProductForm.margen" disabled style="opacity: 0.7; cursor: not-allowed;">
                  </div>
               </div>

               <div class="modal-actions">
                  <button class="btn-cancel" (click)="closeEditProductModal()">Cancelar</button>
                  <button class="btn-confirm" (click)="submitEditProduct()">Actualizar</button>
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
  private branchContext = inject(BranchContextService);
  private branchService = inject(BranchService);
  private catalogService = inject(CatalogService);

  // Signals
  stock = signal<StockDto[]>([]);
  lowStockCount = signal(0);
  movements = signal<StockMovementDto[]>([]);
  loading = signal(false);
  filterMode = signal<'all' | 'low' | 'movements'>('all');
  taxes = signal<Tax[]>([]);
  currentBranchName = computed(() => this.branchContext.activeBranch()?.nombre || '');

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

  showNewProductModal = false;
  selectedFile: File | null = null;
  newProductForm = {
    nombre: '',
    sku: '',
    imageUrl: '',
    costo: 0,
    precioNeto: 0,
    precioBruto: 0,
    taxId: '',
    margen: '0%',
    stockInicial: 0
  };

  showEditProductModal = false;
  selectedEditFile: File | null = null;
  editProductForm = {
    id: '',
    nombre: '',
    sku: '',
    imageUrl: '',
    originalVariantId: '',
    costo: 0,
    precioNeto: 0,
    precioBruto: 0,
    taxId: '',
    margen: '0%'
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
  private buffer = '';
  private lastKeyTime = 0;

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    const currentTime = Date.now();
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
    const match = this.stock().find(s => s.variantSku === code || s.productName.includes(code));
    if (match) {
      // Optional: auto-action
    }
  }

  toggleScanMode() {
    this.scanningMode = !this.scanningMode;
    if (this.scanningMode) {
      const input = document.querySelector('input') as HTMLInputElement;
      if (input) input.focus();
    }
  }

  ngOnInit() {
    this.loadData();
    this.loadTaxes();
  }

  async loadTaxes() {
    try {
      const taxes = await this.catalogService.getTaxes().toPromise();
      this.taxes.set(taxes || []);
    } catch (e) {
      console.warn('Failed to load taxes', e);
    }
  }

  async loadData(forceApi = false) {
    this.loading.set(true);

    // Logic: Identify Active Branch
    let branchId = this.branchContext.activeBranchId();

    if (!branchId) {
      // Try to fetch user branches and auto-select one
      console.log('No active branch selected. Auto-detecting...');
      try {
        const branches = await this.branchService.getBranches().toPromise();
        if (branches && branches.length > 0) {
          // Prefer principal, or first active
          const selected = branches.find(b => b.esPrincipal && b.activa) || branches.find(b => b.activa);
          if (selected) {
            branchId = selected.id;
            this.branchContext.setActiveBranch({
              id: selected.id,
              nombre: selected.nombre,
              codigo: selected.codigo
            });
            console.log('Auto-selected branch:', selected.nombre);
          }
        }
      } catch (e) {
        console.warn('Failed to auto-detect branches', e);
      }
    }

    // Final fallback to tenant ID (likely won't work for stock but prevents crash)
    branchId = branchId || this.authService.tenant()?.id || '';

    try {
      // 1. Try Cache First (Matches POS), unless forced
      const cached = !forceApi ? await this.offlineService.getCachedProducts() : [];

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

      // 2. Fallback to API 
      const stockData = await this.stockService.getStockByBranch(branchId).toPromise().catch(e => {
        console.warn('Failed to load stock from API', e);
        return [];
      });

      // 3. Enrich stock with images and prices from catalog
      let enrichedStock = stockData || [];
      try {
        const productsRes = await this.catalogService.getProducts(0, 200).toPromise();
        if (productsRes && productsRes.content) {
          const productMap = new Map<string, any>();
          for (const p of productsRes.content) {
            if (p.variants) {
              for (const v of p.variants) {
                productMap.set(v.sku, { imagenUrl: p.imagenUrl, precioBruto: v.precioBruto, precioNeto: v.precioNeto, costo: v.costo, marginPercentage: v.marginPercentage });
              }
            }
          }
          enrichedStock = enrichedStock.map(s => {
            const catalogInfo = productMap.get(s.variantSku);
            if (catalogInfo) {
              return { ...s, imageUrl: catalogInfo.imagenUrl || s.imageUrl, precioBruto: catalogInfo.precioBruto, precioNeto: catalogInfo.precioNeto, costo: catalogInfo.costo, marginPercentage: catalogInfo.marginPercentage };
            }
            return s;
          });
        }
      } catch (e) {
        console.warn('Failed to enrich stock with catalog data', e);
      }

      this.stock.set(enrichedStock);
      const manualCount = enrichedStock.filter(i => i.stockBajo).length;
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
      const branchId = this.branchContext.activeBranchId() || this.authService.tenant()?.id || '';
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
      cantidad: 10,
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

  // --- New Product Logic ---
  openNewProductModal() {
    const defaultTax = this.taxes().find(t => t.esDefault);
    this.newProductForm = { nombre: '', sku: '', imageUrl: '', costo: 0, precioNeto: 0, precioBruto: 0, taxId: defaultTax?.id || '', margen: '0%', stockInicial: 0 };
    this.selectedFile = null;
    this.showNewProductModal = true;
  }

  recalcNewProduct() {
    const tax = this.taxes().find(t => t.id === this.newProductForm.taxId);
    const taxRate = tax ? tax.porcentaje / 100 : 0;
    this.newProductForm.precioBruto = Math.round(this.newProductForm.precioNeto * (1 + taxRate));
    if (this.newProductForm.costo > 0 && this.newProductForm.precioNeto > 0) {
      const margin = ((this.newProductForm.precioNeto - this.newProductForm.costo) / this.newProductForm.costo) * 100;
      this.newProductForm.margen = margin.toFixed(1) + '%';
    } else {
      this.newProductForm.margen = '0%';
    }
  }

  closeNewProductModal() {
    this.showNewProductModal = false;
  }

  generateSku() {
    this.newProductForm.sku = 'ART-' + Math.floor(1000 + Math.random() * 9000);
  }

  scanBarcodeForNewProduct() {
    // Basic implementation for demo. In a real app, this would open a camera scanner modal.
    const mockBarcode = '780' + Math.floor(100000000 + Math.random() * 900000000);
    alert('Escáner activado. Código simulado capturado: ' + mockBarcode);
    this.newProductForm.sku = mockBarcode;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 1048576) {
        alert('El archivo es demasiado grande. Máximo 1MB.');
        return;
      }
      this.selectedFile = file;
      this.newProductForm.imageUrl = URL.createObjectURL(file); // Preview temporal
    }
  }

  async submitNewProduct() {
    if (!this.newProductForm.nombre) {
        alert('El nombre es obligatorio');
        return;
    }
    
    this.loading.set(true);
    try {
        let finalImageUrl = '';

        // 1. Subir imagen si hay un archivo seleccionado
        if (this.selectedFile) {
            const uploadRes = await this.catalogService.uploadImage(this.selectedFile).toPromise();
            if (uploadRes && uploadRes.url) {
                finalImageUrl = uploadRes.url;
            }
        }

        // 2. Crear producto en CatalogService
        const productReq: ProductRequest = {
            sku: this.newProductForm.sku,
            nombre: this.newProductForm.nombre,
            imagenUrl: finalImageUrl || undefined,
            variants: [{
                sku: this.newProductForm.sku,
                nombre: 'Default',
                costo: this.newProductForm.costo || 0,
                precioNeto: this.newProductForm.precioNeto || 0,
                precioBruto: this.newProductForm.precioBruto || 0,
                taxId: this.newProductForm.taxId || undefined,
                stockMinimo: 5,
                esDefault: true
            }]
        };

        const createdProduct = await this.catalogService.createProduct(productReq).toPromise();

        // 3. Crear stock inicial en InventoryService si hay stock > 0
        if (createdProduct && this.newProductForm.stockInicial > 0) {
            const branchId = this.branchContext.activeBranchId();
            if (branchId && createdProduct.variants && createdProduct.variants.length > 0) {
                const stockReq: StockAdjustmentRequest = {
                    variantId: createdProduct.variants[0].id,
                    branchId,
                    tipo: 'ENTRADA',
                    cantidad: this.newProductForm.stockInicial,
                    motivo: 'Stock Inicial',
                    documentoReferencia: ''
                };
                await this.stockService.adjustStock(stockReq).toPromise();
            }
        }

        alert('Producto creado exitosamente');
        this.closeNewProductModal();
        this.loadData(true); // recargar de la API
    } catch (e: any) {
        console.error(e);
        alert('Error al crear producto: ' + (e.error?.message || e.message));
    } finally {
        this.loading.set(false);
    }
  }

  // --- Edit Product Logic ---
  async openEditProductModal(item: StockDto, event: Event) {
    event.stopPropagation();
    this.loading.set(true);
    try {
        // Fetch full product by searching SKU to get the main Product ID
        const res = await this.catalogService.getProducts(0, 1, item.variantSku).toPromise();
        if (res && res.content && res.content.length > 0) {
            const product = res.content[0];
            const defaultVariant = product.variants?.[0];
            const currentTaxId = defaultVariant?.taxId || '';
            const costo = defaultVariant?.costo || 0;
            const precioNeto = defaultVariant?.precioNeto || 0;
            const precioBruto = defaultVariant?.precioBruto || 0;
            let margen = '0%';
            if (costo > 0 && precioNeto > 0) {
                margen = (((precioNeto - costo) / costo) * 100).toFixed(1) + '%';
            }
            this.editProductForm = {
                id: product.id,
                nombre: product.nombre,
                sku: product.sku,
                imageUrl: product.imagenUrl || '',
                originalVariantId: item.variantId,
                costo,
                precioNeto,
                precioBruto,
                taxId: currentTaxId,
                margen
            };
            this.selectedEditFile = null;
            this.showEditProductModal = true;
        } else {
            alert('No se pudo cargar la información del producto.');
        }
    } catch (e) {
        console.error(e);
        alert('Error al buscar producto');
    } finally {
        this.loading.set(false);
    }
  }

  closeEditProductModal() {
    this.showEditProductModal = false;
  }

  recalcEditProduct() {
    const tax = this.taxes().find(t => t.id === this.editProductForm.taxId);
    const taxRate = tax ? tax.porcentaje / 100 : 0;
    this.editProductForm.precioBruto = Math.round(this.editProductForm.precioNeto * (1 + taxRate));
    if (this.editProductForm.costo > 0 && this.editProductForm.precioNeto > 0) {
      const margin = ((this.editProductForm.precioNeto - this.editProductForm.costo) / this.editProductForm.costo) * 100;
      this.editProductForm.margen = margin.toFixed(1) + '%';
    } else {
      this.editProductForm.margen = '0%';
    }
  }

  onEditFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 1048576) {
        alert('El archivo es demasiado grande. Máximo 1MB.');
        return;
      }
      this.selectedEditFile = file;
      this.editProductForm.imageUrl = URL.createObjectURL(file);
    }
  }

  async submitEditProduct() {
    if (!this.editProductForm.nombre) {
        alert('El nombre es obligatorio');
        return;
    }
    
    this.loading.set(true);
    try {
        let finalImageUrl = this.editProductForm.imageUrl;

        if (this.selectedEditFile) {
            const uploadRes = await this.catalogService.uploadImage(this.selectedEditFile).toPromise();
            if (uploadRes && uploadRes.url) {
                finalImageUrl = uploadRes.url;
            }
        }

        // We need the existing product to update it without losing variants
        const currentProduct = await this.catalogService.getProduct(this.editProductForm.id).toPromise();
        if (!currentProduct) throw new Error('Producto no encontrado');

        const productReq: ProductRequest = {
            sku: currentProduct.sku,
            nombre: this.editProductForm.nombre,
            categoryId: currentProduct.categoryId,
            unitId: currentProduct.unitId, 
            imagenUrl: finalImageUrl,
            variants: currentProduct.variants.map(v => ({
                sku: v.sku,
                nombre: v.nombre,
                costo: this.editProductForm.costo || 0,
                precioNeto: this.editProductForm.precioNeto || 0,
                precioBruto: this.editProductForm.precioBruto || 0,
                taxId: this.editProductForm.taxId || undefined,
                stockMinimo: v.stockMinimo,
                barcode: v.codigoBarra
            }))
        };

        await this.catalogService.updateProduct(this.editProductForm.id, productReq).toPromise();

        alert('Producto actualizado exitosamente');
        this.closeEditProductModal();
        this.loadData(true);
    } catch (e: any) {
        console.error(e);
        alert('Error al actualizar producto: ' + (e.error?.message || e.message));
    } finally {
        this.loading.set(false);
    }
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

  onBranchChanged(branch: any) {
    console.log('Branch changed manually to:', branch.nombre);
    // Force reload from API to get fresh stock for this branch
    this.loadData(true);
  }

  async submitAdjustment() {
    if (!this.selectedStockItem) return;

    // Ensure we have an active branch
    let branchId = this.branchContext.activeBranchId();
    if (!branchId) {
      // Should have been set by loadData, but safe guard
      alert('No hay sucursal seleccionada. Recargando...');
      this.loadData(true);
      return;
    }

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
      const updatedStock = await this.stockService.adjustStock(req).toPromise();

      if (updatedStock) {
        console.log('Adjustment success, updating UI for variant:', updatedStock.variantId);

        console.log('Clearing local cache to force refresh...');
        await this.offlineService.clearCache();

        this.stock.update(items => items.map(i => i.variantId === updatedStock.variantId ? updatedStock : i));
      }

      this.closeAdjustModal();
      this.loadData(true);
    } catch (e) { console.error('Error submitting adjustment:', e); alert('Error al ajustar stock'); }
    finally { this.loading.set(false); }
  }

  // Helpers
  calculateTotalValue(): string {
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
