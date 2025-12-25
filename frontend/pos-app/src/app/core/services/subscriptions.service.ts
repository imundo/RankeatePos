import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { AuthService } from '../auth/auth.service';

// ========== DTOs ==========

export interface SubscriptionPlan {
    id: string;
    nombre: string;
    descripcion: string;
    frecuencia: 'DIARIA' | 'SEMANAL' | 'QUINCENAL' | 'MENSUAL';
    precio: number;
    productos: string; // JSON string
    activo: boolean;
}

export interface Subscription {
    id: string;
    plan?: SubscriptionPlan;
    clienteNombre: string;
    clienteTelefono?: string;
    clienteEmail?: string;
    direccionEntrega: string;
    comuna?: string;
    notasEntrega?: string;
    estado: 'ACTIVA' | 'PAUSADA' | 'CANCELADA';
    proximaEntrega?: string;
    fechaInicio: string;
    fechaPausa?: string;
    fechaCancelacion?: string;
    totalEntregas: number;
}

export interface SubscriptionDelivery {
    id: string;
    subscription?: Subscription;
    fecha: string;
    horaProgramada?: string;
    horaEntrega?: string;
    estado: 'PENDIENTE' | 'EN_RUTA' | 'ENTREGADO' | 'FALLIDO' | 'REPROGRAMADO';
    direccion: string;
    notas?: string;
}

export interface SubscriptionStats {
    activeSubscriptions: number;
    monthlyRevenue: number;
    pendingDeliveries: number;
}

export interface CreateSubscriptionRequest {
    planId: string;
    clienteNombre: string;
    clienteTelefono?: string;
    direccionEntrega: string;
    comuna?: string;
    fechaInicio?: string;
}

@Injectable({
    providedIn: 'root'
})
export class SubscriptionsService {
    private baseUrl = environment.apiUrl || 'http://localhost:8080/api';

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    private getHeaders() {
        return {
            'X-Tenant-ID': this.authService.getTenantId() || '',
            'Authorization': `Bearer ${this.authService.getToken()}`
        };
    }

    // ========== PLANS ==========

    getPlans(activeOnly = true): Observable<SubscriptionPlan[]> {
        return this.http.get<SubscriptionPlan[]>(`${this.baseUrl}/subscriptions/plans`, {
            headers: this.getHeaders(),
            params: { activeOnly: activeOnly.toString() }
        });
    }

    // ========== SUBSCRIPTIONS ==========

    getSubscriptions(activeOnly = false): Observable<Subscription[]> {
        return this.http.get<Subscription[]>(`${this.baseUrl}/subscriptions`, {
            headers: this.getHeaders(),
            params: { activeOnly: activeOnly.toString() }
        });
    }

    getSubscription(id: string): Observable<Subscription> {
        return this.http.get<Subscription>(`${this.baseUrl}/subscriptions/${id}`, {
            headers: this.getHeaders()
        });
    }

    createSubscription(request: CreateSubscriptionRequest): Observable<Subscription> {
        return this.http.post<Subscription>(`${this.baseUrl}/subscriptions`, request, {
            headers: this.getHeaders()
        });
    }

    updateStatus(id: string, estado: string): Observable<Subscription> {
        return this.http.put<Subscription>(`${this.baseUrl}/subscriptions/${id}/status`, { estado }, {
            headers: this.getHeaders()
        });
    }

    // ========== DELIVERIES ==========

    getDeliveries(date?: string, pendingOnly = false): Observable<SubscriptionDelivery[]> {
        let params = new HttpParams();
        if (date) {
            params = params.set('date', date);
        }
        params = params.set('pendingOnly', pendingOnly.toString());

        return this.http.get<SubscriptionDelivery[]>(`${this.baseUrl}/subscriptions/deliveries`, {
            headers: this.getHeaders(),
            params
        });
    }

    updateDeliveryStatus(id: string, estado: string): Observable<SubscriptionDelivery> {
        return this.http.put<SubscriptionDelivery>(`${this.baseUrl}/subscriptions/deliveries/${id}/status`, { estado }, {
            headers: this.getHeaders()
        });
    }

    // ========== STATS ==========

    getStats(): Observable<SubscriptionStats> {
        return this.http.get<SubscriptionStats>(`${this.baseUrl}/subscriptions/stats`, {
            headers: this.getHeaders()
        });
    }
}
