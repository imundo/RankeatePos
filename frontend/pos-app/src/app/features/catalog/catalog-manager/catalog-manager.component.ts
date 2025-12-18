import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { TabViewModule } from 'primeng/tabview';

import { AuthService } from '@core/auth/auth.service';
import { environment } from '@env/environment';

interface Category {
    id: string;
    nombre: string;
    descripcion?: string;
    orden: number;
    activa: boolean;
    icon?: string;
}

interface Product {
    id: string;
    sku: string;
    nombre: string;
    descripcion?: string;
    categoryId?: string;
    categoryName?: string;
    imagenUrl?: string;
    activo: boolean;
    variants: ProductVariant[];
}

interface ProductVariant {
    id: string;
    sku: string;
    precioBruto: number;
    precioNeto: number;
    costo?: number;
    stock?: number;
}

@Component({
    selector: 'app-catalog-manager',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        InputTextModule,
        DialogModule,
        ToastModule,
        DropdownModule,
        InputNumberModule,
        TabViewModule
    ],
    providers: [MessageService],
    template: `
    <div class="catalog-manager">
      <!-- Header -->
      <header class="manager-header">
        <div>
          <h1>📦 Gestión de Catálogo</h1>
          <p class="text-muted">Administra categorías y productos</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline" routerLink="/pos">
            ← Volver al POS
          </button>
        </div>
      </header>

      <!-- Tabs -->
      <div class="tabs-container">
        <button 
          class="tab-btn" 
          [class.active]="activeTab === 'categories'"
          (click)="activeTab = 'categories'"
        >
          📁 Categorías
        </button>
        <button 
          class="tab-btn" 
          [class.active]="activeTab === 'products'"
          (click)="activeTab = 'products'"
        >
          🏷️ Productos
        </button>
      </div>

      <!-- Categories Tab -->
      @if (activeTab === 'categories') {
        <section class="tab-content fade-in-up">
          <div class="section-header">
            <h2>Categorías</h2>
            <button class="btn btn-primary" (click)="openCategoryDialog()">
              + Nueva Categoría
            </button>
          </div>

          <div class="cards-grid">
            @for (category of categories(); track category.id) {
              <div class="category-card">
                <div class="category-icon">{{ getCategoryIcon(category.nombre) }}</div>
                <div class="category-info">
                  <h3>{{ category.nombre }}</h3>
                  <p class="text-muted">{{ category.descripcion || 'Sin descripción' }}</p>
                  <span class="badge badge-success">{{ getProductsInCategory(category.id) }} productos</span>
                </div>
                <div class="card-actions">
                  <button class="icon-btn" (click)="editCategory(category)">✏️</button>
                  <button class="icon-btn danger" (click)="deleteCategory(category)">🗑️</button>
                </div>
              </div>
            }
            
            @if (categories().length === 0) {
              <div class="empty-state">
                <div style="font-size: 4rem">📁</div>
                <p>No hay categorías</p>
                <button class="btn btn-primary" (click)="openCategoryDialog()">
                  Crear primera categoría
                </button>
              </div>
            }
          </div>
        </section>
      }

      <!-- Products Tab -->
      @if (activeTab === 'products') {
        <section class="tab-content fade-in-up">
          <div class="section-header">
            <h2>Productos</h2>
            <div class="header-actions">
              <select [(ngModel)]="filterCategory" class="filter-select">
                <option value="">Todas las categorías</option>
                @for (cat of categories(); track cat.id) {
                  <option [value]="cat.id">{{ cat.nombre }}</option>
                }
              </select>
              <button class="btn btn-primary" (click)="openProductDialog()">
                + Nuevo Producto
              </button>
            </div>
          </div>

          <div class="products-table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Imagen</th>
                  <th>SKU</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (product of filteredProducts(); track product.id) {
                  <tr>
                    <td>
                      <div class="product-thumb">
                        @if (product.imagenUrl) {
                          <img [src]="product.imagenUrl" [alt]="product.nombre" />
                        } @else {
                          <span>{{ getCategoryIcon(product.categoryName || 'Otro') }}</span>
                        }
                      </div>
                    </td>
                    <td><code>{{ product.sku }}</code></td>
                    <td>{{ product.nombre }}</td>
                    <td>
                      <span class="badge">{{ product.categoryName || 'Sin categoría' }}</span>
                    </td>
                    <td class="text-success">{{ formatPrice(product.variants[0]?.precioBruto || 0) }}</td>
                    <td>
                      <div class="actions">
                        <button class="icon-btn" (click)="editProduct(product)">✏️</button>
                        <button class="icon-btn danger" (click)="deleteProduct(product)">🗑️</button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
            
            @if (filteredProducts().length === 0) {
              <div class="empty-state" style="padding: 3rem">
                <div style="font-size: 4rem">🏷️</div>
                <p>No hay productos</p>
                <button class="btn btn-primary" (click)="openProductDialog()">
                  Crear primer producto
                </button>
              </div>
            }
          </div>
        </section>
      }

      <!-- Category Dialog -->
      <p-dialog 
        [(visible)]="showCategoryDialog" 
        [header]="editingCategory ? 'Editar Categoría' : 'Nueva Categoría'"
        [modal]="true"
        [style]="{width: '90vw', maxWidth: '500px'}"
      >
        <div class="form-content">
          <div class="input-group">
            <label class="input-label">Nombre *</label>
            <input type="text" [(ngModel)]="categoryForm.nombre" placeholder="Ej: Panadería" />
          </div>
          <div class="input-group">
            <label class="input-label">Descripción</label>
            <input type="text" [(ngModel)]="categoryForm.descripcion" placeholder="Descripción opcional" />
          </div>
          <div class="input-group">
            <label class="input-label">Orden</label>
            <input type="number" [(ngModel)]="categoryForm.orden" min="1" />
          </div>
        </div>
        <div class="form-actions">
          <button class="btn btn-outline" (click)="showCategoryDialog = false">Cancelar</button>
          <button class="btn btn-primary" (click)="saveCategory()" [disabled]="!categoryForm.nombre">
            {{ editingCategory ? 'Guardar' : 'Crear' }}
          </button>
        </div>
      </p-dialog>

      <!-- Product Dialog -->
      <p-dialog 
        [(visible)]="showProductDialog" 
        [header]="editingProduct ? 'Editar Producto' : 'Nuevo Producto'"
        [modal]="true"
        [style]="{width: '90vw', maxWidth: '600px'}"
      >
        <div class="form-content">
          <div class="form-grid">
            <div class="input-group">
              <label class="input-label">SKU *</label>
              <input type="text" [(ngModel)]="productForm.sku" placeholder="Ej: PAN-001" />
            </div>
            <div class="input-group">
              <label class="input-label">Nombre *</label>
              <input type="text" [(ngModel)]="productForm.nombre" placeholder="Ej: Marraqueta" />
            </div>
          </div>
          
          <div class="input-group">
            <label class="input-label">Categoría</label>
            <select [(ngModel)]="productForm.categoryId">
              <option value="">Sin categoría</option>
              @for (cat of categories(); track cat.id) {
                <option [value]="cat.id">{{ cat.nombre }}</option>
              }
            </select>
          </div>

          <div class="input-group">
            <label class="input-label">Descripción</label>
            <input type="text" [(ngModel)]="productForm.descripcion" placeholder="Descripción del producto" />
          </div>

          <div class="form-grid">
            <div class="input-group">
              <label class="input-label">Precio Bruto (IVA inc.) *</label>
              <input type="number" [(ngModel)]="productForm.precioBruto" min="0" placeholder="2000" />
            </div>
            <div class="input-group">
              <label class="input-label">Costo</label>
              <input type="number" [(ngModel)]="productForm.costo" min="0" placeholder="1000" />
            </div>
          </div>

          <!-- Image Upload -->
          <div class="input-group">
            <label class="input-label">Imagen del Producto</label>
            <div 
              class="dropzone"
              [class.dragover]="isDragover"
              (dragover)="onDragOver($event)"
              (dragleave)="isDragover = false"
              (drop)="onDrop($event)"
              (click)="fileInput.click()"
            >
              @if (productForm.imagenUrl) {
                <img [src]="productForm.imagenUrl" class="dropzone-preview" />
                <button class="btn btn-outline mt-2" (click)="productForm.imagenUrl = ''; $event.stopPropagation()">
                  Quitar imagen
                </button>
              } @else {
                <div class="dropzone-icon">📷</div>
                <p class="dropzone-text">Arrastra una imagen o haz clic para seleccionar</p>
              }
            </div>
            <input 
              #fileInput 
              type="file" 
              accept="image/*" 
              style="display: none"
              (change)="onFileSelect($event)"
            />
          </div>
        </div>
        <div class="form-actions">
          <button class="btn btn-outline" (click)="showProductDialog = false">Cancelar</button>
          <button class="btn btn-primary" (click)="saveProduct()" [disabled]="!productForm.sku || !productForm.nombre">
            {{ editingProduct ? 'Guardar' : 'Crear' }}
          </button>
        </div>
      </p-dialog>
    </div>

    <p-toast position="bottom-center"></p-toast>
  `,
    styles: [`
    .catalog-manager {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      padding: 1.5rem;
    }

    .manager-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      
      h1 {
        font-size: 1.75rem;
        margin: 0 0 0.5rem 0;
        background: linear-gradient(135deg, #6366F1, #EC4899);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    }

    .tabs-container {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      padding: 0.5rem;
      background: rgba(255,255,255,0.05);
      border-radius: 12px;
      width: fit-content;
    }

    .tab-btn {
      padding: 0.75rem 1.5rem;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s ease;
      
      &:hover {
        background: rgba(255,255,255,0.05);
      }
      
      &.active {
        background: var(--primary-gradient);
        color: white;
      }
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      
      h2 {
        margin: 0;
        font-size: 1.25rem;
      }
      
      .header-actions {
        display: flex;
        gap: 1rem;
        align-items: center;
      }
    }

    .filter-select {
      padding: 0.75rem 1rem;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      color: white;
      min-width: 200px;
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }

    .category-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      background: var(--glass-bg);
      backdrop-filter: blur(var(--glass-blur));
      border: 1px solid var(--glass-border);
      border-radius: var(--border-radius);
      transition: var(--transition);
      
      &:hover {
        border-color: var(--primary-color);
        transform: translateY(-2px);
      }
      
      .category-icon {
        font-size: 2.5rem;
      }
      
      .category-info {
        flex: 1;
        
        h3 {
          margin: 0 0 0.25rem 0;
          font-size: 1.1rem;
        }
        
        p {
          margin: 0 0 0.5rem 0;
          font-size: 0.875rem;
        }
      }
      
      .card-actions {
        display: flex;
        gap: 0.5rem;
      }
    }

    .products-table-container {
      background: var(--glass-bg);
      backdrop-filter: blur(var(--glass-blur));
      border: 1px solid var(--glass-border);
      border-radius: var(--border-radius);
      overflow: hidden;
    }

    .product-thumb {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      background: var(--surface-section);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      span {
        font-size: 1.5rem;
      }
    }

    code {
      background: rgba(99, 102, 241, 0.2);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
    }

    .form-content {
      padding: 1rem 0;
    }

    .badge {
      display: inline-flex;
      padding: 0.25rem 0.75rem;
      background: rgba(255,255,255,0.1);
      border-radius: 999px;
      font-size: 0.75rem;
    }

    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 3rem;
      color: var(--text-muted);
    }
  `]
})
export class CatalogManagerComponent implements OnInit {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private messageService = inject(MessageService);

