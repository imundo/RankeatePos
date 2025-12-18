import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/auth/auth.service';
import { CatalogService, Product, Category } from '@core/services/catalog.service';

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
            <span class="subtitle">{{ products().length }} productos</span>
          </div>
        </div>
        <button class="btn-primary" (click)="showNewProduct = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Nuevo
        </button>
      </header>

      <!-- Categories -->
      <div class="categories-bar">
        <button 
          class="category-chip"
          [class.active]="!selectedCategory"
          (click)="selectedCategory = null">
          Todos
        </button>
        @for (cat of categories(); track cat.id) {
          <button 
            class="category-chip"
            [class.active]="selectedCategory === cat.id"
            (click)="selectedCategory = cat.id">
            {{ cat.nombre }}
          </button>
        }
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
          placeholder="Buscar productos..."
        />
      </div>

      <!-- Products Grid -->
      <div class="products-grid">
        @for (product of filteredProducts(); track product.id) {
          <div class="product-card">
            <div class="product-icon">📦</div>
            <div class="product-info">
              <h3>{{ product.nombre }}</h3>
              <span class="sku">{{ product.sku }}</span>
            </div>
            <div class="product-meta">
              <div class="product-price">
                {{ formatPrice(product.variants?.[0]?.precioBruto || 0) }}
              </div>
              <div class="product-stock" [class.low]="(product.variants?.[0]?.stock || 0) < 10">
                Stock: {{ product.variants?.[0]?.stock || 0 }}
              </div>
            </div>
            <div class="product-actions">
              <button class="btn-icon-sm" (click)="editProduct(product)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
            </div>
          </div>
        }

        @if (filteredProducts().length === 0) {
          <div class="empty-state">
            <span class="empty-icon">📭</span>
            <p>No hay productos</p>
            <button class="btn-primary" (click)="loadProducts()">
              Cargar productos
            </button>
          </div>
        }
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="loading-overlay">
          <div class="spinner"></div>
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
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
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

    .categories-bar {
      display: flex;
      gap: 0.5rem;
      padding: 1rem 1.5rem;
      overflow-x: auto;
      scrollbar-width: none;
      
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
    }

    .products-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.75rem;
      padding: 0 1.5rem 2rem;
    }

    .product-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      transition: all 0.2s;
      
      &:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(99, 102, 241, 0.3);
      }
    }

    .product-icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(99, 102, 241, 0.15);
      border-radius: 12px;
      font-size: 1.5rem;
    }

    .product-info {
      flex: 1;
      min-width: 0;
      
      h3 {
        margin: 0 0 0.25rem;
        font-size: 1rem;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .sku {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
      }
    }

    .product-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.25rem;
    }

    .product-price {
      font-size: 1.1rem;
      font-weight: 700;
      color: #10B981;
    }

    .product-stock {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.5);
      
      &.low {
        color: #f59e0b;
        font-weight: 600;
      }
    }

    .btn-icon-sm {
      width: 36px;
      height: 36px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      background: transparent;
      color: rgba(255, 255, 255, 0.6);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      
      svg { width: 16px; height: 16px; }
      
      &:hover {
        background: rgba(255, 255, 255, 0.1);
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
    }

    .loading-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
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
  `]
})
export class CatalogListComponent implements OnInit {
  private catalogService = inject(CatalogService);
  private authService = inject(AuthService);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(false);
  searchQuery = '';
  selectedCategory: string | null = null;
  showNewProduct = false;

  filteredProducts = () => {
    let items = this.products();

    if (this.selectedCategory) {
      items = items.filter(p => p.categoryId === this.selectedCategory);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      items = items.filter(p =>
        p.nombre.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      );
    }

    return items;
  };

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

  editProduct(product: Product) {
    console.log('Edit product:', product);
  }

  formatPrice(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  }
}
