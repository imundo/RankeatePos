import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { AuthService } from '../auth/auth.service';

// ========== DTOs ==========

export interface RestaurantTable {
    id: string;
    numero: string;
    capacidad: number;
    ubicacion: string;
    estado: 'DISPONIBLE' | 'OCUPADA' | 'RESERVADA' | 'NO_DISPONIBLE';
    descripcion?: string;
    activo: boolean;
}

export interface Reservation {
    id: string;
    clienteNombre: string;
    clienteTelefono?: string;
    clienteEmail?: string;
    fecha: string;
    hora: string;
    personas: number;
    table?: RestaurantTable;
    estado: 'PENDIENTE' | 'CONFIRMADA' | 'EN_CURSO' | 'COMPLETADA' | 'CANCELADA' | 'NO_SHOW';
    notas?: string;
    recordatorioEnviado: boolean;
    createdAt: string;
}

export interface ReservationStats {
    totalReservas: number;
    confirmadas: number;
}

export interface CreateReservationRequest {
    clienteNombre: string;
    clienteTelefono?: string;
    fecha: string;
    hora: string;
    personas: number;
    tableId?: string;
    notas?: string;
    serviceType?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ReservationsService {
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

    // ========== RESERVATIONS ==========

    getReservations(date?: string): Observable<Reservation[]> {
        let params = new HttpParams();
        if (date) {
            params = params.set('date', date);
        }
        return this.http.get<Reservation[]>(`${this.baseUrl}/reservations`, {
            headers: this.getHeaders(),
            params
        });
    }

    getReservation(id: string): Observable<Reservation> {
        return this.http.get<Reservation>(`${this.baseUrl}/reservations/${id}`, {
            headers: this.getHeaders()
        });
    }

    createReservation(request: CreateReservationRequest): Observable<Reservation> {
        return this.http.post<Reservation>(`${this.baseUrl}/reservations`, request, {
            headers: this.getHeaders()
        });
    }

    updateStatus(id: string, estado: string): Observable<Reservation> {
        return this.http.put<Reservation>(`${this.baseUrl}/reservations/${id}/status`, { estado }, {
            headers: this.getHeaders()
        });
    }

    assignTable(id: string, tableId: string): Observable<Reservation> {
        return this.http.put<Reservation>(`${this.baseUrl}/reservations/${id}/table`, { tableId }, {
            headers: this.getHeaders()
        });
    }

    // ========== TABLES ==========

    getTables(): Observable<RestaurantTable[]> {
        return this.http.get<RestaurantTable[]>(`${this.baseUrl}/reservations/tables`, {
            headers: this.getHeaders()
        });
    }

    getAvailableTables(minCapacity = 1): Observable<RestaurantTable[]> {
        return this.http.get<RestaurantTable[]>(`${this.baseUrl}/reservations/tables/available`, {
            headers: this.getHeaders(),
            params: { minCapacity: minCapacity.toString() }
        });
    }

    updateTableStatus(id: string, estado: string): Observable<RestaurantTable> {
        return this.http.put<RestaurantTable>(`${this.baseUrl}/reservations/tables/${id}/status`, { estado }, {
            headers: this.getHeaders()
        });
    }

    // ========== STATS ==========

    getStats(date?: string): Observable<ReservationStats> {
        let params = new HttpParams();
        if (date) {
            params = params.set('date', date);
        }
        return this.http.get<ReservationStats>(`${this.baseUrl}/reservations/stats`, {
            headers: this.getHeaders(),
            params
        });
    }
    // ========== AUTOMATIONS ==========

    getAutomations(): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/automations`, {
            headers: this.getHeaders()
        });
    }

    saveAutomation(automation: any): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/automations`, automation, {
            headers: this.getHeaders()
        });
    }

    getAutomationLogs(id: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/automations/${id}/logs`, {
            headers: this.getHeaders()
        });
    }

    testConnection(config: any): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/automations/test`, config, {
            headers: this.getHeaders()
        });
    }
}
