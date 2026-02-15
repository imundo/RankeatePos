import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupplierService, SupplierProduct, Supplier } from '../../../core/services/supplier.service';
import { CatalogService, Product } from '../../../core/services/catalog.service';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';

@Component({
    selector: 'app-supplier-products-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="modal-overlay" (click)="close.emit()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Productos de {{ supplier?.nombre }}</h2>
          <button class="close-btn" (click)="close.emit()">✕</button>
        </div>
        
        <div class="modal-body">
          <!-- Add Product Form -->
          <div class="add-product-section">
            <h3>Asignar Nuevo Producto</h3>
            <div class="search-box">
               <input type="text" placeholder="Buscar producto por nombre o SKU..." 
                      [ngModel]="searchTerm" (ngModelChange)="searchProducts($event)"
                      class="search-input">
               
               @if (searchResults().length > 0) {
                 <div class="search-results">
                   @for (product of searchResults(); track product.id) {
                     <div class="search-item" (click)="selectProduct(product)">
                       <div class="item-name">{{ product.nombre }}</div>
                       <div class="item-sku">{{ product.sku }}</div>
                     </div>
                   }
                 </div>
               }
            </div>

            @if (selectedProduct) {
              <div class="selected-product-form">
                <div class="selected-info">
                   <strong>Producto:</strong> {{ selectedProduct.nombre }}
                   @if (selectedProduct.variants.length > 0) {
                     <select [(ngModel)]="selectedVariantId" class="variant-select">
                       @for (variant of selectedProduct.variants; track variant.id) {
                         <option [value]="variant.id">{{ variant.nombre || 'Default' }} ({{ variant.sku }})</option>
                       }
                     </select>
                   }
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>SKU Proveedor</label>
                    <input type="text" [(ngModel)]="newProductForm.supplierSku" placeholder="Código del proveedor">
                  </div>
                  <div class="form-group">
                    <label>Costo (CLP)</label>
                    <input type="number" [(ngModel)]="newProductForm.lastCost" placeholder="0">
                  </div>
                  <button class="btn btn-primary add-btn" (click)="addProduct()" [disabled]="!canAdd()">
                    Asignar
                  </button>
                </div>
              </div>
            }
          </div>

          <!-- Assigned Products List -->
          <div class="assigned-products">
            <h3>Productos Asignados</h3>
            @if (loading()) {
               <div class="loading">Cargando...</div>
            } @else {
               <div class="table-container">
                 <table class="products-table">
                   <thead>
                     <tr>
                       <th>Producto</th>
                       <th>SKU Prov.</th>
                       <th>Costo</th>
                       <th>Acciones</th>
                     </tr>
                   </thead>
                   <tbody>
                     @for (item of assignedProducts(); track item.id) {
                       <tr>
                         <td>{{ item.productVariantName }}</td>
                         <td>{{ item.supplierSku || '-' }}</td>
                         <td>{{ item.lastCost | currency:'CLP':'symbol-narrow':'1.0-0' }}</td>
                         <td>
                           <button class="btn-icon delete" (click)="removeProduct(item)">🗑️</button>
                         </td>
                       </tr>
                     } @empty {
                       <tr>
                         <td colspan="4" class="empty-cell">No hay productos asignados</td>
                       </tr>
                     }
                   </tbody>
                 </table>
               </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
    .modal-content { background: #1a1a3e; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; width: 90%; max-width: 800px; max-height: 90vh; overflow-y: auto; display: flex; flex-direction: column; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .modal-header h2 { margin: 0; color: #fff; font-size: 1.25rem; }
    .close-btn { background: none; border: none; color: rgba(255,255,255,0.5); font-size: 1.5rem; cursor: pointer; }
    
    .modal-body { padding: 24px; display: flex; flex-direction: column; gap: 24px; }
    h3 { color: #fff; font-size: 1rem; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; }

    .add-product-section { background: rgba(255,255,255,0.03); padding: 16px; border-radius: 12px; }
    
    .search-box { position: relative; margin-bottom: 12px; }
    .search-input { width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #fff; }
    .search-results { position: absolute; top: 100%; left: 0; right: 0; background: #2d2d44; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; max-height: 200px; overflow-y: auto; z-index: 10; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
    .search-item { padding: 8px 12px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .search-item:hover { background: rgba(255,255,255,0.1); }
    .item-name { color: #fff; font-weight: 500; }
    .item-sku { color: rgba(255,255,255,0.6); font-size: 0.8rem; }

    .selected-product-form { display: flex; flex-direction: column; gap: 12px; animation: slideDown 0.2s ease; }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    .selected-info { color: #fff; margin-bottom: 8px; }
    .variant-select { margin-left: 10px; padding: 4px 8px; border-radius: 4px; background: rgba(255,255,255,0.1); color: #fff; border: none; }
    
    .form-row { display: flex; gap: 12px; align-items: flex-end; }
    .form-group { flex: 1; display: flex; flex-direction: column; gap: 4px; }
    .form-group label { color: rgba(255,255,255,0.6); font-size: 0.8rem; }
    .form-group input { padding: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff; }
    .add-btn { height: 38px; min-width: 100px; display: flex; align-items: center; justify-content: center; }

    .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(102,126,234,0.4); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

    .table-container { background: rgba(255,255,255,0.03); border-radius: 12px; overflow: hidden; }
    .products-table { width: 100%; border-collapse: collapse; color: #fff; }
    .products-table th { text-align: left; padding: 12px 16px; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.6); font-size: 0.8rem; text-transform: uppercase; }
    .products-table td { padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.9rem; }
    .products-table tr:last-child td { border-bottom: none; }
    .empty-cell { text-align: center; color: rgba(255,255,255,0.4); padding: 24px; }
    
    .btn-icon { background: none; border: none; cursor: pointer; opacity: 0.7; transition: opacity 0.2s; font-size: 1.1rem; }
    .btn-icon:hover { opacity: 1; }
    .delete:hover { transform: scale(1.1); }
    
    .loading { text-align: center; color: rgba(255,255,255,0.6); padding: 20px; }
  `]
})
export class SupplierProductsModalComponent implements OnInit {
    @Input() supplier: Supplier | null = null;
    @Output() close = new EventEmitter<void>();

    assignedProducts = signal<SupplierProduct[]>([]);
    loading = signal(true);

    searchResults = signal<Product[]>([]);
    searchTerm = '';
    private searchSubject = new Subject<string>();

    selectedProduct: Product | null = null;
    selectedVariantId: string | null = null;

    newProductForm = {
        supplierSku: '',
        lastCost: 0
    };

    constructor(
        private supplierService: SupplierService,
        private catalogService: CatalogService
    ) {
        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(term => this.catalogService.getProducts(0, 5, term))
        ).subscribe({
            next: (res) => this.searchResults.set(res.content),
            error: (e) => console.error(e)
        });
    }

    ngOnInit() {
        if (this.supplier) {
            this.loadAssignedProducts();
        }
    }

    loadAssignedProducts() {
        this.loading.set(true);
        this.supplierService.getSupplierProducts(this.supplier!.id).subscribe({
            next: (data) => {
                this.assignedProducts.set(data);
                this.loading.set(false);
            },
            error: (e) => {
                console.error('Error loading products', e);
                this.loading.set(false);
            }
        });
    }

    searchProducts(term: string) {
        this.searchTerm = term;
        if (term.length > 2) {
            this.searchSubject.next(term);
        } else {
            this.searchResults.set([]);
        }
    }

    selectProduct(product: Product) {
        this.selectedProduct = product;
        // Auto select first variant if available
        if (product.variants && product.variants.length > 0) {
            this.selectedVariantId = product.variants[0].id;
        } else {
            // Logic for no variants? Backend expects productVariantId.
            // Assuming product has at least one variant or logic elsewhere.
            // Usually default variant or base variant.
            this.selectedVariantId = null;
        }
        this.searchResults.set([]);
        this.searchTerm = '';
    }

    addProduct() {
        if (!this.canAdd()) return;

        this.supplierService.addSupplierProduct(this.supplier!.id, {
            productVariantId: this.selectedVariantId!,
            supplierSku: this.newProductForm.supplierSku,
            lastCost: this.newProductForm.lastCost
        }).subscribe({
            next: () => {
                this.loadAssignedProducts();
                this.resetForm();
            },
            error: (e) => console.error('Error adding product', e)
        });
    }

    removeProduct(item: SupplierProduct) {
        if (confirm('¿Eliminar asignación?')) {
            this.supplierService.removeSupplierProduct(this.supplier!.id, item.productVariantId).subscribe({
                next: () => this.loadAssignedProducts(),
                error: (e) => console.error('Error removing', e)
            });
        }
    }

    resetForm() {
        this.selectedProduct = null;
        this.selectedVariantId = null;
        this.newProductForm = { supplierSku: '', lastCost: 0 };
    }

    canAdd(): boolean {
        return !!this.selectedProduct && !!this.selectedVariantId && !!this.supplier;
    }
}
