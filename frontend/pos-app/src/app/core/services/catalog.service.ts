import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { AuthService } from '../auth/auth.service';

// DTOs
export interface PageResponse<T> {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}

export interface Category {
    id: string;
    nombre: string;
    descripcion?: string;
    parentId?: string;
    parentName?: string;
    orden: number;
    activa: boolean;
    children?: Category[];
}

export interface CategoryRequest {
    nombre: string;
    descripcion?: string;
    parentId?: string;
    orden?: number;
}

export interface ProductVariant {
    id: string;
    sku: string;
    codigoBarra?: string;
    nombre?: string;
    precioBruto: number;
    precioNeto: number;
    stock: number;
    stockMinimo: number;
    activo: boolean;
}

export interface Product {
    id: string;
    sku: string;
    nombre: string;
    descripcion?: string;
    categoryId?: string;
    categoryName?: string;
    unidad: string;
    tipoProducto: string;
    activo: boolean;
    variants: ProductVariant[];
}

export interface ProductRequest {
    sku: string;
    nombre: string;
    descripcion?: string;
    categoryId?: string;
    unidadId?: string;
    tipoProducto: string;
    variants: VariantRequest[];
}

export interface VariantRequest {
    sku: string;
    codigoBarra?: string;
    nombre?: string;
    precioBruto: number;
    stock?: number;
    stockMinimo?: number;
}

@Injectable({
    providedIn: 'root'
})
export class CatalogService {
    private baseUrl = environment.catalogUrl || 'http://localhost:8082/api';

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    private getHeaders() {
        return {
            'X-Tenant-Id': this.authService.getTenantId() || '',
            'X-User-Id': this.authService.getUserId() || ''
        };
    }

    // ========== CATEGORIES ==========

    getCategories(): Observable<Category[]> {
        return this.http.get<Category[]>(`${this.baseUrl}/categories`, {
            headers: this.getHeaders()
        });
    }

    getCategoryTree(): Observable<Category[]> {
        return this.http.get<Category[]>(`${this.baseUrl}/categories/tree`, {
            headers: this.getHeaders()
        });
    }

    getCategory(id: string): Observable<Category> {
        return this.http.get<Category>(`${this.baseUrl}/categories/${id}`, {
            headers: this.getHeaders()
        });
    }

    createCategory(request: CategoryRequest): Observable<Category> {
        return this.http.post<Category>(`${this.baseUrl}/categories`, request, {
            headers: this.getHeaders()
        });
    }

    updateCategory(id: string, request: CategoryRequest): Observable<Category> {
        return this.http.put<Category>(`${this.baseUrl}/categories/${id}`, request, {
            headers: this.getHeaders()
        });
    }

    deleteCategory(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/categories/${id}`, {
            headers: this.getHeaders()
        });
    }

    // ========== PRODUCTS ==========

    getProducts(page = 0, size = 20, search?: string): Observable<PageResponse<Product>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        if (search) {
            params = params.set('search', search);
        }

        return this.http.get<PageResponse<Product>>(`${this.baseUrl}/products`, {
            headers: this.getHeaders(),
            params
        });
    }

    getProductsForSync(): Observable<Product[]> {
        return this.http.get<Product[]>(`${this.baseUrl}/products/sync`, {
            headers: this.getHeaders()
        });
    }

    getProduct(id: string): Observable<Product> {
        return this.http.get<Product>(`${this.baseUrl}/products/${id}`, {
            headers: this.getHeaders()
        });
    }

    lookupByCode(code: string): Observable<ProductVariant> {
        return this.http.get<ProductVariant>(`${this.baseUrl}/products/lookup/${code}`, {
            headers: this.getHeaders()
        });
    }

    createProduct(request: ProductRequest): Observable<Product> {
        return this.http.post<Product>(`${this.baseUrl}/products`, request, {
            headers: this.getHeaders()
        });
    }

    updateProduct(id: string, request: ProductRequest): Observable<Product> {
        return this.http.put<Product>(`${this.baseUrl}/products/${id}`, request, {
            headers: this.getHeaders()
        });
    }

    deleteProduct(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/products/${id}`, {
            headers: this.getHeaders()
        });
    }
}
