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
    tipoDteDescripcion?: string;
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
    estadoDescripcion?: string;
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
    tipoDteDescripcion?: string;
    folioDesde: number;
    folioHasta: number;
    folioActual: number;
    foliosDisponibles: number;
    porcentajeUso: number;
    fechaAutorizacion: string;
    fechaVencimiento?: string;
    vencido?: boolean;
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

    /**
     * Get headers including emisor (company) information for DTE emission
     */
    private getEmisorHeaders() {
        const tenant = this.authService.tenant();
        const baseHeaders = this.getHeaders();

        return {
            ...baseHeaders,
            'X-Emisor-Rut': tenant?.rut || '',
            'X-Emisor-RazonSocial': tenant?.razonSocial || tenant?.nombre || '',
            'X-Emisor-Giro': tenant?.giro || '',
            'X-Emisor-Direccion': tenant?.direccion || '',
            'X-Emisor-Comuna': tenant?.comuna || '',
            'X-Emisor-Logo-Url': tenant?.logoUrl || ''
        };
    }

    // ========== EMISION ==========

    emitirBoleta(request: EmitirDteRequest): Observable<Dte> {
        return this.http.post<Dte>(`${this.baseUrl}/billing/dte/boleta`, request, {
            headers: this.getEmisorHeaders()
        });
    }

    emitirFactura(request: EmitirDteRequest): Observable<Dte> {
        return this.http.post<Dte>(`${this.baseUrl}/billing/dte/factura`, request, {
            headers: this.getEmisorHeaders()
        });
    }

    emitirNotaCredito(request: EmitirDteRequest): Observable<Dte> {
        return this.http.post<Dte>(`${this.baseUrl}/billing/dte/nota-credito`, request, {
            headers: this.getEmisorHeaders()
        });
    }

    emitirNotaDebito(request: EmitirDteRequest): Observable<Dte> {
        return this.http.post<Dte>(`${this.baseUrl}/billing/dte/nota-debito`, request, {
            headers: this.getEmisorHeaders()
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

    enviarPorEmail(id: string, email: string): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/billing/dte/${id}/email`, { email }, {
            headers: this.getHeaders()
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

    // ========== CAF MANAGEMENT ==========

    subirCaf(file: File): Observable<CafInfo> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<CafInfo>(`${this.baseUrl}/billing/caf`, formData, {
            headers: this.getHeaders() // Headers needed for auth
        });
    }

    desactivarCaf(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/billing/caf/${id}`, {
            headers: this.getHeaders()
        });
    }

    // ========== LIBRO VENTAS ==========

    getLibroVentas(desde: string, hasta: string, tipoDte?: string): Observable<Dte[]> {
        let params = new HttpParams()
            .set('desde', desde)
            .set('hasta', hasta);

        if (tipoDte) params = params.set('tipoDte', tipoDte);

        return this.http.get<Dte[]>(`${this.baseUrl}/billing/dte/libro-ventas`, {
            headers: this.getHeaders(),
            params
        });
    }

    // ========== HELPERS & DICTIONARIES ==========

    getTiposDte(pais: 'CL' | 'PE' | 'VE' = 'CL'): { codigo: number, nombre: string }[] {
        const tipos = {
            CL: [
                { codigo: 33, nombre: 'Factura Electrónica' },
                { codigo: 39, nombre: 'Boleta Electrónica' },
                { codigo: 61, nombre: 'Nota de Crédito Electrónica' },
                { codigo: 56, nombre: 'Nota de Débito Electrónica' },
                { codigo: 52, nombre: 'Guía de Despacho Electrónica' }
            ],
            PE: [
                { codigo: 1, nombre: 'Factura' },
                { codigo: 3, nombre: 'Boleta de Venta' },
                { codigo: 7, nombre: 'Nota de Crédito' },
                { codigo: 8, nombre: 'Nota de Débito' }
            ],
            VE: [
                { codigo: 1, nombre: 'Factura Digital' },
                { codigo: 2, nombre: 'Nota de Crédito' },
                { codigo: 3, nombre: 'Nota de Débito' }
            ]
        };
        return tipos[pais] || tipos['CL'];
    }

    formatRut(rut: string): string {
        if (!rut) return '';
        const clean = rut.replace(/[^0-9kK]/g, '');
        if (clean.length < 2) return clean;
        const body = clean.slice(0, -1);
        const dv = clean.slice(-1).toUpperCase();
        return body.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + dv;
    }

    formatCurrency(value: number): string {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0
        }).format(value);
    }
    // ========== REPORTES ==========

    downloadLibroVentasExcel(from: string, to: string): Observable<Blob> {
        let params = new HttpParams()
            .set('from', from)
            .set('to', to);

        return this.http.get(`${this.baseUrl}/billing/reports/sales-book/excel`, {
            headers: this.getHeaders(),
            params,
            responseType: 'blob'
        });
    }

    downloadLibroVentasPdf(from: string, to: string): Observable<Blob> {
        let params = new HttpParams()
            .set('from', from)
            .set('to', to);

        return this.http.get(`${this.baseUrl}/billing/reports/sales-book/pdf`, {
            headers: this.getHeaders(),
            params,
            responseType: 'blob'
        });
    }
}
