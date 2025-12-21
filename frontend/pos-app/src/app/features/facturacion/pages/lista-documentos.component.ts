import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FacturacionService, Dte, PageResponse } from '../services/facturacion.service';

@Component({
    selector: 'app-lista-documentos',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
    <div class="documentos-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-left">
          <h1>📄 Documentos Tributarios</h1>
          <p class="subtitle">Historial de DTEs emitidos</p>
        </div>
        <a routerLink="../emitir" class="btn-primary">
          + Nuevo Documento
        </a>
      </header>

      <!-- Filtros -->
      <div class="filters-bar">
        <div class="search-box">
          <span class="icon">🔍</span>
          <input 
            type="text" 
            placeholder="Buscar por folio, RUT o razón social..."
            [(ngModel)]="searchTerm"
            (input)="buscar()">
        </div>

        <div class="filters">
          <select [(ngModel)]="filtroTipo" (change)="aplicarFiltros()">
            <option value="">Todos los tipos</option>
            <option value="BOLETA_ELECTRONICA">Boletas</option>
            <option value="FACTURA_ELECTRONICA">Facturas</option>
            <option value="NOTA_CREDITO">Notas de Crédito</option>
            <option value="NOTA_DEBITO">Notas de Débito</option>
          </select>

          <select [(ngModel)]="filtroEstado" (change)="aplicarFiltros()">
            <option value="">Todos los estados</option>
            <option value="ACEPTADO">Aceptados</option>
            <option value="PENDIENTE">Pendientes</option>
            <option value="RECHAZADO">Rechazados</option>
            <option value="BORRADOR">Borradores</option>
          </select>

          <input 
            type="date" 
            [(ngModel)]="filtroFechaDesde"
            (change)="aplicarFiltros()"
            placeholder="Desde">
          <input 
            type="date" 
            [(ngModel)]="filtroFechaHasta"
            (change)="aplicarFiltros()"
            placeholder="Hasta">
        </div>
      </div>

      <!-- Lista de documentos -->
      <div class="documentos-list">
        @if (loading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Cargando documentos...</p>
          </div>
        } @else if (documentos().length === 0) {
          <div class="empty-state">
            <span class="icon">📭</span>
            <h3>No hay documentos</h3>
            <p>Aún no has emitido ningún documento tributario</p>
            <a routerLink="../emitir" class="btn-primary">Emitir primer documento</a>
          </div>
        } @else {
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Tipo / Folio</th>
                  <th>Fecha</th>
                  <th>Receptor</th>
                  <th class="right">Monto</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (doc of documentos(); track doc.id) {
                  <tr [class]="doc.estado.toLowerCase()">
                    <td>
                      <div class="tipo-col">
                        <span class="tipo-icon">{{ getTipoIcon(doc.tipoDte) }}</span>
                        <div class="tipo-info">
                          <span class="tipo-nombre">{{ doc.tipoDteDescripcion }}</span>
                          <span class="folio">N° {{ doc.folio }}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="fecha">{{ formatDate(doc.fechaEmision) }}</span>
                    </td>
                    <td>
                      <div class="receptor-col">
                        <span class="receptor-nombre">{{ doc.receptorRazonSocial || 'Sin receptor' }}</span>
                        <span class="receptor-rut">{{ doc.receptorRut || '' }}</span>
                      </div>
                    </td>
                    <td class="right">
                      <span class="monto">{{ formatCurrency(doc.montoTotal) }}</span>
                    </td>
                    <td>
                      <span class="badge" [class]="doc.estado.toLowerCase()">
                        {{ doc.estadoDescripcion }}
                      </span>
                    </td>
                    <td>
                      <div class="actions">
                        <a [routerLink]="['../', 'documentos', doc.id]" class="action-btn" title="Ver detalle">
                          👁️
                        </a>
                        <button class="action-btn" (click)="descargarPdf(doc)" title="Descargar PDF">
                          📥
                        </button>
                        @if (doc.estado === 'PENDIENTE') {
                          <button class="action-btn" (click)="reenviar(doc)" title="Reenviar al SII">
                            🔄
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Paginación -->
          <div class="pagination">
            <button 
              class="page-btn" 
              (click)="cambiarPagina(currentPage - 1)"
              [disabled]="currentPage === 0">
              ← Anterior
            </button>
            <span class="page-info">
              Página {{ currentPage + 1 }} de {{ totalPages }}
            </span>
            <button 
              class="page-btn" 
              (click)="cambiarPagina(currentPage + 1)"
              [disabled]="currentPage >= totalPages - 1">
              Siguiente →
            </button>
          </div>
        }
      </div>
    </div>
  `,
    styles: [`
    .documentos-container {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .page-header h1 {
      font-size: 1.5rem;
      margin: 0;
    }

    .subtitle {
      color: var(--text-secondary);
      margin: 0.25rem 0 0;
    }

    .btn-primary {
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
    }

    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(99,102,241,0.3);
    }

    /* Filtros */
    .filters-bar {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .search-box {
      flex: 1;
      min-width: 250px;
      display: flex;
      align-items: center;
      background: var(--card-bg, #fff);
      border: 1px solid var(--border-color, #e0e0e0);
      border-radius: 8px;
      padding: 0 1rem;
    }

    .search-box .icon {
      margin-right: 0.5rem;
    }

    .search-box input {
      flex: 1;
      border: none;
      padding: 0.75rem 0;
      font-size: 0.875rem;
      background: transparent;
    }

    .search-box input:focus {
      outline: none;
    }

    .filters {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .filters select, .filters input {
      padding: 0.75rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      font-size: 0.875rem;
      background: var(--card-bg, #fff);
    }

    /* Tabla */
    .table-container {
      background: var(--card-bg, #fff);
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--border-color);
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    thead {
      background: var(--bg-secondary, #f5f5f5);
    }

    th {
      text-align: left;
      padding: 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
    }

    th.right {
      text-align: right;
    }

    td {
      padding: 1rem;
      border-top: 1px solid var(--border-color, #e0e0e0);
    }

    td.right {
      text-align: right;
    }

    tr:hover {
      background: rgba(99,102,241,0.02);
    }

    .tipo-col {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .tipo-icon {
      font-size: 1.5rem;
    }

    .tipo-info {
      display: flex;
      flex-direction: column;
    }

    .tipo-nombre {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .folio {
      font-weight: 600;
    }

    .receptor-col {
      display: flex;
      flex-direction: column;
    }

    .receptor-nombre {
      font-weight: 500;
    }

    .receptor-rut {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .monto {
      font-weight: 600;
      font-size: 0.95rem;
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .badge.aceptado { background: #dcfce7; color: #16a34a; }
    .badge.pendiente { background: #fef3c7; color: #d97706; }
    .badge.rechazado { background: #fee2e2; color: #dc2626; }
    .badge.borrador { background: #e0e7ff; color: #4f46e5; }
    .badge.enviado { background: #dbeafe; color: #2563eb; }

    .actions {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.1rem;
      opacity: 0.7;
      transition: opacity 0.2s;
      padding: 0.25rem;
    }

    .action-btn:hover {
      opacity: 1;
    }

    /* Paginación */
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
    }

    .page-btn {
      padding: 0.5rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      background: var(--card-bg);
      cursor: pointer;
      transition: all 0.2s;
    }

    .page-btn:hover:not(:disabled) {
      border-color: var(--primary-color);
      color: var(--primary-color);
    }

    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-info {
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    /* Estados */
    .loading-state, .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: var(--card-bg);
      border-radius: 12px;
      border: 1px solid var(--border-color);
    }

    .loading-state .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--border-color);
      border-top-color: var(--primary-color);
      border-radius: 50%;
      margin: 0 auto 1rem;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-state .icon {
      font-size: 4rem;
      display: block;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      margin: 0 0 0.5rem;
    }

    .empty-state p {
      color: var(--text-secondary);
      margin: 0 0 1.5rem;
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }

      .filters-bar {
        flex-direction: column;
      }

      table {
        font-size: 0.875rem;
      }

      .tipo-nombre, .receptor-rut {
        display: none;
      }
    }
  `]
})
export class ListaDocumentosComponent implements OnInit {
    private facturacionService = inject(FacturacionService);

    documentos = signal<Dte[]>([]);
    loading = signal(false);

    currentPage = 0;
    pageSize = 20;
    totalPages = 1;
    totalElements = 0;

    searchTerm = '';
    filtroTipo = '';
    filtroEstado = '';
    filtroFechaDesde = '';
    filtroFechaHasta = '';

    ngOnInit() {
        this.cargarDocumentos();
    }

    cargarDocumentos() {
        this.loading.set(true);
        this.facturacionService.listarDtes(this.currentPage, this.pageSize, this.filtroTipo, this.filtroEstado)
            .subscribe({
                next: (response) => {
                    this.documentos.set(response.content);
                    this.totalPages = response.totalPages;
                    this.totalElements = response.totalElements;
                    this.loading.set(false);
                },
                error: (err) => {
                    console.error('Error cargando documentos', err);
                    this.loading.set(false);
                }
            });
    }

    buscar() {
        // Implementar búsqueda con debounce
        this.cargarDocumentos();
    }

    aplicarFiltros() {
        this.currentPage = 0;
        this.cargarDocumentos();
    }

    cambiarPagina(page: number) {
        if (page >= 0 && page < this.totalPages) {
            this.currentPage = page;
            this.cargarDocumentos();
        }
    }

    getTipoIcon(tipo: string): string {
        const icons: Record<string, string> = {
            'BOLETA_ELECTRONICA': '🧾',
            'FACTURA_ELECTRONICA': '📄',
            'NOTA_CREDITO': '🔻',
            'NOTA_DEBITO': '🔺',
            'GUIA_DESPACHO': '📦'
        };
        return icons[tipo] || '📄';
    }

    formatDate(date: string): string {
        return new Date(date).toLocaleDateString('es-CL');
    }

    formatCurrency(value: number): string {
        return this.facturacionService.formatCurrency(value);
    }

    descargarPdf(doc: Dte) {
        this.facturacionService.getPdf(doc.id).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${doc.tipoDte}_${doc.folio}.pdf`;
                a.click();
                window.URL.revokeObjectURL(url);
            },
            error: (err) => {
                console.error('Error descargando PDF', err);
                alert('Error al descargar PDF');
            }
        });
    }

    reenviar(doc: Dte) {
        // TODO: Implementar reenvío al SII
        alert('Función de reenvío próximamente');
    }
}
