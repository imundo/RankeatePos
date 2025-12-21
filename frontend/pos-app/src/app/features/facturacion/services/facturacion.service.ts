import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';

// === Interfaces ===

export interface TipoDte {
    codigo: number;
    nombre: string;
}

export interface Dte {
    id: string;
    tipoDte: string;
    tipoDteDescripcion: string;
    folio: number;
    fechaEmision: string;
    emisorRut: string;
    emisorRazonSocial: string;
    receptorRut?: string;
    receptorRazonSocial?: string;
    receptorEmail?: string;
    montoNeto?: number;
    montoExento?: number;
    montoIva?: number;
    montoTotal: number;
    estado: string;
    estadoDescripcion: string;
    trackId?: string;
    glosaEstado?: string;
    fechaEnvio?: string;
    fechaRespuesta?: string;
    pdfUrl?: string;
    xmlUrl?: string;
    detalles?: DteDetalle[];
    ventaId?: string;
    createdAt: string;
}

export interface DteDetalle {
    numeroLinea: number;
    codigo?: string;
    nombreItem: string;
    descripcionItem?: string;
    cantidad: number;
    unidadMedida?: string;
    precioUnitario: number;
    descuentoPorcentaje?: number;
    descuentoMonto?: number;
    montoItem: number;
    exento?: boolean;
}

export interface EmitirDteRequest {
    tipoDte?: string;
    receptorRut?: string;
    receptorRazonSocial?: string;
    receptorGiro?: string;
    receptorDireccion?: string;
    receptorComuna?: string;
    receptorEmail?: string;
    items: EmitirDteItem[];
    dteReferenciaId?: string;
    tipoReferencia?: string;
    razonReferencia?: string;
    ventaId?: string;
    enviarSii?: boolean;
    enviarEmail?: boolean;
}

export interface EmitirDteItem {
    codigo?: string;
    nombreItem: string;
    descripcionItem?: string;
    cantidad: number;
    unidadMedida?: string;
    precioUnitario: number;
    descuentoPorcentaje?: number;
    descuentoMonto?: number;
    exento?: boolean;
    productoId?: string;
}

export interface Caf {
    id: string;
    tipoDte: string;
    tipoDteDescripcion: string;
    folioDesde: number;
    folioHasta: number;
    folioActual: number;
    foliosDisponibles: number;
    porcentajeUso: number;
    fechaAutorizacion: string;
    fechaVencimiento?: string;
    vencido: boolean;
    activo: boolean;
    agotado: boolean;
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

export type Pais = 'CL' | 'PE' | 'VE';

@Injectable({
    providedIn: 'root'
})
export class FacturacionService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/billing`;

    // Signals para estado reactivo
    readonly documentos = signal<Dte[]>([]);
    readonly cafs = signal<Caf[]>([]);
    readonly loading = signal(false);

    // === DTEs ===

    emitirBoleta(request: EmitirDteRequest): Observable<Dte> {
        return this.http.post<Dte>(`${this.baseUrl}/dte/boleta`, request);
    }

    emitirFactura(request: EmitirDteRequest): Observable<Dte> {
        return this.http.post<Dte>(`${this.baseUrl}/dte/factura`, request);
    }

    emitirNotaCredito(request: EmitirDteRequest): Observable<Dte> {
        return this.http.post<Dte>(`${this.baseUrl}/dte/nota-credito`, request);
    }

    emitirNotaDebito(request: EmitirDteRequest): Observable<Dte> {
        return this.http.post<Dte>(`${this.baseUrl}/dte/nota-debito`, request);
    }

    listarDtes(page = 0, size = 20, tipoDte?: string, estado?: string): Observable<PageResponse<Dte>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        if (tipoDte) params = params.set('tipoDte', tipoDte);
        if (estado) params = params.set('estado', estado);

        this.loading.set(true);
        return this.http.get<PageResponse<Dte>>(`${this.baseUrl}/dte`, { params }).pipe(
            tap(response => {
                this.documentos.set(response.content);
                this.loading.set(false);
            })
        );
    }

    getDte(id: string): Observable<Dte> {
        return this.http.get<Dte>(`${this.baseUrl}/dte/${id}`);
    }

    getXml(id: string): Observable<string> {
        return this.http.get(`${this.baseUrl}/dte/${id}/xml`, { responseType: 'text' });
    }

    getPdf(id: string): Observable<Blob> {
        return this.http.get(`${this.baseUrl}/dte/${id}/pdf`, { responseType: 'blob' });
    }

    enviarEmail(id: string, email: string): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/dte/${id}/enviar-email`, { email });
    }

    reenviarSii(id: string): Observable<Dte> {
        return this.http.post<Dte>(`${this.baseUrl}/dte/${id}/reenviar-sii`, {});
    }

    getLibroVentas(desde: string, hasta: string, tipoDte?: string): Observable<Dte[]> {
        let params = new HttpParams()
            .set('desde', desde)
            .set('hasta', hasta);

        if (tipoDte) params = params.set('tipoDte', tipoDte);

        return this.http.get<Dte[]>(`${this.baseUrl}/dte/libro-ventas`, { params });
    }

    // === CAF ===

    listarCafs(tipoDte?: string): Observable<Caf[]> {
        let params = new HttpParams();
        if (tipoDte) params = params.set('tipoDte', tipoDte);

        return this.http.get<Caf[]>(`${this.baseUrl}/caf`, { params }).pipe(
            tap(cafs => this.cafs.set(cafs))
        );
    }

    subirCaf(file: File): Observable<Caf> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<Caf>(`${this.baseUrl}/caf`, formData);
    }

    getFoliosDisponibles(): Observable<Record<string, number>> {
        return this.http.get<Record<string, number>>(`${this.baseUrl}/caf/disponibles`);
    }

    desactivarCaf(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/caf/${id}`);
    }

    // === Tipos de DTE por país ===

    getTiposDte(pais: Pais = 'CL'): TipoDte[] {
        const tipos: Record<Pais, TipoDte[]> = {
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
        return tipos[pais];
    }

    // === Helpers ===

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
}
