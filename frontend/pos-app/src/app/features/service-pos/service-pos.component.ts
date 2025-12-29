import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { OfflineService, CachedProduct } from '@core/offline/offline.service';
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
}

interface OrderItem {
    product: Product;
    cantidad: number;
    notas?: string;
    subtotal: number;
}

interface TableOrder {
    id: string;
    mesa: string;
    ubicacion: string;
    items: OrderItem[];
    status: 'ABIERTA' | 'LISTA' | 'COBRADA';
    createdAt: Date;
    cliente?: string;
}

@Component({
    selector: 'app-service-pos',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
    <div class="service-pos">
      <!-- Header -->
      <header class="header">
        <div class="header-left">
          <a routerLink="/pos" class="back-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </a>
          <div class="title">
            <h1>🍽️ POS por Servicio</h1>
            <span class="subtitle">Gestión de mesas y pedidos</span>
          </div>
        </div>
        <div class="header-right">
          <button class="icon-btn" (click)="showSettings = true" title="Configuración">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
          </button>
        </div>
      </header>

      <div class="main-layout">
        <!-- Tables Panel -->
        <div class="tables-panel">
          <div class="panel-header">
            <h2>🪑 Mesas Activas</h2>
            <button class="add-table-btn" (click)="addNewTable()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>
              </svg>
              Nueva Mesa
            </button>
          </div>
          
          <div class="tables-grid">
            @for (order of activeOrders(); track order.id) {
              <div class="table-card" 
                   [class.selected]="selectedOrder()?.id === order.id"
                   [class.ready]="order.status === 'LISTA'"
                   (click)="selectOrder(order)">
                <div class="table-icon">🪑</div>
                <div class="table-info">
                  <span class="table-name">{{ order.mesa }}</span>
                  <span class="table-location">{{ order.ubicacion }}</span>
                </div>
                <div class="table-stats">
                  <span class="items-count">{{ order.items.length }} items</span>
                  <span class="table-total">{{ formatPrice(getOrderTotal(order)) }}</span>
                </div>
                <div class="status-badge" [class]="order.status.toLowerCase()">
                  {{ order.status }}
                </div>
              </div>
            } @empty {
              <div class="empty-tables">
                <div class="empty-icon">🍽️</div>
                <p>No hay mesas activas</p>
                <button (click)="addNewTable()">Abrir primera mesa</button>
              </div>
            }
          </div>
        </div>

        <!-- Products Panel -->
        <div class="products-panel">
          <div class="search-bar">
            <input type="text" [(ngModel)]="searchQuery" placeholder="🔍 Buscar producto..." />
          </div>
          
          <div class="categories-bar">
            <button class="cat-btn" [class.active]="selectedCategory === 'Todo'" (click)="selectedCategory = 'Todo'">
              🏷️ Todo
            </button>
            @for (cat of categories(); track cat) {
              <button class="cat-btn" [class.active]="selectedCategory === cat" (click)="selectedCategory = cat">
                {{ cat }}
              </button>
            }
          </div>

          <div class="products-grid">
            @for (product of filteredProducts(); track product.id) {
              <div class="product-card" 
                   [class.disabled]="product.stock <= 0"
                   (click)="addToOrder(product)">
                <div class="product-image">
                  @if (product.imagen) {
                    <img [src]="product.imagen" [alt]="product.nombre" />
                  } @else {
                    <span class="placeholder">🍞</span>
                  }
                  @if (product.stock <= 5 && product.stock > 0) {
                    <span class="stock-low">{{ product.stock }}</span>
                  }
                  @if (product.stock <= 0) {
                    <span class="out-of-stock">Agotado</span>
                  }
                </div>
                <div class="product-info">
                  <span class="name">{{ product.nombre }}</span>
                  <span class="price">{{ formatPrice(product.precioVenta) }}</span>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Order Panel -->
        <div class="order-panel" [class.has-order]="selectedOrder()">
          @if (selectedOrder(); as order) {
            <div class="order-header">
              <div class="order-title">
                <span class="mesa-name">{{ order.mesa }}</span>
                <span class="mesa-location">{{ order.ubicacion }}</span>
              </div>
              <button class="close-btn" (click)="selectedOrderId.set(null)">✕</button>
            </div>

            <div class="order-items">
              @for (item of order.items; track item.product.id) {
                <div class="order-item" [@itemAnimation]>
                  <div class="item-main">
                    <span class="item-name">{{ item.product.nombre }}</span>
                    <div class="item-qty">
                      <button class="qty-btn minus" (click)="updateItemQty(order, item, -1)">−</button>
                      <span class="qty-value">{{ item.cantidad }}</span>
                      <button class="qty-btn plus" (click)="updateItemQty(order, item, 1)">+</button>
                    </div>
                    <span class="item-subtotal">{{ formatPrice(item.subtotal) }}</span>
                  </div>
                  <input type="text" 
                         class="item-notes" 
                         [(ngModel)]="item.notas" 
                         placeholder="📝 Notas: sin sal, extra queso..."
                  />
                  <button class="remove-btn" (click)="removeItem(order, item)">🗑️</button>
                </div>
              } @empty {
                <div class="empty-order">
                  <span>📋</span>
                  <p>Agrega productos a la orden</p>
                </div>
              }
            </div>

            @if (order.items.length > 0) {
              <div class="order-summary">
                <div class="summary-row">
                  <span>Subtotal</span>
                  <span>{{ formatPrice(getOrderSubtotal(order)) }}</span>
                </div>
                <div class="summary-row">
                  <span>IVA (19%)</span>
                  <span>{{ formatPrice(getOrderTax(order)) }}</span>
                </div>
                <div class="summary-row total">
                  <span>Total</span>
                  <span>{{ formatPrice(getOrderTotal(order)) }}</span>
                </div>
              </div>

              <div class="order-actions">
                <button class="action-btn secondary" (click)="markAsReady(order)">
                  🍽️ Listo para Servir
                </button>
                <button class="action-btn primary" (click)="openCheckout(order)">
                  💳 Cobrar {{ formatPrice(getOrderTotal(order)) }}
                </button>
              </div>
            }
          } @else {
            <div class="no-order-selected">
              <div class="icon">👈</div>
              <p>Selecciona una mesa para ver su orden</p>
            </div>
          }
        </div>
      </div>

      <!-- New Table Modal -->
      @if (showNewTableModal) {
        <div class="modal-overlay" (click)="showNewTableModal = false">
          <div class="modal-content animated" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>🪑 Nueva Mesa</h2>
              <button class="close-modal" (click)="showNewTableModal = false">✕</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Mesa / Número</label>
                <div class="table-quick-select">
                  @for (n of [1,2,3,4,5,6,7,8,9,10]; track n) {
                    <button class="table-num" 
                            [class.selected]="newTableForm.mesa === 'Mesa ' + n"
                            (click)="newTableForm.mesa = 'Mesa ' + n">
                      {{ n }}
                    </button>
                  }
                </div>
                <input type="text" [(ngModel)]="newTableForm.mesa" placeholder="O escribe nombre personalizado..." />
              </div>
              <div class="form-group">
                <label>Ubicación</label>
                <div class="location-select">
                  @for (loc of locations; track loc) {
                    <button class="loc-btn" 
                            [class.selected]="newTableForm.ubicacion === loc"
                            (click)="newTableForm.ubicacion = loc">
                      {{ loc }}
                    </button>
                  }
                </div>
              </div>
              <div class="form-group">
                <label>Cliente (opcional)</label>
                <input type="text" [(ngModel)]="newTableForm.cliente" placeholder="Nombre del cliente..." />
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" (click)="showNewTableModal = false">Cancelar</button>
              <button class="btn-confirm" (click)="confirmNewTable()">✅ Crear Mesa</button>
            </div>
          </div>
        </div>
      }

      <!-- Checkout Modal -->
      @if (showCheckoutModal && checkoutOrder) {
        <div class="modal-overlay" (click)="showCheckoutModal = false">
          <div class="modal-content checkout-modal animated" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>💳 Cobrar {{ checkoutOrder.mesa }}</h2>
              <button class="close-modal" (click)="showCheckoutModal = false">✕</button>
            </div>
            
            <div class="checkout-total">
              <span class="label">Total a cobrar</span>
              <span class="amount">{{ formatPrice(getOrderTotal(checkoutOrder)) }}</span>
            </div>

            <div class="checkout-section">
              <label>Tipo de Documento</label>
              <div class="doc-types">
                <button class="doc-btn" [class.selected]="docType === 'BOLETA'" (click)="docType = 'BOLETA'">
                  <span class="icon">🧾</span>
                  <span>Boleta</span>
                </button>
                <button class="doc-btn" [class.selected]="docType === 'FACTURA'" (click)="docType = 'FACTURA'">
                  <span class="icon">📄</span>
                  <span>Factura</span>
                </button>
                <button class="doc-btn" [class.selected]="docType === 'SIN_DOC'" (click)="docType = 'SIN_DOC'">
                  <span class="icon">📋</span>
                  <span>Sin Doc.</span>
                </button>
              </div>
            </div>

            <div class="checkout-section">
              <label>Método de Pago</label>
              <div class="payment-methods">
                <button class="pay-btn" [class.selected]="paymentMethod === 'EFECTIVO'" (click)="paymentMethod = 'EFECTIVO'">
                  <span class="icon">💵</span>
                  <span>Efectivo</span>
                </button>
                <button class="pay-btn" [class.selected]="paymentMethod === 'DEBITO'" (click)="paymentMethod = 'DEBITO'">
                  <span class="icon">💳</span>
                  <span>Débito</span>
                </button>
                <button class="pay-btn" [class.selected]="paymentMethod === 'CREDITO'" (click)="paymentMethod = 'CREDITO'">
                  <span class="icon">💳</span>
                  <span>Crédito</span>
                </button>
                <button class="pay-btn" [class.selected]="paymentMethod === 'TRANSFERENCIA'" (click)="paymentMethod = 'TRANSFERENCIA'">
                  <span class="icon">🏦</span>
                  <span>Transfer.</span>
                </button>
              </div>
            </div>

            @if (paymentMethod === 'EFECTIVO') {
              <div class="checkout-section cash-section">
                <label>Monto Recibido</label>
                <input type="number" [(ngModel)]="cashReceived" class="cash-input" />
                @if (cashReceived >= getOrderTotal(checkoutOrder)) {
                  <div class="change-display">
                    <span>Vuelto:</span>
                    <span class="change-amount">{{ formatPrice(cashReceived - getOrderTotal(checkoutOrder)) }}</span>
                  </div>
                }
              </div>
            }

            <div class="modal-footer">
              <button class="btn-cancel" (click)="showCheckoutModal = false">Cancelar</button>
              <button class="btn-confirm large" (click)="confirmCheckout()">
                ✅ Confirmar Venta
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Settings Modal -->
      @if (showSettings) {
        <div class="modal-overlay" (click)="showSettings = false">
          <div class="modal-content animated" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>⚙️ Configuración</h2>
              <button class="close-modal" (click)="showSettings = false">✕</button>
            </div>
            <div class="modal-body">
              <div class="setting-item">
                <label>Ubicaciones disponibles</label>
                <div class="tags-input">
                  @for (loc of locations; track loc) {
                    <span class="tag">{{ loc }} <button (click)="removeLocation(loc)">✕</button></span>
                  }
                  <input type="text" [(ngModel)]="newLocation" 
                         placeholder="Nueva ubicación..." 
                         (keyup.enter)="addLocation()" />
                </div>
              </div>
              <div class="setting-item">
                <label>Número máximo de mesas</label>
                <input type="number" [(ngModel)]="maxTables" min="1" max="50" />
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-confirm" (click)="showSettings = false">Guardar</button>
            </div>
          </div>
        </div>
      }

      <!-- Toast -->
      @if (toast.show) {
        <div class="toast" [class]="toast.type">{{ toast.message }}</div>
      }
    </div>
  `,
    styles: [`
    .service-pos {
      min-height: 100vh;
      background: linear-gradient(135deg, #0a0a14 0%, #12121f 100%);
      color: white;
    }

    /* Header */
    .header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 1rem 1.5rem;
      background: rgba(255,255,255,0.03);
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .header-left { display: flex; align-items: center; gap: 1rem; }
    .back-btn {
      width: 44px; height: 44px; border-radius: 12px;
      background: rgba(255,255,255,0.08);
      display: flex; align-items: center; justify-content: center;
      color: white; text-decoration: none;
    }
    .back-btn svg { width: 20px; height: 20px; }
    .title h1 { margin: 0; font-size: 1.25rem; }
    .subtitle { color: rgba(255,255,255,0.5); font-size: 0.8rem; }
    .icon-btn {
      width: 44px; height: 44px; border-radius: 12px;
      background: rgba(255,255,255,0.08); border: none;
      color: white; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    }
    .icon-btn svg { width: 20px; height: 20px; }

    /* Main Layout */
    .main-layout {
      display: grid;
      grid-template-columns: 280px 1fr 380px;
      height: calc(100vh - 77px);
    }
    @media (max-width: 1200px) {
      .main-layout { grid-template-columns: 1fr; }
      .tables-panel, .order-panel { display: none; }
    }

    /* Tables Panel */
    .tables-panel {
      background: rgba(255,255,255,0.02);
      border-right: 1px solid rgba(255,255,255,0.08);
      padding: 1rem; overflow-y: auto;
    }
    .panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .panel-header h2 { margin: 0; font-size: 1rem; }
    .add-table-btn {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.5rem 1rem; border-radius: 10px;
      background: linear-gradient(135deg, #10B981, #059669);
      border: none; color: white; cursor: pointer; font-size: 0.8rem;
    }
    .add-table-btn svg { width: 16px; height: 16px; }

    .tables-grid { display: flex; flex-direction: column; gap: 0.75rem; }
    .table-card {
      background: rgba(255,255,255,0.05);
      border-radius: 12px; padding: 1rem;
      cursor: pointer; transition: all 0.2s;
      border: 2px solid transparent;
      display: grid; grid-template-columns: auto 1fr auto;
      gap: 0.75rem; align-items: center;
    }
    .table-card:hover { background: rgba(255,255,255,0.08); }
    .table-card.selected { border-color: #6366F1; background: rgba(99,102,241,0.1); }
    .table-card.ready { border-color: #10B981; }
    .table-icon { font-size: 1.5rem; }
    .table-name { font-weight: 600; display: block; }
    .table-location { font-size: 0.75rem; color: rgba(255,255,255,0.5); }
    .items-count { font-size: 0.75rem; color: rgba(255,255,255,0.5); display: block; }
    .table-total { font-weight: 700; color: #10B981; font-size: 0.9rem; }
    .status-badge {
      grid-column: span 3; text-align: center;
      padding: 0.25rem 0.75rem; border-radius: 20px;
      font-size: 0.7rem; font-weight: 600;
    }
    .status-badge.abierta { background: rgba(99,102,241,0.2); color: #818CF8; }
    .status-badge.lista { background: rgba(16,185,129,0.2); color: #34D399; }

    .empty-tables { text-align: center; padding: 2rem; color: rgba(255,255,255,0.5); }
    .empty-tables .empty-icon { font-size: 3rem; margin-bottom: 1rem; }
    .empty-tables button {
      margin-top: 1rem; padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      border: none; border-radius: 10px; color: white; cursor: pointer;
    }

    /* Products Panel */
    .products-panel { padding: 1rem; overflow-y: auto; }
    .search-bar input {
      width: 100%; padding: 0.875rem 1rem;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px; color: white; font-size: 1rem;
    }
    .categories-bar {
      display: flex; gap: 0.5rem; overflow-x: auto;
      padding: 1rem 0; scrollbar-width: none;
    }
    .cat-btn {
      padding: 0.5rem 1rem; border-radius: 20px;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.1);
      color: white; cursor: pointer; white-space: nowrap;
    }
    .cat-btn.active { background: rgba(99,102,241,0.3); border-color: #6366F1; }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 1rem;
    }
    .product-card {
      background: rgba(255,255,255,0.05);
      border-radius: 12px; cursor: pointer;
      transition: all 0.2s; overflow: hidden;
    }
    .product-card:hover { transform: translateY(-2px); background: rgba(255,255,255,0.1); }
    .product-card.disabled { opacity: 0.5; pointer-events: none; }
    .product-image {
      height: 100px; background: rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
      position: relative;
    }
    .product-image img { width: 100%; height: 100%; object-fit: cover; }
    .product-image .placeholder { font-size: 2.5rem; }
    .stock-low {
      position: absolute; top: 6px; right: 6px;
      background: #F59E0B; padding: 0.125rem 0.5rem;
      border-radius: 4px; font-size: 0.7rem; font-weight: 600;
    }
    .out-of-stock {
      position: absolute; inset: 0;
      background: rgba(0,0,0,0.7);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem; font-weight: 600; color: #EF4444;
    }
    .product-info { padding: 0.75rem; }
    .product-info .name { display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 0.25rem; }
    .product-info .price { color: #10B981; font-weight: 700; }

    /* Order Panel */
    .order-panel {
      background: rgba(255,255,255,0.03);
      border-left: 1px solid rgba(255,255,255,0.08);
      display: flex; flex-direction: column;
    }
    .order-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .mesa-name { font-size: 1.25rem; font-weight: 700; }
    .mesa-location { display: block; font-size: 0.8rem; color: rgba(255,255,255,0.5); }
    .close-btn {
      width: 32px; height: 32px; border-radius: 8px;
      background: rgba(255,255,255,0.1); border: none;
      color: white; cursor: pointer;
    }

    .order-items { flex: 1; overflow-y: auto; padding: 1rem; }
    .order-item {
      background: rgba(255,255,255,0.05);
      border-radius: 12px; padding: 1rem;
      margin-bottom: 0.75rem; position: relative;
    }
    .item-main { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .item-name { font-weight: 500; flex: 1; }
    .item-qty { display: flex; align-items: center; gap: 0.5rem; }
    .qty-btn {
      width: 28px; height: 28px; border-radius: 6px;
      border: none; cursor: pointer; font-size: 1rem;
    }
    .qty-btn.minus { background: rgba(239,68,68,0.2); color: #EF4444; }
    .qty-btn.plus { background: rgba(16,185,129,0.2); color: #10B981; }
    .qty-value { min-width: 24px; text-align: center; font-weight: 600; }
    .item-subtotal { font-weight: 700; color: #10B981; margin-left: 1rem; }
    .item-notes {
      width: 100%; padding: 0.5rem;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 6px; color: white; font-size: 0.8rem;
    }
    .remove-btn {
      position: absolute; top: 0.5rem; right: 0.5rem;
      background: none; border: none; cursor: pointer;
      font-size: 0.9rem; opacity: 0.5;
    }
    .remove-btn:hover { opacity: 1; }

    .empty-order { text-align: center; padding: 3rem; color: rgba(255,255,255,0.4); }
    .empty-order span { font-size: 3rem; }

    .order-summary {
      background: rgba(0,0,0,0.3);
      padding: 1rem 1.25rem;
      border-top: 1px solid rgba(255,255,255,0.08);
    }
    .summary-row { display: flex; justify-content: space-between; padding: 0.375rem 0; }
    .summary-row.total { font-size: 1.25rem; font-weight: 700; color: #10B981; padding-top: 0.75rem; margin-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.1); }

    .order-actions { display: flex; gap: 0.75rem; padding: 1rem 1.25rem; }
    .action-btn {
      flex: 1; padding: 0.875rem; border-radius: 12px;
      border: none; cursor: pointer; font-weight: 600;
      display: flex; align-items: center; justify-content: center; gap: 0.5rem;
    }
    .action-btn.secondary { background: rgba(255,255,255,0.1); color: white; }
    .action-btn.primary { background: linear-gradient(135deg, #10B981, #059669); color: white; }

    .no-order-selected { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: rgba(255,255,255,0.4); }
    .no-order-selected .icon { font-size: 4rem; margin-bottom: 1rem; }

    /* Modals */
    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.85);
      backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; padding: 1rem;
    }
    .modal-content {
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      border-radius: 20px; width: 100%; max-width: 480px;
      border: 1px solid rgba(255,255,255,0.1);
      box-shadow: 0 25px 50px rgba(0,0,0,0.5);
    }
    .modal-content.animated {
      animation: modalIn 0.3s ease;
    }
    @keyframes modalIn {
      from { transform: scale(0.9); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .modal-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .modal-header h2 { margin: 0; font-size: 1.1rem; }
    .close-modal {
      width: 32px; height: 32px; border-radius: 8px;
      background: rgba(255,255,255,0.1); border: none;
      color: white; cursor: pointer; font-size: 1rem;
    }
    .modal-body { padding: 1.5rem; }
    .modal-footer {
      display: flex; gap: 1rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid rgba(255,255,255,0.1);
    }
    .btn-cancel {
      flex: 1; padding: 0.875rem; border-radius: 12px;
      background: rgba(255,255,255,0.1); border: none;
      color: white; cursor: pointer; font-weight: 600;
    }
    .btn-confirm {
      flex: 1; padding: 0.875rem; border-radius: 12px;
      background: linear-gradient(135deg, #10B981, #059669); border: none;
      color: white; cursor: pointer; font-weight: 600;
    }
    .btn-confirm.large { padding: 1rem; font-size: 1rem; }

    .form-group { margin-bottom: 1.25rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-size: 0.9rem; color: rgba(255,255,255,0.7); }
    .form-group input {
      width: 100%; padding: 0.75rem 1rem;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 10px; color: white;
    }
    .table-quick-select {
      display: grid; grid-template-columns: repeat(5, 1fr);
      gap: 0.5rem; margin-bottom: 0.75rem;
    }
    .table-num {
      padding: 0.75rem; border-radius: 10px;
      background: rgba(255,255,255,0.08);
      border: 2px solid transparent;
      color: white; cursor: pointer; font-weight: 600;
    }
    .table-num.selected { border-color: #6366F1; background: rgba(99,102,241,0.2); }
    .location-select { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .loc-btn {
      padding: 0.5rem 1rem; border-radius: 20px;
      background: rgba(255,255,255,0.08);
      border: 2px solid transparent;
      color: white; cursor: pointer;
    }
    .loc-btn.selected { border-color: #10B981; background: rgba(16,185,129,0.2); }

    /* Checkout Modal */
    .checkout-modal { max-width: 420px; }
    .checkout-total {
      text-align: center; padding: 2rem;
      background: linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,95,70,0.1));
    }
    .checkout-total .label { display: block; color: rgba(255,255,255,0.6); margin-bottom: 0.5rem; }
    .checkout-total .amount { font-size: 3rem; font-weight: 700; color: #10B981; }

    .checkout-section { padding: 1rem 1.5rem; }
    .checkout-section label { display: block; margin-bottom: 0.75rem; font-size: 0.85rem; color: rgba(255,255,255,0.6); }
    .doc-types, .payment-methods { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
    .payment-methods { grid-template-columns: repeat(2, 1fr); }
    .doc-btn, .pay-btn {
      display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
      padding: 1rem; border-radius: 12px;
      background: rgba(255,255,255,0.05);
      border: 2px solid rgba(255,255,255,0.1);
      color: white; cursor: pointer;
    }
    .doc-btn .icon, .pay-btn .icon { font-size: 1.5rem; }
    .doc-btn.selected, .pay-btn.selected {
      border-color: #10B981; background: rgba(16,185,129,0.15);
    }

    .cash-section input {
      width: 100%; padding: 1rem; font-size: 1.5rem;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 12px; color: white; text-align: center;
    }
    .change-display {
      display: flex; justify-content: space-between;
      margin-top: 1rem; padding: 1rem;
      background: rgba(16,185,129,0.1);
      border-radius: 10px;
    }
    .change-amount { font-weight: 700; color: #10B981; font-size: 1.25rem; }

    /* Settings */
    .setting-item { margin-bottom: 1.5rem; }
    .tags-input { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .tag {
      display: flex; align-items: center; gap: 0.25rem;
      padding: 0.25rem 0.5rem 0.25rem 0.75rem;
      background: rgba(99,102,241,0.2);
      border-radius: 20px; font-size: 0.85rem;
    }
    .tag button { background: none; border: none; color: white; cursor: pointer; }
    .tags-input input {
      flex: 1; min-width: 120px; padding: 0.5rem;
      background: transparent; border: 1px dashed rgba(255,255,255,0.2);
      border-radius: 10px; color: white;
    }

    /* Toast */
    .toast {
      position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%);
      padding: 1rem 2rem; border-radius: 12px;
      background: #10B981; color: white; font-weight: 600;
      animation: toastIn 0.3s ease; z-index: 2000;
    }
    .toast.error { background: #EF4444; }
    @keyframes toastIn {
      from { transform: translateX(-50%) translateY(20px); opacity: 0; }
      to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
  `]
})
export class ServicePosComponent implements OnInit {
    private http = inject(HttpClient);
    private offlineService = inject(OfflineService);
    private stockService = inject(StockService);
    private authService = inject(AuthService);

    // UI State
    searchQuery = '';
    selectedCategory = 'Todo';
    showNewTableModal = false;
    showCheckoutModal = false;
    showSettings = false;

    // Data
    products = signal<Product[]>([]);
    orders = signal<TableOrder[]>([]);
    selectedOrderId = signal<string | null>(null);

    // Forms
    newTableForm = { mesa: '', ubicacion: 'Interior', cliente: '' };
    locations = ['Interior', 'Terraza', 'Barra', 'VIP', 'Delivery'];
    maxTables = 20;
    newLocation = '';

    // Checkout
    checkoutOrder: TableOrder | null = null;
    docType: 'BOLETA' | 'FACTURA' | 'SIN_DOC' = 'BOLETA';
    paymentMethod: 'EFECTIVO' | 'DEBITO' | 'CREDITO' | 'TRANSFERENCIA' = 'EFECTIVO';
    cashReceived = 0;

    toast = { show: false, message: '', type: 'success' as 'success' | 'error' };

    // Computed
    selectedOrder = computed(() => {
        const id = this.selectedOrderId();
        return id ? this.orders().find(o => o.id === id) : null;
    });

    activeOrders = computed(() => this.orders().filter(o => o.status !== 'COBRADA'));

    categories = computed(() => {
        const cats = new Set(this.products().map(p => p.categoria));
        return Array.from(cats);
    });

    filteredProducts = computed(() => {
        let list = this.products();
        if (this.selectedCategory !== 'Todo') {
            list = list.filter(p => p.categoria === this.selectedCategory);
        }
        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase();
            list = list.filter(p => p.nombre.toLowerCase().includes(q));
        }
        return list;
    });

    ngOnInit() {
        this.loadProducts();
        this.loadOrders();
    }

    async loadProducts() {
        try {
            const cached = await this.offlineService.getCachedProducts();
            if (cached.length > 0) {
                const mapped = cached.map(p => this.mapProduct(p));
                this.products.set(mapped);
                await this.loadStock();
            }
        } catch (e) {
            console.error('Error loading products:', e);
        }
    }

    private mapProduct(p: CachedProduct): Product {
        const v = p.variants?.[0];
        return {
            id: p.id, sku: p.sku, nombre: p.nombre,
            categoria: p.categoryName || 'General',
            precioVenta: v?.precioNeto || 0,
            stock: 0, imagen: p.imagenUrl
        };
    }

    async loadStock() {
        const demoStock: Record<string, number> = {
            'PAN-001': 25, 'PAN-002': 0, 'PAN-003': 12, 'PAN-004': 8,
            'PAN-005': 0, 'PAN-006': 45, 'PAN-007': 3, 'PAN-008': 15,
            'PAS-001': 0, 'PAS-002': 7, 'PAS-003': 20, 'PAS-004': 0,
            'BEB-001': 30, 'BEB-002': 0, 'BEB-003': 50
        };
        const updated = this.products().map(p => ({
            ...p, stock: demoStock[p.sku] ?? Math.floor(Math.random() * 20)
        }));
        this.products.set(updated);
    }

    loadOrders() {
        const stored = localStorage.getItem('service_pos_orders');
        if (stored) {
            this.orders.set(JSON.parse(stored));
        }
    }

    saveOrders() {
        localStorage.setItem('service_pos_orders', JSON.stringify(this.orders()));
    }

    addNewTable() {
        this.newTableForm = { mesa: '', ubicacion: 'Interior', cliente: '' };
        this.showNewTableModal = true;
    }

    confirmNewTable() {
        if (!this.newTableForm.mesa) {
            this.showToast('Ingresa un nombre de mesa', 'error');
            return;
        }
        const newOrder: TableOrder = {
            id: crypto.randomUUID(),
            mesa: this.newTableForm.mesa,
            ubicacion: this.newTableForm.ubicacion,
            cliente: this.newTableForm.cliente,
            items: [],
            status: 'ABIERTA',
            createdAt: new Date()
        };
        this.orders.update(o => [...o, newOrder]);
        this.saveOrders();
        this.selectedOrderId.set(newOrder.id);
        this.showNewTableModal = false;
        this.showToast(`${newOrder.mesa} creada`, 'success');
    }

    selectOrder(order: TableOrder) {
        this.selectedOrderId.set(order.id);
    }

    addToOrder(product: Product) {
        const order = this.selectedOrder();
        if (!order) {
            this.showToast('Selecciona una mesa primero', 'error');
            return;
        }
        if (product.stock <= 0) {
            this.showToast('Producto sin stock', 'error');
            return;
        }

        const existing = order.items.find(i => i.product.id === product.id);
        if (existing) {
            if (existing.cantidad >= product.stock) {
                this.showToast(`Solo hay ${product.stock} unidades`, 'error');
                return;
            }
            existing.cantidad++;
            existing.subtotal = existing.cantidad * existing.product.precioVenta;
        } else {
            order.items.push({
                product, cantidad: 1, subtotal: product.precioVenta
            });
        }
        this.orders.set([...this.orders()]);
        this.saveOrders();
    }

    updateItemQty(order: TableOrder, item: OrderItem, delta: number) {
        item.cantidad = Math.max(1, item.cantidad + delta);
        if (delta > 0 && item.cantidad > item.product.stock) {
            item.cantidad = item.product.stock;
            this.showToast(`Stock máximo: ${item.product.stock}`, 'error');
        }
        item.subtotal = item.cantidad * item.product.precioVenta;
        this.orders.set([...this.orders()]);
        this.saveOrders();
    }

    removeItem(order: TableOrder, item: OrderItem) {
        order.items = order.items.filter(i => i.product.id !== item.product.id);
        this.orders.set([...this.orders()]);
        this.saveOrders();
    }

    getOrderSubtotal(order: TableOrder): number {
        return order.items.reduce((sum, i) => sum + i.subtotal, 0);
    }

    getOrderTax(order: TableOrder): number {
        return this.getOrderSubtotal(order) * 0.19;
    }

    getOrderTotal(order: TableOrder): number {
        return this.getOrderSubtotal(order) + this.getOrderTax(order);
    }

    markAsReady(order: TableOrder) {
        order.status = 'LISTA';
        this.orders.set([...this.orders()]);
        this.saveOrders();
        this.showToast(`${order.mesa} lista para servir`, 'success');
    }

    openCheckout(order: TableOrder) {
        this.checkoutOrder = order;
        this.cashReceived = 0;
        this.showCheckoutModal = true;
    }

    confirmCheckout() {
        if (!this.checkoutOrder) return;

        if (this.paymentMethod === 'EFECTIVO' && this.cashReceived < this.getOrderTotal(this.checkoutOrder)) {
            this.showToast('Monto insuficiente', 'error');
            return;
        }

        this.checkoutOrder.status = 'COBRADA';
        this.orders.set([...this.orders()]);
        this.saveOrders();
        this.showCheckoutModal = false;
        this.selectedOrderId.set(null);
        this.showToast(`Venta confirmada: ${this.formatPrice(this.getOrderTotal(this.checkoutOrder))}`, 'success');
        this.checkoutOrder = null;
    }

    addLocation() {
        if (this.newLocation && !this.locations.includes(this.newLocation)) {
            this.locations.push(this.newLocation);
            this.newLocation = '';
        }
    }

    removeLocation(loc: string) {
        this.locations = this.locations.filter(l => l !== loc);
    }

    showToast(message: string, type: 'success' | 'error') {
        this.toast = { show: true, message, type };
        setTimeout(() => this.toast.show = false, 3000);
    }

    formatPrice(value: number): string {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
    }
}
