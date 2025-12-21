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
      min-height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: white;
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
      background: linear-gradient(135deg, #fff, rgba(255,255,255,0.7));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      color: rgba(255, 255, 255, 0.5);
      margin: 0.25rem 0 0;
    }

    .btn-primary {
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      color: white;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(99,102,241,0.4);
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
      background: rgba(30, 41, 59, 0.6);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
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
      color: white;
    }

    .search-box input::placeholder {
      color: rgba(255, 255, 255, 0.4);
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
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      font-size: 0.875rem;
      background: rgba(30, 41, 59, 0.6);
      color: white;
      backdrop-filter: blur(12px);
    }

    .filters select option {
      background: #1e293b;
      color: white;
    }

    /* Tabla */
    .table-container {
      background: rgba(30, 41, 59, 0.6);
      backdrop-filter: blur(12px);
      border-radius: 14px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    thead {
      background: rgba(255, 255, 255, 0.05);
    }

    th {
      text-align: left;
      padding: 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
    }

    th.right {
      text-align: right;
    }

    td {
      padding: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    td.right {
      text-align: right;
    }

    tr:hover {
      background: rgba(99, 102, 241, 0.1);
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
      color: rgba(255, 255, 255, 0.5);
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
      color: rgba(255, 255, 255, 0.9);
    }

    .receptor-rut {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.4);
    }

    .monto {
      font-weight: 600;
      font-size: 0.95rem;
      color: #10B981;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.75rem;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .badge.aceptado { background: rgba(34, 197, 94, 0.2); color: #22C55E; }
    .badge.pendiente { background: rgba(249, 115, 22, 0.2); color: #F97316; }
    .badge.rechazado { background: rgba(239, 68, 68, 0.2); color: #EF4444; }
    .badge.borrador { background: rgba(99, 102, 241, 0.2); color: #6366F1; }
    .badge.enviado { background: rgba(59, 130, 246, 0.2); color: #3B82F6; }

    .actions {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
      opacity: 0.7;
      transition: all 0.2s;
      padding: 0.5rem;
      text-decoration: none;
    }

    .action-btn:hover {
      opacity: 1;
      background: rgba(99, 102, 241, 0.2);
      border-color: rgba(99, 102, 241, 0.4);
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
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.05);
      color: white;
      cursor: pointer;
      transition: all 0.2s;
    }

    .page-btn:hover:not(:disabled) {
      border-color: #6366F1;
      background: rgba(99, 102, 241, 0.2);
    }

    .page-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .page-info {
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.875rem;
    }

    /* Estados */
    .loading-state, .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: rgba(30, 41, 59, 0.6);
      backdrop-filter: blur(12px);
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .loading-state .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-top-color: #6366F1;
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
      opacity: 0.5;
    }

    .empty-state h3 {
      margin: 0 0 0.5rem;
      color: rgba(255, 255, 255, 0.9);
    }

    .empty-state p {
      color: rgba(255, 255, 255, 0.5);
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
