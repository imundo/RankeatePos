import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/auth/auth.service';
import { CatalogService, Product, Category } from '@core/services/catalog.service';

type ViewMode = 'grid' | 'list';
type SortOption = 'nombre' | 'precio' | 'stock';

@Component({
  selector: 'app-catalog-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="catalog-container">
      <header class="catalog-header">
        <div class="header-left">
          <button class="btn-icon" routerLink="/pos">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div class="header-title">
            <h1>Catálogo</h1>
            <span class="subtitle">{{ filteredProducts().length }} de {{ products().length }} productos</span>
          </div>
        </div>
        <div class="header-actions">
          <!-- View Toggle -->
          <div class="view-toggle">
            <button 
              class="toggle-btn" 
              [class.active]="viewMode() === 'grid'"
              (click)="viewMode.set('grid')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
              </svg>
            </button>
            <button 
              class="toggle-btn" 
              [class.active]="viewMode() === 'list'"
              (click)="viewMode.set('list')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            </button>
          </div>
          <button class="btn-primary" routerLink="/catalog/manager">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Gestionar
          </button>
        </div>
      </header>

      <!-- Filter Bar -->
      <div class="filter-bar">
        <!-- Categories -->
        <div class="categories-bar">
          <button 
            class="category-chip"
            [class.active]="!selectedCategory()"
            (click)="selectedCategory.set(null)">
            Todos
          </button>
          @for (cat of categories(); track cat.id) {
            <button 
              class="category-chip"
              [class.active]="selectedCategory() === cat.id"
              (click)="selectedCategory.set(cat.id)">
              {{ cat.nombre }}
            </button>
          }
        </div>

        <!-- Sort -->
        <div class="sort-container">
          <label>Ordenar:</label>
          <select [(ngModel)]="sortBy" (ngModelChange)="onSortChange($event)">
            <option value="nombre">Nombre</option>
            <option value="precio">Precio</option>
            <option value="stock">Stock</option>
          </select>
          <button class="sort-dir-btn" (click)="toggleSortDir()">
            <svg [style.transform]="sortAsc ? 'rotate(0deg)' : 'rotate(180deg)'" 
                 viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 19V5M5 12l7-7 7 7"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Search -->
      <div class="search-container">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <input 
          type="text" 
          [(ngModel)]="searchQuery"
          placeholder="Buscar por nombre o SKU..."
        />
        @if (searchQuery) {
          <button class="clear-btn" (click)="searchQuery = ''">✕</button>
        }
      </div>

      <!-- Products Grid/List -->
      <div class="products-container" [class.grid-view]="viewMode() === 'grid'" [class.list-view]="viewMode() === 'list'">
        @for (product of filteredProducts(); track product.id) {
          <div class="product-card" (click)="openProductDetail(product)">
            <div class="product-image">
              @if (product.imagenUrl) {
                <img [src]="product.imagenUrl" [alt]="product.nombre" />
              } @else {
                <span class="product-icon">📦</span>
              }
              @if (isLowStock(product)) {
                <span class="stock-badge low">Stock bajo</span>
              }
              @if (isOutOfStock(product)) {
                <span class="stock-badge out">Sin stock</span>
              }
            </div>
            <div class="product-info">
              <h3>{{ product.nombre }}</h3>
              <span class="sku">{{ product.sku }}</span>
              @if (product.categoryName) {
                <span class="category-tag">{{ product.categoryName }}</span>
              }
            </div>
            <div class="product-meta">
              <div class="product-price">
                {{ formatPrice(product.variants?.[0]?.precioBruto || 0) }}
              </div>
              <div class="product-stock" 
                   [class.low]="isLowStock(product)"
                   [class.out]="isOutOfStock(product)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                </svg>
                {{ getStock(product) }} unidades
              </div>
            </div>
            <div class="product-actions">
              <button class="btn-icon-sm" (click)="editProduct($event, product)" title="Editar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
            </div>
          </div>
        }

        @if (filteredProducts().length === 0 && !loading()) {
          <div class="empty-state">
            <span class="empty-icon">📭</span>
            <h3>No se encontraron productos</h3>
            <p>Intenta con otros filtros o agrega nuevos productos</p>
            <button class="btn-primary" routerLink="/catalog/manager">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Agregar productos
            </button>
          </div>
        }
      </div>

      <!-- Product Detail Modal -->
      @if (selectedProduct()) {
        <div class="modal-overlay" (click)="closeProductDetail()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <button class="modal-close" (click)="closeProductDetail()">✕</button>
            
            <div class="modal-header">
              <div class="modal-image">
                @if (selectedProduct()?.imagenUrl) {
                  <img [src]="selectedProduct()?.imagenUrl" [alt]="selectedProduct()?.nombre" />
                } @else {
                  <span class="product-icon-lg">📦</span>
                }
              </div>
            </div>

            <div class="modal-body">
              <span class="modal-sku">{{ selectedProduct()?.sku }}</span>
              <h2>{{ selectedProduct()?.nombre }}</h2>
              
              @if (selectedProduct()?.descripcion) {
                <p class="modal-description">{{ selectedProduct()?.descripcion }}</p>
              }

              <div class="modal-info-grid">
                <div class="info-item">
                  <label>Categoría</label>
                  <span>{{ selectedProduct()?.categoryName || 'Sin categoría' }}</span>
                </div>
                <div class="info-item">
                  <label>Estado</label>
                  <span class="status-badge" [class.active]="selectedProduct()?.activo">
                    {{ selectedProduct()?.activo ? 'Activo' : 'Inactivo' }}
                  </span>
                </div>
              </div>

              <!-- Variants -->
              <div class="variants-section">
                <h4>Variantes y precios</h4>
                <div class="variants-list">
                  @for (variant of selectedProduct()?.variants || []; track variant.id) {
                    <div class="variant-card">
                      <div class="variant-info">
                        <span class="variant-sku">{{ variant.sku }}</span>
                        <span class="variant-stock" [class.low]="(variant.stock || 0) < 10">
                          Stock: {{ variant.stock || 0 }}
                        </span>
                      </div>
                      <div class="variant-prices">
                        <span class="price-gross">{{ formatPrice(variant.precioBruto) }}</span>
                        <span class="price-net">Neto: {{ formatPrice(variant.precioNeto) }}</span>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-secondary" (click)="closeProductDetail()">Cerrar</button>
              <button class="btn-primary" (click)="goToEdit()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Editar producto
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Loading -->
      @if (loading()) {
        <div class="loading-overlay">
          <div class="spinner"></div>
          <span>Cargando productos...</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .catalog-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: white;
    }

    .catalog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.5rem;
      background: rgba(30, 41, 59, 0.8);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .view-toggle {
      display: flex;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      padding: 4px;
    }

    .toggle-btn {
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: rgba(255, 255, 255, 0.5);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      
      svg { width: 18px; height: 18px; }
      
      &.active {
        background: rgba(99, 102, 241, 0.3);
        color: white;
      }
      
      &:hover:not(.active) {
        color: white;
      }
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
      transition: all 0.2s;
      
      svg { width: 20px; height: 20px; }
      
      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
    }

    .header-title {
      h1 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 700;
      }
      .subtitle {
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.5);
      }
    }

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
      transition: all 0.2s;
      
      svg { width: 18px; height: 18px; }
      
      &:hover {
        box-shadow: 0 8px 20px -4px rgba(99, 102, 241, 0.4);
        transform: translateY(-2px);
      }
    }

    .btn-secondary {
      padding: 0.75rem 1.25rem;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      color: white;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        background: rgba(255, 255, 255, 0.15);
      }
    }

    .filter-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.5rem;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .categories-bar {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      scrollbar-width: none;
      flex: 1;
      
      &::-webkit-scrollbar { display: none; }
    }

    .category-chip {
      padding: 0.5rem 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.85rem;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;
      
      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      
      &.active {
        background: linear-gradient(135deg, #6366F1, #8B5CF6);
        border-color: transparent;
        color: white;
      }
    }

    .sort-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      
      label {
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.6);
      }
      
      select {
        padding: 0.5rem 1rem;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        color: white;
        font-size: 0.85rem;
        cursor: pointer;
        
        option {
          background: #1e293b;
        }
      }
    }

    .sort-dir-btn {
      width: 32px;
      height: 32px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      background: transparent;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      
      svg {
        width: 16px;
        height: 16px;
        transition: transform 0.2s;
      }
    }

    .search-container {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 0 1.5rem 1rem;
      padding: 0.875rem 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      
      svg {
        width: 20px;
        height: 20px;
        color: rgba(255, 255, 255, 0.4);
        flex-shrink: 0;
      }
      
      input {
        flex: 1;
        background: transparent;
        border: none;
        color: white;
        font-size: 1rem;
        outline: none;
        
        &::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }
      }
      
      .clear-btn {
        background: rgba(255, 255, 255, 0.1);
        border: none;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        color: rgba(255, 255, 255, 0.6);
        cursor: pointer;
        font-size: 0.75rem;
        
        &:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      }
    }

    .products-container {
      padding: 0 1.5rem 2rem;
      
      &.grid-view {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1rem;
        
        .product-card {
          flex-direction: column;
          
          .product-image {
            width: 100%;
            height: 160px;
          }
          
          .product-info {
            text-align: center;
          }
          
          .product-meta {
            flex-direction: column;
            align-items: center;
          }
          
          .product-actions {
            position: absolute;
            top: 0.5rem;
            right: 0.5rem;
          }
        }
      }
      
      &.list-view {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        
        .product-card {
          flex-direction: row;
          
          .product-image {
            width: 64px;
            height: 64px;
            flex-shrink: 0;
          }
        }
      }
    }

    .product-card {
      position: relative;
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(99, 102, 241, 0.3);
        transform: translateY(-2px);
        box-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.3);
      }
    }

    .product-image {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(99, 102, 241, 0.15);
      border-radius: 12px;
      overflow: hidden;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .product-icon {
        font-size: 2rem;
      }
    }

    .stock-badge {
      position: absolute;
      top: 0.5rem;
      left: 0.5rem;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.65rem;
      font-weight: 600;
      text-transform: uppercase;
      
      &.low {
        background: #f59e0b;
        color: white;
      }
      
      &.out {
        background: #ef4444;
        color: white;
      }
    }

    .product-info {
      flex: 1;
      min-width: 0;
      
      h3 {
        margin: 0 0 0.25rem;
        font-size: 1rem;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .sku {
        display: block;
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
        margin-bottom: 0.25rem;
      }
      
      .category-tag {
        display: inline-block;
        padding: 0.2rem 0.5rem;
        background: rgba(99, 102, 241, 0.2);
        border-radius: 4px;
        font-size: 0.7rem;
        color: #a5b4fc;
      }
    }

    .product-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.25rem;
    }

    .product-price {
      font-size: 1.25rem;
      font-weight: 700;
      color: #10B981;
    }

    .product-stock {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.6);
      
      svg {
        width: 14px;
        height: 14px;
      }
      
      &.low {
        color: #f59e0b;
      }
      
      &.out {
        color: #ef4444;
      }
    }

    .btn-icon-sm {
      width: 36px;
      height: 36px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.3);
      color: rgba(255, 255, 255, 0.6);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      
      svg { width: 16px; height: 16px; }
      
      &:hover {
        background: rgba(99, 102, 241, 0.3);
        color: white;
      }
    }

    .empty-state {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 4rem 2rem;
      gap: 1rem;
      color: rgba(255, 255, 255, 0.5);
      
      .empty-icon {
        font-size: 4rem;
      }
      
      h3 {
        margin: 0;
        color: white;
      }
      
      p {
        margin: 0;
      }
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal-content {
      position: relative;
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      animation: modalIn 0.2s ease-out;
    }

    @keyframes modalIn {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    .modal-close {
      position: absolute;
      top: 1rem;
      right: 1rem;
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      cursor: pointer;
      font-size: 1rem;
      z-index: 10;
      
      &:hover {
        background: rgba(255, 255, 255, 0.2);
      }
    }

    .modal-header {
      .modal-image {
        width: 100%;
        height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(99, 102, 241, 0.15);
        border-radius: 20px 20px 0 0;
        
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .product-icon-lg {
          font-size: 5rem;
        }
      }
    }

    .modal-body {
      padding: 1.5rem;
      
      .modal-sku {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.7);
        margin-bottom: 0.5rem;
      }
      
      h2 {
        margin: 0 0 1rem;
        font-size: 1.5rem;
      }
      
      .modal-description {
        color: rgba(255, 255, 255, 0.7);
        margin-bottom: 1.5rem;
        line-height: 1.6;
      }
    }

    .modal-info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
      
      .info-item {
        label {
          display: block;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 0.25rem;
        }
        
        span {
          font-weight: 500;
        }
        
        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          
          &.active {
            background: rgba(16, 185, 129, 0.2);
            color: #10B981;
          }
        }
      }
    }

    .variants-section {
      h4 {
        margin: 0 0 0.75rem;
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.7);
      }
    }

    .variants-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .variant-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
    }

    .variant-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      
      .variant-sku {
        font-weight: 500;
      }
      
      .variant-stock {
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.6);
        
        &.low {
          color: #f59e0b;
        }
      }
    }

    .variant-prices {
      text-align: right;
      
      .price-gross {
        display: block;
        font-size: 1.1rem;
        font-weight: 700;
        color: #10B981;
      }
      
      .price-net {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
      }
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .loading-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      z-index: 1000;
      
      span {
        color: rgba(255, 255, 255, 0.7);
      }
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

    @media (max-width: 640px) {
      .filter-bar {
        flex-direction: column;
        align-items: stretch;
      }
      
      .sort-container {
        justify-content: flex-end;
      }
      
      .products-container.grid-view {
        grid-template-columns: repeat(2, 1fr);
        
        .product-card .product-image {
          height: 120px;
        }
      }
    }
  `]
})
export class CatalogListComponent implements OnInit {
  private catalogService = inject(CatalogService);
  private authService = inject(AuthService);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(false);
  searchQuery = '';
  selectedCategory = signal<string | null>(null);
  selectedProduct = signal<Product | null>(null);
  viewMode = signal<ViewMode>('grid');
  sortBy: SortOption = 'nombre';
  sortAsc = true;

  filteredProducts = computed(() => {
    let items = [...this.products()];

    // Filter by category
    const catId = this.selectedCategory();
    if (catId) {
      items = items.filter(p => p.categoryId === catId);
    }

    // Filter by search
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      items = items.filter(p =>
        p.nombre.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      );
    }

    // Sort
    items.sort((a, b) => {
      let cmp = 0;
      switch (this.sortBy) {
        case 'nombre':
          cmp = a.nombre.localeCompare(b.nombre);
          break;
        case 'precio':
          cmp = (a.variants?.[0]?.precioBruto || 0) - (b.variants?.[0]?.precioBruto || 0);
          break;
        case 'stock':
          cmp = (a.variants?.[0]?.stock || 0) - (b.variants?.[0]?.stock || 0);
          break;
      }
      return this.sortAsc ? cmp : -cmp;
    });

    return items;
  });

  ngOnInit() {
    this.loadProducts();
    this.loadCategories();
  }

  async loadProducts() {
    this.loading.set(true);
    try {
      const response = await this.catalogService.getProducts().toPromise();
      this.products.set(response?.content || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async loadCategories() {
    try {
      const response: any = await this.catalogService.getCategories().toPromise();
      this.categories.set(response?.content || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  openProductDetail(product: Product) {
    this.selectedProduct.set(product);
  }

  closeProductDetail() {
    this.selectedProduct.set(null);
  }

  editProduct(event: Event, product: Product) {
    event.stopPropagation();
    // Navigate to manager with product selected
    console.log('Edit product:', product);
  }

  goToEdit() {
    // Navigate to catalog manager
    this.closeProductDetail();
  }

  getStock(product: Product): number {
    return product.variants?.[0]?.stock || 0;
  }

  isLowStock(product: Product): boolean {
    const stock = this.getStock(product);
    return stock > 0 && stock < 10;
  }

  isOutOfStock(product: Product): boolean {
    return this.getStock(product) === 0;
  }

  onSortChange(option: SortOption) {
    this.sortBy = option;
  }

  toggleSortDir() {
    this.sortAsc = !this.sortAsc;
  }

  formatPrice(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  }
}
