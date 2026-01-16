import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface DteListItem {
    id: string;
    folio: number;
    tipoDte: 'BOLETA' | 'FACTURA' | 'NOTA_CREDITO' | 'NOTA_DEBITO' | 'GUIA_DESPACHO';
    fecha: Date;
    receptor: {
        rut: string;
        razonSocial: string;
    };
    total: number;
    estado: 'GENERADO' | 'ENVIADO' | 'ACEPTADO' | 'RECHAZADO' | 'ERROR';
    trackId?: string;
}

@Component({
    selector: 'app-dte-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="dte-list-container">
      <!-- Header with filters -->
      <div class="list-header">
        <h2>📋 Documentos Tributarios Electrónicos</h2>
        
        <div class="filters">
          <select [(ngModel)]="filterTipoDte" class="filter-select">
            <option value="">Todos los tipos</option>
            <option value="BOLETA">Boleta</option>
            <option value="FACTURA">Factura</option>
            <option value="NOTA_CREDITO">Nota de Crédito</option>
            <option value="NOTA_DEBITO">Nota de Débito</option>
            <option value="GUIA_DESPACHO">Guía de Despacho</option>
          </select>

          <select [(ngModel)]="filterEstado" class="filter-select">
            <option value="">Todos los estados</option>
            <option value="GENERADO">Generado</option>
            <option value="ENVIADO">Enviado</option>
            <option value="ACEPTADO">Aceptado</option>
            <option value="RECHAZADO">Rechazado</option>
            <option value="ERROR">Error</option>
          </select>

          <input 
            type="date" 
            [(ngModel)]="filterFechaDesde"
            class="filter-date"
            placeholder="Desde">
          
          <input 
            type="date"
            [(ngModel)]="filterFechaHasta"
            class="filter-date"
            placeholder="Hasta">

          <button class="btn-search" (click)="search()">
            🔍 Buscar
          </button>
        </div>
      </div>

      <!-- DTE Table -->
      <div class="dte-table-container">
        <table class="dte-table">
          <thead>
            <tr>
              <th>Folio</th>
              <th>Tipo</th>
              <th>Fecha</th>
              <th>Receptor</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @if (loading()) {
              <tr>
                <td colspan="7" class="loading-row">
                  <div class="spinner-large"></div>
                  <p>Cargando documentos...</p>
                </td>
              </tr>
            } @else if (filteredDtes().length === 0) {
              <tr>
                <td colspan="7" class="empty-row">
                  <div class="empty-icon">📄</div>
                  <p>No se encontraron documentos</p>
                </td>
              </tr>
            } @else {
              @for (dte of filteredDtes(); track dte.id) {
                <tr class="dte-row" (click)="selectDte(dte)">
                  <td class="folio-cell">
                    <span class="folio-number">{{ dte.folio }}</span>
                  </td>
                  <td>
                    <span class="doc-type" [attr.data-type]="dte.tipoDte">
                      {{ formatTipoDte(dte.tipoDte) }}
                    </span>
                  </td>
                  <td>{{ dte.fecha | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td>
                    <div class="receptor-info">
                      <span class="rut">{{ dte.receptor.rut }}</span>
                      <span class="razon-social">{{ dte.receptor.razonSocial }}</span>
                    </div>
                  </td>
                  <td class="total-cell">{{ formatPrice(dte.total) }}</td>
                  <td>
                    <span class="status-badge" [attr.data-status]="dte.estado">
                      {{ formatEstado(dte.estado) }}
                    </span>
                  </td>
                  <td class="actions-cell">
                    <button class="action-btn" (click)="viewXml(dte); $event.stopPropagation()" title="Ver XML">
                      📄
                    </button>
                    <button class="action-btn" (click)="viewPdf(dte); $event.stopPropagation()" title="Ver PDF">
                      📕
                    </button>
                    <button class="action-btn" (click)="download(dte); $event.stopPropagation()" title="Descargar">
                      📥
                    </button>
                    @if (dte.estado === 'GENERADO') {
                      <button class="action-btn" (click)="sendToSii(dte); $event.stopPropagation()" title="Enviar al SII">
                        📤
                      </button>
                    }
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <span class="page-info">
          Mostrando {{ filteredDtes().length }} de {{ dtes().length }} documentos
        </span>
        <div class="page-controls">
          <button class="page-btn" [disabled]="currentPage() === 1">
            ← Anterior
          </button>
          <span class="page-number">Página {{ currentPage() }}</span>
          <button class="page-btn">
            Siguiente →
          </button>
        </div>
      </div>

      <!-- Detail Modal -->
      @if (selectedDte()) {
        <div class="modal-overlay" (click)="closeDteDetail()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ formatTipoDte(selectedDte()!.tipoDte) }} N° {{ selectedDte()!.folio }}</h3>
              <button class="close-btn" (click)="closeDteDetail()">✕</button>
            </div>
            
            <div class="modal-body">
              <div class="detail-section">
                <h4>Información General</h4>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="label">Folio:</span>
                    <span class="value">{{ selectedDte()!.folio }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">Fecha:</span>
                    <span class="value">{{ selectedDte()!.fecha | date:'dd/MM/yyyy HH:mm' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">Estado:</span>
                    <span class="status-badge" [attr.data-status]="selectedDte()!.estado">
                      {{ formatEstado(selectedDte()!.estado) }}
                    </span>
                  </div>
                  @if (selectedDte()!.trackId) {
                    <div class="detail-item">
                      <span class="label">Track ID:</span>
                      <span class="value">{{ selectedDte()!.trackId }}</span>
                    </div>
                  }
                </div>
              </div>

              <div class="detail-section">
                <h4>Receptor</h4>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="label">RUT:</span>
                    <span class="value">{{ selectedDte()!.receptor.rut }}</span>
                  </div>
                  <div class="detail-item full-width">
                    <span class="label">Razón Social:</span>
                    <span class="value">{{ selectedDte()!.receptor.razonSocial }}</span>
                  </div>
                </div>
              </div>

              <div class="detail-section">
                <h4>Monto</h4>
                <div class="total-display">
                  {{ formatPrice(selectedDte()!.total) }}
                </div>
              </div>
            </div>
            
            <div class="modal-footer">
              <button class="btn-secondary" (click)="closeDteDetail()">Cerrar</button>
              <button class="btn-primary" (click)="download PDF(selectedDte()!)">
                📕 Descargar PDF
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
    styles: [`
    .dte-list-container {
      padding: 2rem;
      max-width: 1600px;
      margin: 0 auto;
    }

    .list-header {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      margin-bottom: 2rem;
      border: 1px solid #e2e8f0;

      h2 {
        font-size: 1.75rem;
        font-weight: 700;
        color: #1e293b;
        margin: 0 0 1.5rem 0;
      }

      .filters {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .filter-select,
      .filter-date {
        padding: 0.75rem 1rem;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        font-size: 0.875rem;
        background: white;
        cursor: pointer;
        transition: all 0.2s;

        &:focus {
          outline: none;
          border-color: #6366f1;
        }
      }

      .btn-search {
        padding: 0.75rem 1.5rem;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }
      }
    }

    .dte-table-container {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }

    .dte-table {
      width: 100%;
      border-collapse: collapse;

      thead {
        background: #f8fafc;
        
        th {
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          color: #475569;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 2px solid #e2e8f0;
        }
      }

      tbody {
        .dte-row {
          cursor: pointer;
          transition: all 0.2s;

          &:hover {
            background: #f8fafc;
          }

          td {
            padding: 1rem;
            border-bottom: 1px solid #f1f5f9;
          }
        }

        .loading-row,
        .empty-row {
          text-align: center;
          padding: 4rem 2rem;

          .spinner-large {
            width: 48px;
            height: 48px;
            border: 4px solid #e2e8f0;
            border-top-color: #6366f1;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 1rem;
          }

          .empty-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
          }

          p {
            color: #64748b;
            margin: 0;
          }
        }
      }

      .folio-cel {
        .folio-number {
          font-weight: 700;
          color: #1e293b;
          font-size: 1.125rem;
        }
      }

      .doc-type {
        padding: 0.375rem 0.75rem;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 600;
        display: inline-block;

        &[data-type="BOLETA"] {
          background: #dbeafe;
          color: #1e40af;
        }

        &[data-type="FACTURA"] {
          background: #fef3c7;
          color: #92400e;
        }

        &[data-type="NOTA_CREDITO"] {
          background: #dcfce7;
          color: #166534;
        }

        &[data-type="NOTA_DEBITO"] {
          background: #fee2e2;
          color: #991b1b;
        }

        &[data-type="GUIA_DESPACHO"] {
          background: #e0e7ff;
          color: #3730a3;
        }
      }

      .receptor-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;

        .rut {
          font-weight: 600;
          color: #1e293b;
        }

        .razon-social {
          font-size: 0.875rem;
          color: #64748b;
        }
      }

      .total-cell {
        font-weight: 700;
        color: #10b981;
        font-size: 1.125rem;
      }

      .status-badge {
        padding: 0.375rem 0.75rem;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 600;
        display: inline-block;

        &[data-status="GENERADO"] {
          background: #e0e7ff;
          color: #3730a3;
        }

        &[data-status="ENVIADO"] {
          background: #fef3c7;
          color: #92400e;
        }

        &[data-status="ACEPTADO"] {
          background: #dcfce7;
          color: #166534;
        }

        &[data-status="RECHAZADO"],
        &[data-status="ERROR"] {
          background: #fee2e2;
          color: #991b1b;
        }
      }

      .actions-cell {
        display: flex;
        gap: 0.5rem;

        .action-btn {
          padding: 0.5rem;
          background: #f1f5f9;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1.125rem;
          transition: all 0.2s;

          &:hover {
            background: #e2e8f0;
            transform: translateY(-2px);
          }
        }
      }
    }

    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      background: white;
      border-radius: 0 0 16px 16px;
      margin-top: -1px;
      border: 1px solid #e2e8f0;
      border-top: none;

      .page-info {
        color: #64748b;
        font-size: 0.875rem;
      }

      .page-controls {
        display: flex;
        gap: 1rem;
        align-items: center;

        .page-btn {
          padding: 0.5rem 1rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          color: #475569;
          transition: all 0.2s;

          &:hover:not(:disabled) {
            background: #e2e8f0;
          }

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        }

        .page-number {
          font-weight: 600;
          color: #1e293b;
        }
      }
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 2rem;
    }

    .modal-content {
      background: white;
      border-radius: 16px;
      max-width: 600px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 2rem;
        border-bottom: 1px solid #e2e8f0;

        h3 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #64748b;
          padding: 0.5rem;
          line-height: 1;
          border-radius: 6px;
          transition: all 0.2s;

          &:hover {
            background: #f1f5f9;
            color: #1e293b;
          }
        }
      }

      .modal-body {
        padding: 2rem;

        .detail-section {
          margin-bottom: 2rem;

          &:last-child {
            margin-bottom: 0;
          }

          h4 {
            font-size: 1.125rem;
            font-weight: 600;
            color: #1e293b;
            margin: 0 0 1rem 0;
          }

          .detail-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;

            .detail-item {
              display: flex;
              flex-direction: column;
              gap: 0.25rem;

              &.full-width {
                grid-column: 1 / -1;
              }

              .label {
                font-size: 0.875rem;
                color: #64748b;
                font-weight: 500;
              }

              .value {
                font-weight: 600;
                color: #1e293b;
              }
            }
          }

          .total-display {
            font-size: 2rem;
            font-weight: 700;
            color: #10b981;
            text-align: center;
            padding: 1.5rem;
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            border-radius: 12px;
          }
        }
      }

      .modal-footer {
        padding: 1.5rem 2rem;
        border-top: 1px solid #e2e8f0;
        display: flex;
        gap: 1rem;
        justify-content: flex-end;

        .btn-secondary {
          padding: 0.75rem 1.5rem;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s;

          &:hover {
            background: #f8fafc;
            border-color: #cbd5e1;
          }
        }

        .btn-primary {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
          }
        }
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class DteListComponent {
    dtes = signal<DteListItem[]>([]);
    loading = signal(true);
    selectedDte = signal<DteListItem | null>(null);
    currentPage = signal(1);

    // Filters
    filterTipoDte = '';
    filterEstado = '';
    filterFechaDesde = '';
    filterFechaHasta = '';

    filteredDtes = computed(() => {
        let result = this.dtes();

        if (this.filterTipoDte) {
            result = result.filter(d => d.tipoDte === this.filterTipoDte);
        }

        if (this.filterEstado) {
            result = result.filter(d => d.estado === this.filterEstado);
        }

        // TODO: Add date filtering

        return result;
    });

    ngOnInit() {
        this.loadDtes();
    }

    loadDtes() {
        // TODO: Load from backend
        setTimeout(() => {
            this.dtes.set([
                {
                    id: '1',
                    folio: 1234,
                    tipoDte: 'BOLETA',
                    fecha: new Date(),
                    receptor: { rut: '12.345.678-9', razonSocial: 'Cliente Ejemplo' },
                    total: 50000,
                    estado: 'ACEPTADO',
                    trackId: 'TRACK123'
                }
            ]);
            this.loading.set(false);
        }, 1000);
    }

    search() {
        this.loadDtes();
    }

    selectDte(dte: DteListItem) {
        this.selectedDte.set(dte);
    }

    closeDteDetail() {
        this.selectedDte.set(null);
    }

    formatTipoDte(tipo: string): string {
        const tipos: Record<string, string> = {
            'BOLETA': 'Boleta Electrónica',
            'FACTURA': 'Factura Electrónica',
            'NOTA_CREDITO': 'Nota de Crédito',
            'NOTA_DEBITO': 'Nota de Débito',
            'GUIA_DESPACHO': 'Guía de Despacho'
        };
        return tipos[tipo] || tipo;
    }

    formatEstado(estado: string): string {
        const estados: Record<string, string> = {
            'GENERADO': 'Generado',
            'ENVIADO': 'Enviado al SII',
            'ACEPTADO': 'Aceptado',
            'RECHAZADO': 'Rechazado',
            'ERROR': 'Error'
        };
        return estados[estado] || estado;
    }

    formatPrice(amount: number): string {
        return `$${amount.toLocaleString('es-CL')}`;
    }

    viewXml(dte: DteListItem) {
        // TODO: Implement XML view
        console.log('View XML', dte);
    }

    viewPdf(dte: DteListItem) {
        // TODO: Implement PDF view
        console.log('View PDF', dte);
    }

    download(dte: DteListItem) {
        // TODO: Implement download
        console.log('Download', dte);
    }

    downloadPDF(dte: DteListItem) {
        // TODO: Implement PDF download
        console.log('Download PDF', dte);
    }

    sendToSii(dte: DteListItem) {
        // TODO: Implement send to SII
        console.log('Send to SII', dte);
    }
}
