import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { AuthService } from '../auth/auth.service';
import { PageResponse } from './catalog.service';

// ========== DTOs ==========

export interface SaleItem {
    variantId: string;
    sku: string;
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    descuento: number;
    subtotal: number;
}

export interface SalePayment {
    metodoPago: 'EFECTIVO' | 'DEBITO' | 'CREDITO' | 'TRANSFERENCIA';
    monto: number;
    referencia?: string;
}

export interface Sale {
    id: string;
    tenantId: string;
    branchId: string;
    sessionId: string;
    numero: string;
    fechaVenta: string;
    subtotal: number;
    descuentoTotal: number;
    impuestoTotal: number;
    total: number;
    estado: 'COMPLETADA' | 'ANULADA' | 'PENDIENTE';
    items: SaleItem[];
    payments: SalePayment[];
    clienteNombre?: string;
    clienteRut?: string;
}

export interface CreateSaleRequest {
    commandId: string;  // Para idempotencia
    branchId: string;
    sessionId: string;
    items: CreateSaleItemRequest[];
    payments: SalePayment[];
    descuentoGlobal?: number;
    clienteNombre?: string;
    clienteRut?: string;
    notas?: string;
}

export interface CreateSaleItemRequest {
    variantId: string;
    cantidad: number;
    precioUnitario: number;
    descuento?: number;
}

export interface CashSession {
    id: string;
    branchId: string;
    userId: string;
    userName: string;
    fechaApertura: string;
    fechaCierre?: string;
    montoInicial: number;
    montoFinal?: number;
    montoEsperado?: number;
    diferencia?: number;
    estado: 'ABIERTA' | 'CERRADA';
    totalVentas: number;
    cantidadVentas: number;
}

export interface OpenCashSessionRequest {
    branchId: string;
    montoInicial: number;
}

export interface CloseCashSessionRequest {
    montoFinal: number;
    notas?: string;
}

@Injectable({
    providedIn: 'root'
})
export class SalesService {
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

    // ========== SALES ==========

    createSale(request: CreateSaleRequest): Observable<Sale> {
        return this.http.post<Sale>(`${this.baseUrl}/sales`, request, {
            headers: this.getHeaders()
        });
    }

    getSale(id: string): Observable<Sale> {
        return this.http.get<Sale>(`${this.baseUrl}/sales/${id}`, {
            headers: this.getHeaders()
        });
    }

    getSalesBySession(sessionId: string, page = 0, size = 20): Observable<PageResponse<Sale>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        return this.http.get<PageResponse<Sale>>(`${this.baseUrl}/sales/session/${sessionId}`, {
            headers: this.getHeaders(),
            params
        });
    }

    cancelSale(id: string, motivo: string): Observable<Sale> {
        return this.http.post<Sale>(`${this.baseUrl}/sales/${id}/cancel`, { motivo }, {
            headers: this.getHeaders()
        });
    }

    // ========== CASH SESSIONS ==========

    openCashSession(request: OpenCashSessionRequest): Observable<CashSession> {
        return this.http.post<CashSession>(`${this.baseUrl}/cash-sessions/open`, request, {
            headers: this.getHeaders()
        });
    }

    closeCashSession(sessionId: string, request: CloseCashSessionRequest): Observable<CashSession> {
        return this.http.post<CashSession>(`${this.baseUrl}/cash-sessions/${sessionId}/close`, request, {
            headers: this.getHeaders()
        });
    }

    getCurrentSession(branchId: string): Observable<CashSession | null> {
        return this.http.get<CashSession | null>(`${this.baseUrl}/cash-sessions/current`, {
            headers: this.getHeaders(),
            params: { branchId }
        });
    }

    getSessionHistory(branchId: string, page = 0, size = 20): Observable<PageResponse<CashSession>> {
        const params = new HttpParams()
            .set('branchId', branchId)
            .set('page', page.toString())
            .set('size', size.toString());

        return this.http.get<PageResponse<CashSession>>(`${this.baseUrl}/cash-sessions`, {
            headers: this.getHeaders(),
            params
        });
    }

    getSessionSummary(sessionId: string): Observable<CashSession> {
        return this.http.get<CashSession>(`${this.baseUrl}/cash-sessions/${sessionId}`, {
            headers: this.getHeaders()
        });
    }

    // ========== DASHBOARD ==========

    getDashboardStats(): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}/dashboard/stats`, {
            headers: this.getHeaders()
        });
    }

    getRecentSales(limit = 5): Observable<Sale[]> {
        return this.http.get<any>(`${this.baseUrl}/sales`, {
            headers: this.getHeaders(),
            params: { page: '0', size: limit.toString() }
        });
    }

    // ========== PENDING SALES & APPROVAL ==========

    getPendingSales(): Observable<Sale[]> {
        return this.http.get<Sale[]>(`${this.baseUrl}/sales/pending`, {
            headers: this.getHeaders()
        });
    }

    approveSale(id: string): Observable<Sale> {
        return this.http.post<Sale>(`${this.baseUrl}/sales/${id}/approve`, {}, {
            headers: this.getHeaders()
        });
    }

    rejectSale(id: string, motivo?: string): Observable<Sale> {
        return this.http.post<Sale>(`${this.baseUrl}/sales/${id}/reject`, { motivo }, {
            headers: this.getHeaders()
        });
    }

    // ========== DAILY STATS & EARNINGS ==========

    getDailyStats(date?: string): Observable<DailyStats> {
        let params: any = {};
        if (date) params.date = date;

        return this.http.get<DailyStats>(`${this.baseUrl}/sales/stats/daily`, {
            headers: this.getHeaders(),
            params
        });
    }

    getStatsRange(from: string, to: string): Observable<DailyStats[]> {
        return this.http.get<DailyStats[]>(`${this.baseUrl}/sales/stats/range`, {
            headers: this.getHeaders(),
            params: { from, to }
        });
    }

    getMonthlyStats(year: number, month: number): Observable<DailyStats[]> {
        const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const lastDayStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        return this.getStatsRange(firstDay, lastDayStr);
    }
}

// ========== STATS DTOs ==========

export interface DailyStats {
    fecha: string;
    totalVentas: number;
    totalTransacciones: number;
    ticketPromedio: number;
    ventasAprobadas: number;
    ventasPendientes: number;
    ventasRechazadas: number;
    ventasAnuladas: number;
    montoAprobado: number;
    montoPendiente: number;
    topProductos?: TopProduct[];
    ventasPorHora?: HourlyStat[];
}

export interface TopProduct {
    nombre: string;
    sku: string;
    cantidad: number;
    total: number;
    imagenUrl?: string;
}

export interface HourlyStat {
    hora: number;
    horaLabel: string;
    transacciones: number;
    total: number;
}

