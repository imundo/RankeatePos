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
import { BarcodeScannerComponent } from '@shared/components/barcode-scanner/barcode-scanner.component';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, BranchSwitcherComponent, BarcodeScannerComponent],
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
               <span class="label">Costo Inventario</span>
            </div>
         </div>

         <div class="stat-card" style="background: rgba(139, 92, 246, 0.1); border-color: rgba(139, 92, 246, 0.2);">
            <div class="stat-icon" style="color: #8B5CF6;">📈</div>
            <div class="stat-info">
               <span class="value" style="color: #8B5CF6;">{{ calculateTotalProfit() }}</span>
               <span class="label">Ganancia Proyectada</span>
            </div>
         </div>

         <div class="stat-card" style="background: rgba(236, 72, 153, 0.1); border-color: rgba(236, 72, 153, 0.2);">
            <div class="stat-icon" style="color: #ec4899;">🏛️</div>
            <div class="stat-info">
               <span class="value" style="color: #ec4899;">{{ calculateTotalTaxes() }}</span>
               <span class="label">Impuestos Acumulados</span>
            </div>
         </div>
      </div>

      <!-- Toolbar -->
      <div class="toolbar-section">
         <!-- Search -->
         <div class="search-container" style="flex: 1; max-width: 500px;">
           <span class="search-icon">🔍</span>
           <input 
             type="text" 
             [ngModel]="searchQuery()"
             (ngModelChange)="searchQuery.set($event)"
             placeholder="Buscar por nombre, SKU o escanear código..." 
             class="search-input w-full"
             #searchInput
           />
           @if (searchQuery()) {
             <button class="search-clear" (click)="searchQuery.set('')">✕</button>
           }
           <button class="search-scanner-btn" (click)="openSearchScanner()" title="Escanear Código de Barras">
             <i class="pi pi-camera"></i>
           </button>
         </div>
         
         <div class="inventory-tabs">
            <button class="tab-btn" [class.active]="filterMode() === 'all'" (click)="filterBy('all')">
               <span class="tab-icon">📦</span> Stock Actual
            </button>
            <button class="tab-btn" [class.active]="filterMode() === 'movements'" (click)="filterBy('movements')">
               <span class="tab-icon">📝</span> Movimientos
            </button>
         </div>
         
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
               <div class="movements-layout">
                  <!-- Timeline -->
                  <div class="movements-timeline-container">
                     <div class="movements-timeline">
                        @for (group of groupedMovements(); track group.date) {
                           <div class="timeline-day-header" [id]="'day-' + group.date">
                              <span class="day-badge">{{ group.date }}</span>
                           </div>
                        @for (mov of group.items; track mov.id) {
                           <div class="timeline-item" [class.positive]="isPositive(mov.tipo)" [class.negative]="!isPositive(mov.tipo)">
                              <div class="timeline-icon">
                                 {{ getMovementIcon(mov.tipo) }}
                              </div>
                              <div class="timeline-content">
                                 <div class="timeline-header">
                                    <div class="timeline-title-group">
                                       <h3>{{ mov.productName }}</h3>
                                       <span class="movement-badge">{{ formatMovementType(mov.tipo) }}</span>
                                    </div>
                                    <span class="timeline-time">{{ mov.createdAt | date:'HH:mm' }}</span>
                                 </div>
                                 <div class="timeline-body">
                                    <div class="stock-change-box">
                                       <span class="amount">{{ isPositive(mov.tipo) ? '+' : '-' }}{{ mov.cantidad }}</span>
                                       <span class="stock-flow">{{ mov.stockAnterior }} ➔ {{ mov.stockNuevo }}</span>
                                    </div>
                                    <div class="timeline-note">
                                       <span>📝 {{ mov.motivo || 'Sin nota de movimiento' }}</span>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        }
                     }
                  </div>
                  @if (groupedMovements().length === 0) {
                     <div class="empty-state">
                        <i class="pi pi-inbox"></i>
                        <p>No hay movimientos registrados</p>
                     </div>
                  }
                  </div>

                  <!-- Sticky Calendar Sidebar -->
                  <div class="movements-calendar-sidebar">
                     <div class="calendar-card">
                        <div class="calendar-header">
                           <button class="btn-nav" (click)="prevMonth()">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                 <path d="M15 19l-7-7 7-7"/>
                              </svg>
                           </button>
                           <h3>{{ currentMonthName() }} {{ currentYear() }}</h3>
                           <button class="btn-nav" (click)="nextMonth()">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                 <path d="M9 5l7 7-7 7"/>
                              </svg>
                           </button>
                        </div>
                        <div class="calendar-grid">
                           <div class="calendar-weekdays">
                              @for (day of weekdays; track day) {
                                 <span>{{ day }}</span>
                              }
                           </div>
                           <div class="calendar-days">
                              @for (day of calendarDays(); track day.date.toISOString()) {
                                 <button 
                                    class="calendar-day"
                                    [class.other-month]="!day.isCurrentMonth"
                                    [class.today]="day.isToday"
                                    [class.has-movements]="day.hasMovements"
                                    (click)="scrollToDate(day.date)"
                                    [disabled]="!day.hasMovements"
                                 >
                                    <span class="day-number">{{ day.dayNumber }}</span>
                                    @if (day.hasMovements && day.isCurrentMonth) {
                                       <span class="day-indicator"></span>
                                    }
                                 </button>
                              }
                           </div>
                        </div>
                     </div>
                  </div>
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

                        @if ($any(item).precioBruto > 0) {
                           <div class="card-price">
                              <span class="price-value">\${{ $any(item).precioBruto | number }}</span>
                              @if ($any(item).marginPercentage > 0) {
                                 <span class="price-margin">+{{ $any(item).marginPercentage | number:'1.0-1' }}%</span>
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
                           <button class="btn-delete-small" style="background: rgba(239,68,68,0.1); color: #EF4444; border: 1px solid rgba(239,68,68,0.2); padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.8rem; font-weight: 500; cursor: pointer;" (click)="deleteProduct(item, $event)">Eliminar</button>
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
                  <label>Categoría</label>
                  <select [(ngModel)]="newProductForm.categoryId" name="categoryId">
                     <option value="">Sin categoría</option>
                     @for (cat of categories(); track cat.id) {
                        <option [value]="cat.id">{{ cat.icono || '📁' }} {{ cat.nombre }}</option>
                     }
                  </select>
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
                  <label>Categoría</label>
                  <select [(ngModel)]="editProductForm.categoryId" name="categoryId">
                     <option value="">Sin categoría</option>
                     @for (cat of categories(); track cat.id) {
                        <option [value]="cat.id">{{ cat.icono || '📁' }} {{ cat.nombre }}</option>
                     }
                  </select>
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

      <!-- Barcode Scanner Modal -->
      @if (showScannerModal) {
         <app-barcode-scanner 
            (scanSuccess)="onBarcodeScanned($event)" 
            (close)="showScannerModal = false">
         </app-barcode-scanner>
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
  categories = signal<any[]>([]);
  currentBranchName = computed(() => this.branchContext.activeBranch()?.nombre || '');

  searchQuery = signal('');
  scanningMode = false;
  showScannerModal = false;
  scannerTarget: 'search' | 'newProduct' = 'newProduct';

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
    descripcion: '',
    sku: '',
    categoryId: '',
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
    categoryId: '',
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

    if (!this.searchQuery().trim()) return items;
    const q = this.searchQuery().toLowerCase();
    return items.filter(s =>
      s.productName.toLowerCase().includes(q) ||
      s.variantSku.toLowerCase().includes(q)
    );
  });

  filteredMovements = computed(() => {
    if (!this.searchQuery().trim()) return this.movements();
    const q = this.searchQuery().toLowerCase();
    return this.movements().filter(m =>
      m.productName.toLowerCase().includes(q) ||
      m.variantSku.toLowerCase().includes(q)
    );
  });

  groupedMovements = computed(() => {
    const movements = this.filteredMovements();
    const groups: { date: string, items: StockMovementDto[] }[] = [];
    
    // Agrupar por fecha local
    movements.forEach(m => {
      const dateObj = new Date(m.createdAt);
      const dateStr = this.formatDateStrForId(dateObj);
      
      const existingGroup = groups.find(g => g.date === dateStr);
      if (existingGroup) {
        existingGroup.items.push(m);
      } else {
        groups.push({ date: dateStr, items: [m] });
      }
    });
    
    return groups;
  });

  // --- Calendar Navigation Logic ---
  currentCalendarDate = signal(new Date());
  weekdays = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

  formatDateStrForId(date: Date): string {
    const dateStr = date.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Santiago' });
    return dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  }

  currentMonthName = computed(() => {
    const d = this.currentCalendarDate();
    const str = d.toLocaleDateString('es-CL', { month: 'long' });
    return str.charAt(0).toUpperCase() + str.slice(1);
  });
  
  currentYear = computed(() => this.currentCalendarDate().getFullYear());

  calendarDays = computed(() => {
    const year = this.currentCalendarDate().getFullYear();
    const month = this.currentCalendarDate().getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    // getDay() is 0 for Sunday, 1 for Monday. We want 0=Monday, 6=Sunday.
    let startDay = firstDay.getDay() - 1;
    if (startDay === -1) startDay = 6;

    const days: any[] = [];
    const today = new Date();

    // Previous month days
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push(this.createDayData(date, false, today));
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push(this.createDayData(date, true, today));
    }

    return days;
  });

  private createDayData(date: Date, isCurrentMonth: boolean, today: Date) {
    return {
      date,
      dayNumber: date.getDate(),
      isCurrentMonth,
      isToday: date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate(),
      hasMovements: this.groupedMovements().some(g => g.date === this.formatDateStrForId(date))
    };
  }

  prevMonth() {
    const current = this.currentCalendarDate();
    this.currentCalendarDate.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }

  nextMonth() {
    const current = this.currentCalendarDate();
    this.currentCalendarDate.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  scrollToDate(date: Date) {
    const idStr = 'day-' + this.formatDateStrForId(date);
    const el = document.getElementById(idStr);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

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
    this.searchQuery.set(code);
    const match = this.stock().find(s => s.variantSku === code || s.productName.includes(code));
    if (match) {
      // Optional: auto-action
    }
  }

  onBarcodeScanned(code: string) {
    if (this.scannerTarget === 'search') {
      this.searchQuery.set(code);
    } else {
      this.newProductForm.sku = code;
    }
    this.showScannerModal = false;
  }

  openSearchScanner() {
    this.scannerTarget = 'search';
    this.showScannerModal = true;
  }

  scanBarcodeForNewProduct() {
    this.scannerTarget = 'newProduct';
    this.showScannerModal = true;
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
    this.loadCategories();
  }

  async loadTaxes() {
    try {
      const taxes = await this.catalogService.getTaxes().toPromise();
      this.taxes.set(taxes || []);
    } catch (e) {
      console.warn('Failed to load taxes', e);
    }
  }

  async loadCategories() {
    try {
      const categories = await this.catalogService.getCategories().toPromise();
      if (categories) {
         categories.sort((a, b) => (a.orden || 0) - (b.orden || 0));
         this.categories.set(categories);
      }
    } catch (e) {
      console.warn('Failed to load categories', e);
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
          updatedAt: p.syncedAt?.toISOString() || new Date().toISOString(),
          // Fix: Include image and prices from cache
          imageUrl: p.imagenUrl,
          precioBruto: (v as any).precioBruto || 0,
          precioNeto: (v as any).precioNeto || 0,
          costo: (v as any).costo || 0,
          marginPercentage: (v as any).marginPercentage || 0
        })));

        this.stock.set(mapped);
        this.lowStockCount.set(mapped.filter(x => x.stockBajo).length);
        console.log('Loaded inventory from cache:', mapped.length);
      }

      // 2. Load stock from API
      const stockData = await this.stockService.getStockByBranch(branchId).toPromise().catch(e => {
        console.warn('Failed to load stock from API', e);
        return [];
      });

      const stockMap = new Map<string, any>();
      if (stockData) {
        stockData.forEach(s => stockMap.set(s.variantSku, s));
      }

      // 3. Fetch catalog and merge with stock
      let finalStock: StockDto[] = [];
      try {
        const productsRes = await this.catalogService.getProducts(0, 500).toPromise();
        if (productsRes && productsRes.content) {
          for (const p of productsRes.content) {
            if (p.variants) {
              for (const v of p.variants) {
                const s = stockMap.get(v.sku);
                finalStock.push({
                  id: s?.id || `virtual-${v.id}`,
                  variantId: v.id,
                  variantSku: v.sku,
                  productName: `${p.nombre} ${v.nombre && v.nombre !== 'Default' ? v.nombre : ''}`.trim(),
                  branchId: branchId,
                  cantidadActual: s?.cantidadActual || 0,
                  cantidadReservada: s?.cantidadReservada || 0,
                  cantidadDisponible: s?.cantidadDisponible || 0,
                  stockMinimo: v.stockMinimo || 5,
                  stockBajo: (s?.cantidadDisponible || 0) <= (v.stockMinimo || 5),
                  updatedAt: s?.updatedAt || new Date().toISOString(),
                  imageUrl: p.imagenUrl,
                  precioBruto: (v as any).precioBruto || 0,
                  precioNeto: (v as any).precioNeto || 0,
                  costo: (v as any).costo || 0,
                  marginPercentage: (v as any).marginPercentage || 0
                });
              }
            }
          }
        }

        this.stock.set(finalStock);
        const manualCount = finalStock.filter(i => i.stockBajo).length;
        this.lowStockCount.set(manualCount);

      } catch (e) {
        console.warn('Failed to enrich stock with catalog data', e);
        // Fallback to stockData
        this.stock.set(stockData || []);
      }

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
    this.newProductForm = { nombre: '', descripcion: '', sku: '', categoryId: '', imageUrl: '', costo: 0, precioNeto: 0, precioBruto: 0, taxId: defaultTax?.id || '', margen: '0%', stockInicial: 0 };
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



  async compressImage(file: File, maxSizeMB: number): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event: any) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimensions to avoid huge canvases
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Start with 0.8 quality and decrease if needed
          let quality = 0.8;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);
          
          while (dataUrl.length > maxSizeMB * 1024 * 1024 && quality > 0.1) {
             quality -= 0.1;
             dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          
          // Convert back to File
          fetch(dataUrl)
            .then(res => res.blob())
            .then(blob => {
              const compressedFile = new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() });
              resolve(compressedFile);
            });
        };
      };
      reader.onerror = error => reject(error);
    });
  }

  async onFileSelected(event: any) {
    let file = event.target.files[0];
    if (file) {
      if (file.size > 1048576) {
        // Compress if larger than 1MB
        try {
           file = await this.compressImage(file, 0.95); // Target ~0.95MB max
        } catch (e) {
           console.warn('Image compression failed', e);
        }
      }
      this.selectedFile = file;
      this.newProductForm.imageUrl = URL.createObjectURL(file);
    }
  }

  async submitNewProduct() {
    if (!this.newProductForm.nombre) {
        alert('El nombre es obligatorio');
        return;
    }
    
    this.loading.set(true);
    try {
        let imageUrl = '';
        if (this.selectedFile) {
            const uploadRes = await this.catalogService.uploadImage(this.selectedFile).toPromise();
            if (uploadRes && uploadRes.url) imageUrl = uploadRes.url;
        }

        const productReq: ProductRequest = {
            sku: this.newProductForm.sku,
            nombre: this.newProductForm.nombre,
            descripcion: this.newProductForm.descripcion,
            categoryId: this.newProductForm.categoryId || undefined,
            imagenUrl: imageUrl,
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
        this.loadData(true);
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
                categoryId: product.categoryId || '',
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

  async onEditFileSelected(event: any) {
    let file = event.target.files[0];
    if (file) {
      if (file.size > 1048576) {
        try {
           file = await this.compressImage(file, 0.95);
        } catch (e) {
           console.warn('Image compression failed', e);
        }
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

        const currentProduct = await this.catalogService.getProduct(this.editProductForm.id).toPromise();
        if (!currentProduct) throw new Error('Producto no encontrado');

        const productReq: ProductRequest = {
            sku: currentProduct.sku,
            nombre: this.editProductForm.nombre,
            categoryId: this.editProductForm.categoryId || currentProduct.categoryId,
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

  async deleteProduct(item: StockDto, event: Event) {
    event.stopPropagation();
    if (confirm(`¿Seguro que desea eliminar el producto ${item.productName} del catálogo? Esta acción es irreversible.`)) {
        this.loading.set(true);
        try {
            const res = await this.catalogService.getProducts(0, 1, item.variantSku).toPromise();
            if (res && res.content && res.content.length > 0) {
                const productId = res.content[0].id;
                await this.catalogService.deleteProduct(productId).toPromise();
                alert('Producto eliminado exitosamente');
                this.loadData(true);
            } else {
                alert('No se pudo encontrar el ID del producto para eliminar.');
            }
        } catch (e: any) {
            console.error('Error eliminando producto:', e);
            alert('Error al eliminar producto: ' + (e.error?.message || e.message));
        } finally {
            this.loading.set(false);
        }
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
    this.loadData(true);
  }

  async submitAdjustment() {
    if (!this.selectedStockItem) return;

    let branchId = this.branchContext.activeBranchId();
    if (!branchId) {
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
    const value = this.stock().reduce((acc, i: any) => {
      const costo = i.costo || 0;
      return acc + (i.cantidadDisponible > 0 ? i.cantidadDisponible * costo : 0);
    }, 0);
    return '$' + Math.round(value).toLocaleString();
  }

  calculateTotalProfit() {
    const total = this.stock().reduce((sum, item) => {
      const costo = (item as any).costo || 0;
      const precioNeto = (item as any).precioNeto || 0;
      return sum + (precioNeto - costo) * item.cantidadDisponible;
    }, 0);
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(total);
  }

  calculateTotalTaxes() {
    const total = this.stock().reduce((sum, item) => {
      const precioBruto = (item as any).precioBruto || 0;
      const precioNeto = (item as any).precioNeto || 0;
      return sum + (precioBruto - precioNeto) * item.cantidadDisponible;
    }, 0);
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(total);
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
