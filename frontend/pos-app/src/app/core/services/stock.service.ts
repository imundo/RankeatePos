import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { AuthService } from '../auth/auth.service';

// DTOs
export interface StockDto {
    id: string;
    variantId: string;
    variantSku: string;
    productName: string;
    branchId: string;
    cantidadActual: number;
    cantidadReservada: number;
    cantidadDisponible: number;
    stockMinimo: number;
    stockBajo: boolean;
    updatedAt: string;
}

export interface StockMovementDto {
    id: string;
    variantId: string;
    variantSku: string;
    productName: string;
    branchId: string;
    tipo: TipoMovimiento;
    cantidad: number;
    stockAnterior: number;
    stockNuevo: number;
    costoUnitario?: number;
    motivo?: string;
    documentoReferencia?: string;
    createdBy: string;
    createdAt: string;
}

export type TipoMovimiento =
    'ENTRADA' | 'SALIDA' | 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO' |
    'TRANSFERENCIA_ENTRADA' | 'TRANSFERENCIA_SALIDA' | 'DEVOLUCION' | 'MERMA';

export interface StockAdjustmentRequest {
    variantId: string;
    branchId: string;
    tipo: TipoMovimiento;
    cantidad: number;
    motivo?: string;
    documentoReferencia?: string;
    costoUnitario?: number;
}

export interface PageResponse<T> {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}

@Injectable({
    providedIn: 'root'
})
export class StockService {
    private baseUrl = environment.catalogUrl || 'http://localhost:8082/api';

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    private getHeaders() {
        return {
            'X-Tenant-Id': this.authService.getTenantId() || '',
            'X-User-Id': this.authService.getUserId() || '',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        };
    }

    // ========== STOCK ==========

    getStockByBranch(branchId: string): Observable<StockDto[]> {
        const params = new HttpParams().set('branchId', branchId);
        return this.http.get<StockDto[]>(`${this.baseUrl}/stock`, {
            headers: this.getHeaders(),
            params
        });
    }

    getStock(variantId: string, branchId: string): Observable<StockDto> {
        const params = new HttpParams().set('branchId', branchId);
        return this.http.get<StockDto>(`${this.baseUrl}/stock/${variantId}`, {
            headers: this.getHeaders(),
            params
        });
    }

    getLowStock(branchId: string): Observable<StockDto[]> {
        const params = new HttpParams().set('branchId', branchId);
        return this.http.get<StockDto[]>(`${this.baseUrl}/stock/low`, {
            headers: this.getHeaders(),
            params
        });
    }

    countLowStock(): Observable<number> {
        return this.http.get<number>(`${this.baseUrl}/stock/low/count`, {
            headers: this.getHeaders()
        });
    }

    adjustStock(request: StockAdjustmentRequest): Observable<StockDto> {
        return this.http.post<StockDto>(`${this.baseUrl}/stock/adjust`, request, {
            headers: this.getHeaders()
        });
    }

    // ========== MOVEMENTS ==========

    getMovements(branchId: string, page = 0, size = 20): Observable<PageResponse<StockMovementDto>> {
        const params = new HttpParams()
            .set('branchId', branchId)
            .set('page', page.toString())
            .set('size', size.toString());

        return this.http.get<PageResponse<StockMovementDto>>(`${this.baseUrl}/stock/movements`, {
            headers: this.getHeaders(),
            params
        });
    }

    getKardex(variantId: string): Observable<StockMovementDto[]> {
        return this.http.get<StockMovementDto[]>(`${this.baseUrl}/stock/kardex/${variantId}`, {
            headers: this.getHeaders()
        });
    }
}
