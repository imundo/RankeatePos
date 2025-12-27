import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Supplier {
    id: string;
    rut: string;
    businessName: string;
    fantasyName?: string;
    contactName?: string;
    phone?: string;
    email?: string;
    address?: string;
    paymentTerms: number;
    isActive: boolean;
}

export interface PurchaseOrderItem {
    productId?: string;
    productSku?: string;
    productName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    subtotal: number;
}

export interface PurchaseOrder {
    id: string;
    orderNumber: number;
    supplierId: string;
    supplierName: string;
    orderDate: string;
    expectedDeliveryDate?: string;
    subtotal: number;
    taxAmount: number;
    total: number;
    status: 'DRAFT' | 'APPROVED' | 'SENT' | 'PARTIAL' | 'RECEIVED' | 'CANCELLED';
    items: PurchaseOrderItem[];
}

export interface CreatePurchaseOrderRequest {
    supplierId: string;
    expectedDeliveryDate?: string;
    notes?: string;
    items: Partial<PurchaseOrderItem>[];
}

@Injectable({
    providedIn: 'root'
})
export class PurchasesService {
    private baseUrl = `${environment.apiUrl}/api/purchases`;

    constructor(private http: HttpClient) { }

    // Suppliers
    getSuppliers(): Observable<Supplier[]> {
        return this.http.get<Supplier[]>(`${this.baseUrl}/suppliers`);
    }

    getSupplier(id: string): Observable<Supplier> {
        return this.http.get<Supplier>(`${this.baseUrl}/suppliers/${id}`);
    }

    createSupplier(supplier: Partial<Supplier>): Observable<Supplier> {
        return this.http.post<Supplier>(`${this.baseUrl}/suppliers`, supplier);
    }

    // Purchase Orders
    getPurchaseOrders(status?: string): Observable<PurchaseOrder[]> {
        const url = status ? `${this.baseUrl}/orders?status=${status}` : `${this.baseUrl}/orders`;
        return this.http.get<PurchaseOrder[]>(url);
    }

    getPurchaseOrder(id: string): Observable<PurchaseOrder> {
        return this.http.get<PurchaseOrder>(`${this.baseUrl}/orders/${id}`);
    }

    createPurchaseOrder(order: CreatePurchaseOrderRequest): Observable<PurchaseOrder> {
        return this.http.post<PurchaseOrder>(`${this.baseUrl}/orders`, order);
    }

    approvePurchaseOrder(id: string): Observable<PurchaseOrder> {
        return this.http.post<PurchaseOrder>(`${this.baseUrl}/orders/${id}/approve`, {});
    }
}
