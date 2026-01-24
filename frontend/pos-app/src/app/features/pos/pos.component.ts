import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { BadgeModule } from 'primeng/badge';
import { InputNumberModule } from 'primeng/inputnumber';

import { AuthService } from '@core/auth/auth.service';
import { OfflineService, CachedProduct, CachedVariant } from '@core/offline/offline.service';
import { IndustryMockDataService } from '@core/services/industry-mock.service';
import { DemoDataService } from '@core/services/demo-data.service';
import { FacturacionService } from '../facturacion/services/facturacion.service';
import { SalesEventService } from '@core/services/sales-event.service';
import { StockService } from '@core/services/stock.service';
import { BarcodeService } from '@core/services/barcode.service';
import { environment } from '@env/environment';
import { BranchSwitcherComponent } from '@shared/components/branch-switcher/branch-switcher.component';
import { BottomNavComponent, NavItem } from '@shared/components/bottom-nav/bottom-nav.component';

interface CartItem {
  variantId: string;
  productSku: string;
  productNombre: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  impuestoPorcentaje: number;
  subtotal: number;
  isAdding?: boolean;
}

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    DialogModule,
    ToastModule,
    BadgeModule,
    InputNumberModule,
    BranchSwitcherComponent,
    BottomNavComponent
  ],
  providers: [MessageService],
  template: `
    <div class="pos-container">
      <!-- Header -->
      <header class="pos-header">
        <div class="header-left">
          @if (tenantLogo()) {
            <img [src]="tenantLogo()" alt="Logo" class="tenant-logo" />
          } @else {
            <span class="logo-emoji">{{ industryConfig().icon }}</span>
          }
          <span class="tenant-name">{{ tenantName() }}</span>
          <app-branch-switcher class="ml-4"></app-branch-switcher>
        </div>
        <div class="header-right">
          <!-- WhatsApp Notifications -->
          @if (whatsappNotifications() > 0) {
            <button class="notification-badge whatsapp" routerLink="/whatsapp" title="Mensajes de WhatsApp">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
              </svg>
              <span class="badge-count">{{ whatsappNotifications() }}</span>
            </button>
          }

          <!-- Reservations -->
          @if (reservationsToday() > 0) {
            <button class="notification-badge reservations" routerLink="/reservations" title="Reservas para hoy">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span class="badge-count">{{ reservationsToday() }}</span>
            </button>
          }

          <!-- KDS Orders -->
          @if (kdsOrders() > 0) {
            <button class="notification-badge kds" routerLink="/kds" title="Pedidos en cocina">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              <span class="badge-count">{{ kdsOrders() }}</span>
            </button>
          }

          <!-- Document Expiry Alert -->
          @if (expiringDocs().length > 0) {
            <button class="alert-badge" [class.urgent]="hasUrgentDocs()" (click)="showDocsModal = true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              {{ expiringDocs().length }}
            </button>
          }
          
          <!-- Pending Sales -->
          @if (pendingCount() > 0) {
            <button class="badge badge-warning" (click)="showPendingModal = true">
              {{ pendingCount() }} pendientes
            </button>
          }
          
          <!-- Sync Button -->
          <button class="btn btn-primary" (click)="syncProducts()" title="Sincronizar catálogo">
            <i class="pi pi-refresh"></i>
            <span class="btn-text">Sincronizar</span>
          </button>
          
          <button class="btn btn-outline" (click)="showMenu = true">
            <i class="pi pi-bars"></i>
          </button>
        </div>
      </header>


      <!-- Main Content -->
      <div class="pos-main">
        <!-- Products Grid -->
        <section class="products-section">
          <!-- Sticky Filters Container -->
          <div class="sticky-filters">
            <!-- Search -->
            <div class="search-container">
              <span class="search-icon">🔍</span>
              <input 
                type="text" 
                [(ngModel)]="searchQuery"
                placeholder="Buscar producto o escanear código..."
                (keyup.enter)="onSearch()"
                class="search-input w-full"
              />
              @if (searchQuery) {
                <button class="search-clear" (click)="searchQuery = ''">✕</button>
              }
            </div>

            <!-- Filters and Actions Row -->
            <div class="filters-actions-row">
              <!-- Category Pills -->
              <div class="category-pills-wrapper">
                <div class="category-pills">
                  <button 
                    class="category-pill"
                    [class.active]="!selectedCategory()"
                    (click)="selectCategory(null)"
                  >
                    <span class="pill-icon">📦</span>
                    Todo
                    <span class="pill-count">{{ products().length }}</span>
                  </button>
                  @for (category of categories(); track category.id) {
                    <button 
                      class="category-pill"
                      [class.active]="selectedCategory() === category.id"
                      (click)="selectCategory(category.id)"
                    >
                      <span class="pill-icon">{{ getCategoryIcon(category.nombre) }}</span>
                      {{ category.nombre }}
                      <span class="pill-count">{{ getCategoryCount(category.id) }}</span>
                    </button>
                  }
                </div>
              </div>
            </div>
          </div>

          <!-- Favoritos / Popular Section -->
          @if (popularProducts().length > 0 && !searchQuery) {
            <div class="favorites-section">
              <div class="section-header">
                <span class="section-title-small">⭐ Más Vendidos</span>
              </div>
              <div class="favorites-scroll">
                @for (product of popularProducts(); track product.id) {
                  <div class="favorite-chip" (click)="addToCart(product)">
                    <span class="fav-name">{{ product.nombre }}</span>
                    <span class="fav-price">{{ formatPrice(product.variants[0]?.precioBruto || 0) }}</span>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Products Grid with Cards -->
          <div class="pos-grid">
            @if (isLoading()) {
              <!-- Skeleton Loading -->
              @for (i of [1,2,3,4,5,6]; track i) {
                <div class="product-card skeleton">
                  <div class="product-image skeleton-card"></div>
                  <div class="product-info">
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text" style="width: 60%"></div>
                  </div>
                </div>
              }
            } @else {
              @for (product of filteredProducts(); track product.id) {
                <div 
                  class="product-card fade-in-up"
                  [class.out-of-stock]="(product.variants[0]?.stock ?? 0) <= 0"
                  (click)="addToCart(product)"
                  [style.animation-delay]="$index * 0.05 + 's'"
                >
                  <div class="product-image">
                    @if (product.imagenUrl) {
                      <img [src]="product.imagenUrl" [alt]="product.nombre" loading="lazy" />
                    } @else {
                      <span>{{ getCategoryIcon(product.categoryName || 'Otro') }}</span>
                    }
                    <!-- Stock Badge -->
                    @if ((product.variants[0]?.stock ?? 0) > 0) {
                      <span class="stock-badge">{{ product.variants[0]?.stock }}</span>
                    } @else {
                      <span class="stock-badge out">0</span>
                    }
                  </div>
                  <div class="product-info">
                    <div class="product-name">{{ product.nombre }}</div>
                    <div class="product-category">{{ product.categoryName || 'Sin categoría' }}</div>
                    <div class="product-price">{{ formatPrice(product.variants[0]?.precioBruto || 0) }}</div>
                  </div>
                </div>
              }
            }
            
            @if (!isLoading() && filteredProducts().length === 0) {
              <div class="empty-state">
                <div style="font-size: 4rem; margin-bottom: 1rem;">📦</div>
                <p style="font-size: 1.25rem; margin-bottom: 0.5rem;">Sin productos</p>
                <p class="text-muted" style="margin-bottom: 1.5rem;">No hay productos que coincidan con tu búsqueda</p>
                <button class="btn btn-primary" (click)="syncProducts()">
                  <span>🔄</span> Sincronizar catálogo
                </button>
              </div>
            }
          </div>

          <!-- Floating Action Button (FAB) with Quick Actions - Desktop Only -->
          <div class="fab-container desktop-only" [class.fab-open]="fabOpen">
            <!-- Sub Actions (expand from main FAB) -->
            @if (fabOpen) {
              <div class="fab-submenu">
                <button class="fab-action" (click)="openWeightInput(); fabOpen = false" title="Pesar">
                  <span class="fab-icon">⚖️</span>
                  <span class="fab-label">Pesar</span>
                </button>
                <button class="fab-action" (click)="openSpecialOrder(); fabOpen = false" title="Pedido">
                  <span class="fab-icon">📦</span>
                  <span class="fab-label">Pedido</span>
                </button>
                <button class="fab-action" (click)="applyPromotion(); fabOpen = false" title="Promoción">
                  <span class="fab-icon">🎁</span>
                  <span class="fab-label">Promo</span>
                </button>
                <button class="fab-action" (click)="openClientSearch(); fabOpen = false" title="Cliente">
                  <span class="fab-icon">👤</span>
                  <span class="fab-label">Cliente</span>
                </button>
                <button class="fab-action" (click)="savePending(); fabOpen = false" title="Guardar">
                  <span class="fab-icon">💾</span>
                  <span class="fab-label">Guardar</span>
                </button>
              </div>
            }
            
            <!-- Main FAB Button -->
            <button class="fab-main" (click)="fabOpen = !fabOpen" [class.active]="fabOpen">
              @if (fabOpen) {
                <span class="fab-main-icon">✕</span>
              } @else {
                <span class="fab-main-icon">⚡</span>
              }
            </button>
          </div>
        </section>

        <!-- Cart Section - Desktop Only -->
        <section class="cart-section desktop-only">
          <div class="cart-header">
            <h2>Carrito</h2>
            @if (cartItems().length > 0) {
              <button class="btn btn-outline" (click)="clearCart()">
                <i class="pi pi-trash"></i>
              </button>
            }
          </div>

          <!-- Cart Items -->
          <div class="cart-items">
            @for (item of cartItems(); track item.variantId; let i = $index) {
              <div class="cart-item" 
                   [class.adding]="item.isAdding"
                   (animationend)="onItemAnimationEnd(item)">
                <div class="item-info">
                  <span class="item-name">{{ item.productNombre }}</span>
                  <span class="item-price text-muted">{{ formatPrice(item.precioUnitario) }} c/u</span>
                </div>
                <div class="item-actions">
                  <button class="qty-btn minus" (click)="updateQuantity(i, -1)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                      <path d="M5 12h14"/>
                    </svg>
                  </button>
                  <span class="qty-value">{{ item.cantidad }}</span>
                  <button class="qty-btn plus" (click)="updateQuantity(i, 1)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                  </button>
                </div>
                <div class="item-subtotal-container">
                  <span class="item-subtotal">{{ formatPrice(item.subtotal) }}</span>
                  <button class="btn-delete" (click)="removeItem(i)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            }
            
            @if (cartItems().length === 0) {
              <div class="empty-cart">
                <div class="empty-cart-icon">🛒</div>
                <p class="text-muted">Selecciona productos para agregar</p>
                <span class="empty-hint">Toca un producto de la izquierda</span>
              </div>
            }
          </div>

          <!-- Cart Summary -->
          @if (cartItems().length > 0) {
            <div class="cart-summary">
              <div class="summary-row">
                <span>Subtotal</span>
                <span>{{ formatPrice(subtotal()) }}</span>
              </div>
              <div class="summary-row">
                <span>IVA (19%)</span>
                <span>{{ formatPrice(taxTotal()) }}</span>
              </div>
              <div class="summary-row total">
                <span>Total</span>
                <span>{{ formatPrice(total()) }}</span>
              </div>
            </div>

            <!-- Checkout Button -->
            <button 
              class="btn btn-success btn-lg btn-block"
              (click)="openCheckoutWithBarcodes()"
            >
              <i class="pi pi-check"></i>
              Cobrar {{ formatPrice(total()) }}
            </button>
          }
        </section>
      </div>

      <!-- Premium Payment Dialog -->
      <p-dialog 
        [(visible)]="showPaymentDialog" 
        header="Cobrar Venta"
        [modal]="true"
        [style]="{width: '95vw', maxWidth: '1400px', height: '90vh'}"
        [closable]="true"
        styleClass="premium-checkout-dialog"
      >
        <div class="premium-checkout-container">
          <!-- LEFT: Order Summary (30%) -->
          <section class="order-summary-section">
            <h3 class="section-title">Resumen del Pedido</h3>
            
            <div class="cart-items-preview">
              @for (item of cartItems(); track item.variantId) {
                <div class="cart-item-mini">
                  <div class="item-thumbnail">
                    <span class="default-icon">🛒</span>
                  </div>
                  <div class="item-details">
                    <span class="item-name">{{ item.productNombre }}</span>
                    <span class="item-qty">x{{ item.cantidad }}</span>
                  </div>
                  <span class="item-price">{{ formatPrice(item.precioUnitario * item.cantidad) }}</span>
                </div>
              }
            </div>

            <div class="order-totals">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>{{ formatPrice(subtotalCheckout()) }}</span>
              </div>
              <div class="total-row">
                <span>IVA (19%):</span>
                <span>{{ formatPrice(taxCheckout()) }}</span>
              </div>
              <div class="total-row final-total">
                <span>TOTAL:</span>
                <span class="total-amount-gradient">{{ formatPrice(total()) }}</span>
              </div>
            </div>

            <div class="customer-input-section">
              <label class="input-label">
                <i class="pi pi-user"></i>
                Cliente (opcional)
              </label>
              <input 
                type="text" 
                [(ngModel)]="customerName"
                placeholder="Nombre del cliente"
                class="premium-input">
            </div>
          </section>

          <!-- CENTER: Payment Flow (40%) -->
          <section class="payment-flow-section">
            <!-- Document Type Selection -->
            <div class="document-type-selector">
              <h3 class="section-title">Tipo de Documento</h3>
              <div class="doc-type-pills">
                <button 
                  class="doc-pill"
                  [class.active]="tipoDocumento === 'BOLETA'"
                  (click)="tipoDocumento = 'BOLETA'">
                  <span class="pill-icon">🧾</span>
                  <span class="pill-text">Boleta</span>
                </button>
                <button 
                  class="doc-pill"
                  [class.active]="tipoDocumento === 'FACTURA'"
                  (click)="tipoDocumento = 'FACTURA'">
                  <span class="pill-icon">📄</span>
                  <span class="pill-text">Factura</span>
                </button>
                <button 
                  class="doc-pill"
                  [class.active]="tipoDocumento === 'SIN_DOCUMENTO'"
                  (click)="tipoDocumento = 'SIN_DOCUMENTO'">
                  <span class="pill-icon">📋</span>
                  <span class="pill-text">Sin Doc.</span>
                </button>
              </div>
            </div>

            <!-- Client Data (only for Factura) -->
            @if (tipoDocumento === 'FACTURA') {
              <div class="client-data-form fade-in-up">
                <h4 class="form-subtitle">Datos del Cliente</h4>
                <div class="form-grid">
                  <input 
                    type="text" 
                    [(ngModel)]="clienteRut"
                    placeholder="RUT (ej: 12.345.678-9)"
                    class="premium-input"
                    (blur)="formatClienteRut()">
                  <input 
                    type="text" 
                    [(ngModel)]="clienteRazonSocial"
                    placeholder="Razón Social"
                    class="premium-input">
                  <input 
                    type="text" 
                    [(ngModel)]="clienteGiro"
                    placeholder="Giro comercial"
                    class="premium-input">
                  <input 
                    type="email" 
                    [(ngModel)]="clienteEmail"
                    placeholder="Email (opcional)"
                    class="premium-input">
                </div>
              </div>
            }

            <!-- Payment Methods -->
            <div class="payment-methods-selector">
              <h3 class="section-title">Método de Pago</h3>
              <div class="payment-cards-grid">
                <button 
                  class="payment-card efectivo"
                  [class.selected]="selectedPaymentMethod === 'EFECTIVO'"
                  (click)="selectedPaymentMethod = 'EFECTIVO'">
                  <div class="card-icon">💵</div>
                  <div class="card-label">Efectivo</div>
                  @if (selectedPaymentMethod === 'EFECTIVO') {
                    <div class="check-mark">✓</div>
                  }
                </button>
                
                <button 
                  class="payment-card debito"
                  [class.selected]="selectedPaymentMethod === 'DEBITO'"
                  (click)="selectedPaymentMethod = 'DEBITO'">
                  <div class="card-icon">💳</div>
                  <div class="card-label">Tarjeta Débito</div>
                  @if (selectedPaymentMethod === 'DEBITO') {
                    <div class="check-mark">✓</div>
                  }
                </button>
                
                <button 
                  class="payment-card credito"
                  [class.selected]="selectedPaymentMethod === 'CREDITO'"
                  (click)="selectedPaymentMethod = 'CREDITO'">
                  <div class="card-icon">💳</div>
                  <div class="card-label">Tarjeta Crédito</div>
                  @if (selectedPaymentMethod === 'CREDITO') {
                    <div class="check-mark">✓</div>
                  }
                </button>
                
                <button 
                  class="payment-card transferencia"
                  [class.selected]="selectedPaymentMethod === 'TRANSFERENCIA'"
                  (click)="selectedPaymentMethod = 'TRANSFERENCIA'">
                  <div class="card-icon">🏦</div>
                  <div class="card-label">Transferencia</div>
                  @if (selectedPaymentMethod === 'TRANSFERENCIA') {
                    <div class="check-mark">✓</div>
                  }
                </button>
              </div>
            </div>

            <!-- Cash Input & Quick Amounts -->
            @if (selectedPaymentMethod === 'EFECTIVO') {
              <div class="cash-section fade-in-up">
                <label class="section-title">Monto Recibido</label>
                <div class="amount-input-wrapper">
                  <span class="currency-symbol">$</span>
                  <input 
                    type="number" 
                    [(ngModel)]="cashReceived"
                    [min]="0"
                    class="amount-input"
                    placeholder="0">
                </div>

                <div class="quick-amounts">
                  <button class="quick-btn" (click)="cashReceived = 1000">$1.000</button>
                  <button class="quick-btn" (click)="cashReceived = 2000">$2.000</button>
                  <button class="quick-btn" (click)="cashReceived = 5000">$5.000</button>
                  <button class="quick-btn" (click)="cashReceived = 10000">$10.000</button>
                  <button class="quick-btn" (click)="cashReceived = 20000">$20.000</button>
                  <button class="quick-btn exact" (click)="cashReceived = total()">Exacto</button>
                </div>

                @if (cashReceived > total()) {
                  <div class="change-display">
                    <span class="change-label">Cambio:</span>
                    <span class="change-amount">{{ formatPrice(cashReceived - total()) }}</span>
                  </div>
                }
              </div>
            }
          </section>

          <!-- RIGHT: Receipt Preview (30%) -->
          <section class="receipt-preview-section">
            <div class="preview-header">
              <h3 class="section-title">Vista Previa</h3>
            </div>

            <div class="thermal-receipt-container">
              <div class="thermal-receipt">
                <div class="receipt-header">
                  @if (tenantLogo()) {
                    <img [src]="tenantLogo()" alt="Logo" class="receipt-logo-img" style="width:48px;height:48px;object-fit:contain;border-radius:50%;" />
                  } @else {
                    <div class="receipt-logo">{{ industryConfig().icon }}</div>
                  }
                  <div class="receipt-title">{{ tipoDocumento === 'BOLETA' ? 'BOLETA ELECTRÓNICA' : tipoDocumento === 'FACTURA' ? 'FACTURA ELECTRÓNICA' : 'BOLETA' }}</div>
                  <div class="receipt-folio">N° 000{{ Math.floor(Math.random() * 1000) + 1 }}</div>
                  <div class="receipt-date">{{ today | date:'dd/MM/yyyy HH:mm' }}</div>
                </div>

                <div class="receipt-divider"></div>

                <div class="receipt-company">
                  <div>{{ tenantName() }}</div>
                  <div>RUT: {{ tenantRut() }}</div>
                  <div>Dirección: {{ tenantDireccion() }}</div>
                </div>

                <div class="receipt-divider"></div>

                <div class="receipt-items">
                  @for (item of cartItems().slice(0, 5); track item.variantId) {
                    <div class="receipt-item-row">
                      <span class="item-qty">{{ item.cantidad }}x</span>
                      <span class="item-name">{{ item.productNombre }}</span>
                      <span class="item-price">{{ formatPrice(item.precioUnitario * item.cantidad) }}</span>
                    </div>
                  }
                  @if (cartItems().length > 5) {
                    <div class="receipt-item-row">
                      <span>... y {{ cartItems().length - 5 }} más</span>
                    </div>
                  }
                </div>

                <div class="receipt-divider"></div>

                <div class="receipt-totals">
                  <div class="total-row">
                    <span>Neto:</span>
                    <span>{{ formatPrice(subtotalCheckout()) }}</span>
                  </div>
                  <div class="total-row">
                    <span>IVA (19%):</span>
                    <span>{{ formatPrice(taxCheckout()) }}</span>
                  </div>
                  <div class="total-row bold">
                    <span>TOTAL:</span>
                    <span>{{ formatPrice(total()) }}</span>
                  </div>
                </div>

                <div class="receipt-barcode-section">
                  <!-- PDF417 Barcode (Timbre SII) -->
                  <div class="pdf417-container">
                    @if (previewPdf417()) {
                      <img [src]="previewPdf417()" alt="PDF417 Timbre Electrónico" class="pdf417-img" />
                    } @else {
                      <div class="barcode-loading">Generando timbre...</div>
                    }
                    <div class="barcode-label">Timbre Electrónico SII</div>
                  </div>
                  <!-- QR Code -->
                  <div class="qr-container">
                    @if (previewQrCode()) {
                      <img [src]="previewQrCode()" alt="QR Code" class="qr-img" />
                    } @else {
                      <div class="barcode-loading">...</div>
                    }
                  </div>
                </div>
              </div>
            </div>

            <div class="preview-actions">
              <button class="preview-action-btn print">
                <i class="pi pi-print"></i>
                <span>Impimir</span>
              </button>
              <button class="preview-action-btn email">
                <i class="pi pi-envelope"></i>
                <span>Enviar</span>
              </button>
            </div>
          </section>
        </div>

        <!-- Footer Actions -->
        <div class="checkout-footer">
          <button 
            class="btn-cancel"
            (click)="showPaymentDialog = false">
            Cancelar
          </button>
          <button 
            class="btn-confirm"
            [disabled]="!canCompleteSale() || processingPayment()"
            (click)="completeSale()">
            @if (processingPayment()) {
              <span class="spinner-btn"></span> Procesando...
            } @else {
              <i class="pi pi-check-circle"></i>
              Cobrar e Imprimir
              <span class="confirm-amount">{{ formatPrice(total()) }}</span>
            }
          </button>
        </div>
      </p-dialog>


      <!-- Sale Success Modal -->
      <p-dialog 
        [(visible)]="showSuccessModal" 
        [header]="'¡Venta completada!'"
        [modal]="true"
        [style]="{width: '90vw', maxWidth: '400px'}"
        [closable]="true"
        (onHide)="onSuccessModalClose()"
      >
        <div class="success-modal">
          <div class="success-icon">✅</div>
          <div class="success-amount">{{ formatPrice(lastSaleTotal) }}</div>
          
          @if (lastSaleDocumento) {
            <div class="document-info">
              <span class="doc-badge">{{ lastSaleDocumento.tipo }}</span>
              <span class="doc-folio">Folio N° {{ lastSaleDocumento.folio }}</span>
            </div>
          }
          
          <div class="success-actions">
            @if (lastSaleDocumento) {
              <button class="btn btn-outline" (click)="imprimirDocumento()">
                🖨️ Imprimir
              </button>
              <button class="btn btn-outline" (click)="enviarPorEmail()">
                📧 Enviar Email
              </button>
            }
            <button class="btn btn-primary" (click)="showSuccessModal = false">
              Nueva Venta
            </button>
          </div>
        </div>
      </p-dialog>

      <!-- Pending Sales Modal -->
      <p-dialog 
        [(visible)]="showPendingModal" 
        header="Ventas Pendientes"
        [modal]="true"
        [style]="{width: '95vw', maxWidth: '600px'}"
        [closable]="true"
      >
        <div class="pending-modal">
          @if (pendingSales().length === 0) {
            <div class="empty-pending">
              <span class="empty-icon">✅</span>
              <p>No hay ventas pendientes</p>
            </div>
          } @else {
            <div class="pending-list">
              @for (sale of pendingSales(); track sale.id) {
                <div class="pending-item">
                  <div class="pending-info">
                    <div class="pending-header">
                      <span class="pending-id">#{{ sale.numero || sale.id.slice(0,8) }}</span>
                      <span class="pending-date">{{ sale.fecha | date:'dd/MM HH:mm' }}</span>
                    </div>
                    <div class="pending-details">
                      <span class="pending-items">{{ sale.items?.length || 0 }} items</span>
                      <span class="pending-total">{{ formatPrice(sale.total) }}</span>
                    </div>
                  </div>
                  <div class="pending-actions">
                    <button class="btn-approve" (click)="approveSale(sale.id)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </button>
                    <button class="btn-reject" (click)="rejectSale(sale.id)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </p-dialog>

      <!-- Document Expiry Modal -->
      <p-dialog 
        [(visible)]="showDocsModal" 
        header="Documentos por Vencer"
        [modal]="true"
        [style]="{width: '95vw', maxWidth: '500px'}"
        [closable]="true"
      >
        <div class="docs-modal">
          @for (doc of expiringDocs(); track doc.id) {
            <div class="doc-item" [class.urgent]="doc.daysLeft <= 7" [class.warning]="doc.daysLeft > 7 && doc.daysLeft <= 30">
              <div class="doc-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div class="doc-info">
                <span class="doc-name">{{ doc.nombre }}</span>
                <span class="doc-expiry">
                  @if (doc.daysLeft <= 0) {
                    ¡Vencido!
                  } @else if (doc.daysLeft === 1) {
                    Vence mañana
                  } @else {
                    Vence en {{ doc.daysLeft }} días
                  }
                </span>
              </div>
              <div class="doc-status">
                @if (doc.daysLeft <= 0) {
                  <span class="status-badge expired">Vencido</span>
                } @else if (doc.daysLeft <= 7) {
                  <span class="status-badge urgent">Urgente</span>
                } @else {
                  <span class="status-badge warning">Próximo</span>
                }
              </div>
            </div>
          }
          @if (expiringDocs().length === 0) {
            <div class="empty-docs">
              <span>✅</span>
              <p>Todos los documentos están al día</p>
            </div>
          }
        </div>
      </p-dialog>

      <!-- Menu Sidebar -->
      @if (showMenu) {
        <div class="menu-overlay" (click)="showMenu = false"></div>
        <aside class="menu-sidebar">
          <div class="menu-header">
            <div class="menu-brand">
              @if (tenantLogo()) {
                <img [src]="tenantLogo()" alt="Logo" class="menu-logo" />
              } @else {
                <div class="menu-logo-placeholder">🏪</div>
              }
              <div class="menu-brand-text">
                <span class="brand-name">{{ tenantName() }}</span>
                <span class="brand-type">Sistema POS</span>
              </div>
            </div>
            <button class="menu-close" (click)="showMenu = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <nav class="menu-nav">
            <!-- VENTAS -->
            <div class="menu-section">
              <span class="section-title">Ventas</span>
              <button *ngIf="canAccess('pos')" class="menu-item" routerLink="/service-pos" (click)="showMenu = false">
                <div class="item-icon amber">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3"/>
                  </svg>
                </div>
                <span class="item-text">POS por Servicio</span>
                <span class="item-badge new">Mesas</span>
              </button>
              <button *ngIf="canAccess('pos')" class="menu-item" routerLink="/smart-pos" (click)="showMenu = false">
                <div class="item-icon lime">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
                  </svg>
                </div>
                <span class="item-text">POS Inteligente</span>
                <span class="item-badge new">Nuevo</span>
              </button>
              <button *ngIf="canAccess('catalog')" class="menu-item" routerLink="/catalog" (click)="showMenu = false">
                <div class="item-icon orange">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                  </svg>
                </div>
                <span class="item-text">Catálogo</span>
              </button>
              <button *ngIf="canAccess('inventory')" class="menu-item" routerLink="/inventory" (click)="showMenu = false">
                <div class="item-icon teal">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
                  </svg>
                </div>
                <span class="item-text">Inventario</span>
              </button>
              <button *ngIf="canAccess('cotizaciones')" class="menu-item" routerLink="/cotizaciones" (click)="showMenu = false">
                <div class="item-icon pink">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </div>
                <span class="item-text">Cotizaciones</span>
              </button>
              <button *ngIf="canAccess('reservations')" class="menu-item" routerLink="/reservations" (click)="showMenu = false">
                <div class="item-icon indigo">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <span class="item-text">Reservas</span>
                <span class="item-badge new">Nuevo</span>
              </button>
            </div>

            <!-- FACTURACIÓN -->
            <div class="menu-section">
              <span class="section-title">Facturación</span>
              <button *ngIf="canAccess('facturacion')" class="menu-item" routerLink="/facturacion" (click)="showMenu = false">
                <div class="item-icon emerald">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </div>
                <span class="item-text">Facturación</span>
                <span class="item-badge new">SII</span>
              </button>
            </div>

            <!-- FINANZAS -->
            <div class="menu-section">
              <span class="section-title">Finanzas</span>
              <button *ngIf="canAccess('pos')" class="menu-item" routerLink="/dashboard" (click)="showMenu = false">
                <div class="item-icon purple">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 3v18h18M7 16l4-4 4 4 6-6"/>
                  </svg>
                </div>
                <span class="item-text">Dashboard</span>
              </button>
              <button *ngIf="canAccess('earnings')" class="menu-item" routerLink="/earnings" (click)="showMenu = false">
                <div class="item-icon green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                  </svg>
                </div>
                <span class="item-text">Ganancias</span>
              </button>
              <button *ngIf="canAccess('cobros-pagos')" class="menu-item" routerLink="/cobros-pagos" (click)="showMenu = false">
                <div class="item-icon blue">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                  </svg>
                </div>
                <span class="item-text">Cobros y Pagos</span>
              </button>
              <button *ngIf="canAccess('flujo-caja')" class="menu-item" routerLink="/flujo-caja" (click)="showMenu = false">
                <div class="item-icon teal">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
                  </svg>
                </div>
                <span class="item-text">Flujo de Caja</span>
              </button>
              <button *ngIf="canAccess('contabilidad')" class="menu-item" routerLink="/contabilidad" (click)="showMenu = false">
                <div class="item-icon emerald">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
                  </svg>
                </div>
                <span class="item-text">Contabilidad</span>
              </button>
              <button *ngIf="canAccess('presupuesto')" class="menu-item" routerLink="/presupuesto" (click)="showMenu = false">
                <div class="item-icon purple">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
                    <line x1="6" y1="20" x2="6" y2="14"/>
                  </svg>
                </div>
                <span class="item-text">Presupuesto</span>
              </button>
              <button *ngIf="canAccess('reports')" class="menu-item" routerLink="/reports" (click)="showMenu = false">
                <div class="item-icon gray">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </div>
                <span class="item-text">Reportes</span>
              </button>
            </div>

            <!-- MARKETING & CRM -->
            <div class="menu-section">
              <span class="section-title">Marketing & CRM</span>
              <button *ngIf="canAccess('marketing')" class="menu-item" routerLink="/marketing/crm" (click)="showMenu = false">
                <div class="item-icon blue">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
                  </svg>
                </div>
                <span class="item-text">CRM Clientes</span>
                <span class="item-badge new">Nuevo</span>
              </button>
              <button *ngIf="canAccess('marketing')" class="menu-item" routerLink="/marketing/email" (click)="showMenu = false">
                <div class="item-icon pink">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <span class="item-text">Email Marketing</span>
                <span class="item-badge new">Nuevo</span>
              </button>
              <button *ngIf="canAccess('marketing')" class="menu-item" routerLink="/marketing/promotions" (click)="showMenu = false">
                <div class="item-icon amber">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
                    <line x1="7" y1="7" x2="7.01" y2="7"/>
                  </svg>
                </div>
                <span class="item-text">Promociones</span>
                <span class="item-badge new">Nuevo</span>
              </button>
              <button *ngIf="canAccess('loyalty')" class="menu-item" routerLink="/loyalty" (click)="showMenu = false">
                <div class="item-icon red">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </div>
                <span class="item-text">Programa Lealtad</span>
              </button>
              <button *ngIf="canAccess('whatsapp')" class="menu-item" routerLink="/whatsapp" (click)="showMenu = false">
                <div class="item-icon whatsapp">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                  </svg>
                </div>
                <span class="item-text">WhatsApp</span>
              </button>
              <button *ngIf="canAccess('marketing')" class="menu-item" routerLink="/marketing/reviews" (click)="showMenu = false">
                <div class="item-icon yellow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </div>
                <span class="item-text">Reviews</span>
                <span class="item-badge new">Nuevo</span>
              </button>
              <button *ngIf="canAccess('marketing')" class="menu-item" routerLink="/marketing/referrals" (click)="showMenu = false">
                <div class="item-icon cyan">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                </div>
                <span class="item-text">Referidos</span>
                <span class="item-badge new">Nuevo</span>
              </button>
            </div>

            <!-- COMPRAS -->
            <div class="menu-section">
              <span class="section-title">Compras</span>
              <button *ngIf="canAccess('compras')" class="menu-item" routerLink="/compras" (click)="showMenu = false">
                <div class="item-icon blue">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
                  </svg>
                </div>
                <span class="item-text">Órdenes de Compra</span>
              </button>
            </div>

            <!-- RRHH -->
            <div class="menu-section">
              <span class="section-title">RRHH</span>
              <button *ngIf="canAccess('remuneraciones')" class="menu-item" routerLink="/remuneraciones" (click)="showMenu = false">
                <div class="item-icon orange">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
                  </svg>
                </div>
                <span class="item-text">Remuneraciones</span>
              </button>
            </div>

            <!-- INNOVACIÓN -->
            <div class="menu-section">
              <span class="section-title">Innovación</span>
              <button *ngIf="canAccess('kds')" class="menu-item" routerLink="/kds" (click)="showMenu = false">
                <div class="item-icon orange">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                </div>
                <span class="item-text">Cocina (KDS)</span>
              </button>
              <button *ngIf="canAccess('subscriptions')" class="menu-item" routerLink="/subscriptions" (click)="showMenu = false">
                <div class="item-icon blue">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 12a9 9 0 01-9 9m0 0a9 9 0 01-9-9m18 0a9 9 0 00-9-9m0 18V3"/>
                    <polyline points="16 17 12 21 8 17"/>
                  </svg>
                </div>
                <span class="item-text">Suscripciones</span>
              </button>
              <button *ngIf="canAccess('menu-generator')" class="menu-item" routerLink="/menu-generator" (click)="showMenu = false">
                <div class="item-icon purple">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/>
                    <line x1="9" y1="17" x2="11" y2="17"/>
                  </svg>
                </div>
                <span class="item-text">Generador de Carta</span>
                <span class="item-badge new">Premium</span>
              </button>
            </div>

            <!-- CONFIGURACIÓN -->
            <div class="menu-section">
              <span class="section-title">Configuración</span>
              <button *ngIf="canAccess('settings')" class="menu-item" routerLink="/company" (click)="showMenu = false">
                <div class="item-icon indigo">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16"/>
                  </svg>
                </div>
                <span class="item-text">Gestión Empresa</span>
              </button>
              <button *ngIf="canAccess('settings')" class="menu-item" routerLink="/settings" (click)="showMenu = false">
                <div class="item-icon gray">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
                  </svg>
                </div>
                <span class="item-text">Configuración</span>
              </button>
            </div>
          </nav>

          <div class="menu-footer">
            <button class="menu-item logout" (click)="logout()">
              <div class="item-icon red">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                  <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </div>
              <span class="item-text">Cerrar Sesión</span>
            </button>
          </div>
        </aside>
      }

      <!-- Mobile Bottom Navigation -->
      <app-bottom-nav 
        [items]="mobileNavItems"
        [showFab]="false"
        (fabClick)="onMobileFabClick()">
      </app-bottom-nav>

      <!-- Mobile Cart Pill (Floating) -->
      @if (cartItems().length > 0) {
        <div class="mobile-cart-pill mobile-only" (click)="openCheckoutWithBarcodes()">
          <div class="cart-pill-info">
            <span class="cart-pill-count">{{ cartItems().length }}</span>
            <span class="cart-pill-label">items</span>
          </div>
          <div class="cart-pill-total">
            <span>Pagar</span>
            <span class="pill-price">{{ formatPrice(total()) }}</span>
          </div>
        </div>
      }
    </div>

    <p-toast position="bottom-center"></p-toast>
  `,
  styles: [`
    .pos-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    }

    .pos-header {
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

    .logo {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0;
      background: linear-gradient(135deg, #6366F1, #EC4899);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .tenant-logo {
      height: 44px;
      width: 44px;
      object-fit: contain;
      border-radius: 12px;
      padding: 6px;
      background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
      border: 1px solid rgba(255,255,255,0.15);
      box-shadow: 
        0 4px 12px rgba(0,0,0,0.3),
        inset 0 1px 1px rgba(255,255,255,0.1);
      backdrop-filter: blur(8px);
      transition: all 0.3s ease;
      
      &:hover {
        transform: scale(1.05);
        box-shadow: 
          0 6px 20px rgba(99, 102, 241, 0.3),
          inset 0 1px 1px rgba(255,255,255,0.15);
        border-color: rgba(99, 102, 241, 0.4);
      }
    }

    .tenant-name {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.875rem;
      padding-left: 1rem;
      border-left: 1px solid rgba(255, 255, 255, 0.2);
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    /* Innovation Notification Badges */
    .notification-badge {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 42px;
      height: 42px;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.25s ease;
      
      svg { width: 20px; height: 20px; }
      
      .badge-count {
        position: absolute;
        top: -4px;
        right: -4px;
        min-width: 18px;
        height: 18px;
        padding: 0 5px;
        border-radius: 10px;
        font-size: 0.65rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
      }
      
      &:hover {
        transform: scale(1.1);
      }
      
      /* WhatsApp - Green */
      &.whatsapp {
        background: linear-gradient(135deg, rgba(37, 211, 102, 0.2), rgba(18, 140, 126, 0.1));
        color: #25D366;
        animation: pulse-whatsapp 2.5s infinite;
        
        .badge-count {
          background: linear-gradient(135deg, #25D366, #128C7E);
        }
        
        &:hover {
          box-shadow: 0 4px 16px rgba(37, 211, 102, 0.4);
        }
      }
      
      /* Reservations - Purple */
      &.reservations {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.1));
        color: #8B5CF6;
        
        .badge-count {
          background: linear-gradient(135deg, #6366F1, #8B5CF6);
        }
        
        &:hover {
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
        }
      }
      
      /* KDS - Orange */
      &.kds {
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.1));
        color: #F59E0B;
        animation: pulse-kds 2s infinite;
        
        .badge-count {
          background: linear-gradient(135deg, #F59E0B, #D97706);
        }
        
        &:hover {
          box-shadow: 0 4px 16px rgba(245, 158, 11, 0.4);
        }
      }
    }
    
    @keyframes pulse-whatsapp {
      0%, 100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.3); }
      50% { box-shadow: 0 0 0 8px rgba(37, 211, 102, 0); }
    }
    
    @keyframes pulse-kds {
      0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.3); }
      50% { box-shadow: 0 0 0 6px rgba(245, 158, 11, 0); }
    }

    .badge-warning {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
      padding: 0.35rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
      }
    }

    .alert-badge {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.65rem;
      background: linear-gradient(135deg, #eab308, #ca8a04);
      border: none;
      border-radius: 20px;
      color: white;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      animation: pulse-subtle 2s infinite;
      
      svg { width: 14px; height: 14px; }
      
      &.urgent {
        background: linear-gradient(135deg, #ef4444, #dc2626);
        animation: pulse-urgent 1s infinite;
      }
      
      &:hover {
        transform: scale(1.05);
      }
    }

    @keyframes pulse-subtle {
      0%, 100% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.4); }
      50% { box-shadow: 0 0 0 6px rgba(234, 179, 8, 0); }
    }

    @keyframes pulse-urgent {
      0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
      50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
    }

    /* Pending Sales Modal */
    .pending-modal {
      .pending-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      
      .pending-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
      }
      
      .pending-info {
        flex: 1;
      }
      
      .pending-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.35rem;
      }
      
      .pending-id {
        font-weight: 600;
        color: #6366F1;
      }
      
      .pending-date {
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.5);
      }
      
      .pending-details {
        display: flex;
        gap: 1rem;
        font-size: 0.85rem;
      }
      
      .pending-items {
        color: rgba(255, 255, 255, 0.6);
      }
      
      .pending-total {
        color: #10B981;
        font-weight: 600;
      }
      
      .pending-actions {
        display: flex;
        gap: 0.5rem;
      }
      
      .btn-approve, .btn-reject {
        width: 40px;
        height: 40px;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        
        svg { width: 20px; height: 20px; }
      }
      
      .btn-approve {
        background: linear-gradient(135deg, #10B981, #059669);
        color: white;
        
        &:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }
      }
      
      .btn-reject {
        background: rgba(239, 68, 68, 0.2);
        color: #f87171;
        
        &:hover {
          background: rgba(239, 68, 68, 0.3);
          transform: scale(1.1);
        }
      }
      
      .empty-pending {
        text-align: center;
        padding: 3rem;
        color: rgba(255, 255, 255, 0.6);
        
        .empty-icon {
          font-size: 3rem;
          display: block;
        }
      }
    }

    /* Quick Actions Bar - Industry Adaptive */
    .quick-actions-bar {
      display: flex;
      gap: 0.5rem;
      flex-shrink: 0;
      overflow-x: auto;
      scrollbar-width: none;
      
      &::-webkit-scrollbar { display: none; }
    }
    
    .quick-action {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      padding: 0.5rem 0.75rem;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.05));
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 12px;
      color: white;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
      min-width: 70px;
      
      .action-icon { font-size: 1.25rem; }
      span:last-child { font-size: 0.7rem; color: rgba(255, 255, 255, 0.8); }
      
      &:hover {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.15));
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
      }
      
      &:active { transform: scale(0.95); }
    }

    /* Favoritos / Popular Section */
    .favorites-section {
      padding: 0.5rem 0;
      
      .section-header {
        margin-bottom: 0.5rem;
      }
      
      .section-title-small {
        font-size: 0.8rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.6);
      }
    }
    
    .favorites-scroll {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      scrollbar-width: none;
      padding-bottom: 0.5rem;
      
      &::-webkit-scrollbar { display: none; }
    }
    
    .favorite-chip {
      display: flex;
      flex-direction: column;
      padding: 0.5rem 1rem;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.1));
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
      
      .fav-name {
        font-size: 0.8rem;
        font-weight: 500;
        color: white;
      }
      
      .fav-price {
        font-size: 0.7rem;
        color: #10B981;
        font-weight: 600;
      }
      
      &:hover {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.2));
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      }
      
      &:active { transform: scale(0.95); }
    }

    /* Document Expiry Modal */
    .docs-modal {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      
      .doc-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        
        &.warning { border-left: 3px solid #eab308; }
        &.urgent { border-left: 3px solid #ef4444; }
      }
      
      .doc-icon {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(99, 102, 241, 0.2);
        border-radius: 10px;
        color: #a5b4fc;
        
        svg { width: 20px; height: 20px; }
      }
      
      .doc-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      
      .doc-name {
        font-weight: 500;
      }
      
      .doc-expiry {
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.5);
      }
      
      .status-badge {
        padding: 0.25rem 0.6rem;
        border-radius: 6px;
        font-size: 0.7rem;
        font-weight: 600;
        
        &.warning {
          background: rgba(234, 179, 8, 0.2);
          color: #fbbf24;
        }
        
        &.urgent {
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
        }
        
        &.expired {
          background: rgba(239, 68, 68, 0.3);
          color: #fca5a5;
        }
      }
      
      .empty-docs {
        text-align: center;
        padding: 2rem;
        color: rgba(255, 255, 255, 0.6);
        
        span { font-size: 2rem; display: block; margin-bottom: 0.5rem; }
      }
    }

    .pos-main {
      display: flex;
      flex: 1;
      overflow: hidden;
      
      @media (max-width: 768px) {
        flex-direction: column;
      }
    }

    .products-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 0;
      overflow-y: auto;
    }

    .sticky-filters {
      position: sticky;
      top: 0;
      z-index: 100;
      background: linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(15, 23, 42, 0.95) 100%);
      backdrop-filter: blur(20px);
      padding: 1rem 1.5rem;
      margin-bottom: 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      
      .search-container {
        margin-bottom: 0.75rem;
      }
    }

    .pos-grid {
      padding: 1rem 1.5rem 2rem;
    }

    .search-bar {
      margin-bottom: 1.5rem;
      
      input {
        width: 100%;
        padding: 1rem 1rem 1rem 3rem;
        font-size: 1rem;
        background: rgba(255, 255, 255, 0.05);
        border: 2px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        color: white;
        transition: all 0.3s ease;
        
        &::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }
        
        &:focus {
          outline: none;
          border-color: #6366F1;
          background: rgba(99, 102, 241, 0.1);
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
        }
      }
      
      .p-input-icon-left i {
        color: rgba(255, 255, 255, 0.5);
        left: 1rem;
      }
    }

    .pos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
      
      @media (min-width: 1200px) {
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      }
    }

    /* Filters and Actions Row - Prevents Overlap */
    .filters-actions-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
      padding: 0.5rem 0;
    }

    .category-pills-wrapper {
      flex: 1;
      min-width: 0;
      overflow: hidden;
    }

    .category-pills {
      display: flex;
      flex-wrap: nowrap;
      gap: 0.75rem;
      overflow-x: auto;
      padding: 0.25rem 0;
      scrollbar-width: none;
      
      &::-webkit-scrollbar {
        display: none;
      }
    }

    .category-pill {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 25px;
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s ease;
      flex-shrink: 0;
      
      &:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
      }
      
      &.active {
        background: linear-gradient(135deg, #6366F1, #8B5CF6);
        border-color: transparent;
        color: white;
        box-shadow: 0 4px 12px -2px rgba(99, 102, 241, 0.4);
      }
      
      .pill-icon {
        font-size: 1rem;
      }
      
      .pill-count {
        padding: 0.15rem 0.5rem;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 12px;
        font-size: 0.7rem;
        font-weight: 600;
      }
    }

    .product-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 1.5rem 1rem;
      background: linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      color: white;
      cursor: pointer;
      transition: all 0.3s ease;
      min-height: 120px;
      
      &:hover {
        transform: translateY(-4px);
        background: linear-gradient(145deg, rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0.05));
        border-color: rgba(99, 102, 241, 0.4);
        box-shadow: 0 12px 24px -8px rgba(99, 102, 241, 0.3);
      }
      
      &:active {
        transform: scale(0.98);
      }
    }

    .product-name {
      font-size: 0.9rem;
      font-weight: 500;
      text-align: center;
      line-height: 1.3;
    }

    .product-price {
      font-size: 1.1rem;
      font-weight: 700;
      background: linear-gradient(135deg, #10B981, #34D399);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    /* Stock Badge - Circle with available stock */
    .stock-badge {
      position: absolute;
      top: 8px;
      left: 8px;
      min-width: 22px;
      height: 22px;
      padding: 0 6px;
      background: linear-gradient(135deg, #eab308, #ca8a04);
      color: white;
      border-radius: 50%;
      font-size: 0.7rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(234, 179, 8, 0.4);
      z-index: 10;
      
      &.out {
        background: linear-gradient(135deg, #ef4444, #dc2626);
        box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
      }
    }

    /* Out of Stock Product Card */
    .product-card.out-of-stock {
      opacity: 0.8; /* Increased opacity slightly for visibility */
      /* pointer-events: none; REMOVED to allow clicking for management */
      
      .product-image::after {
        content: 'Agotado';
        position: absolute;
        bottom: 8px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(239, 68, 68, 0.9);
        color: white;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.65rem;
        font-weight: 600;
        text-transform: uppercase;
      }
    }

    /* Product image needs position relative for badge positioning */
    .product-image {
      position: relative;
    }

    .empty-state {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      gap: 1.5rem;
      color: rgba(255, 255, 255, 0.6);
      
      i {
        color: rgba(99, 102, 241, 0.5);
      }
    }

    /* Floating Action Button (FAB) */
    .fab-container {
      position: absolute;
      bottom: 2rem;
      right: 2rem;
      z-index: 100;
      
      @media (max-width: 768px) {
        bottom: 1rem;
        right: 1rem;
      }
    }

    .fab-main {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      border: none;
      box-shadow: 0 8px 24px -4px rgba(99, 102, 241, 0.4);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      
      &:hover {
        transform: scale(1.1);
        box-shadow: 0 12px 32px -4px rgba(99, 102, 241, 0.6);
      }
      
      &.active {
        transform: rotate(45deg);
      }
      
      .fab-main-icon {
        font-size: 1.5rem;
        transition: transform 0.3s;
      }
    }

    .fab-submenu {
      position: absolute;
      bottom: 70px;
      right: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      animation: fabSlideIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }

    @keyframes fabSlideIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .fab-action {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1.25rem;
      background: rgba(30, 41, 59, 0.95);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 30px;
      color: white;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      
      &:hover {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.15));
        border-color: rgba(99, 102, 241, 0.6);
        transform: translateX(-4px);
        box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
      }
      
      .fab-icon {
        font-size: 1.25rem;
      }
      
      .fab-label {
        color: rgba(255, 255, 255, 0.9);
      }
    }

    .cart-section {
      width: 100%;
      max-width: 380px;
      display: flex;
      flex-direction: column;
      background: rgba(30, 41, 59, 0.9);
      backdrop-filter: blur(20px);
      border-left: 1px solid rgba(255, 255, 255, 0.1);
      
      /* Hide on mobile - use mobile cart pill instead */
      @media (max-width: 768px) {
        display: none !important;
      }
    }

    .cart-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);

      h2 {
        margin: 0;
        font-size: 1.25rem;
        color: white;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        
        &::before {
          content: '🛒';
        }
      }
    }

    .cart-items {
      flex: 1;
      overflow-y: auto;
      padding: 0.75rem;
    }

    .cart-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      margin-bottom: 0.5rem;
      transition: all 0.2s ease;
      
      &:hover {
        background: rgba(255, 255, 255, 0.08);
      }
    }

    .item-info {
      flex: 1;
      min-width: 0;

      .item-name {
        display: block;
        font-weight: 500;
        color: white;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 0.25rem;
      }

      .item-price {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
      }
    }

    .item-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .qty-btn {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 8px;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      color: white;
      font-size: 1.25rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      
      &:hover {
        transform: scale(1.1);
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
      }
    }

    .qty-value {
      min-width: 28px;
      text-align: center;
      font-weight: 600;
      color: white;
    }

    .item-subtotal {
      font-weight: 700;
      color: #10B981;
      min-width: 80px;
      text-align: right;
      font-size: 0.9rem;
    }

    .empty-cart {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      gap: 0.75rem;
      color: rgba(255, 255, 255, 0.4);
      
      i {
        opacity: 0.3;
      }
    }

    .empty-cart-icon {
      font-size: 3.5rem;
      opacity: 0.4;
    }

    .empty-hint {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.3);
    }

    .item-subtotal-container {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.25rem;
    }

    .btn-delete {
      width: 24px;
      height: 24px;
      border: none;
      background: transparent;
      color: rgba(255, 255, 255, 0.3);
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      
      svg { width: 14px; height: 14px; }
      
      &:hover {
        color: #EF4444;
      }
    }

    .qty-btn {
      svg { width: 14px; height: 14px; }
      
      &.minus {
        background: rgba(255, 255, 255, 0.1);
        
        &:hover {
          background: rgba(239, 68, 68, 0.2);
        }
      }
      
      &.plus {
        background: linear-gradient(135deg, #6366F1, #8B5CF6);
      }
    }

    /* Cart animations */
    .cart-item.adding {
      animation: slideInBounce 0.4s ease-out;
    }

    @keyframes slideInBounce {
      0% {
        opacity: 0;
        transform: translateX(20px) scale(0.95);
      }
      60% {
        transform: translateX(-5px) scale(1.02);
      }
      100% {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
    }

    .cart-summary {
      padding: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(0, 0, 0, 0.2);
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      color: rgba(255, 255, 255, 0.7);

      &.total {
        font-size: 1.35rem;
        font-weight: 700;
        color: white;
        border-top: 1px solid rgba(255, 255, 255, 0.15);
        margin-top: 0.5rem;
        padding-top: 1rem;
        
        span:last-child {
          color: #10B981;
        }
      }
    }

    .cart-section > .btn {
      margin: 1rem;
    }

    .btn-success {
      background: linear-gradient(135deg, #10B981, #059669) !important;
      border: none !important;
      padding: 1rem !important;
      font-size: 1.1rem !important;
      font-weight: 600 !important;
      border-radius: 12px !important;
      box-shadow: 0 8px 20px -4px rgba(16, 185, 129, 0.4) !important;
      transition: all 0.3s ease !important;
      
      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 12px 28px -4px rgba(16, 185, 129, 0.5) !important;
      }
    }

    /* Payment Dialog */
    .payment-dialog {
      padding: 1rem 0;
    }

    .total-display {
      text-align: center;
      margin-bottom: 2rem;

      .total-label {
        display: block;
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
      }

      .total-amount {
        font-size: 3rem;
        font-weight: 700;
        background: linear-gradient(135deg, #10B981, #34D399);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    }

    .payment-methods {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .payment-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1.25rem;
      background: rgba(255, 255, 255, 0.05);
      border: 2px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      color: rgba(255, 255, 255, 0.8);
      cursor: pointer;
      transition: all 0.2s ease;

      i {
        font-size: 1.5rem;
      }

      &.selected {
        border-color: #6366F1;
        background: rgba(99, 102, 241, 0.15);
        color: white;
      }
      
      &:hover:not(.selected) {
        background: rgba(255, 255, 255, 0.08);
      }
    }

    .cash-input {
      margin-bottom: 1rem;

      label {
        display: block;
        margin-bottom: 0.5rem;
        color: rgba(255, 255, 255, 0.6);
      }
    }

    .change-display {
      margin-top: 0.75rem;
      padding: 1rem;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 12px;
      text-align: center;
      font-weight: 600;
      color: #10B981;
      font-size: 1.1rem;
    }

    /* Premium Menu Sidebar */
    .menu-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      z-index: 9999; // Very high z-index to be above everything
      animation: fadeIn 0.2s ease;
    }

    .menu-sidebar {
      position: fixed;
      top: 0;
      right: 0;
      width: 320px;
      max-width: 90vw;
      height: 100vh;
      height: 100dvh; // Dynamic viewport height for mobile
      background: linear-gradient(180deg, rgba(30, 41, 59, 0.99), rgba(15, 23, 42, 0.99));
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border-left: 1px solid rgba(255, 255, 255, 0.15);
      z-index: 10000; // Highest z-index to always be on top
      display: flex;
      flex-direction: column;
      animation: slideIn 0.3s cubic-bezier(0.32, 0.72, 0, 1);
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      
      // Mobile adjustments
      @media (max-width: 768px) {
        width: 85vw;
        max-width: 320px;
        
        // Safe area support
        padding-top: env(safe-area-inset-top, 0);
        padding-bottom: env(safe-area-inset-bottom, 0);
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideIn {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }

    .menu-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .menu-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .menu-logo {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      object-fit: contain;
      background: rgba(255, 255, 255, 0.05);
      padding: 4px;
    }

    .menu-logo-placeholder {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }

    .menu-brand-text {
      display: flex;
      flex-direction: column;
    }

    .brand-name {
      font-weight: 600;
      font-size: 1rem;
    }

    .brand-type {
      font-size: 0.7rem;
      color: rgba(255, 255, 255, 0.4);
    }

    .menu-close {
      width: 36px;
      height: 36px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 10px;
      background: transparent;
      color: rgba(255, 255, 255, 0.6);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      svg { width: 18px; height: 18px; }

      &:hover {
        background: rgba(239, 68, 68, 0.15);
        border-color: rgba(239, 68, 68, 0.5);
        color: #EF4444;
      }
    }

    .menu-nav {
      flex: 1;
      overflow-y: auto;
      padding: 0.75rem;
    }

    .menu-section {
      margin-bottom: 1.25rem;
    }

    .section-title {
      display: block;
      padding: 0.5rem 0.75rem;
      font-size: 0.65rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: rgba(255, 255, 255, 0.35);
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      width: 100%;
      padding: 0.75rem;
      background: transparent;
      border: none;
      border-radius: 12px;
      color: rgba(255, 255, 255, 0.8);
      cursor: pointer;
      text-align: left;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.06);
        color: white;
        transform: translateX(4px);
      }
    }

    .item-icon {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      svg { width: 18px; height: 18px; }

      &.sync { background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.1)); color: #A5B4FC; }
      &.purple { background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.1)); color: #A78BFA; }
      &.green { background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(52, 211, 153, 0.1)); color: #6EE7B7; }
      &.blue { background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.1)); color: #93C5FD; }
      &.orange { background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(251, 191, 36, 0.1)); color: #FCD34D; }
      &.pink { background: linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(244, 114, 182, 0.1)); color: #F9A8D4; }
      &.teal { background: linear-gradient(135deg, rgba(20, 184, 166, 0.2), rgba(45, 212, 191, 0.1)); color: #5EEAD4; }
      &.indigo { background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(129, 140, 248, 0.1)); color: #A5B4FC; }
      &.gray { background: rgba(255, 255, 255, 0.06); color: rgba(255, 255, 255, 0.5); }
      &.red { background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(248, 113, 113, 0.1)); color: #FCA5A5; }
      &.whatsapp { background: linear-gradient(135deg, rgba(37, 211, 102, 0.2), rgba(18, 140, 126, 0.1)); color: #25D366; }
      &.emerald { background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1)); color: #34D399; }
    }

    .item-text {
      flex: 1;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .item-badge {
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      font-size: 0.65rem;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.6);

      &.new {
        background: linear-gradient(135deg, #10B981, #059669);
        color: white;
      }
    }

    .menu-footer {
      padding: 0.75rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    .menu-item.logout {
      &:hover {
        background: rgba(239, 68, 68, 0.1);
        color: #FCA5A5;
      }
    }

    
    /* Buttons */
    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
    }
    
    .btn-outline {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
      
      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      color: white;
      
      &:hover {
        box-shadow: 0 8px 20px -4px rgba(99, 102, 241, 0.4);
      }
    }
    
    .btn-lg {
      padding: 1rem 2rem;
      font-size: 1.1rem;
    }
    
    .btn-block {
      width: 100%;
    }
    
    .text-muted {
      color: rgba(255, 255, 255, 0.5);
    }
    
    .w-full {
      width: 100%;
    }
    
    .mt-3 {
      margin-top: 1rem;
    }

    /* Document Type Selection */
    .document-type-section, .payment-methods-section, .client-data-section {
      margin-bottom: 1.5rem;
    }

    .section-label {
      display: block;
      font-size: 0.75rem;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.5);
      margin-bottom: 0.75rem;
      font-weight: 600;
    }

    .doc-type-buttons {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
    }

    .doc-type-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.75rem;
      background: rgba(255, 255, 255, 0.05);
      border: 2px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;

      &.selected {
        border-color: #10B981;
        background: rgba(16, 185, 129, 0.1);
      }

      &:hover:not(.selected) {
        border-color: rgba(255, 255, 255, 0.3);
      }
    }

    .doc-icon {
      font-size: 1.5rem;
      margin-bottom: 0.25rem;
    }

    .doc-name {
      font-weight: 600;
      font-size: 0.85rem;
      color: white;
    }

    .doc-desc {
      font-size: 0.65rem;
      color: rgba(255, 255, 255, 0.5);
    }

    /* Client Form */
    .client-form {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      color: white;
      font-size: 0.9rem;

      &::placeholder {
        color: rgba(255, 255, 255, 0.4);
      }

      &:focus {
        outline: none;
        border-color: #6366F1;
      }
    }

    /* Success Modal */
    .success-modal {
      text-align: center;
      padding: 1rem;
    }

    .success-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .success-amount {
      font-size: 2.5rem;
      font-weight: 700;
      color: #10B981;
      margin-bottom: 1rem;
    }

    .document-info {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .doc-badge {
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      color: white;
      padding: 0.35rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .doc-folio {
      color: rgba(255, 255, 255, 0.7);
    }

    .success-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    /* Spinner */
    .spinner-btn {
      display: inline-block;
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin-btn 0.8s linear infinite;
    }

    @keyframes spin-btn {
      to { transform: rotate(360deg); }
    }

    /* Icon colors */
    .item-icon.emerald {
      background: linear-gradient(135deg, #10B981, #059669);
      svg { stroke: white; }
    }

    /* ===========================================
       MOBILE RESPONSIVE DESIGN
       Samsung S22: 360px | iPhone 13 Pro Max: 428px
       =========================================== */

    /* Tablet and below (768px) */
    @media (max-width: 768px) {
      .pos-main {
        flex-direction: column;
      }
      
      .products-section {
        order: 1;
      }
      
      .cart-section {
        /* Hidden on mobile - using mobile-cart-pill instead */
        display: none !important;
      }
      
      .pos-grid {
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)) !important;
        gap: 0.5rem !important;
      }
      
      .product-card {
        .product-image {
          height: 80px !important;
        }
        
        .product-info {
          padding: 0.5rem !important;
        }
        
        .product-name {
          font-size: 0.75rem !important;
        }
        
        .product-price {
          font-size: 0.8rem !important;
        }
      }
      
      .quick-actions-bar {
        flex-wrap: nowrap;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }
      
      .favorite-chip {
        padding: 0.375rem 0.75rem;
        
        .fav-name { font-size: 0.75rem; }
        .fav-price { font-size: 0.65rem; }
      }
    }

    /* Mobile Large - iPhone 13 Pro Max (428px) */
    @media (max-width: 428px) {
      .pos-header {
        padding: 0.75rem 1rem;
      }
      
      .tenant-name {
        display: none;
      }
      
      .search-container {
        margin: 0 0.5rem;
      }
      
      .search-input {
        font-size: 0.9rem !important;
        padding: 0.75rem 2.5rem !important;
      }
      
      .category-pills {
        gap: 0.25rem;
        padding: 0.5rem 0.5rem;
      }
      
      .category-pill {
        padding: 0.5rem 0.75rem;
        font-size: 0.75rem;
        
        .pill-icon { font-size: 0.9rem; margin-right: 0.25rem; }
        .pill-count { font-size: 0.65rem; margin-left: 0.25rem; }
      }
      
      .quick-actions-bar {
        gap: 0.375rem;
        padding: 0.5rem;
      }
      
      .quick-action {
        min-width: 60px;
        padding: 0.375rem 0.5rem;
        
        .action-icon { font-size: 1rem; }
        span:last-child { font-size: 0.6rem; }
      }
      
      /* Cart item layout fix - prevent overlap */
      .cart-item {
        flex-wrap: wrap;
        gap: 0.5rem;
        padding: 0.75rem;
      }
      
      .item-info {
        flex: 1 1 100%;
        order: 1;
        
        .item-name {
          font-size: 0.85rem;
        }
        
        .item-price {
          font-size: 0.7rem;
        }
      }
      
      .item-actions {
        order: 2;
        flex: 0 0 auto;
      }
      
      .item-subtotal-container {
        order: 3;
        flex: 0 0 auto;
        margin-left: auto;
      }
      
      .qty-btn {
        width: 36px !important;
        height: 36px !important;
        min-width: 36px;
      }
      
      .qty-value {
        min-width: 24px;
        font-size: 0.9rem;
      }
      
      .item-subtotal {
        min-width: 60px;
        font-size: 0.85rem;
      }
      
      .btn-delete {
        width: 28px;
        height: 28px;
        
        svg { width: 12px; height: 12px; }
      }
      
      .cart-summary {
        padding: 0.75rem;
        
        .summary-row {
          font-size: 0.85rem;
        }
        
        .total {
          font-size: 1rem;
        }
      }
      
      .btn-block {
        padding: 0.875rem !important;
        font-size: 0.9rem !important;
      }
    }

    /* Mobile Small - Samsung S22 (360px) */
    @media (max-width: 360px) {
      .pos-header {
        padding: 0.5rem 0.75rem;
      }
      
      .logo-emoji, .tenant-logo {
        width: 32px !important;
        height: 32px !important;
        font-size: 1.25rem;
      }
      
      /* Ultra-minimal notification badges */
      .notification-badge {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        
        svg { width: 14px; height: 14px; }
        
        .badge-count {
          min-width: 12px;
          height: 12px;
          font-size: 0.55rem;
          top: -2px;
          right: -2px;
        }
      }
      
      /* Hide non-essential header elements */
      .tenant-name,
      .btn-text,
      .badge-warning,
      .alert-badge {
        display: none !important;
      }
      
      /* Compact buttons */
      .btn {
        padding: 0.5rem !important;
        min-width: 36px;
        
        i { font-size: 1rem; }
      }
      
      .header-right {
        gap: 0.375rem;
      }
    }

    /* Mobile Tablets (768px) - ULTRA-MINIMAL Header */
    @media (max-width: 768px) {
      .pos-header {
        padding: 0.5rem 0.875rem;
        
        .header-left {
          gap: 0.5rem;
        }
        
        .header-right {
          gap: 0.375rem;
        }
      }
      
      /* Hide ALL notifications on mobile - access via menu */
      .notification-badge,
      .alert-badge,
      .badge-warning {
        display: none !important;
      }
      
      /* Hide tenant name */
      .tenant-name {
        display: none !important;
      }
      
      /* Hide text in buttons */
      .btn-text {
        display: none;
      }
      
      /* Smaller sync button - icon only */
      .btn.btn-primary {
        padding: 0.5rem 0.625rem;
        min-width: auto;
        
        i { font-size: 0.875rem; }
      }
      
      /* Menu button - prominent and accessible */
      .btn.btn-outline {
        padding: 0.625rem 0.75rem;
        background: rgba(99, 102, 241, 0.15);
        border-color: rgba(99, 102, 241, 0.4);
        
        i { font-size: 1.125rem; }
      }
      
      .pos-grid {
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 0.375rem !important;
      }
      
      .product-card {
        .product-image {
          height: 70px !important;
        }
        
        .product-name {
          font-size: 0.7rem !important;
        }
        
        .product-category {
          display: none !important;
        }
        
        .product-price {
          font-size: 0.75rem !important;
        }
      }
      
      .category-pill {
        padding: 0.375rem 0.5rem;
        font-size: 0.7rem;
        
        .pill-icon { display: none; }
      }
      
      .quick-action {
        min-width: 50px;
        padding: 0.25rem 0.375rem;
        
        .action-icon { font-size: 0.9rem; }
        span:last-child { font-size: 0.55rem; }
      }
      
      .favorites-section {
        display: none;
      }
      
      /* Cart fixes for very small screens */
      .cart-item {
        padding: 0.5rem;
        gap: 0.375rem;
      }
      
      .item-info .item-name {
        font-size: 0.8rem !important;
      }
      
      .qty-btn {
        width: 32px !important;
        height: 32px !important;
        min-width: 32px;
      }
      
      .item-subtotal {
        min-width: 50px;
        font-size: 0.8rem !important;
      }
      
      .cart-header h2 {
        font-size: 1rem;
      }
      
      .empty-cart {
        padding: 2rem;
      }
      
      .empty-cart-icon {
        font-size: 2.5rem;
      }
    }

    /* Touch-friendly sizes */
    @media (hover: none) and (pointer: coarse) {
      .product-card {
        min-height: 44px;
      }
      
      .category-pill,
      .quick-action,
      .favorite-chip {
        min-height: 44px;
      }
      
      .qty-btn {
        min-width: 44px;
        min-height: 44px;
      }
      
      .btn-delete {
        min-width: 44px;
        min-height: 44px;
      }
    }

    /* Landscape mobile optimization */
    @media (max-height: 500px) and (orientation: landscape) {
      .pos-main {
        flex-direction: row;
      }
      
      .cart-section {
        /* Stay hidden in landscape mobile too */
        display: none !important;
      }
      
      .products-section {
        height: 100vh;
        overflow-y: auto;
      }
      
      .quick-actions-bar,
      .favorites-section {
        display: none;
      }
    }
  `]
})
export class PosComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private offlineService = inject(OfflineService);
  private stockService = inject(StockService); // Injected for Restock Modal
  private messageService = inject(MessageService);
  private industryService = inject(IndustryMockDataService);
  private facturacionService = inject(FacturacionService);
  private demoDataService = inject(DemoDataService);
  private barcodeService = inject(BarcodeService);
  private salesEventService = inject(SalesEventService);

  // State
  products = signal<CachedProduct[]>([]);
  categories = signal<{ id: string, nombre: string }[]>([]);
  selectedCategory = signal<string | null>(null);
  isLoading = signal(false);
  cartItems = signal<CartItem[]>([]);
  searchQuery = '';
  showPaymentDialog = false;
  showMenu = false;
  fabOpen = false;  // Floating Action Button state
  showPendingModal = false;
  showDocsModal = false;
  selectedPaymentMethod: 'EFECTIVO' | 'DEBITO' | 'CREDITO' | 'TRANSFERENCIA' = 'EFECTIVO';
  cashReceived = 0;

  // Premium checkout modal properties
  customerName = '';
  today = new Date();
  Math = Math; // Expose Math to template

  // Billing Integration
  tipoDocumento: 'BOLETA' | 'FACTURA' | 'SIN_DOCUMENTO' = 'BOLETA';
  clienteRut = '';
  clienteRazonSocial = '';
  clienteGiro = '';
  clienteEmail = '';
  processingPayment = signal(false);
  showSuccessModal = false;
  lastSaleTotal = 0;
  lastSaleDocumento: { id?: string; tipo: string; tipoDte?: string; folio: number } | null = null;

  // Barcode preview signals for DTE
  previewFolio = signal<number>(Math.floor(Math.random() * 9000) + 1000);
  previewPdf417 = signal<string>('');
  previewQrCode = signal<string>('');

  // POS Session Management - Generate or retrieve persistent session ID for this terminal
  posSessionId: string = (() => {
    const storageKey = 'pos_session_id';
    let sessionId = localStorage.getItem(storageKey);
    if (!sessionId) {
      sessionId = `POS-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(storageKey, sessionId);
    }
    return sessionId;
  })();

  // Pending sales (loaded from API)
  pendingSales = signal<any[]>([]);

  // Restock Modal State
  showRestockModal = false;
  restockItem: CachedProduct | null = null;
  restockAmount = 10;
  restockLoading = false;



  // Document expiry alerts (demo data)
  expiringDocs = signal<any[]>([
    { id: 'doc-1', nombre: 'Patente Comercial', daysLeft: 5 },
    { id: 'doc-2', nombre: 'Permiso Sanitario', daysLeft: 28 },
    { id: 'doc-3', nombre: 'Certificado SII', daysLeft: 0 },
  ]);

  hasUrgentDocs = () => this.expiringDocs().some(d => d.daysLeft <= 7);

  // ============================================
  // MOBILE-FIRST PROPERTIES
  // ============================================

  // Mobile Navigation Items
  mobileNavItems: NavItem[] = [
    { route: '/pos', icon: 'shopping-cart', label: 'Ventas' },
    { route: '/inventory', icon: 'package', label: 'Stock' },
    { route: '/analytics', icon: 'bar-chart-2', label: 'Reportes' },
    { route: '/settings', icon: 'settings', label: 'Config' }
  ];

  // Mobile FAB click handler (opens checkout directly)
  onMobileFabClick(): void {
    this.openCheckoutWithBarcodes();
  }

  // Category icons mapping - multi-industry support
  private categoryIcons: Record<string, string> = {
    // Panadería
    'panadería': '🥖', 'panaderia': '🥖', 'panes': '🥖',
    'pastelería': '🍰', 'pasteleria': '🍰', 'pasteles': '🍰',
    'empanadas': '🥟', 'cafetería': '☕', 'cafeteria': '☕', 'café': '☕',
    // Cursos/Academia
    'desarrollo web': '💻', 'programación': '💻', 'programacion': '💻',
    'marketing digital': '📱', 'marketing': '📱', 'redes sociales': '📱',
    'diseño ux/ui': '🎨', 'diseño': '🎨', 'ux': '🎨', 'ui': '🎨',
    'liderazgo': '👔', 'gestión': '👔', 'gestion': '👔',
    'finanzas personales': '💰', 'finanzas': '💰', 'inversiones': '💰',
    // Editorial/Imprenta
    'libros impresos': '📕', 'libros': '📕', 'libro': '📕',
    'revistas': '📰', 'revista': '📰', 'publicaciones': '📰',
    'catálogos': '📋', 'catalogos': '📋', 'catálogo': '📋',
    'folletos': '📄', 'trípticos': '📄', 'dípticos': '📄',
    'tarjetas': '🪪', 'tarjetas de visita': '🪪',
    // Minimarket
    'bebidas': '🥤', 'bebidas frías': '🥤', 'gaseosas': '🥤',
    'snacks': '🍿', 'galletas': '🍪', 'dulces': '🍬',
    'lácteos': '🥛', 'lacteos': '🥛', 'leche': '🥛',
    'abarrotes': '🛒', 'limpieza': '🧹',
    'otro': '📦'
  };

  // Computed
  tenantName = computed(() => this.authService.tenant()?.nombre || this.authService.tenant()?.razonSocial || 'Mi Negocio');
  tenantLogo = computed(() => {
    // First try to use logoUrl from tenant (from database)
    const logoUrl = this.authService.tenant()?.logoUrl;
    if (logoUrl) return logoUrl;

    // Fallback to local assets for demo
    const name = this.tenantName().toLowerCase();
    if (name.includes('trigal')) return '/assets/logos/eltrigal.png';
    if (name.includes('pedro')) return '/assets/logos/donpedro.png';
    return '';
  });
  tenantRut = computed(() => this.authService.tenant()?.rut || '76.XXX.XXX-X');
  tenantDireccion = computed(() => {
    const tenant = this.authService.tenant();
    if (!tenant) return 'Av. Providencia 1234';
    const parts = [tenant.direccion, tenant.comuna].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Av. Providencia 1234';
  });
  industryConfig = computed(() => this.industryService.getIndustryConfig());
  // Pending sales count - uses actual pending sales from API
  pendingCount = computed(() => this.pendingSales().length);

  // Innovation module notifications (initialized in ngOnInit from DemoDataService)
  whatsappNotifications = signal(3);
  reservationsToday = signal(5);
  kdsOrders = signal(3);

  filteredProducts = computed(() => {
    let result = this.products();

    // Filter by category
    const catId = this.selectedCategory();
    if (catId) {
      result = result.filter(p => p.categoryId === catId);
    }

    // Filter by search
    const query = this.searchQuery.toLowerCase().trim();
    if (query) {
      result = result.filter(p =>
        p.nombre.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.variants.some(v =>
          v.sku.toLowerCase().includes(query) ||
          v.barcode?.toLowerCase().includes(query)
        )
      );
    }

    return result;
  });

  // Category helper methods
  getCategoryIcon(categoryName: string): string {
    const key = categoryName.toLowerCase();
    return this.categoryIcons[key] || '📦';
  }

  getCategoryCount(categoryId: string): number {
    return this.products().filter(p => p.categoryId === categoryId).length;
  }

  selectCategory(categoryId: string | null): void {
    this.selectedCategory.set(categoryId);
  }

  // Popular/Favorite products - Top 6 for quick access
  popularProducts = computed(() => {
    return this.products().slice(0, 6);
  });

  /**
   * Generate preview barcodes (PDF417 and QR) for the receipt preview
   * Called when opening checkout modal or changing document type
   */
  async generatePreviewBarcodes(): Promise<void> {
    const tenant = this.authService.tenant();
    const folio = this.previewFolio();
    const total = this.total();
    const now = new Date();
    const fechaEmision = now.toISOString().split('T')[0];
    const fechaHora = now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

    const tipoDte = this.tipoDocumento === 'FACTURA' ? 'FACTURA_ELECTRONICA' : 'BOLETA_ELECTRONICA';

    // Generate Timbre data for PDF417
    const timbreData = this.barcodeService.generateTimbreData({
      tipoDte,
      folio,
      fechaEmision,
      rutEmisor: tenant?.rut || '76.849.210-8',
      razonSocialEmisor: tenant?.razonSocial || tenant?.nombre || 'Empresa Demo',
      montoTotal: total
    });

    // Generate structured QR data with folio, date, and hash
    const qrData = this.barcodeService.generateStructuredQRData({
      tipoDte,
      folio,
      fechaEmision,
      fechaHora,
      rutEmisor: tenant?.rut || '76.849.210-8',
      montoTotal: total
    });

    try {
      // Generate PDF417 barcode
      const pdf417 = await this.barcodeService.generatePDF417(timbreData);
      this.previewPdf417.set(pdf417);

      // Generate QR code with structured data
      const qr = await this.barcodeService.generateQRCode(qrData);
      this.previewQrCode.set(qr);
    } catch (error) {
      console.error('Error generating barcodes:', error);
    }
  }

  /**
   * Open checkout dialog and generate barcodes for preview
   */
  openCheckoutWithBarcodes(): void {
    // Generate new folio for preview
    this.previewFolio.set(Math.floor(Math.random() * 9000) + 1000);
    // Show the dialog
    this.showPaymentDialog = true;
    // Generate barcodes asynchronously
    this.generatePreviewBarcodes();
  }

  // Quick action methods - Industry adaptive
  openWeightInput(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Pesaje',
      detail: 'Ingresa el peso del producto en la balanza'
    });
    // TODO: Open weight input modal
  }

  openSpecialOrder(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Pedido Especial',
      detail: 'Crear orden de pedido especial'
    });
    // TODO: Open special order modal
  }

  applyPromotion(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Promociones',
      detail: 'Aplicar descuento o promoción al carrito'
    });
    // TODO: Open promotions modal
  }

  openClientSearch(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Buscar Cliente',
      detail: 'Asociar cliente a esta venta'
    });
    // TODO: Open client search modal
  }

  savePending(): void {
    if (this.cartItems().length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Carrito vacío',
        detail: 'Agrega productos antes de guardar'
      });
      return;
    }
    // Save to pending
    const pending = {
      id: crypto.randomUUID(),
      items: this.cartItems(),
      total: this.total(),
      createdAt: new Date().toISOString()
    };
    const stored = localStorage.getItem('pending_sales') || '[]';
    const pendingList = JSON.parse(stored);
    pendingList.push(pending);
    localStorage.setItem('pending_sales', JSON.stringify(pendingList));
    this.clearCart();
    this.messageService.add({
      severity: 'success',
      summary: 'Guardado',
      detail: 'Venta guardada como pendiente'
    });
  }

  subtotal = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.subtotal, 0)
  );

  taxTotal = computed(() =>
    Math.round(this.subtotal() * 0.19) // IVA 19% Chile
  );

  total = computed(() => this.subtotal() + this.taxTotal());

  // For checkout modal
  subtotalCheckout = computed(() => {
    const totalAmount = this.total();
    return Math.round(totalAmount / 1.19); // Remove IVA
  });

  taxCheckout = computed(() => {
    return this.total() - this.subtotalCheckout(); // IVA 19%
  });

  // Permissions Helper
  canAccess(moduleId: string): boolean {
    // POS module is core
    if (moduleId === 'pos') {
      return this.authService.hasModule('pos') && this.authService.hasPermission('pos');
    }

    // Check if Tenant has it AND User has it (case-insensitive)
    // Note: Backend now sends module codes in permissions array
    const hasTenantModule = this.authService.hasModule(moduleId);
    const hasUserPermission = this.authService.hasPermission(moduleId);

    return hasTenantModule && hasUserPermission;
  }

  ngOnInit(): void {
    this.loadCachedProducts();
    this.loadPendingSales();

    // Load notification counts from DemoDataService
    const counts = this.demoDataService.getNotificationCounts();
    this.whatsappNotifications.set(counts.whatsapp);
    this.reservationsToday.set(counts.reservations);
    this.kdsOrders.set(counts.kds);
  }

  loadPendingSales(): void {
    const tenantId = this.authService.tenant()?.id;
    if (!tenantId) return;

    this.http.get<any[]>(`${environment.salesUrl}/sales/pending`, {
      headers: {
        'X-Tenant-Id': tenantId,
        'X-User-Id': this.authService.user()?.id || ''
      }
    }).subscribe({
      next: (sales) => {
        this.pendingSales.set(sales.map(s => ({
          id: s.id,
          numero: s.numero,
          fecha: new Date(s.createdAt),
          total: s.total,
          items: s.items || []
        })));
      },
      error: (err) => {
        console.error('Error loading pending sales:', err);
        this.pendingSales.set([]);
      }
    });
  }

  async loadCachedProducts(): Promise<void> {
    const cached = await this.offlineService.getCachedProducts();
    if (cached.length > 0) {
      this.products.set(cached);
    } else {
      this.syncProducts();
    }
  }

  async syncProducts(): Promise<void> {
    try {
      this.isLoading.set(true);
      this.messageService.add({
        severity: 'info',
        summary: 'Sincronizando...',
        life: 2000
      });

      // Get headers from auth service
      const tenantId = this.authService.tenant()?.id;
      const headers: any = {
        'X-Tenant-Id': tenantId || '',
        'X-User-Id': this.authService.user()?.id || ''
      };

      // Load products and categories in parallel
      const [productsResponse, categoriesResponse] = await Promise.all([
        this.http.get<any[]>(`${environment.catalogUrl}/products/sync`, { headers }).toPromise(),
        this.http.get<any[]>(`${environment.catalogUrl}/categories`, { headers }).toPromise().catch(() => [])
      ]);

      // Set categories
      if (categoriesResponse && categoriesResponse.length > 0) {
        this.categories.set(categoriesResponse.map(c => ({
          id: c.id,
          nombre: c.nombre
        })));
      }

      // Set products
      if (productsResponse) {
        const cached: CachedProduct[] = productsResponse.map(p => ({
          id: p.id,
          sku: p.sku,
          nombre: p.nombre,
          categoryId: p.categoryId,
          categoryName: p.categoryName,
          imagenUrl: p.imagenUrl,
          unitCode: p.unitCode,
          variants: p.variants?.map((v: any) => ({
            id: v.id,
            sku: v.sku,
            nombre: v.nombre,
            barcode: v.barcode,
            precioBruto: v.precioBruto,
            precioNeto: v.precioNeto,
            taxPercentage: v.taxPercentage || 19,
            stock: v.stock,
            stockMinimo: v.stockMinimo || 0 // Map stockMinimo for inventory
          })) || [],
          syncedAt: new Date()
        }));

        await this.offlineService.cacheProducts(cached, tenantId);
        this.products.set(cached);

        this.messageService.add({
          severity: 'success',
          summary: 'Catálogo sincronizado',
          detail: `${cached.length} productos`,
          life: 3000
        });
      }
    } catch (error) {
      console.error('Sync error:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error de sincronización',
        detail: 'Usando catálogo local',
        life: 3000
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  onSearch(): void {
    // Si hay código exacto, agregar al carrito
    const code = this.searchQuery.trim();
    if (code) {
      const product = this.products().find(p =>
        p.sku === code ||
        p.variants.some(v => v.sku === code || v.barcode === code)
      );

      if (product) {
        this.addToCart(product);
        this.searchQuery = '';
      }
    }
  }

  addToCart(product: CachedProduct): void {
    const variant = product.variants[0]; // Por ahora usamos la primera variante
    if (!variant) return;

    // Check stock if available (mock stock or real)
    const stock = variant.stock ?? 0;
    if (stock <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Producto Agotado',
        detail: 'Este producto no tiene stock disponible.',
        life: 3000
      });
      // Can add logic to open inventory modal here if needed
      return;
    }

    const items = [...this.cartItems()];
    const existingIndex = items.findIndex(i => i.variantId === variant.id);

    if (existingIndex >= 0) {
      if (items[existingIndex].cantidad >= stock) {
        this.messageService.add({ severity: 'error', summary: 'Stock Insuficiente', detail: 'No hay más unidades' });
        return;
      }
      items[existingIndex].cantidad++;
      items[existingIndex].subtotal = items[existingIndex].cantidad * items[existingIndex].precioUnitario;
    } else {
      items.push({
        variantId: variant.id,
        productSku: variant.sku,
        productNombre: variant.nombre || product.nombre,
        cantidad: 1,
        precioUnitario: variant.precioBruto,
        descuento: 0,
        impuestoPorcentaje: variant.taxPercentage || 19,
        subtotal: variant.precioBruto,
        isAdding: true
      });
    }

    this.cartItems.set(items);
  }

  updateQuantity(index: number, delta: number): void {
    const items = [...this.cartItems()];
    items[index].cantidad += delta;

    if (items[index].cantidad <= 0) {
      items.splice(index, 1);
    } else {
      items[index].subtotal = items[index].cantidad * items[index].precioUnitario;
    }

    this.cartItems.set(items);
  }

  clearCart(): void {
    this.cartItems.set([]);
  }

  removeItem(index: number): void {
    const items = [...this.cartItems()];
    items.splice(index, 1);
    this.cartItems.set(items);
  }

  onItemAnimationEnd(item: CartItem): void {
    if (item.isAdding) {
      const items = this.cartItems().map(i =>
        i.variantId === item.variantId ? { ...i, isAdding: false } : i
      );
      this.cartItems.set(items);
    }
  }

  canCompleteSale(): boolean {
    if (this.cartItems().length === 0) return false;
    if (this.selectedPaymentMethod === 'EFECTIVO' && this.cashReceived < this.total()) {
      return false;
    }
    // Para factura, validar datos del cliente
    if (this.tipoDocumento === 'FACTURA') {
      if (!this.clienteRut || !this.clienteRazonSocial) {
        return false;
      }
    }
    return true;
  }

  async completeSale(): Promise<void> {
    this.processingPayment.set(true);
    const commandId = crypto.randomUUID();
    const totalVenta = this.total();

    const saleData = {
      commandId,
      sessionId: this.posSessionId,
      items: this.cartItems().map(item => ({
        variantId: item.variantId,
        productSku: item.productSku,
        productNombre: item.productNombre,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        descuento: item.descuento,
        impuestoPorcentaje: item.impuestoPorcentaje
      })),
      payments: [{
        medio: this.selectedPaymentMethod,
        monto: totalVenta
      }],
      // Billing data para documento tributario
      tipoDocumento: this.tipoDocumento,
      cliente: this.tipoDocumento === 'FACTURA' ? {
        rut: this.clienteRut,
        razonSocial: this.clienteRazonSocial,
        giro: this.clienteGiro,
        email: this.clienteEmail
      } : null
    };

    try {
      let saleResult: any = null;

      if (this.offlineService.isOffline()) {
        await this.offlineService.addPendingCommand('CREATE_SALE', saleData);
        this.messageService.add({
          severity: 'info',
          summary: 'Venta guardada',
          detail: 'Se sincronizará cuando haya conexión',
          life: 3000
        });
      } else {
        // 1. Crear la venta en sales-service
        saleResult = await this.http.post(
          `${environment.salesUrl}/sales`,
          saleData
        ).toPromise();

        // 2. Emitir documento tributario si corresponde
        if (this.tipoDocumento !== 'SIN_DOCUMENTO') {
          try {
            const dteRequest = this.buildDteRequest(saleResult);
            const endpoint = this.tipoDocumento === 'BOLETA'
              ? `${environment.billingUrl}/billing/boleta`
              : `${environment.billingUrl}/billing/factura`;

            const dteResult = await this.http.post<any>(endpoint, dteRequest).toPromise();

            this.lastSaleDocumento = {
              id: dteResult?.id,
              tipo: this.tipoDocumento === 'BOLETA' ? 'Boleta Electrónica' : 'Factura Electrónica',
              tipoDte: dteResult?.tipoDte || (this.tipoDocumento === 'BOLETA' ? 'BOLETA_ELECTRONICA' : 'FACTURA_ELECTRONICA'),
              folio: dteResult?.folio || Math.floor(Math.random() * 10000) + 1
            };
          } catch (billingError) {
            console.error('Error emitiendo documento:', billingError);
            // No fallamos la venta, solo avisamos
            this.messageService.add({
              severity: 'warn',
              summary: 'Documento pendiente',
              detail: 'La venta se registró pero el documento se emitirá después',
              life: 4000
            });
          }
        }
      }

      // Guardar total para mostrar en modal
      this.lastSaleTotal = totalVenta;

      // Notificar al dashboard y otros componentes
      if (saleResult) {
        this.salesEventService.notifySale({
          id: saleResult.id || commandId,
          numero: saleResult.numero || commandId.slice(0, 8),
          total: totalVenta,
          items: this.cartItems().map(item => ({
            variantId: item.variantId,
            sku: item.productSku,
            nombre: item.productNombre,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario
          })),
          timestamp: new Date(),
          type: 'VENTA'
        });
      }

      // Limpiar carrito y cerrar modal de pago
      this.clearCart();
      this.showPaymentDialog = false;
      this.processingPayment.set(false);

      // Mostrar modal de éxito
      this.showSuccessModal = true;

      // Trigger cross-tab sync via localStorage
      localStorage.setItem('pos_sale_completed', Date.now().toString());

      // Reset datos de cliente
      this.resetClienteData();

    } catch (error) {
      console.error('Sale error:', error);
      this.processingPayment.set(false);

      // Si falla, guardar offline
      await this.offlineService.addPendingCommand('CREATE_SALE', saleData);

      this.messageService.add({
        severity: 'warn',
        summary: 'Venta guardada localmente',
        detail: 'Se sincronizará cuando haya conexión',
        life: 3000
      });

      // Still notify local components about the pending sale
      this.salesEventService.notifySale({
        id: commandId,
        numero: commandId.slice(0, 8),
        total: totalVenta,
        items: this.cartItems().map(item => ({
          variantId: item.variantId,
          sku: item.productSku,
          nombre: item.productNombre,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario
        })),
        timestamp: new Date(),
        type: 'VENTA_OFFLINE'
      });

      this.clearCart();
      this.showPaymentDialog = false;
    }
  }

  private buildDteRequest(saleResult: any) {
    return {
      ventaId: saleResult?.id,
      receptor: this.tipoDocumento === 'FACTURA' ? {
        rut: this.clienteRut.replace(/\./g, ''),
        razonSocial: this.clienteRazonSocial,
        giro: this.clienteGiro,
        email: this.clienteEmail
      } : null,
      items: this.cartItems().map(item => ({
        nombre: item.productNombre,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        descuento: item.descuento
      }))
    };
  }

  private resetClienteData() {
    this.clienteRut = '';
    this.clienteRazonSocial = '';
    this.clienteGiro = '';
    this.clienteEmail = '';
    this.tipoDocumento = 'BOLETA';
    this.cashReceived = 0;
    this.selectedPaymentMethod = 'EFECTIVO';
  }

  formatClienteRut() {
    // Formatear RUT chileno (12.345.678-9)
    let rut = this.clienteRut.replace(/[^0-9kK]/g, '');
    if (rut.length > 1) {
      const dv = rut.slice(-1);
      const body = rut.slice(0, -1);
      const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      this.clienteRut = `${formatted}-${dv.toUpperCase()}`;
    }
  }

  onSuccessModalClose() {
    this.lastSaleDocumento = null;
    this.lastSaleTotal = 0;
  }

  imprimirDocumento() {
    if (!this.lastSaleDocumento) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin documento',
        detail: 'No hay documento para imprimir',
        life: 2000
      });
      return;
    }

    this.messageService.add({
      severity: 'info',
      summary: 'Generando PDF...',
      detail: 'Preparando documento para impresión',
      life: 2000
    });

    if (!this.lastSaleDocumento.id) {
      window.print();
      return;
    }

    this.facturacionService.getPdf(this.lastSaleDocumento.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const printWindow = window.open(url);
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
        } else {
          // Si bloqueado popup, descargar directamente
          const a = document.createElement('a');
          a.href = url;
          a.download = `${this.lastSaleDocumento?.tipoDte}-${this.lastSaleDocumento?.folio}.pdf`;
          a.click();
          window.URL.revokeObjectURL(url);
        }
      },
      error: (err) => {
        console.error('Error obteniendo PDF:', err);
        // Fallback a window.print()
        window.print();
      }
    });
  }

  enviarPorEmail() {
    let email = this.clienteEmail;

    if (!email) {
      const inputEmail = prompt('Email del cliente:');
      if (!inputEmail || !inputEmail.includes('@')) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Email requerido',
          detail: 'Ingrese un email válido',
          life: 2000
        });
        return;
      }
      email = inputEmail;
    }

    if (!this.lastSaleDocumento) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin documento',
        detail: 'No hay documento para enviar',
        life: 2000
      });
      return;
    }

    this.messageService.add({
      severity: 'info',
      summary: 'Enviando...',
      detail: `Enviando documento a ${email}`,
      life: 2000
    });

    if (!this.lastSaleDocumento.id) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin ID',
        detail: 'Documento no tiene ID para enviar',
        life: 2000
      });
      return;
    }

    this.facturacionService.enviarEmail(this.lastSaleDocumento.id, email).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Email enviado',
          detail: `Documento enviado a ${email}`,
          life: 3000
        });
      },
      error: (err) => {
        console.error('Error enviando email:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo enviar el email',
          life: 3000
        });
      }
    });
  }


  formatPrice(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  }

  logout(): void {
    this.showMenu = false;
    this.authService.logout();
  }

  // Pending sales methods
  approveSale(saleId: string): void {
    const tenantId = this.authService.tenant()?.id;
    const userId = this.authService.user()?.id;

    this.http.post<any>(`${environment.salesUrl}/sales/${saleId}/approve`, {}, {
      headers: {
        'X-Tenant-Id': tenantId || '',
        'X-User-Id': userId || ''
      }
    }).subscribe({
      next: (approvedSale) => {
        const sales = this.pendingSales().filter(s => s.id !== saleId);
        this.pendingSales.set(sales);

        this.messageService.add({
          severity: 'success',
          summary: 'Venta aprobada',
          detail: `Venta #${approvedSale.numero} aprobada - $${this.formatPrice(approvedSale.total)}`,
          life: 3000
        });

        // Notify dashboard to refresh
        this.salesEventService.triggerDashboardRefresh();

        if (sales.length === 0) {
          this.showPendingModal = false;
        }
      },
      error: (err) => {
        console.error('Error approving sale:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo aprobar la venta',
          life: 3000
        });
      }
    });
  }

  rejectSale(saleId: string): void {
    const tenantId = this.authService.tenant()?.id;
    const userId = this.authService.user()?.id;

    this.http.post<any>(`${environment.salesUrl}/sales/${saleId}/reject`, { motivo: 'Rechazada por supervisor' }, {
      headers: {
        'X-Tenant-Id': tenantId || '',
        'X-User-Id': userId || ''
      }
    }).subscribe({
      next: () => {
        const sales = this.pendingSales().filter(s => s.id !== saleId);
        this.pendingSales.set(sales);

        this.messageService.add({
          severity: 'warn',
          summary: 'Venta rechazada',
          detail: 'La venta fue rechazada',
          life: 2000
        });

        // Notify dashboard to refresh
        this.salesEventService.triggerDashboardRefresh();

        if (sales.length === 0) {
          this.showPendingModal = false;
        }
      },
      error: (err) => {
        console.error('Error rejecting sale:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo rechazar la venta',
          life: 3000
        });
      }
    });
  }

  async confirmRestock() {
    if (!this.restockItem || this.restockAmount <= 0) return;

    this.restockLoading = true;
    try {
      const variantId = this.restockItem.variants[0].id;
      const branchId = this.authService.tenant()?.id || '';

      await this.stockService.adjustStock({
        variantId,
        branchId,
        tipo: 'ENTRADA', // Shortcut for purchase/entry
        cantidad: this.restockAmount,
        motivo: 'Reposición rápida desde POS'
      }).toPromise();

      this.messageService.add({ severity: 'success', summary: 'Stock Actualizado', detail: `+${this.restockAmount} unidades agregadas` });

      // Update local cache stock to reflect change immediately without full reload
      const updatedProducts = this.products().map(p => {
        if (p.id === this.restockItem!.id) {
          const v = { ...p.variants[0], stock: (p.variants[0].stock || 0) + this.restockAmount };
          return { ...p, variants: [v] };
        }
        return p;
      });
      this.products.set(updatedProducts);

      this.showRestockModal = false;
      this.restockItem = null;
    } catch (e) {
      console.error(e);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el stock' });
    } finally {
      this.restockLoading = false;
    }
  }
}
