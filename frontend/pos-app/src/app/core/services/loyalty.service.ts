import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { AuthService } from '../auth/auth.service';

// ========== DTOs ==========

export interface LoyaltyCustomer {
    id: string;
    nombre: string;
    email: string;
    telefono: string;
    puntosActuales: number;
    puntosTotales: number;
    nivel: 'BRONCE' | 'PLATA' | 'ORO' | 'PLATINO';
    fechaRegistro: string;
    ultimaCompra: string;
    activo: boolean;
}

export interface LoyaltyTransaction {
    id: string;
    customerId: string;
    tipo: 'EARN' | 'REDEEM';
    puntos: number;
    descripcion: string;
    ventaId?: string;
    createdAt: string;
}

export interface Reward {
    id: string;
    nombre: string;
    descripcion: string;
    puntosRequeridos: number;
    tipo: string;
    valor: number;
    activo: boolean;
}

export interface LoyaltyStats {
    totalCustomers: number;
    totalPointsInCirculation: number;
    activeRewards: number;
}

export interface CreateCustomerRequest {
    nombre: string;
    email?: string;
    telefono?: string;
}

export interface AddPointsRequest {
    puntos: number;
    descripcion?: string;
    ventaId?: string;
}

@Injectable({
    providedIn: 'root'
})
export class LoyaltyService {
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

    // ========== CUSTOMERS ==========

    getCustomers(page = 0, size = 20): Observable<any> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        return this.http.get<any>(`${this.baseUrl}/loyalty/customers`, {
            headers: this.getHeaders(),
            params
        });
    }

    searchCustomers(query: string): Observable<LoyaltyCustomer[]> {
        return this.http.get<LoyaltyCustomer[]>(`${this.baseUrl}/loyalty/customers/search`, {
            headers: this.getHeaders(),
            params: { q: query }
        });
    }

    getCustomer(id: string): Observable<LoyaltyCustomer> {
        return this.http.get<LoyaltyCustomer>(`${this.baseUrl}/loyalty/customers/${id}`, {
            headers: this.getHeaders()
        });
    }

    createCustomer(request: CreateCustomerRequest): Observable<LoyaltyCustomer> {
        return this.http.post<LoyaltyCustomer>(`${this.baseUrl}/loyalty/customers`, request, {
            headers: this.getHeaders()
        });
    }

    updateCustomer(id: string, request: CreateCustomerRequest): Observable<LoyaltyCustomer> {
        return this.http.put<LoyaltyCustomer>(`${this.baseUrl}/loyalty/customers/${id}`, request, {
            headers: this.getHeaders()
        });
    }

    // ========== POINTS ==========

    addPoints(customerId: string, request: AddPointsRequest): Observable<LoyaltyTransaction> {
        return this.http.post<LoyaltyTransaction>(`${this.baseUrl}/loyalty/customers/${customerId}/points`, request, {
            headers: this.getHeaders()
        });
    }

    redeemPoints(customerId: string, request: AddPointsRequest): Observable<LoyaltyTransaction> {
        return this.http.post<LoyaltyTransaction>(`${this.baseUrl}/loyalty/customers/${customerId}/redeem`, request, {
            headers: this.getHeaders()
        });
    }

    getTransactions(customerId: string): Observable<LoyaltyTransaction[]> {
        return this.http.get<LoyaltyTransaction[]>(`${this.baseUrl}/loyalty/customers/${customerId}/transactions`, {
            headers: this.getHeaders()
        });
    }

    // ========== REWARDS ==========

    getRewards(): Observable<Reward[]> {
        return this.http.get<Reward[]>(`${this.baseUrl}/loyalty/rewards`, {
            headers: this.getHeaders()
        });
    }

    // ========== STATS ==========

    getStats(): Observable<LoyaltyStats> {
        return this.http.get<LoyaltyStats>(`${this.baseUrl}/loyalty/stats`, {
            headers: this.getHeaders()
        });
    }
}