    // State
    categories = signal<Category[]>([]);
    products = signal<Product[]>([]);
    activeTab: 'categories' | 'products' = 'categories';
    filterCategory = '';

    // Dialog state
    showCategoryDialog = false;
    showProductDialog = false;
    editingCategory: Category | null = null;
    editingProduct: Product | null = null;
    isDragover = false;

    // Form models
    categoryForm = {
        nombre: '',
        descripcion: '',
        orden: 1
    };

    productForm = {
        sku: '',
        nombre: '',
        descripcion: '',
        categoryId: '',
        precioBruto: 0,
        costo: 0,
        imagenUrl: ''
    };

    // Category icons
    private categoryIcons: Record<string, string> = {
        'panadería': '🥖', 'panaderia': '🥖', 'panes': '🥖',
        'pastelería': '🍰', 'pasteleria': '🍰', 'pasteles': '🍰',
        'empanadas': '🥟',
        'cafetería': '☕', 'cafeteria': '☕', 'café': '☕',
        'bebidas': '🥤', 'bebidas frías': '🥤',
        'galletas': '🍪',
        'snacks': '🍿',
        'lácteos': '🥛', 'lacteos': '🥛',
        'abarrotes': '🛒',
        'limpieza': '🧹'
    };

    filteredProducts = computed(() => {
        if (!this.filterCategory) return this.products();
        return this.products().filter(p => p.categoryId === this.filterCategory);
    });

