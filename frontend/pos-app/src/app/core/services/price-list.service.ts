import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface PriceList {
    id: string;
    nombre: string;
    descripcion?: string;
    tipo: 'GENERAL' | 'SUCURSAL' | 'CLIENTE' | 'TEMPORAL';
    sucursalId?: string;
    clienteId?: string;
    fechaInicio?: string;
    fechaFin?: string;
    prioridad: number;
    activa: boolean;
    productCount: number;
    createdAt?: string;
}

export interface PriceListItem {
    id: string;
    productoId: string;
    precio: number;
    descuento?: number;
    precioMinimo?: number;
}

export interface CreatePriceListRequest {
    nombre: string;
    descripcion?: string;
    tipo: 'GENERAL' | 'SUCURSAL' | 'CLIENTE' | 'TEMPORAL';
    sucursalId?: string;
    clienteId?: string;
    fechaInicio?: string;
    fechaFin?: string;
    prioridad?: number;
}

export interface SetPriceRequest {
    productoId: string;
    precio: number;
    descuento?: number;
}

@Injectable({
    providedIn: 'root'
})
export class PriceListService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/price-lists`;

    // ============ CRUD ============

    getAll(): Observable<PriceList[]> {
        return this.http.get<PriceList[]>(this.baseUrl);
    }

    getActive(): Observable<PriceList[]> {
        return this.http.get<PriceList[]>(`${this.baseUrl}/active`);
    }

    getById(id: string): Observable<PriceList> {
        return this.http.get<PriceList>(`${this.baseUrl}/${id}`);
    }

    create(request: CreatePriceListRequest): Observable<PriceList> {
        return this.http.post<PriceList>(this.baseUrl, request);
    }

    update(id: string, data: Partial<PriceList>): Observable<PriceList> {
        return this.http.put<PriceList>(`${this.baseUrl}/${id}`, data);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    // ============ ITEMS ============

    getItems(priceListId: string): Observable<PriceListItem[]> {
        return this.http.get<PriceListItem[]>(`${this.baseUrl}/${priceListId}/items`);
    }

    setPrice(priceListId: string, request: SetPriceRequest): Observable<PriceListItem> {
        return this.http.post<PriceListItem>(`${this.baseUrl}/${priceListId}/items`, request);
    }

    // ============ PRICE RESOLUTION ============

    resolvePrice(productoId: string, precioBase: number, sucursalId?: string, clienteId?: string): Observable<number> {
        let url = `${this.baseUrl}/resolve?productoId=${productoId}&precioBase=${precioBase}`;
        if (sucursalId) url += `&sucursalId=${sucursalId}`;
        if (clienteId) url += `&clienteId=${clienteId}`;
        return this.http.get<number>(url);
    }
}
