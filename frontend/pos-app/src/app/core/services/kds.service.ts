import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { AuthService } from '../auth/auth.service';

// ========== DTOs ==========

export interface KitchenOrderItem {
    id: string;
    productoNombre: string;
    productoId?: string;
    cantidad: number;
    modificadores?: string;
    notas?: string;
    estado: 'PENDIENTE' | 'PREPARANDO' | 'LISTO';
    completadoAt?: string;
}

export interface KitchenOrder {
    id: string;
    numero: string;
    tipo: 'LOCAL' | 'DELIVERY' | 'PICKUP';
    mesa?: string;
    clienteNombre?: string;
    estado: 'PENDIENTE' | 'PREPARANDO' | 'LISTO' | 'ENTREGADO' | 'CANCELADO';
    prioridad: 'BAJA' | 'NORMAL' | 'ALTA' | 'URGENTE';
    notas?: string;
    tiempoIngreso: string;
    tiempoInicioPreparacion?: string;
    tiempoCompletado?: string;
    tiempoEntregado?: string;
    items: KitchenOrderItem[];
}

export interface KdsStats {
    pendientes: number;
    enPreparacion: number;
    listos: number;
    tiempoPromedioMinutos: number;
}

@Injectable({
    providedIn: 'root'
})
export class KdsService {
    private baseUrl = environment.apiUrl || 'http://localhost:8080/api';

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    private getHeaders() {
        return {
            'X-Tenant-ID': this.authService.getTenantId() || '',
            'X-Branch-ID': this.authService.getBranchId() || '',
            'Authorization': `Bearer ${this.authService.getToken()}`
        };
    }

    // ========== ORDERS ==========

    getActiveOrders(): Observable<KitchenOrder[]> {
        return this.http.get<KitchenOrder[]>(`${this.baseUrl}/kds/orders`, {
            headers: this.getHeaders()
        });
    }

    getOrder(id: string): Observable<KitchenOrder> {
        return this.http.get<KitchenOrder>(`${this.baseUrl}/kds/orders/${id}`, {
            headers: this.getHeaders()
        });
    }

    updateOrderStatus(id: string, estado: string): Observable<KitchenOrder> {
        return this.http.put<KitchenOrder>(`${this.baseUrl}/kds/orders/${id}/status`, { estado }, {
            headers: this.getHeaders()
        });
    }

    updateItemStatus(orderId: string, itemId: string, estado: string): Observable<KitchenOrderItem> {
        return this.http.put<KitchenOrderItem>(`${this.baseUrl}/kds/orders/${orderId}/items/${itemId}/status`, { estado }, {
            headers: this.getHeaders()
        });
    }

    // ========== STATS ==========

    getStats(): Observable<KdsStats> {
        return this.http.get<KdsStats>(`${this.baseUrl}/kds/stats`, {
            headers: this.getHeaders()
        });
    }
}