    ngOnInit(): void {
        this.loadData();
    }

    async loadData(): Promise<void> {
        const tenantId = this.authService.tenant()?.id;
        if (!tenantId) return;

        const headers = { 'X-Tenant-Id': tenantId };

        try {
            const [cats, prods] = await Promise.all([
                this.http.get<Category[]>(`${environment.catalogUrl}/categories`, { headers }).toPromise(),
                this.http.get<any>(`${environment.catalogUrl}/products`, { headers }).toPromise()
            ]);

            this.categories.set(cats || []);
            this.products.set(prods?.content || prods || []);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    getCategoryIcon(name: string): string {
        return this.categoryIcons[name.toLowerCase()] || '📦';
    }

    getProductsInCategory(categoryId: string): number {
        return this.products().filter(p => p.categoryId === categoryId).length;
    }

    formatPrice(value: number): string {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
    }

    // Category CRUD
    openCategoryDialog(category?: Category): void {
        this.editingCategory = category || null;
        this.categoryForm = {
            nombre: category?.nombre || '',
            descripcion: category?.descripcion || '',
            orden: category?.orden || this.categories().length + 1
        };
        this.showCategoryDialog = true;
    }

    editCategory(category: Category): void {
        this.openCategoryDialog(category);
    }

    async saveCategory(): Promise<void> {
        const tenantId = this.authService.tenant()?.id;
        if (!tenantId) return;

        const headers = { 'X-Tenant-Id': tenantId };

        try {
            if (this.editingCategory) {
                await this.http.put(
                    `${environment.catalogUrl}/categories/${this.editingCategory.id}`,
                    this.categoryForm,
                    { headers }
                ).toPromise();
            } else {
                await this.http.post(
                    `${environment.catalogUrl}/categories`,
                    this.categoryForm,
                    { headers }
                ).toPromise();
            }

            this.messageService.add({ severity: 'success', summary: 'Categoría guardada' });
            this.showCategoryDialog = false;
            this.loadData();
        } catch (error) {
            this.messageService.add({ severity: 'error', summary: 'Error al guardar categoría' });
        }
    }

    async deleteCategory(category: Category): Promise<void> {
        if (!confirm(`¿Eliminar categoría "${category.nombre}"?`)) return;

        const tenantId = this.authService.tenant()?.id;
        if (!tenantId) return;

        try {
            await this.http.delete(
                `${environment.catalogUrl}/categories/${category.id}`,
                { headers: { 'X-Tenant-Id': tenantId } }
            ).toPromise();

            this.messageService.add({ severity: 'success', summary: 'Categoría eliminada' });
            this.loadData();
        } catch (error) {
            this.messageService.add({ severity: 'error', summary: 'Error al eliminar' });
        }
    }

    // Product CRUD
    openProductDialog(product?: Product): void {
        this.editingProduct = product || null;
        this.productForm = {
            sku: product?.sku || '',
            nombre: product?.nombre || '',
            descripcion: product?.descripcion || '',
            categoryId: product?.categoryId || '',
            precioBruto: product?.variants?.[0]?.precioBruto || 0,
            costo: product?.variants?.[0]?.costo || 0,
            imagenUrl: product?.imagenUrl || ''
        };
        this.showProductDialog = true;
    }

    editProduct(product: Product): void {
        this.openProductDialog(product);
    }

    async saveProduct(): Promise<void> {
        const tenantId = this.authService.tenant()?.id;
        if (!tenantId) return;

        const headers = {
            'X-Tenant-Id': tenantId,
            'X-User-Id': this.authService.user()?.id || ''
        };

        const payload = {
            sku: this.productForm.sku,
            nombre: this.productForm.nombre,
            descripcion: this.productForm.descripcion,
            categoryId: this.productForm.categoryId || null,
            imagenUrl: this.productForm.imagenUrl,
            variants: [{
                sku: this.productForm.sku,
                precioBruto: this.productForm.precioBruto,
                precioNeto: Math.round(this.productForm.precioBruto / 1.19),
                costo: this.productForm.costo
            }]
        };

        try {
            if (this.editingProduct) {
                await this.http.put(
                    `${environment.catalogUrl}/products/${this.editingProduct.id}`,
                    payload,
                    { headers }
                ).toPromise();
            } else {
                await this.http.post(
                    `${environment.catalogUrl}/products`,
                    payload,
                    { headers }
                ).toPromise();
            }

            this.messageService.add({ severity: 'success', summary: 'Producto guardado' });
            this.showProductDialog = false;
            this.loadData();
        } catch (error) {
            this.messageService.add({ severity: 'error', summary: 'Error al guardar producto' });
        }
    }

    async deleteProduct(product: Product): Promise<void> {
        if (!confirm(`¿Eliminar producto "${product.nombre}"?`)) return;

        const tenantId = this.authService.tenant()?.id;
        if (!tenantId) return;

        try {
            await this.http.delete(
                `${environment.catalogUrl}/products/${product.id}`,
                { headers: { 'X-Tenant-Id': tenantId, 'X-User-Id': this.authService.user()?.id || '' } }
            ).toPromise();

            this.messageService.add({ severity: 'success', summary: 'Producto eliminado' });
            this.loadData();
        } catch (error) {
            this.messageService.add({ severity: 'error', summary: 'Error al eliminar' });
        }
    }

    // Image handling
    onDragOver(event: DragEvent): void {
        event.preventDefault();
        this.isDragover = true;
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        this.isDragover = false;

        const file = event.dataTransfer?.files[0];
        if (file && file.type.startsWith('image/')) {
            this.handleImageFile(file);
        }
    }

    onFileSelect(event: Event): void {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
            this.handleImageFile(file);
        }
    }

    private handleImageFile(file: File): void {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.productForm.imagenUrl = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    }
}
