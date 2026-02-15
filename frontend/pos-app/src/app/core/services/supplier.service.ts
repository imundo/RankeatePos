import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Supplier {
    id: string;
    nombre: string;
    rut: string;
    email: string;
    telefono: string;
    direccion: string;
    contacto: string;
    plazoPago: string;
    activo: boolean;
}

export interface SupplierProduct {
    id: string;
    supplierId: string;
    productVariantId: string;
    productVariantName: string;
    supplierSku: string;
    lastCost: number;
}

@Injectable({
    providedIn: 'root'
})
export class SupplierService {
    private apiUrl = `${environment.apiUrl}/suppliers`;

    constructor(private http: HttpClient) { }

    getSuppliers(filter?: string, page = 0, size = 10): Observable<any> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        if (filter) {
            params = params.set('filter', filter);
        }

        return this.http.get<any>(this.apiUrl, { params });
    }

    getActiveSuppliers(): Observable<Supplier[]> {
        return this.http.get<Supplier[]>(`${this.apiUrl}/active`);
    }

    getSupplier(id: string): Observable<Supplier> {
        return this.http.get<Supplier>(`${this.apiUrl}/${id}`);
    }

    createSupplier(supplier: Partial<Supplier>): Observable<Supplier> {
        return this.http.post<Supplier>(this.apiUrl, supplier);
    }

    updateSupplier(id: string, supplier: Partial<Supplier>): Observable<Supplier> {
        return this.http.put<Supplier>(`${this.apiUrl}/${id}`, supplier);
    }

    deleteSupplier(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    // Supplier Products
    getSupplierProducts(supplierId: string): Observable<SupplierProduct[]> {
        return this.http.get<SupplierProduct[]>(`${this.apiUrl}/${supplierId}/products`);
    }

    addSupplierProduct(supplierId: string, product: { productVariantId: string; supplierSku: string; lastCost: number }): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/${supplierId}/products`, product);
    }

    removeSupplierProduct(supplierId: string, productVariantId: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${supplierId}/products/${productVariantId}`);
    }
}
