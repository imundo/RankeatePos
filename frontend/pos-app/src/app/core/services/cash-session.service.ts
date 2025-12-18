import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { AuthService } from '../auth/auth.service';

// DTOs
export interface CashSessionDto {
    id: string;
    registerId: string;
    userId: string;
    montoInicial: number;
    montoFinal?: number;
    montoTeorico?: number;
    diferencia?: number;
    estado: 'ABIERTA' | 'CERRADA';
    aperturaAt: string;
    cierreAt?: string;
    cierreNota?: string;
}

export interface OpenCashSessionRequest {
    registerId: string;
    montoInicial: number;
}

export interface CloseCashSessionRequest {
    montoFinal: number;
    nota?: string;
}

@Injectable({
    providedIn: 'root'
})
export class CashSessionService {
    private baseUrl = environment.salesUrl || 'http://localhost:8083/api';

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

    openSession(request: OpenCashSessionRequest): Observable<CashSessionDto> {
        return this.http.post<CashSessionDto>(`${this.baseUrl}/cash-sessions/open`, request, {
            headers: this.getHeaders()
        });
    }

    closeSession(sessionId: string, request: CloseCashSessionRequest): Observable<CashSessionDto> {
        return this.http.post<CashSessionDto>(`${this.baseUrl}/cash-sessions/${sessionId}/close`, request, {
            headers: this.getHeaders()
        });
    }

    getCurrentSession(): Observable<CashSessionDto> {
        return this.http.get<CashSessionDto>(`${this.baseUrl}/cash-sessions/current`, {
            headers: this.getHeaders()
        });
    }

    getSession(sessionId: string): Observable<CashSessionDto> {
        return this.http.get<CashSessionDto>(`${this.baseUrl}/cash-sessions/${sessionId}`, {
            headers: this.getHeaders()
        });
    }

    getAllSessions(): Observable<CashSessionDto[]> {
        return this.http.get<CashSessionDto[]>(`${this.baseUrl}/cash-sessions`, {
            headers: this.getHeaders()
        });
    }
}
