import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Supplier {
    id: string;
    rut: string;
    businessName: string;
    fantasyName: string;
    name: string;
    giro: string;
    email: string;
    phone: string;
    website: string;
    address: string;
    city: string;
    contactName: string;
    paymentTerms: number;
    discountPercentage: number;
    currency: string;
    bankAccount: string;
    bankName: string;
    category: string;
    deliveryType: string;
    avgDeliveryDays: number;
    trustRating: number;
    totalOrders: number;
    onTimeDeliveries: number;
    totalSpent: number;
    status: string;
    notes: string;
    isActive: boolean;
    createdAt: string;
    // Legacy compat
    nombre?: string;
    contacto?: string;
    telefono?: string;
    direccion?: string;
    plazoPago?: string;
    activo?: boolean;
}

export interface SupplierProduct {
    id: string;
    supplierId: string;
    productVariantId: string;
    productVariantName: string;
    supplierSku: string;
    lastCost: number;
    unitOfMeasure?: string;
}

export interface SupplierStats {
    totalActive: number;
    totalAll: number;
    avgRating: number;
}

export interface PurchaseOrder {
    id: string;
    orderNumber: number;
    orderDate: string;
    subtotal: number;
    taxAmount: number;
    total: number;
    status: string;
    itemsCount?: number;
}

export interface AccountPayable {
    id: string;
    tenantId: string;
    supplierId: string;
    purchaseOrderId?: string;
    orderNumber?: number;
    documentNumber: string;
    documentType: string;
    issueDate: string;
    dueDate: string;
    amount: number;
    balance: number;
    status: string;
    daysLeft?: number;
}

@Injectable({
    providedIn: 'root'
})
export class SupplierService {
    private apiUrl = `${environment.apiUrl}/suppliers`;
    private purchasesUrl = `${environment.apiUrl}/purchases`;

    constructor(private http: HttpClient) { }

    getSuppliers(filter?: string, page = 0, size = 50): Observable<any> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        if (filter) {
            params = params.set('filter', filter);
        }

        return this.http.get<any>(this.apiUrl, { params });
    }

    getActiveSuppliers(): Observable<Supplier[]> {
        return this.http.get<Supplier[]>(`${this.apiUrl}?active=true`);
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

    updateRating(id: string, rating: number): Observable<Supplier> {
        return this.http.put<Supplier>(`${this.purchasesUrl}/suppliers/${id}/rating`, { rating });
    }

    deleteSupplier(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    getStats(): Observable<SupplierStats> {
        return this.http.get<SupplierStats>(`${this.apiUrl}/stats`);
    }

    // Supplier Products
    getSupplierProducts(supplierId: string): Observable<SupplierProduct[]> {
        return this.http.get<SupplierProduct[]>(`${this.apiUrl}/${supplierId}/products`);
    }

    addSupplierProduct(supplierId: string, dto: { productVariantId: string, supplierSku: string, lastCost: number, unitOfMeasure?: string }): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/${supplierId}/products`, dto);
    }

    removeSupplierProduct(supplierId: string, variantId: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${supplierId}/products/${variantId}`);
    }

    // Purchase Orders
    getSupplierOrders(supplierId: string): Observable<PurchaseOrder[]> {
        return this.http.get<PurchaseOrder[]>(`${this.purchasesUrl}/orders/supplier/${supplierId}`);
    }

    // Accounts Payable
    getSupplierPayables(supplierId: string): Observable<AccountPayable[]> {
        return this.http.get<AccountPayable[]>(`${this.purchasesUrl}/payables/supplier/${supplierId}`);
    }

    createPayable(payable: Partial<AccountPayable>): Observable<AccountPayable> {
        return this.http.post<AccountPayable>(`${this.purchasesUrl}/payables`, payable);
    }

    payAccountPayable(id: string): Observable<AccountPayable> {
        return this.http.post<AccountPayable>(`${this.purchasesUrl}/payables/${id}/pay`, {});
    }
}
