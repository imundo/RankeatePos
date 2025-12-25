import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { AuthService } from '../auth/auth.service';

// ========== DTOs ==========

export interface DteItem {
    numeroLinea: number;
    nombreItem: string;
    descripcionItem?: string;
    cantidad: number;
    unidadMedida?: string;
    precioUnitario: number;
    descuentoPorcentaje?: number;
    descuentoMonto?: number;
    montoItem: number;
}

export interface Dte {
    id: string;
    tipoDte: string;
    folio: number;
    fechaEmision: string;
    fechaVencimiento?: string;

    // Emisor
    emisorRut: string;
    emisorRazonSocial: string;
    emisorGiro?: string;
    emisorDireccion?: string;
    emisorComuna?: string;

    // Receptor
    receptorRut?: string;
    receptorRazonSocial?: string;
    receptorGiro?: string;
    receptorDireccion?: string;
    receptorComuna?: string;
    receptorEmail?: string;

    // Montos
    montoNeto?: number;
    montoExento?: number;
    tasaIva: number;
    montoIva?: number;
    montoTotal: number;

    // Estado
    estado: 'BORRADOR' | 'PENDIENTE' | 'ENVIADO' | 'ACEPTADO' | 'RECHAZADO' | 'ANULADO';
    trackId?: string;
    glosaEstado?: string;

    // Items
    items?: DteItem[];
}

export interface EmitirDteRequest {
    receptorRut?: string;
    receptorRazonSocial?: string;
    receptorGiro?: string;
    receptorDireccion?: string;
    receptorComuna?: string;
    receptorEmail?: string;
    items: EmitirDteItemRequest[];
    ventaId?: string;
}

export interface EmitirDteItemRequest {
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    descuento?: number;
    exento?: boolean;
}

export interface CafInfo {
    id: string;
    tipoDte: string;
    folioDesde: number;
    folioHasta: number;
    folioActual: number;
    fechaAutorizacion: string;
    fechaVencimiento?: string;
    activo: boolean;
    agotado: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class BillingService {
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

    // ========== EMISION ==========

    emitirBoleta(request: EmitirDteRequest): Observable<Dte> {
        return this.http.post<Dte>(`${this.baseUrl}/billing/boleta`, request, {
            headers: this.getHeaders()
        });
    }

    emitirFactura(request: EmitirDteRequest): Observable<Dte> {
        return this.http.post<Dte>(`${this.baseUrl}/billing/factura`, request, {
            headers: this.getHeaders()
        });
    }

    emitirNotaCredito(request: EmitirDteRequest): Observable<Dte> {
        return this.http.post<Dte>(`${this.baseUrl}/billing/nota-credito`, request, {
            headers: this.getHeaders()
        });
    }

    emitirNotaDebito(request: EmitirDteRequest): Observable<Dte> {
        return this.http.post<Dte>(`${this.baseUrl}/billing/nota-debito`, request, {
            headers: this.getHeaders()
        });
    }

    // ========== CONSULTA ==========

    getDtes(tipoDte?: string, estado?: string, page = 0, size = 20): Observable<any> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        if (tipoDte) params = params.set('tipoDte', tipoDte);
        if (estado) params = params.set('estado', estado);

        return this.http.get<any>(`${this.baseUrl}/billing/dte`, {
            headers: this.getHeaders(),
            params
        });
    }

    getDte(id: string): Observable<Dte> {
        return this.http.get<Dte>(`${this.baseUrl}/billing/dte/${id}`, {
            headers: this.getHeaders()
        });
    }

    getDteXml(id: string): Observable<string> {
        return this.http.get(`${this.baseUrl}/billing/dte/${id}/xml`, {
            headers: this.getHeaders(),
            responseType: 'text'
        });
    }

    getDtePdf(id: string): Observable<Blob> {
        return this.http.get(`${this.baseUrl}/billing/dte/${id}/pdf`, {
            headers: this.getHeaders(),
            responseType: 'blob'
        });
    }

    // ========== CAF ==========

    getCafs(): Observable<CafInfo[]> {
        return this.http.get<CafInfo[]>(`${this.baseUrl}/billing/caf`, {
            headers: this.getHeaders()
        });
    }

    getFoliosDisponibles(): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}/billing/caf/disponibles`, {
            headers: this.getHeaders()
        });
    }

    // ========== LIBRO VENTAS ==========

    getLibroVentas(desde: string, hasta: string, tipoDte?: string): Observable<Dte[]> {
        let params = new HttpParams()
            .set('desde', desde)
            .set('hasta', hasta);

        if (tipoDte) params = params.set('tipoDte', tipoDte);

        return this.http.get<Dte[]>(`${this.baseUrl}/billing/libro-ventas`, {
            headers: this.getHeaders(),
            params
        });
    }
}
