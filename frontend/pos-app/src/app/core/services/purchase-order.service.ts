import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Supplier } from './supplier.service';

export enum PurchaseOrderStatus {
    DRAFT = 'DRAFT',
    PENDING_APPROVAL = 'PENDING_APPROVAL',
    APPROVED = 'APPROVED',
    SENT = 'SENT',
    PARTIAL = 'PARTIAL',
    RECEIVED = 'RECEIVED',
    CANCELLED = 'CANCELLED'
}

export interface PurchaseOrderItem {
    id: string;
    productVariantId: string;
    productVariantName: string;
    sku: string;
    quantity: number;
    unitCost: number;
    subtotal: number;
}

export interface PurchaseOrder {
    id: string;
    orderNumber: number;
    supplier: Supplier;
    status: PurchaseOrderStatus;
    expectedDeliveryDate?: string;
    totalAmount: number;
    notes?: string;
    items: PurchaseOrderItem[];
    createdAt: string;
    updatedAt?: string;
}

export interface CreatePurchaseOrderRequest {
    supplierId: string;
    expectedDeliveryDate?: string;
    notes?: string;
    items: CreatePurchaseOrderItemRequest[];
}

export interface CreatePurchaseOrderItemRequest {
    productVariantId: string;
    productName: string;
    productSku: string;
    quantity: number;
    unitCost: number;
}

@Injectable({
    providedIn: 'root'
})
export class PurchaseOrderService {
    // Apuntamos al BFF Gateway en lugar del microservicio directo
    private apiUrl = `${environment.apiUrl}/purchases/orders`;

    constructor(private http: HttpClient) { }

    getOrders(status?: string): Observable<PurchaseOrder[]> {
        let params = new HttpParams();
        if (status && status !== 'ALL') {
            params = params.set('status', status);
        }
        return this.http.get<PurchaseOrder[]>(this.apiUrl, { params });
    }

    getOrder(id: string): Observable<PurchaseOrder> {
        return this.http.get<PurchaseOrder>(`${this.apiUrl}/${id}`);
    }

    createOrder(request: CreatePurchaseOrderRequest): Observable<PurchaseOrder> {
        return this.http.post<PurchaseOrder>(this.apiUrl, request);
    }

    submitOrder(id: string): Observable<PurchaseOrder> {
        return this.http.post<PurchaseOrder>(`${this.apiUrl}/${id}/submit`, {});
    }

    sendOrder(id: string): Observable<PurchaseOrder> {
        return this.http.post<PurchaseOrder>(`${this.apiUrl}/${id}/send`, {});
    }

    receiveOrder(id: string): Observable<PurchaseOrder> {
        return this.http.post<PurchaseOrder>(`${this.apiUrl}/${id}/receive`, {});
    }

    cancelOrder(id: string): Observable<PurchaseOrder> {
        return this.http.post<PurchaseOrder>(`${this.apiUrl}/${id}/cancel`, {});
    }

    deleteOrder(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
