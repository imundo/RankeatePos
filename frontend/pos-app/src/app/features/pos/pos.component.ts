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
import { environment } from '@env/environment';

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
    InputNumberModule
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
        </div>
        <div class="header-right">
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

            <!-- Category Pills -->
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
                  (click)="addToCart(product)"
                  [style.animation-delay]="$index * 0.05 + 's'"
                >
                  <div class="product-image">
                    @if (product.imagenUrl) {
                      <img [src]="product.imagenUrl" [alt]="product.nombre" loading="lazy" />
                    } @else {
                      <span>{{ getCategoryIcon(product.categoryName || 'Otro') }}</span>
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
        </section>

        <!-- Cart Section -->
        <section class="cart-section">
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
              (click)="showPaymentDialog = true"
            >
              <i class="pi pi-check"></i>
              Cobrar {{ formatPrice(total()) }}
            </button>
          }
        </section>
      </div>

      <!-- Payment Dialog -->
      <p-dialog 
        [(visible)]="showPaymentDialog" 
        header="Cobrar venta"
        [modal]="true"
        [style]="{width: '90vw', maxWidth: '400px'}"
        [closable]="true"
      >
        <div class="payment-dialog">
          <div class="total-display">
            <span class="total-label">Total a cobrar</span>
            <span class="total-amount">{{ formatPrice(total()) }}</span>
          </div>

          <div class="payment-methods">
            <button 
              class="payment-btn"
              [class.selected]="selectedPaymentMethod === 'EFECTIVO'"
              (click)="selectedPaymentMethod = 'EFECTIVO'"
            >
              <i class="pi pi-wallet"></i>
              Efectivo
            </button>
            <button 
              class="payment-btn"
              [class.selected]="selectedPaymentMethod === 'DEBITO'"
              (click)="selectedPaymentMethod = 'DEBITO'"
            >
              <i class="pi pi-credit-card"></i>
              Débito
            </button>
            <button 
              class="payment-btn"
              [class.selected]="selectedPaymentMethod === 'CREDITO'"
              (click)="selectedPaymentMethod = 'CREDITO'"
            >
              <i class="pi pi-credit-card"></i>
              Crédito
            </button>
            <button 
              class="payment-btn"
              [class.selected]="selectedPaymentMethod === 'TRANSFERENCIA'"
              (click)="selectedPaymentMethod = 'TRANSFERENCIA'"
            >
              <i class="pi pi-send"></i>
              Transferencia
            </button>
          </div>

          @if (selectedPaymentMethod === 'EFECTIVO') {
            <div class="cash-input">
              <label>Monto recibido</label>
              <p-inputNumber 
                [(ngModel)]="cashReceived"
                [min]="0"
                mode="currency"
                currency="CLP"
                locale="es-CL"
                [showButtons]="false"
              ></p-inputNumber>
              
              @if (cashReceived > total()) {
                <div class="change-display">
                  Vuelto: {{ formatPrice(cashReceived - total()) }}
                </div>
              }
            </div>
          }

          <button 
            class="btn btn-success btn-lg btn-block mt-3"
            [disabled]="!canCompleteSale()"
            (click)="completeSale()"
          >
            <i class="pi pi-check-circle"></i>
            Confirmar venta
          </button>
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
            <!-- Quick Actions -->
            <div class="menu-section">
              <span class="section-title">Acciones Rápidas</span>
              <button class="menu-item" (click)="syncProducts(); showMenu = false;">
                <div class="item-icon sync">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 12a9 9 0 01-9 9m0 0a9 9 0 01-9-9m18 0a9 9 0 00-9-9m0 18V3m0 18l3-3m-3 3l-3-3M12 3l3 3m-3-3L9 6"/>
                  </svg>
                </div>
                <span class="item-text">Sincronizar Catálogo</span>
                <span class="item-badge">↻</span>
              </button>
            </div>

            <!-- Analytics -->
            <div class="menu-section">
              <span class="section-title">Análisis</span>
              <button class="menu-item" routerLink="/dashboard" (click)="showMenu = false">
                <div class="item-icon purple">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 3v18h18M7 16l4-4 4 4 6-6"/>
                  </svg>
                </div>
                <span class="item-text">Dashboard</span>
              </button>
              <button class="menu-item" routerLink="/earnings" (click)="showMenu = false">
                <div class="item-icon green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2v20m5-17a5 5 0 00-10 0 5 5 0 0010 0z"/>
                    <circle cx="12" cy="12" r="10"/>
                  </svg>
                </div>
                <span class="item-text">Ganancias Diarias</span>
                <span class="item-badge new">Nuevo</span>
              </button>
              <button class="menu-item" routerLink="/reports" (click)="showMenu = false">
                <div class="item-icon blue">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </div>
                <span class="item-text">Reportes</span>
              </button>
            </div>

            <!-- Operaciones -->
            <div class="menu-section">
              <span class="section-title">Operaciones</span>
              <button class="menu-item" routerLink="/catalog" (click)="showMenu = false">
                <div class="item-icon orange">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                  </svg>
                </div>
                <span class="item-text">Catálogo</span>
              </button>
              <button class="menu-item" routerLink="/catalog/manager" (click)="showMenu = false">
                <div class="item-icon pink">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
                  </svg>
                </div>
                <span class="item-text">Gestión Productos</span>
              </button>
              <button class="menu-item" routerLink="/inventory" (click)="showMenu = false">
                <div class="item-icon teal">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
                  </svg>
                </div>
                <span class="item-text">Inventario</span>
              </button>
            </div>

            <!-- Configuración -->
            <div class="menu-section">
              <span class="section-title">Configuración</span>
              <button class="menu-item" routerLink="/company" (click)="showMenu = false">
                <div class="item-icon indigo">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16"/>
                  </svg>
                </div>
                <span class="item-text">Gestión Empresa</span>
              </button>
              <button class="menu-item" routerLink="/settings" (click)="showMenu = false">
                <div class="item-icon gray">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
                    <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
                    <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
                    <line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/>
                    <line x1="17" y1="16" x2="23" y2="16"/>
                  </svg>
                </div>
                <span class="item-text">Configuración</span>
              </button>
            </div>

            <!-- Marketing -->
            <div class="menu-section">
              <span class="section-title">Marketing</span>
              <button class="menu-item" routerLink="/menu-generator" (click)="showMenu = false">
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
          margin-bottom: 1rem;
        }
      }
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

    .category-pills {
      display: flex;
      flex-wrap: nowrap;
      gap: 0.75rem;
      overflow-x: auto;
      padding: 0.75rem 0;
      margin-bottom: 0.5rem;
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

    .cart-section {
      width: 100%;
      max-width: 380px;
      display: flex;
      flex-direction: column;
      background: rgba(30, 41, 59, 0.9);
      backdrop-filter: blur(20px);
      border-left: 1px solid rgba(255, 255, 255, 0.1);
      
      @media (max-width: 768px) {
        max-width: none;
        max-height: 50vh;
        border-left: none;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
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
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: 999;
      animation: fadeIn 0.2s ease;
    }

    .menu-sidebar {
      position: fixed;
      top: 0;
      right: 0;
      width: 320px;
      max-width: 90vw;
      height: 100vh;
      background: linear-gradient(180deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.98));
      backdrop-filter: blur(20px);
      border-left: 1px solid rgba(255, 255, 255, 0.1);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      animation: slideIn 0.3s ease;
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
  `]
})
export class PosComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private offlineService = inject(OfflineService);
  private messageService = inject(MessageService);
  private industryService = inject(IndustryMockDataService);

  // State
  products = signal<CachedProduct[]>([]);
  categories = signal<{ id: string, nombre: string }[]>([]);
  selectedCategory = signal<string | null>(null);
  isLoading = signal(false);
  cartItems = signal<CartItem[]>([]);
  searchQuery = '';
  showPaymentDialog = false;
  showMenu = false;
  showPendingModal = false;
  showDocsModal = false;
  selectedPaymentMethod: 'EFECTIVO' | 'DEBITO' | 'CREDITO' | 'TRANSFERENCIA' = 'EFECTIVO';
  cashReceived = 0;

  // Pending sales (demo data)
  pendingSales = signal<any[]>([
    { id: 'sale-001', numero: '00123', fecha: new Date(), total: 15500, items: [{}, {}] },
    { id: 'sale-002', numero: '00124', fecha: new Date(Date.now() - 3600000), total: 8750, items: [{}] },
  ]);

  // Document expiry alerts (demo data)
  expiringDocs = signal<any[]>([
    { id: 'doc-1', nombre: 'Patente Comercial', daysLeft: 5 },
    { id: 'doc-2', nombre: 'Permiso Sanitario', daysLeft: 28 },
    { id: 'doc-3', nombre: 'Certificado SII', daysLeft: 0 },
  ]);

  hasUrgentDocs = () => this.expiringDocs().some(d => d.daysLeft <= 7);

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
  tenantName = computed(() => this.authService.tenant()?.nombre || 'Mi Negocio');
  tenantLogo = computed(() => {
    const name = this.tenantName().toLowerCase();
    if (name.includes('trigal')) return '/assets/logos/eltrigal.png';
    if (name.includes('pedro')) return '/assets/logos/donpedro.png';
    if (name.includes('academia') || name.includes('aprende')) return '';  // Uses emoji
    if (name.includes('editorial') || name.includes('imprenta')) return '';  // Uses emoji
    return '';
  });
  industryConfig = computed(() => this.industryService.getIndustryConfig());
  pendingCount = this.offlineService.pendingCount;

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

  subtotal = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.subtotal, 0)
  );

  taxTotal = computed(() =>
    Math.round(this.subtotal() * 0.19) // IVA 19% Chile
  );

  total = computed(() => this.subtotal());

  ngOnInit(): void {
    this.loadCachedProducts();
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
            taxPercentage: v.taxPercentage || 19
          })) || [],
          syncedAt: new Date()
        }));

        await this.offlineService.cacheProducts(cached);
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

    const items = [...this.cartItems()];
    const existingIndex = items.findIndex(i => i.variantId === variant.id);

    if (existingIndex >= 0) {
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
    return true;
  }

  async completeSale(): Promise<void> {
    const commandId = crypto.randomUUID();

    const saleData = {
      commandId,
      sessionId: 'temp-session-id', // TODO: Get from active session
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
        monto: this.total()
      }]
    };

    try {
      if (this.offlineService.isOffline()) {
        // Guardar para sincronizar después
        await this.offlineService.addPendingCommand('CREATE_SALE', saleData);

        this.messageService.add({
          severity: 'success',
          summary: 'Venta guardada',
          detail: 'Se sincronizará cuando haya conexión',
          life: 3000
        });
      } else {
        // Enviar al servidor
        await this.http.post(
          `${environment.salesUrl}/sales`,
          saleData
        ).toPromise();

        this.messageService.add({
          severity: 'success',
          summary: '¡Venta completada!',
          detail: `Total: ${this.formatPrice(this.total())}`,
          life: 3000
        });
      }

      // Limpiar
      this.clearCart();
      this.showPaymentDialog = false;
      this.cashReceived = 0;
      this.selectedPaymentMethod = 'EFECTIVO';

    } catch (error) {
      console.error('Sale error:', error);

      // Si falla, guardar offline
      await this.offlineService.addPendingCommand('CREATE_SALE', saleData);

      this.messageService.add({
        severity: 'warn',
        summary: 'Venta guardada localmente',
        detail: 'Se sincronizará cuando haya conexión',
        life: 3000
      });

      this.clearCart();
      this.showPaymentDialog = false;
    }
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
    const sales = this.pendingSales().filter(s => s.id !== saleId);
    this.pendingSales.set(sales);
    this.messageService.add({
      severity: 'success',
      summary: 'Venta aprobada',
      detail: 'La venta fue aprobada exitosamente',
      life: 2000
    });
    if (sales.length === 0) {
      this.showPendingModal = false;
    }
  }

  rejectSale(saleId: string): void {
    const sales = this.pendingSales().filter(s => s.id !== saleId);
    this.pendingSales.set(sales);
    this.messageService.add({
      severity: 'warn',
      summary: 'Venta rechazada',
      detail: 'La venta fue rechazada',
      life: 2000
    });
    if (sales.length === 0) {
      this.showPendingModal = false;
    }
  }
}
