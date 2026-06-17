import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SupplierService, Supplier, SupplierProduct } from '../../../core/services/supplier.service';
import { PurchaseOrderService, CreatePurchaseOrderItemRequest } from '../../../core/services/purchase-order.service';

interface OrderItem {
  productVariantId: string;
  name: string;
  sku: string;
  quantity: number;
  unitCost: number;
}

@Component({
  selector: 'app-crear-orden-compra',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div class="header-left">
           <a routerLink="/compras/ordenes-compra" class="back-link">← Volver</a>
           <h1>➕ Nueva Orden de Compra</h1>
        </div>
      </header>

      <div class="form-container">
        <!-- Supplier Section -->
        <div class="form-section">
          <h2>Información General</h2>
          <div class="form-grid">
            <div class="form-group">
              <label>Proveedor *</label>
              <select [(ngModel)]="selectedSupplierId" (change)="onSupplierChange()" class="form-control">
                <option value="">Seleccionar...</option>
                @for (supplier of suppliers(); track supplier.id) {
                  <option [value]="supplier.id">{{ supplier.nombre }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label>Fecha Entrega Esperada</label>
              <input type="date" [(ngModel)]="expectedDate" class="form-control" />
            </div>
            <div class="form-group full-width">
              <label>Notas</label>
              <textarea [(ngModel)]="notes" class="form-control" rows="2"></textarea>
            </div>
          </div>
        </div>

        <!-- Items Section -->
        @if (selectedSupplierId) {
            <div class="form-section">
              <div class="section-header">
                <h2>Productos</h2>
                <button class="btn btn-secondary" (click)="addItem()">➕ Agregar Producto</button>
              </div>
              
              @if (loadingProducts()) {
                  <div class="loading-products">Cargando productos del proveedor...</div>
              } @else {
                  <div class="items-table-container">
                    <div class="items-header">
                      <span>Producto</span>
                      <span>Cantidad</span>
                      <span>Costo Unit.</span>
                      <span>Subtotal</span>
                      <span></span>
                    </div>
                    @for (item of items(); track $index) {
                      <div class="item-row">
                        <select [(ngModel)]="item.productVariantId" (change)="onProductChange(item)" class="form-control product-select">
                           <option value="">Seleccionar producto...</option>
                           @for (sp of supplierProducts(); track sp.productVariantId) {
                               <option [value]="sp.productVariantId">
                                   {{ sp.productVariantName }} ({{ sp.supplierSku || 'Sin SKU' }})
                               </option>
                           }
                        </select>
                        <input type="number" [(ngModel)]="item.quantity" min="1" class="form-control quantity-input" />
                        <div class="cost-input-wrapper">
                            <span class="currency-symbol">$</span>
                            <input type="number" [(ngModel)]="item.unitCost" class="form-control cost-input" />
                        </div>
                        <span class="subtotal">{{ item.quantity * item.unitCost | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
                        <button class="remove-btn" (click)="removeItem($index)">🗑️</button>
                      </div>
                    } @empty {
                        <div class="empty-items">
                            Agrega productos a la orden
                        </div>
                    }
                  </div>
                  
                  <div class="totals">
                    <div class="total-row">
                        <span>Neto:</span>
                        <span>{{ calculateTotal() | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
                    </div>
                    <div class="total-row final">
                        <span>Total Estimado:</span>
                        <span>{{ calculateTotal() | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
                    </div>
                  </div>
              }
            </div>

            <div class="form-actions">
              <button class="btn btn-outline" routerLink="/compras/ordenes-compra">Cancelar</button>
              <button class="btn btn-primary" (click)="saveOrder()" [disabled]="saving() || items().length === 0">
                {{ saving() ? 'Guardando...' : '💾 Crear Orden (Borrador)' }}
              </button>
            </div>
        } @else {
            <div class="select-supplier-prompt">
                Selecciona un proveedor para comenzar
            </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; min-height: 100vh; background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%); font-family: 'Inter', -apple-system, sans-serif; padding-top: calc(24px + env(safe-area-inset-top)); padding-bottom: calc(24px + env(safe-area-inset-bottom)); }
    @media (max-width: 768px) { .page-container { padding: 16px; padding-top: calc(16px + env(safe-area-inset-top)); padding-bottom: calc(16px + env(safe-area-inset-bottom)); } }
    
    .page-header { margin-bottom: 24px; display: flex; flex-direction: column; gap: 8px; }
    .header-left { display: flex; flex-direction: column; gap: 8px; }
    .back-link { color: #818cf8; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; font-size: 0.95rem; min-height: 44px; font-weight: 500; transition: color 0.2s; }
    .back-link:hover { color: #a5b4fc; }
    h1, h2 { color: #fff; margin: 0; font-weight: 700; letter-spacing: -0.5px; }
    h1 { font-size: 1.8rem; display: flex; align-items: center; gap: 10px; }
    @media (max-width: 768px) { h1 { font-size: 1.4rem; } }
    
    .form-container { max-width: 1000px; margin: 0 auto; }
    .form-section { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 24px; margin-bottom: 24px; animation: fadeIn 0.3s ease; backdrop-filter: blur(10px); }
    @media (max-width: 768px) { .form-section { padding: 16px; border-radius: 12px; } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    
    .form-section h2 { font-size: 1.2rem; margin-bottom: 20px; color: rgba(255,255,255,0.9); border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 12px; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: none !important; padding-bottom: 0 !important; flex-wrap: wrap; gap: 12px; }
    .section-header h2 { border-bottom: none; padding-bottom: 0; margin-bottom: 0; }
    
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .form-group.full-width { grid-column: 1 / -1; }
    .form-group label { color: rgba(255,255,255,0.7); font-size: 0.85rem; font-weight: 500; }
    
    .form-control { background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 12px 16px; color: #fff; font-size: 0.95rem; transition: all 0.2s; min-height: 48px; }
    .form-control:focus { outline: none; border-color: #6366f1; background: rgba(0,0,0,0.3); box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15); }
    .form-control option { background: #1a1a3e; color: #fff; }
    textarea.form-control { resize: vertical; min-height: 80px; }

    /* Desktop Table View */
    .items-table-container { background: transparent; margin-bottom: 24px; }
    .items-header { display: grid; grid-template-columns: 3fr 120px 160px 140px 50px; gap: 16px; padding: 12px 20px; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.5); font-size: 0.75rem; text-transform: uppercase; font-weight: 600; border-radius: 12px 12px 0 0; border: 1px solid rgba(255,255,255,0.05); border-bottom: none; }
    .item-row { display: grid; grid-template-columns: 3fr 120px 160px 140px 50px; gap: 16px; padding: 16px 20px; align-items: center; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); border-top: none; transition: background 0.2s; }
    .item-row:last-child { border-radius: 0 0 12px 12px; }
    .item-row:hover { background: rgba(255,255,255,0.02); }
    
    .cost-input-wrapper { position: relative; }
    .currency-symbol { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.4); font-size: 0.95rem; pointer-events: none; }
    .cost-input { padding-left: 28px; text-align: right; }
    .quantity-input { text-align: center; }
    .subtotal { text-align: right; font-weight: 700; color: #fff; font-size: 1.05rem; }
    
    .remove-btn { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #ef4444; width: 44px; height: 44px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; font-size: 1.2rem; }
    .remove-btn:hover { background: rgba(239,68,68,0.2); transform: translateY(-2px); }

    /* Mobile Card View for Items */
    @media (max-width: 1024px) {
      .items-header { display: none; }
      .items-table-container { display: flex; flex-direction: column; gap: 16px; background: transparent; }
      .item-row { display: flex; flex-direction: column; gap: 16px; padding: 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); border-top: 1px solid rgba(255,255,255,0.05); }
      .item-row:last-child { border-radius: 16px; }
      .product-select { width: 100%; }
      .subtotal { text-align: left; font-size: 1.25rem; color: #4ade80; }
      .remove-btn { width: 100%; margin-top: 8px; }
    }

    .totals { display: flex; flex-direction: column; align-items: flex-end; gap: 12px; padding-top: 24px; border-top: 1px dashed rgba(255,255,255,0.1); }
    .total-row { display: flex; justify-content: space-between; width: 300px; color: rgba(255,255,255,0.6); font-size: 0.95rem; }
    @media (max-width: 768px) { .total-row { width: 100%; } }
    .total-row.final { color: #fff; font-size: 1.5rem; font-weight: 700; margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px; }
    
    .form-actions { display: flex; justify-content: flex-end; gap: 16px; margin-top: 32px; flex-wrap: wrap; }
    @media (max-width: 768px) { .form-actions { flex-direction: column-reverse; } .form-actions .btn { width: 100%; } }
    
    .btn { padding: 12px 24px; border-radius: 12px; font-weight: 600; border: none; cursor: pointer; transition: all 0.3s; display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-size: 0.95rem; min-height: 48px; }
    .btn:hover { transform: translateY(-2px); }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
    .btn-primary { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; }
    .btn-primary:hover:not(:disabled) { box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4); }
    .btn-secondary { background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.05); }
    .btn-secondary:hover { background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.2); }
    .btn-outline { background: transparent; border: 1px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.8); }
    .btn-outline:hover { border-color: #fff; color: #fff; background: rgba(255,255,255,0.05); }

    .select-supplier-prompt { text-align: center; padding: 60px 20px; color: rgba(255,255,255,0.4); font-size: 1.1rem; background: rgba(255,255,255,0.02); border-radius: 16px; border: 1px dashed rgba(255,255,255,0.1); }
    .loading-products { text-align: center; padding: 40px; color: rgba(255,255,255,0.5); font-style: italic; }
    .empty-items { text-align: center; padding: 40px; color: rgba(255,255,255,0.4); background: rgba(0,0,0,0.1); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); }
  `]
})
export class CrearOrdenCompraComponent implements OnInit {
  suppliers = signal<Supplier[]>([]);
  supplierProducts = signal<SupplierProduct[]>([]);

  selectedSupplierId = '';
  expectedDate = '';
  notes = '';

  items = signal<OrderItem[]>([]);

  loadingProducts = signal(false);
  saving = signal(false);

  constructor(
    private supplierService: SupplierService,
    private purchaseOrderService: PurchaseOrderService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadSuppliers();
  }

  loadSuppliers() {
    // Fetch valid/active suppliers. Assuming getAllActiveSuppliers exists or using getSuppliers
    this.supplierService.getActiveSuppliers().subscribe({
      next: (data) => this.suppliers.set(data),
      error: (e) => console.error(e)
    });
  }

  onSupplierChange() {
    this.items.set([]); // Clear items when supplier changes
    if (this.selectedSupplierId) {
      this.loadSupplierProducts();
    } else {
      this.supplierProducts.set([]);
    }
  }

  loadSupplierProducts() {
    this.loadingProducts.set(true);
    this.supplierService.getSupplierProducts(this.selectedSupplierId).subscribe({
      next: (data) => {
        this.supplierProducts.set(data);
        this.loadingProducts.set(false);
      },
      error: (e) => {
        console.error(e);
        this.loadingProducts.set(false);
      }
    });
  }

  addItem() {
    this.items.update(current => [
      ...current,
      { productVariantId: '', name: '', sku: '', quantity: 1, unitCost: 0 }
    ]);
  }

  removeItem(index: number) {
    this.items.update(current => current.filter((_, i) => i !== index));
  }

  onProductChange(item: OrderItem) {
    const product = this.supplierProducts().find(p => p.productVariantId === item.productVariantId);
    if (product) {
      item.name = product.productVariantName;
      item.sku = product.supplierSku || '';
      item.unitCost = product.lastCost || 0;
      // Trigger update? Objects in array are mutable but signal check might need help if deep change.
      // Using update to force refresh
      this.items.update(current => [...current]);
    }
  }

  calculateTotal(): number {
    return this.items().reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
  }

  saveOrder() {
    if (!this.selectedSupplierId || this.items().length === 0) return;

    this.saving.set(true);

    const requestItems: CreatePurchaseOrderItemRequest[] = this.items().map(item => ({
      productVariantId: item.productVariantId,
      productName: item.name,
      productSku: item.sku,
      quantity: item.quantity,
      unitCost: item.unitCost
    })).filter(i => i.productVariantId); // Filter empty rows

    if (requestItems.length === 0) {
      this.saving.set(false);
      return;
    }

    const request = {
      supplierId: this.selectedSupplierId,
      expectedDeliveryDate: this.expectedDate ? new Date(this.expectedDate).toISOString() : undefined,
      notes: this.notes,
      items: requestItems
    };

    this.purchaseOrderService.createOrder(request).subscribe({
      next: (order) => {
        console.log('Order created', order);
        this.router.navigate(['/compras/ordenes-compra']);
      },
      error: (e) => {
        console.error('Error creating order', e);
        this.saving.set(false);
      }
    });
  }
}
