import { Component, OnInit, OnDestroy, inject, signal, computed, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { OfflineService, CachedProduct, CachedVariant } from '@core/offline/offline.service';
import { StockService, StockDto } from '@core/services/stock.service';
import { AuthService } from '@core/auth/auth.service';
import { environment } from '@env/environment';

interface Product {
  id: string;
  sku: string;
  nombre: string;
  categoria: string;
  precioVenta: number;
  stock: number;
  imagen?: string;
  codigoBarras?: string;
  variantId?: string;
}

interface CartItem {
  product: Product;
  cantidad: number;
  descuento: number;
  subtotal: number;
}

interface PendingSale {
  id: string;
  fecha: string;
  cliente: string;
  total: number;
  items: number;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
}

@Component({
  selector: 'app-smart-pos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="smart-pos-container">
      <!-- Header -->
      <header class="pos-header">
        <div class="header-left">
          <a routerLink="/dashboard" class="back-btn">←</a>
          <div class="title-section">
            <h1>🛒 POS Inteligente</h1>
            <p class="subtitle">Escanea, vende y gestiona inventario</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="action-btn secondary" (click)="activeTab = 'pending'" [class.active]="activeTab === 'pending'">
            📋 Pendientes
            @if (pendingSales().length > 0) {
              <span class="badge">{{ pendingSales().length }}</span>
            }
          </button>
          <button class="action-btn primary" (click)="activeTab = 'pos'" [class.active]="activeTab === 'pos'">
            🛒 Vender
          </button>
        </div>
      </header>

      <!-- Main Content -->
      <div class="pos-content">
        @if (activeTab === 'pos') {
          <!-- POS Mode -->
          <div class="pos-layout">
            <!-- Left Panel: Scanner & Products -->
            <div class="products-panel">
              <!-- Scanner Section -->
              <div class="scanner-section">
                <div class="scanner-header">
                  <h3>📷 Scanner de Código de Barras</h3>
                  <button class="scanner-toggle" (click)="toggleScanner()" [class.active]="scannerActive">
                    {{ scannerActive ? '⏹️ Detener' : '▶️ Iniciar' }}
                  </button>
                </div>
                
                @if (scannerActive) {
                  <div class="scanner-preview">
                    <video #videoElement autoplay playsinline></video>
                    <div class="scan-line"></div>
                    <p class="scanner-hint">Apunta al código de barras</p>
                  </div>
                }
                
                <div class="manual-search">
                  <input 
                    type="text" 
                    [(ngModel)]="searchQuery" 
                    (keyup.enter)="searchProduct()"
                    placeholder="🔍 Buscar por SKU o nombre..."
                    class="search-input"
                  />
                  <button class="search-btn" (click)="searchProduct()">Buscar</button>
                </div>
              </div>

              <!-- Quick Actions -->
              <div class="quick-actions">
                <button class="quick-btn" (click)="showInventoryModal = true">
                  <span class="icon">📦</span>
                  <span>Agregar Inventario</span>
                </button>
                <button class="quick-btn" (click)="showNewProductModal = true">
                  <span class="icon">➕</span>
                  <span>Nuevo Producto</span>
                </button>
                <button class="quick-btn" (click)="loadProducts()">
                  <span class="icon">🔄</span>
                  <span>Actualizar</span>
                </button>
              </div>

              <!-- Products Grid -->
              <div class="products-section">
                <h3>Productos Recientes</h3>
                <div class="products-grid">
                  @for (product of filteredProducts(); track product.id) {
                    <div class="product-card" (click)="addToCart(product)">
                      <div class="product-image">
                        @if (product.imagen) {
                          <img [src]="product.imagen" [alt]="product.nombre" />
                        } @else {
                          <span class="placeholder">📦</span>
                        }
                        @if (product.stock <= 5) {
                          <span class="stock-warning">⚠️ {{ product.stock }}</span>
                        }
                      </div>
                      <div class="product-info">
                        <span class="product-name">{{ product.nombre }}</span>
                        <span class="product-sku">SKU: {{ product.sku }}</span>
                        <span class="product-price">{{ formatPrice(product.precioVenta) }}</span>
                      </div>
                    </div>
                  } @empty {
                    <div class="empty-products">
                      <span>📦</span>
                      <p>No hay productos cargados</p>
                      <button (click)="loadProducts()">Cargar Productos</button>
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- Right Panel: Cart -->
            <div class="cart-panel">
              <div class="cart-header">
                <h3>🛒 Carrito</h3>
                @if (cart().length > 0) {
                  <button class="clear-cart" (click)="clearCart()">🗑️ Limpiar</button>
                }
              </div>

              <div class="cart-items">
                @for (item of cart(); track item.product.id) {
                  <div class="cart-item">
                    <div class="item-info">
                      <span class="item-name">{{ item.product.nombre }}</span>
                      <span class="item-sku">{{ item.product.sku }}</span>
                    </div>
                    <div class="item-controls">
                      <button class="qty-btn" (click)="updateQuantity(item, -1)">−</button>
                      <input type="number" [(ngModel)]="item.cantidad" (change)="recalculateItem(item)" min="1" />
                      <button class="qty-btn" (click)="updateQuantity(item, 1)">+</button>
                    </div>
                    <div class="item-price">
                      <span class="unit-price">{{ formatPrice(item.product.precioVenta) }}</span>
                      <span class="subtotal">{{ formatPrice(item.subtotal) }}</span>
                    </div>
                    <button class="remove-item" (click)="removeFromCart(item)">✕</button>
                  </div>
                } @empty {
                  <div class="empty-cart">
                    <span>🛒</span>
                    <p>Carrito vacío</p>
                    <p class="hint">Escanea o busca productos para agregar</p>
                  </div>
                }
              </div>

              @if (cart().length > 0) {
                <!-- Cart Summary -->
                <div class="cart-summary">
                  <div class="summary-row">
                    <span>Subtotal</span>
                    <span>{{ formatPrice(cartSubtotal()) }}</span>
                  </div>
                  <div class="summary-row">
                    <span>Descuento</span>
                    <input type="number" [(ngModel)]="globalDiscount" (change)="recalculateCart()" min="0" max="100" />
                    <span>%</span>
                  </div>
                  <div class="summary-row">
                    <span>IVA (19%)</span>
                    <span>{{ formatPrice(cartTax()) }}</span>
                  </div>
                  <div class="summary-row total">
                    <span>TOTAL</span>
                    <span>{{ formatPrice(cartTotal()) }}</span>
                  </div>
                </div>

                <!-- Payment Methods -->
                <div class="payment-section">
                  <h4>Método de Pago</h4>
                  <div class="payment-methods">
                    <button class="payment-btn" [class.selected]="paymentMethod === 'EFECTIVO'" (click)="paymentMethod = 'EFECTIVO'">
                      💵 Efectivo
                    </button>
                    <button class="payment-btn" [class.selected]="paymentMethod === 'TARJETA'" (click)="paymentMethod = 'TARJETA'">
                      💳 Tarjeta
                    </button>
                    <button class="payment-btn" [class.selected]="paymentMethod === 'TRANSFERENCIA'" (click)="paymentMethod = 'TRANSFERENCIA'">
                      🏦 Transferencia
                    </button>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="cart-actions">
                  <button class="action-btn secondary" (click)="savePending()">
                    💾 Guardar Pendiente
                  </button>
                  <button class="action-btn primary large" (click)="processSale()">
                    ✅ Procesar Venta
                  </button>
                </div>
              }
            </div>
          </div>
        }

        @if (activeTab === 'pending') {
          <!-- Pending Sales -->
          <div class="pending-section">
            <h2>📋 Ventas Pendientes de Aprobación</h2>
            <div class="pending-list">
              @for (sale of pendingSales(); track sale.id) {
                <div class="pending-card" [class]="sale.estado.toLowerCase()">
                  <div class="pending-info">
                    <span class="pending-id">#{{ sale.id }}</span>
                    <span class="pending-date">{{ sale.fecha }}</span>
                    <span class="pending-client">{{ sale.cliente }}</span>
                    <span class="pending-items">{{ sale.items }} items</span>
                    <span class="pending-total">{{ formatPrice(sale.total) }}</span>
                    <span class="pending-status">{{ sale.estado }}</span>
                  </div>
                  @if (sale.estado === 'PENDIENTE') {
                    <div class="pending-actions">
                      <button class="approve-btn" (click)="approveSale(sale)">✅ Aprobar</button>
                      <button class="reject-btn" (click)="rejectSale(sale)">❌ Rechazar</button>
                    </div>
                  }
                </div>
              } @empty {
                <div class="empty-pending">
                  <span>✅</span>
                  <p>No hay ventas pendientes</p>
                </div>
              }
            </div>
          </div>
        }
      </div>

      <!-- Inventory Modal -->
      @if (showInventoryModal) {
        <div class="modal-overlay" (click)="showInventoryModal = false">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <h2>📦 Agregar Inventario</h2>
            <form (ngSubmit)="addInventory()">
              <div class="form-group">
                <label>Producto *</label>
                <select [(ngModel)]="inventoryForm.productId" name="productId" required>
                  <option value="">Seleccionar producto...</option>
                  @for (product of products(); track product.id) {
                    <option [value]="product.id">{{ product.nombre }} ({{ product.sku }})</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label>Cantidad a Agregar *</label>
                <input type="number" [(ngModel)]="inventoryForm.cantidad" name="cantidad" min="1" required />
              </div>
              <div class="form-group">
                <label>Código de Barras (opcional)</label>
                <input type="text" [(ngModel)]="inventoryForm.codigoBarras" name="codigoBarras" placeholder="Escanear o escribir..." />
              </div>
              <div class="form-group">
                <label>Notas</label>
                <textarea [(ngModel)]="inventoryForm.notas" name="notas" placeholder="Motivo, proveedor, etc."></textarea>
              </div>
              <div class="modal-actions">
                <button type="button" class="cancel-btn" (click)="showInventoryModal = false">Cancelar</button>
                <button type="submit" class="save-btn">Agregar Stock</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- New Product Modal -->
      @if (showNewProductModal) {
        <div class="modal-overlay" (click)="showNewProductModal = false">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <h2>➕ Nuevo Producto Rápido</h2>
            <form (ngSubmit)="createProduct()">
              <div class="form-row">
                <div class="form-group">
                  <label>SKU *</label>
                  <input type="text" [(ngModel)]="newProductForm.sku" name="sku" required />
                </div>
                <div class="form-group">
                  <label>Código de Barras</label>
                  <input type="text" [(ngModel)]="newProductForm.codigoBarras" name="codigoBarras" />
                </div>
              </div>
              <div class="form-group">
                <label>Nombre *</label>
                <input type="text" [(ngModel)]="newProductForm.nombre" name="nombre" required />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Precio Venta *</label>
                  <input type="number" [(ngModel)]="newProductForm.precioVenta" name="precioVenta" min="0" required />
                </div>
                <div class="form-group">
                  <label>Stock Inicial</label>
                  <input type="number" [(ngModel)]="newProductForm.stock" name="stock" min="0" />
                </div>
              </div>
              <div class="form-group">
                <label>Categoría</label>
                <input type="text" [(ngModel)]="newProductForm.categoria" name="categoria" />
              </div>
              <div class="modal-actions">
                <button type="button" class="cancel-btn" (click)="showNewProductModal = false">Cancelar</button>
                <button type="submit" class="save-btn">Crear Producto</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Out of Stock Alert Modal -->
      @if (showOutOfStockModal) {
        <div class="modal-overlay" (click)="showOutOfStockModal = false">
          <div class="modal-content stock-alert" (click)="$event.stopPropagation()">
            <div class="alert-icon">⚠️</div>
            <h2>Sin Stock Disponible</h2>
            <p class="alert-product">{{ outOfStockProduct?.nombre }}</p>
            <p class="alert-message">Este producto no tiene stock disponible para vender.</p>
            <div class="stock-info">
              <span class="label">Stock actual:</span>
              <span class="value zero">0 unidades</span>
            </div>
            <div class="modal-actions">
              <button type="button" class="cancel-btn" (click)="showOutOfStockModal = false">Cerrar</button>
              <button type="button" class="save-btn" (click)="goToReplenish()">📦 Reponer Inventario</button>
            </div>
          </div>
        </div>
      }

      <!-- Success Toast -->
      @if (showToast) {
        <div class="toast" [class]="toastType">
          {{ toastMessage }}
        </div>
      }
    </div>
  `,
  styles: [`
    .smart-pos-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
      color: white;
      padding: 1rem;
    }

    .pos-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;
    }
    .header-left { display: flex; align-items: center; gap: 1rem; }
    .back-btn {
      width: 48px; height: 48px; border-radius: 12px;
      background: rgba(255, 255, 255, 0.1);
      display: flex; align-items: center; justify-content: center;
      text-decoration: none; color: white; font-size: 1.5rem;
    }
    .title-section h1 { font-size: 1.5rem; margin: 0; }
    .subtitle { color: rgba(255, 255, 255, 0.6); margin: 0.25rem 0 0; font-size: 0.875rem; }

    .header-actions { display: flex; gap: 0.75rem; }
    .action-btn {
      padding: 0.75rem 1.5rem; border-radius: 12px;
      font-weight: 600; cursor: pointer; border: none;
      display: flex; align-items: center; gap: 0.5rem;
    }
    .action-btn.primary { background: linear-gradient(135deg, #10B981, #059669); color: white; }
    .action-btn.secondary { background: rgba(255, 255, 255, 0.1); color: white; border: 1px solid rgba(255, 255, 255, 0.2); }
    .action-btn.active { background: linear-gradient(135deg, #6366F1, #8B5CF6); }
    .action-btn .badge {
      background: #EF4444; padding: 0.125rem 0.5rem; border-radius: 10px; font-size: 0.75rem;
    }

    .pos-layout { display: grid; grid-template-columns: 1fr 400px; gap: 1.5rem; height: calc(100vh - 120px); }
    @media (max-width: 1024px) { .pos-layout { grid-template-columns: 1fr; } }

    /* Products Panel */
    .products-panel {
      display: flex; flex-direction: column; gap: 1rem;
      overflow-y: auto; padding-right: 0.5rem;
    }

    .scanner-section {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 16px; padding: 1.25rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .scanner-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .scanner-header h3 { margin: 0; font-size: 1rem; }
    .scanner-toggle {
      padding: 0.5rem 1rem; border-radius: 8px;
      background: rgba(255, 255, 255, 0.1); border: none; color: white; cursor: pointer;
    }
    .scanner-toggle.active { background: #EF4444; }

    .scanner-preview {
      position: relative; width: 100%; height: 200px;
      background: #000; border-radius: 12px; overflow: hidden; margin-bottom: 1rem;
    }
    .scanner-preview video { width: 100%; height: 100%; object-fit: cover; }
    .scan-line {
      position: absolute; left: 10%; right: 10%; height: 2px;
      background: linear-gradient(90deg, transparent, #10B981, transparent);
      animation: scan 2s infinite;
    }
    @keyframes scan {
      0%, 100% { top: 20%; }
      50% { top: 80%; }
    }
    .scanner-hint {
      position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.7); padding: 0.25rem 0.75rem; border-radius: 4px;
      font-size: 0.75rem;
    }

    .manual-search { display: flex; gap: 0.5rem; }
    .search-input {
      flex: 1; padding: 0.75rem 1rem; border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.05); color: white;
    }
    .search-btn {
      padding: 0.75rem 1.25rem; border-radius: 10px;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      border: none; color: white; cursor: pointer;
    }

    .quick-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .quick-btn {
      flex: 1; min-width: 120px; padding: 1rem;
      background: rgba(255, 255, 255, 0.05); border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: white; cursor: pointer; display: flex; flex-direction: column;
      align-items: center; gap: 0.5rem;
    }
    .quick-btn:hover { background: rgba(255, 255, 255, 0.1); }
    .quick-btn .icon { font-size: 1.5rem; }

    .products-section { flex: 1; }
    .products-section h3 { margin: 0 0 1rem; font-size: 1rem; }
    .products-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 1rem;
    }
    .product-card {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px; padding: 0.75rem;
      cursor: pointer; transition: all 0.2s;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .product-card:hover { transform: scale(1.02); background: rgba(255, 255, 255, 0.1); }
    .product-image {
      position: relative; height: 80px; background: rgba(0, 0, 0, 0.3);
      border-radius: 8px; display: flex; align-items: center; justify-content: center;
      margin-bottom: 0.5rem; overflow: hidden;
    }
    .product-image img { width: 100%; height: 100%; object-fit: cover; }
    .product-image .placeholder { font-size: 2rem; }
    .stock-warning {
      position: absolute; top: 4px; right: 4px;
      background: #EF4444; padding: 0.125rem 0.375rem; border-radius: 4px; font-size: 0.7rem;
    }
    .product-info { display: flex; flex-direction: column; gap: 0.125rem; }
    .product-name { font-size: 0.875rem; font-weight: 600; }
    .product-sku { font-size: 0.7rem; color: rgba(255, 255, 255, 0.5); }
    .product-price { font-size: 0.875rem; color: #10B981; font-weight: 600; }

    .empty-products {
      grid-column: 1 / -1; text-align: center; padding: 3rem;
      color: rgba(255, 255, 255, 0.5);
    }
    .empty-products span { font-size: 3rem; }
    .empty-products button {
      margin-top: 1rem; padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      border: none; border-radius: 8px; color: white; cursor: pointer;
    }

    /* Cart Panel */
    .cart-panel {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 16px; padding: 1.25rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      display: flex; flex-direction: column;
    }
    .cart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .cart-header h3 { margin: 0; }
    .clear-cart {
      background: transparent; border: none; color: #EF4444; cursor: pointer; font-size: 0.875rem;
    }

    .cart-items { flex: 1; overflow-y: auto; min-height: 200px; }
    .cart-item {
      display: grid; grid-template-columns: 1fr auto auto auto;
      gap: 0.75rem; align-items: center;
      padding: 0.75rem 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .item-info { display: flex; flex-direction: column; }
    .item-name { font-size: 0.875rem; font-weight: 500; }
    .item-sku { font-size: 0.7rem; color: rgba(255, 255, 255, 0.5); }
    .item-controls { display: flex; align-items: center; gap: 0.25rem; }
    .qty-btn {
      width: 28px; height: 28px; border-radius: 6px;
      background: rgba(255, 255, 255, 0.1); border: none; color: white; cursor: pointer;
    }
    .item-controls input {
      width: 40px; text-align: center; padding: 0.25rem;
      background: rgba(255, 255, 255, 0.1); border: none; border-radius: 4px; color: white;
    }
    .item-price { text-align: right; }
    .unit-price { display: block; font-size: 0.7rem; color: rgba(255, 255, 255, 0.5); }
    .subtotal { font-weight: 600; color: #10B981; }
    .remove-item {
      width: 24px; height: 24px; border-radius: 50%;
      background: rgba(239, 68, 68, 0.2); border: none; color: #EF4444; cursor: pointer;
    }

    .empty-cart { text-align: center; padding: 3rem; color: rgba(255, 255, 255, 0.5); }
    .empty-cart span { font-size: 3rem; }
    .empty-cart .hint { font-size: 0.8rem; }

    .cart-summary {
      background: rgba(0, 0, 0, 0.2); border-radius: 12px;
      padding: 1rem; margin-top: 1rem;
    }
    .summary-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 0.5rem 0; font-size: 0.9rem;
    }
    .summary-row input {
      width: 50px; padding: 0.25rem; text-align: center;
      background: rgba(255, 255, 255, 0.1); border: none; border-radius: 4px; color: white;
    }
    .summary-row.total { font-size: 1.25rem; font-weight: 700; color: #10B981; border-top: 1px solid rgba(255, 255, 255, 0.2); padding-top: 0.75rem; margin-top: 0.5rem; }

    .payment-section { margin-top: 1rem; }
    .payment-section h4 { margin: 0 0 0.75rem; font-size: 0.9rem; }
    .payment-methods { display: flex; gap: 0.5rem; }
    .payment-btn {
      flex: 1; padding: 0.75rem 0.5rem; border-radius: 8px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white; cursor: pointer; font-size: 0.8rem;
    }
    .payment-btn.selected { background: rgba(16, 185, 129, 0.2); border-color: #10B981; }

    .cart-actions { display: flex; gap: 0.75rem; margin-top: 1rem; }
    .cart-actions .action-btn { flex: 1; justify-content: center; }
    .cart-actions .action-btn.large { padding: 1rem; font-size: 1rem; }

    /* Pending Sales */
    .pending-section { padding: 1rem; }
    .pending-section h2 { margin: 0 0 1.5rem; }
    .pending-list { display: flex; flex-direction: column; gap: 1rem; }
    .pending-card {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px; padding: 1.25rem;
      border-left: 4px solid #F59E0B;
      display: flex; justify-content: space-between; align-items: center;
    }
    .pending-card.aprobada { border-color: #10B981; opacity: 0.6; }
    .pending-card.rechazada { border-color: #EF4444; opacity: 0.6; }
    .pending-info { display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap; }
    .pending-id { font-weight: 700; color: #6366F1; }
    .pending-total { font-weight: 700; color: #10B981; font-size: 1.1rem; }
    .pending-status { padding: 0.25rem 0.75rem; border-radius: 20px; background: rgba(245, 158, 11, 0.2); color: #FBBF24; font-size: 0.8rem; }
    .pending-actions { display: flex; gap: 0.5rem; }
    .approve-btn, .reject-btn {
      padding: 0.5rem 1rem; border-radius: 8px; border: none; cursor: pointer; font-weight: 600;
    }
    .approve-btn { background: rgba(16, 185, 129, 0.2); color: #10B981; }
    .reject-btn { background: rgba(239, 68, 68, 0.2); color: #EF4444; }

    .empty-pending { text-align: center; padding: 4rem; color: rgba(255, 255, 255, 0.5); }
    .empty-pending span { font-size: 4rem; }

    /* Modal */
    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; padding: 1rem;
    }
    .modal-content {
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      border-radius: 20px; padding: 2rem;
      width: 100%; max-width: 500px; max-height: 90vh;
      overflow-y: auto; border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .modal-content h2 { margin: 0 0 1.5rem; }
    .form-row { display: flex; gap: 1rem; }
    .form-group { flex: 1; margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-size: 0.9rem; }
    .form-group input, .form-group select, .form-group textarea {
      width: 100%; padding: 0.75rem 1rem; border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.05); color: white;
    }
    .form-group textarea { resize: vertical; min-height: 80px; }
    .modal-actions { display: flex; gap: 1rem; margin-top: 1.5rem; }
    .cancel-btn, .save-btn { flex: 1; padding: 0.875rem; border-radius: 12px; font-weight: 600; cursor: pointer; }
    .cancel-btn { background: transparent; border: 1px solid rgba(255, 255, 255, 0.2); color: white; }
    .save-btn { background: linear-gradient(135deg, #10B981, #059669); border: none; color: white; }

    /* Stock Alert Modal */
    .stock-alert { text-align: center; }
    .stock-alert .alert-icon { font-size: 4rem; margin-bottom: 1rem; }
    .stock-alert h2 { color: #EF4444; margin-bottom: 0.5rem; }
    .stock-alert .alert-product { 
      font-size: 1.25rem; font-weight: 600; 
      color: #FBBF24; margin-bottom: 1rem;
    }
    .stock-alert .alert-message { color: rgba(255, 255, 255, 0.7); margin-bottom: 1.5rem; }
    .stock-alert .stock-info {
      background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 12px; padding: 1rem; margin-bottom: 1.5rem;
      display: flex; justify-content: space-between; align-items: center;
    }
    .stock-alert .stock-info .label { color: rgba(255, 255, 255, 0.7); }
    .stock-alert .stock-info .value.zero { color: #EF4444; font-weight: 700; font-size: 1.1rem; }

    /* Toast */
    .toast {
      position: fixed; bottom: 2rem; right: 2rem;
      padding: 1rem 2rem; border-radius: 12px;
      background: #10B981; color: white; font-weight: 600;
      animation: slideIn 0.3s ease;
      z-index: 2000;
    }
    .toast.error { background: #EF4444; }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class SmartPosComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;

  private http = inject(HttpClient);
  private offlineService = inject(OfflineService);
  private stockService = inject(StockService);
  private authService = inject(AuthService);

  activeTab: 'pos' | 'pending' = 'pos';
  searchQuery = '';
  scannerActive = false;
  globalDiscount = 0;
  paymentMethod: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' = 'EFECTIVO';

  showInventoryModal = false;
  showNewProductModal = false;
  showOutOfStockModal = false;
  outOfStockProduct: Product | null = null;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  products = signal<Product[]>([]);
  cart = signal<CartItem[]>([]);
  pendingSales = signal<PendingSale[]>([]);

  inventoryForm = { productId: '', cantidad: 1, codigoBarras: '', notas: '' };
  newProductForm = { sku: '', codigoBarras: '', nombre: '', precioVenta: 0, stock: 0, categoria: '' };

  private mediaStream: MediaStream | null = null;

  filteredProducts = computed(() => {
    const query = this.searchQuery.toLowerCase();
    if (!query) return this.products();
    return this.products().filter(p =>
      p.nombre.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query) ||
      p.codigoBarras?.includes(query)
    );
  });

  cartSubtotal = computed(() => this.cart().reduce((sum, item) => sum + item.subtotal, 0));
  cartTax = computed(() => {
    const subtotal = this.cartSubtotal();
    const discountAmount = subtotal * (this.globalDiscount / 100);
    return (subtotal - discountAmount) * 0.19;
  });
  cartTotal = computed(() => {
    const subtotal = this.cartSubtotal();
    const discountAmount = subtotal * (this.globalDiscount / 100);
    return (subtotal - discountAmount) + this.cartTax();
  });

  ngOnInit() {
    this.loadProducts();
    this.loadPendingSales();
  }

  ngOnDestroy() {
    this.stopScanner();
  }

  async loadProducts() {
    try {
      // Load from cache (shared with main POS)
      const cachedProducts = await this.offlineService.getCachedProducts();

      if (cachedProducts.length > 0) {
        let mapped = cachedProducts.map(p => this.mapCachedProduct(p));
        this.products.set(mapped);
        console.log('Smart POS: Loaded', mapped.length, 'products from shared cache');

        // Fetch real stock data
        await this.loadStockData();
      } else {
        // Fallback to API if no cache
        this.http.get<any[]>(`${environment.apiUrl}/catalog/products`).subscribe({
          next: async (data) => {
            const mapped = data.map(p => ({
              id: p.id,
              sku: p.sku,
              nombre: p.nombre,
              categoria: p.categoryName || 'General',
              precioVenta: p.variants?.[0]?.precioNeto || 0,
              stock: p.stock || 0,
              imagen: p.imagenUrl,
              codigoBarras: p.variants?.[0]?.barcode,
              variantId: p.variants?.[0]?.id
            }));
            this.products.set(mapped);
            await this.loadStockData();
          },
          error: () => this.showNotification('Error cargando productos', 'error')
        });
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  }

  async loadStockData() {
    try {
      const branchId = this.authService.getBranchId();
      if (!branchId) {
        console.log('No branch ID, using demo stock data');
        this.applyDemoStock();
        return;
      }

      this.stockService.getStockByBranch(branchId).subscribe({
        next: (stockData: StockDto[]) => {
          this.mergeStockWithProducts(stockData);
        },
        error: (err) => {
          console.error('Error loading stock, using demo data:', err);
          this.applyDemoStock();
        }
      });
    } catch (error) {
      console.error('Error in loadStockData:', error);
      this.applyDemoStock();
    }
  }

  private mergeStockWithProducts(stockData: StockDto[]) {
    const stockMap = new Map<string, number>();
    stockData.forEach(s => {
      stockMap.set(s.variantId, s.cantidadDisponible);
      stockMap.set(s.variantSku, s.cantidadDisponible);
    });

    const updated = this.products().map(p => ({
      ...p,
      stock: stockMap.get(p.id) || stockMap.get(p.sku) || p.stock
    }));
    this.products.set(updated);
    console.log('Smart POS: Stock data merged for', stockData.length, 'variants');
  }

  private applyDemoStock() {
    // Demo stock data for testing
    const demoStock: { [sku: string]: number } = {
      'PAN-001': 25, 'PAN-002': 0, 'PAN-003': 12, 'PAN-004': 8,
      'PAN-005': 0, 'PAN-006': 45, 'PAN-007': 3, 'PAN-008': 15,
      'PAS-001': 0, 'PAS-002': 7, 'PAS-003': 20, 'PAS-004': 0,
      'PAS-005': 5, 'PAS-006': 10, 'PAS-007': 0, 'PAS-008': 18,
      'BEB-001': 30, 'BEB-002': 0, 'BEB-003': 50, 'BEB-004': 12,
      'BEB-005': 0, 'BEB-006': 25
    };

    const updated = this.products().map(p => ({
      ...p,
      stock: demoStock[p.sku] ?? Math.floor(Math.random() * 20)
    }));
    this.products.set(updated);
    console.log('Smart POS: Demo stock applied');
  }

  private mapCachedProduct(p: CachedProduct): Product {
    const variant = p.variants?.[0];
    return {
      id: p.id,
      sku: p.sku,
      nombre: p.nombre,
      categoria: p.categoryName || 'General',
      precioVenta: variant?.precioNeto || 0,
      stock: 0,
      imagen: p.imagenUrl,
      codigoBarras: variant?.barcode,
      variantId: variant?.id
    };
  }

  loadPendingSales() {
    const stored = localStorage.getItem('smart_pos_pending_sales');
    if (stored) {
      this.pendingSales.set(JSON.parse(stored));
    }
  }

  async toggleScanner() {
    if (this.scannerActive) {
      this.stopScanner();
    } else {
      await this.startScanner();
    }
  }

  async startScanner() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (this.videoElement?.nativeElement) {
        this.videoElement.nativeElement.srcObject = this.mediaStream;
      }
      this.scannerActive = true;
      // Note: Real barcode scanning would use a library like QuaggaJS or ZXing
      this.showNotification('Scanner activado. En producción usaría una librería de escaneo.', 'success');
    } catch (error) {
      console.error('Error accessing camera:', error);
      this.showNotification('No se pudo acceder a la cámara', 'error');
    }
  }

  stopScanner() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    this.scannerActive = false;
  }

  searchProduct() {
    if (!this.searchQuery) return;
    const product = this.products().find(p =>
      p.sku.toLowerCase() === this.searchQuery.toLowerCase() ||
      p.codigoBarras === this.searchQuery
    );
    if (product) {
      this.addToCart(product);
      this.searchQuery = '';
    } else {
      this.showNotification('Producto no encontrado', 'error');
    }
  }

  addToCart(product: Product) {
    // Check stock before adding
    const cartQty = this.cart().find(i => i.product.id === product.id)?.cantidad || 0;
    const requestedQty = cartQty + 1;

    if (product.stock <= 0) {
      // No stock at all - show alert
      this.outOfStockProduct = product;
      this.showOutOfStockModal = true;
      return;
    }

    if (requestedQty > product.stock) {
      // Insufficient stock
      this.showNotification(`Stock insuficiente. Solo hay ${product.stock} unidades.`, 'error');
      return;
    }

    const existing = this.cart().find(item => item.product.id === product.id);
    if (existing) {
      existing.cantidad++;
      existing.subtotal = existing.cantidad * existing.product.precioVenta;
      this.cart.set([...this.cart()]);
    } else {
      this.cart.update(items => [...items, {
        product,
        cantidad: 1,
        descuento: 0,
        subtotal: product.precioVenta
      }]);
    }
    this.showNotification(`${product.nombre} agregado`, 'success');
  }

  goToReplenish() {
    this.showOutOfStockModal = false;
    if (this.outOfStockProduct) {
      this.inventoryForm.productId = this.outOfStockProduct.id;
    }
    this.showInventoryModal = true;
  }

  updateQuantity(item: CartItem, delta: number) {
    item.cantidad = Math.max(1, item.cantidad + delta);
    this.recalculateItem(item);
  }

  recalculateItem(item: CartItem) {
    item.subtotal = item.cantidad * item.product.precioVenta * (1 - item.descuento / 100);
    this.cart.set([...this.cart()]);
  }

  recalculateCart() {
    // Trigger computed signals update
    this.cart.set([...this.cart()]);
  }

  removeFromCart(item: CartItem) {
    this.cart.update(items => items.filter(i => i.product.id !== item.product.id));
  }

  clearCart() {
    this.cart.set([]);
    this.globalDiscount = 0;
  }

  savePending() {
    if (this.cart().length === 0) return;
    const newSale: PendingSale = {
      id: String(Date.now()).slice(-6),
      fecha: new Date().toLocaleString('es-CL'),
      cliente: 'Cliente General',
      total: this.cartTotal(),
      items: this.cart().length,
      estado: 'PENDIENTE'
    };
    this.pendingSales.update(sales => [newSale, ...sales]);
    this.clearCart();
    this.showNotification('Venta guardada como pendiente', 'success');
  }

  processSale() {
    if (this.cart().length === 0) return;
    // Here you would call the actual API
    this.showNotification(`Venta procesada: ${this.formatPrice(this.cartTotal())}`, 'success');
    this.clearCart();
  }

  approveSale(sale: PendingSale) {
    sale.estado = 'APROBADA';
    this.pendingSales.set([...this.pendingSales()]);
    this.showNotification(`Venta #${sale.id} aprobada`, 'success');
  }

  rejectSale(sale: PendingSale) {
    sale.estado = 'RECHAZADA';
    this.pendingSales.set([...this.pendingSales()]);
    this.showNotification(`Venta #${sale.id} rechazada`, 'error');
  }

  addInventory() {
    if (!this.inventoryForm.productId || this.inventoryForm.cantidad < 1) return;
    const product = this.products().find(p => p.id === this.inventoryForm.productId);
    if (product) {
      product.stock += this.inventoryForm.cantidad;
      this.products.set([...this.products()]);
      this.showNotification(`Stock actualizado: +${this.inventoryForm.cantidad}`, 'success');
    }
    this.showInventoryModal = false;
    this.inventoryForm = { productId: '', cantidad: 1, codigoBarras: '', notas: '' };
  }

  createProduct() {
    if (!this.newProductForm.sku || !this.newProductForm.nombre) return;
    const newProduct: Product = {
      id: String(Date.now()),
      sku: this.newProductForm.sku,
      nombre: this.newProductForm.nombre,
      categoria: this.newProductForm.categoria || 'General',
      precioVenta: this.newProductForm.precioVenta,
      stock: this.newProductForm.stock,
      codigoBarras: this.newProductForm.codigoBarras
    };
    this.products.update(products => [newProduct, ...products]);
    this.showNotification(`Producto "${newProduct.nombre}" creado`, 'success');
    this.showNewProductModal = false;
    this.newProductForm = { sku: '', codigoBarras: '', nombre: '', precioVenta: 0, stock: 0, categoria: '' };
  }

  showNotification(message: string, type: 'success' | 'error') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => this.showToast = false, 3000);
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
  }
}
