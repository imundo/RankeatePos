import { Component, signal, inject } from '@angular/core';
import { BillingService, Dte } from '../../../core/services/billing.service';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-lista-documentos',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, TagModule, InputTextModule, CalendarModule, FormsModule],
  template: `
    <div class="billing-container fade-in">
      <div class="page-header">
        <div class="header-content">
          <h1>📑 Documentos Emitidos</h1>
          <p class="subtitle">Historial de Boletas y Facturas Electrónicas</p>
        </div>
        <div class="header-actions">
           <button pButton label="Exportar Libro" icon="pi pi-file-excel" class="p-button-outlined p-button-success"></button>
        </div>
      </div>

      <div class="filters-bar glass-panel mb-4">
        <span class="p-input-icon-left">
          <i class="pi pi-search"></i>
          <input pInputText placeholder="Buscar por Folio o RUT" class="w-full" />
        </span>
        <p-calendar placeholder="Desde" class="input-dark"></p-calendar>
        <p-calendar placeholder="Hasta" class="input-dark"></p-calendar>
        <button pButton icon="pi pi-filter" class="p-button-text"></button>
      </div>

      <div class="glass-panel">
        <p-table [value]="documents()" styleClass="p-datatable-lg" [paginator]="true" [rows]="10">
          <ng-template pTemplate="header">
            <tr>
              <th>Folio</th>
              <th>Tipo</th>
              <th>Emisión</th>
              <th>Receptor</th>
              <th>Monto Total</th>
              <th>Estado SII</th>
              <th>Acciones</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-doc>
            <tr>
              <td class="font-bold">#{{ doc.folio }}</td>
              <td>
                <span class="doc-type-badge" [class.boleta]="doc.tipoDte === 'BOLETA_ELECTRONICA'" [class.factura]="doc.tipoDte === 'FACTURA_ELECTRONICA'">
                  {{ doc.tipoDteDescripcion || doc.tipoDte }}
                </span>
              </td>
              <td>{{ doc.fechaEmision | date:'dd/MM/yyyy' }}</td>
              <td>
                <div class="receptor-info">
                  <span class="name">{{ doc.receptorRazonSocial || 'Consumidor Final' }}</span>
                  <span class="rut text-xs text-gray-400">{{ doc.receptorRut }}</span>
                </div>
              </td>
              <td class="font-bold text-lg text-right">{{ formatMoney(doc.montoTotal) }}</td>
              <td>
                <p-tag [value]="doc.estado" [severity]="doc.estado === 'ACEPTADO' ? 'success' : 'warning'"></p-tag>
              </td>
              <td class="text-right">
                <button pButton icon="pi pi-eye" class="p-button-text p-button-rounded"></button>
                <button pButton icon="pi pi-print" class="p-button-text p-button-rounded"></button>
                <button pButton icon="pi pi-envelope" class="p-button-text p-button-rounded"></button>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
  styles: [`
    .billing-container {
      padding: 2rem;
      min-height: 100vh;
      background: var(--surface-card);
    }
    
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      
      h1 {
        margin: 0;
        font-size: 1.8rem;
        background: linear-gradient(90deg, #34D399, #10B981);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    }

    .glass-panel {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 1rem;
    }

    .filters-bar {
      display: flex;
      gap: 1rem;
      align-items: center;
      padding: 1rem;
    }

    .doc-type-badge {
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      
      &.boleta { background: rgba(59, 130, 246, 0.2); color: #60A5FA; }
      &.factura { background: rgba(16, 185, 129, 0.2); color: #34D399; }
    }
  `]
})
export class ListaDocumentosComponent {
  private billingService = inject(BillingService);

  // State
  documents = signal<Dte[]>([]);
  loading = signal(false);
  totalRecords = signal(0);

  // Filters
  folioFilter = signal('');
  dateRange = signal<Date[] | null>(null);

  ngOnInit() {
    this.loadDocuments();
  }

  loadDocuments(event?: any) {
    this.loading.set(true);
    const page = event ? Math.floor(event.first / event.rows) : 0;
    const size = event ? event.rows : 10;

    this.billingService.getDtes(undefined, undefined, page, size).subscribe({
      next: (response: any) => {
        const content = response.content || [];
        this.documents.set(content);
        this.totalRecords.set(response.totalElements || content.length);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading documents:', error);
        this.loading.set(false);
      }
    });
  }

  formatMoney(amount: number) {
    return this.billingService.formatCurrency(amount);
  }
}
