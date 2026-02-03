import { Component, signal, inject, effect } from '@angular/core';
import { BillingService, Dte } from '../../../core/services/billing.service';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { FormsModule } from '@angular/forms';
import { BranchSwitcherComponent } from '@shared/components/branch-switcher/branch-switcher.component';
import { BarcodeService } from '@core/services/barcode.service';
import { MessageService } from 'primeng/api';
import { AuthService } from '@core/auth/auth.service';

@Component({
  selector: 'app-lista-documentos',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, TagModule, InputTextModule, CalendarModule, DialogModule, TooltipModule, FormsModule, BranchSwitcherComponent],
  template: `
    <div class="billing-container fade-in">
      <div class="page-header">
        <div class="header-content">
          <h1>📑 Documentos Emitidos</h1>
          <p class="subtitle">Historial de Boletas y Facturas Electrónicas</p>
        </div>
        
        <div class="flex items-center gap-4">
             <app-branch-switcher [autoReload]="false" (branchChanged)="onBranchChanged($event)"></app-branch-switcher>
             <div class="header-actions">
                <button pButton label="Enviar Pendientes" icon="pi pi-send" class="premium-btn btn-warning" (click)="enviarPendientes()" [loading]="sendingPending()"></button>
                <button pButton label="Exportar Excel" icon="pi pi-file-excel" class="premium-btn btn-success" (click)="exportarLibro()" [loading]="exporting()"></button>
             </div>
        </div>
      </div>

      <div class="filters-bar glass-panel mb-4">
        <span class="p-input-icon-left search-wrapper">
          <i class="pi pi-search text-gray-400"></i>
          <input pInputText placeholder="Buscar Folio o RUT..." class="premium-input w-full" [(ngModel)]="folioFilter" (keyup.enter)="loadDocuments()" />
        </span>
        
        <div class="date-filters">
           <p-calendar 
             [(ngModel)]="dateRange" 
             selectionMode="range" 
             placeholder="Rango de Fechas" 
             [showIcon]="true" 
             styleClass="premium-calendar"
             inputStyleClass="premium-input"
             [appendTo]="'body'"
             [baseZIndex]="9999">
           </p-calendar>
        </div>
        
        <button pButton icon="pi pi-search" class="search-btn" (click)="loadDocuments()"></button>
      </div>

      <div class="glass-panel table-wrapper">
        <p-table [value]="documents()" styleClass="premium-table p-datatable-lg" [paginator]="true" [rows]="10" [loading]="loading()">
          <ng-template pTemplate="header">
            <tr>
              <th class="rounded-l-lg">Folio</th>
              <th>Tipo</th>
              <th>Emisión</th>
              <th>Receptor</th>
              <th>Monto Total</th>
              <th>Estado SII</th>
              <th class="text-center rounded-r-lg">Acciones</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-doc>
            <tr class="hover-row">
              <td class="font-bold text-lg">#{{ doc.folio }}</td>
              <td>
                <span class="doc-type-badge" [class.boleta]="doc.tipoDte === 'BOLETA_ELECTRONICA'" [class.factura]="doc.tipoDte === 'FACTURA_ELECTRONICA'">
                  {{ doc.tipoDte === 'BOLETA_ELECTRONICA' ? 'Boleta' : 'Factura' }}
                </span>
              </td>
              <!-- Fix: Use UTC to prevent date shift -->
              <td>
                <div class="date-badge">
                    <i class="pi pi-calendar mr-1 text-xs"></i>
                    {{ doc.fechaEmision | date:'dd/MM/yyyy':'UTC' }}
                </div>
              </td>
              <td>
                <div class="receptor-info">
                  <span class="name text-sm font-bold text-white">{{ doc.receptorRazonSocial || 'Consumidor Final' }}</span>
                  <span class="rut text-xs text-secondary">{{ doc.receptorRut }}</span>
                </div>
              </td>
              <td class="font-bold text-xl text-right text-green-400">{{ formatMoney(doc.montoTotal) }}</td>
              <td>
                <p-tag [value]="doc.estado" [severity]="getSeverity(doc.estado)" styleClass="premium-tag"></p-tag>
              </td>
              <td class="text-center">
                <div class="action-buttons">
                    <button pButton icon="pi pi-eye" class="action-icon-btn info" pTooltip="Ver Detalle" tooltipPosition="top" (click)="viewDte(doc)"></button>
                    <button pButton icon="pi pi-print" class="action-icon-btn secondary" pTooltip="Imprimir" tooltipPosition="top" (click)="printDte(doc)"></button>
                    <button pButton icon="pi pi-envelope" class="action-icon-btn help" pTooltip="Enviar Email" tooltipPosition="top" (click)="emailDte(doc)"></button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
                <td colspan="7" class="text-center p-8 text-gray-400">
                    <div class="empty-state">
                        <i class="pi pi-folder-open text-6xl mb-4 text-gray-600"></i>
                        <h3>Sin Documentos</h3>
                        <p>No se encontraron documentos en este rango.</p>
                    </div>
                </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
      
      <!-- DETAILS MODAL (Premium Glass Style) -->
      <p-dialog 
        [(visible)]="showDetailModal" 
        [modal]="true" 
        [style]="{width: '100%', maxWidth: '450px'}" 
        [resizable]="false" 
        [draggable]="false"
        styleClass="premium-modal"
        [dismissableMask]="true"
        [showHeader]="false"
        [baseZIndex]="10000">
        
        <div class="modal-content" *ngIf="selectedDoc">
            <div class="modal-header">
                <h2>🧾 Detalle de Venta</h2>
                <button class="close-btn" (click)="showDetailModal = false">✕</button>
            </div>
            
            <div class="receipt-preview-container">
                <div class="thermal-receipt" id="modal-receipt">
                    <div class="receipt-header">
                        <div class="receipt-logo" *ngIf="!tenantLogo()">💎</div>
                        <img [src]="tenantLogo()" *ngIf="tenantLogo()" class="receipt-logo-img"/>
                        
                        <div class="receipt-title">{{ selectedDoc.tipoDte === 'BOLETA_ELECTRONICA' ? 'BOLETA ELECTRÓNICA' : 'FACTURA ELECTRÓNICA' }}</div>
                        <div class="receipt-folio">Folio N° {{ selectedDoc.folio }}</div>
                        <div class="receipt-date">{{ selectedDoc.fechaEmision | date:'dd/MM/yyyy HH:mm':'UTC' }}</div>
                    </div>

                    <div class="receipt-divider"></div>

                    <div class="receipt-company">
                        <div class="font-bold">{{ selectedDoc.emisorRazonSocial }}</div>
                        <div>{{ selectedDoc.emisorRut }}</div>
                        <div>{{ selectedDoc.emisorDireccion }}</div>
                    </div>

                    <div class="receipt-divider"></div>

                    <div class="receipt-items">
                        <div class="receipt-item-row" *ngFor="let item of selectedDoc.items">
                            <span class="item-qty">{{ item.cantidad }}</span>
                            <span class="item-name">{{ item.nombreItem }}</span>
                            <span class="item-price">{{ formatMoney(item.montoItem) }}</span>
                        </div>
                         <div class="receipt-item-row text-gray-500 italic" *ngIf="!selectedDoc.items?.length">
                            <span class="item-qty">1</span>
                            <span class="item-name">Detalle general</span>
                            <span class="item-price">{{ formatMoney(selectedDoc.montoTotal) }}</span>
                        </div>
                    </div>

                    <div class="receipt-divider"></div>

                    <div class="receipt-totals">
                       <div class="total-row" *ngIf="selectedDoc.montoNeto">
                            <span>Neto</span>
                            <span>{{ formatMoney(selectedDoc.montoNeto) }}</span>
                        </div>
                        <div class="total-row" *ngIf="selectedDoc.montoIva">
                            <span>IVA (19%)</span>
                            <span>{{ formatMoney(selectedDoc.montoIva) }}</span>
                        </div>
                        <div class="total-row bold text-xl mt-2">
                            <span>TOTAL</span>
                            <span>{{ formatMoney(selectedDoc.montoTotal) }}</span>
                        </div>
                    </div>
                    
                    <div class="receipt-barcode-section">
                         <div class="pdf417-container" *ngIf="previewPdf417()">
                            <img [src]="previewPdf417()" class="pdf417-img" />
                            <div class="barcode-label">Timbre Electrónico SII</div>
                         </div>
                         <div class="qr-container mt-4" *ngIf="previewQrCode()">
                            <img [src]="previewQrCode()" class="qr-img mx-auto" style="width: 100px; height: 100px;" />
                            <div class="barcode-label">Verificar en SII</div>
                         </div>
                    </div>
                </div>
            </div>
            
            <div class="modal-actions">
                <button pButton label="Imprimir" icon="pi pi-print" class="p-button-outlined p-button-secondary flex-1 border-gray-600 text-gray-300 hover:bg-gray-800" (click)="printDte(selectedDoc)"></button>
                <button pButton label="Enviar Email" icon="pi pi-envelope" class="premium-btn btn-primary flex-1" (click)="emailDte(selectedDoc)"></button>
            </div>
        </div>
      </p-dialog>
      
      <iframe id="print-frame" style="display:none"></iframe>
    </div>
  `,
  styles: [`
    .billing-container {
      padding: 2rem;
      min-height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #e2e8f0;
    }
    
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2.5rem;
      
      h1 {
        margin: 0;
        font-size: 2.2rem;
        font-weight: 800;
        background: linear-gradient(to right, #4ade80, #3b82f6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        letter-spacing: -1px;
      }
      .subtitle { color: #94a3b8; font-size: 0.95rem; margin-top: 0.25rem; }
    }

    /* Glass Panels */
    .glass-panel {
      background: rgba(30, 41, 59, 0.7);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    }
    
    /* Filters Bar */
    .filters-bar {
      display: flex;
      gap: 1.25rem;
      align-items: center;
      padding: 1.25rem 2rem;
      flex-wrap: wrap;
      margin-bottom: 2rem;
    }
    
    .search-wrapper { 
        flex: 1; 
        min-width: 250px; 
        position: relative;
    }
    
    .premium-input {
        width: 100%;
        background: rgba(15, 23, 42, 0.6) !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        color: white !important;
        border-radius: 12px !important;
        padding: 0.75rem 1rem 0.75rem 2.5rem !important;
        transition: all 0.3s ease;
    }
    
    .premium-input:focus {
        border-color: #3b82f6 !important;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
    }
    
    .search-btn {
        background: rgba(59, 130, 246, 0.1) !important;
        color: #60a5fa !important;
        border: 1px solid rgba(59, 130, 246, 0.2) !important;
        border-radius: 12px !important;
        width: 48px;
        height: 48px;
    }

    /* Premium Buttons */
    .premium-btn {
        border-radius: 12px !important;
        padding: 0.6rem 1.2rem !important;
        font-weight: 600 !important;
        border: none !important;
        transition: transform 0.2s, box-shadow 0.2s !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    
    .premium-btn:active { transform: translateY(1px); }
    .premium-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
    
    .btn-warning {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
        color: white !important;
        text-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }
    
    .btn-success {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
        color: white !important;
        text-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }
    
    .btn-primary {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
        color: white !important;
    }

    /* Table Styles */
    .table-wrapper { padding: 0.5rem; overflow: hidden; }
    
    :host ::ng-deep .premium-table .p-datatable-header,
    :host ::ng-deep .premium-table .p-datatable-thead > tr > th {
        background: #1e293b !important;
        color: #94a3b8 !important;
        border: none !important;
        padding: 1rem !important;
        font-weight: 600;
        text-transform: uppercase;
        font-size: 0.75rem;
        letter-spacing: 0.05em;
    }
    
    :host ::ng-deep .premium-table .p-datatable-tbody > tr {
        background: transparent !important;
        color: #e2e8f0 !important;
        border-bottom: 1px solid rgba(255,255,255,0.05) !important;
        transition: background 0.2s;
    }
    
    :host ::ng-deep .premium-table .p-datatable-tbody > tr:hover {
        background: rgba(59, 130, 246, 0.05) !important;
    }
    
    .date-badge {
        background: rgba(255, 255, 255, 0.05);
        padding: 4px 8px;
        border-radius: 6px;
        display: inline-flex;
        align-items: center;
        font-size: 0.9rem;
        color: #cbd5e1;
    }
    
    .text-secondary { color: #94a3b8; }

    /* Action Icon Buttons */
    .action-badge {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .action-icon-btn {
        width: 2.5rem !important; 
        height: 2.5rem !important;
        border-radius: 10px !important;
        background: rgba(255,255,255,0.05) !important;
        border: 1px solid rgba(255,255,255,0.1) !important;
        margin: 0 0.25rem;
        transition: all 0.2s !important;
    }
    
    .action-icon-btn:hover { transform: scale(1.1); }
    .action-icon-btn.info:hover { background: rgba(59, 130, 246, 0.2) !important; color: #60a5fa !important; border-color: #60a5fa !important; }
    .action-icon-btn.secondary:hover { background: rgba(255, 255, 255, 0.2) !important; color: white !important; border-color: white !important; }
    .action-icon-btn.help:hover { background: rgba(168, 85, 247, 0.2) !important; color: #c084fc !important; border-color: #c084fc !important; }

    /* Modal & Receipt Premium Styles */
    :host ::ng-deep .premium-modal .p-dialog-content {
        padding: 0 !important;
        background: transparent !important;
        border-radius: 20px;
    }

    .modal-content {
        background: #0f172a;
        display: flex;
        flex-direction: column;
        height: 100%;
        max-height: 85vh;
        border-radius: 20px;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,0.1);
    }
    
    .modal-header {
        padding: 1.5rem;
        background: #1e293b;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    
    .modal-header h2 { margin: 0; font-size: 1.25rem; font-weight: 700; color: white; }
    .close-btn { background: none; border: none; color: #94a3b8; font-size: 1.5rem; cursor: pointer; }
    .close-btn:hover { color: white; }
    
    .receipt-preview-container {
        padding: 2rem;
        background: #0f172a; /* Dark background behind paper */
        overflow-y: auto;
        flex: 1;
        display: flex;
        justify-content: center;
        /* Custom Scrollbar */
        scrollbar-width: thin;
        scrollbar-color: #334155 #0f172a;
    }
    
    .thermal-receipt {
        background: #fff;
        color: #000;
        width: 100%;
        max-width: 380px; /* Typical thermal width constraint */
        padding: 20px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        font-family: 'Courier New', Courier, monospace; /* Thermal printer font */
        font-size: 13px;
        line-height: 1.4;
        align-self: flex-start; /* Allow growing */
        position: relative;
    }
    
    /* Paper effect */
    .thermal-receipt::before {
        content: '';
        position: absolute;
        top: -5px; left: 0; right: 0; height: 5px;
        background: linear-gradient(135deg, white 5px, transparent 0) 0 5px,
                    linear-gradient(-135deg, white 5px, transparent 0) 0 5px;
        background-color: #0f172a;
        background-position: left bottom;
        background-repeat: repeat-x;
        background-size: 10px 10px;
    }
    
    .thermal-receipt::after {
        content: '';
        position: absolute;
        bottom: -5px; left: 0; right: 0; height: 5px;
        background: linear-gradient(45deg, white 5px, transparent 0) 0 -5px,
                    linear-gradient(-45deg, white 5px, transparent 0) 0 -5px;
        background-color: #0f172a;
        background-position: left top;
        background-repeat: repeat-x;
        background-size: 10px 10px;
    }

    .receipt-header, .receipt-company, .receipt-totals { text-align: center; }
    .receipt-logo-img { width: 60px; height: 60px; object-fit: contain; margin: 0 auto; display: block; filter: grayscale(100%); mix-blend-mode: multiply; }
    .receipt-title { font-weight: 900; font-size: 16px; margin: 10px 0 5px; text-transform: uppercase; }
    .receipt-folio { font-size: 14px; font-weight: bold; margin-bottom: 5px; }
    .receipt-date { font-size: 11px; color: #555; }
    
    .receipt-divider { 
        border-bottom: 2px dashed #000; 
        margin: 15px 0; 
        opacity: 0.3;
    }
    
    .receipt-item-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .item-qty { width: 30px; }
    .item-name { flex: 1; text-align: left; padding-right: 10px; }
    .item-price { font-weight: bold; }
    
    .total-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .total-row.bold { font-weight: 900; font-size: 1.1rem; border-top: 2px solid #000; padding-top: 10px; margin-top: 5px; }
    
    .receipt-barcode-section { margin-top: 20px; text-align: center; }
    .pdf417-img { max-width: 100%; height: auto; mix-blend-mode: multiply; }
    .qr-img { mix-blend-mode: multiply; display: block; }
    .barcode-label { font-size: 10px; text-transform: uppercase; margin-top: 5px; }

    .modal-actions {
        padding: 1.5rem;
        background: #1e293b;
        display: flex;
        gap: 1rem;
        border-top: 1px solid rgba(255,255,255,0.05);
    }
    
    /* Common Helpers */
    :host ::ng-deep .p-datepicker {
        background: #1e293b !important;
        border: 1px solid rgba(255,255,255,0.1) !important;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5) !important;
        z-index: 99999 !important;
    }
    :host ::ng-deep .p-datepicker table td > span { color: #e2e8f0; }
    :host ::ng-deep .p-datepicker table td > span:hover { background: #3b82f6 !important; }
  `]
})
export class ListaDocumentosComponent {
  private billingService = inject(BillingService);
  private barcodeService = inject(BarcodeService);
  private messageService = inject(MessageService);
  private authService = inject(AuthService);

  // State
  documents = signal<Dte[]>([]);
  loading = signal(false);
  totalRecords = signal(0);

  // UI State
  showDetailModal = false;
  selectedDoc: Dte | null = null;
  currentBranchId: string = '';
  previewPdf417 = signal<string>('');
  previewQrCode = signal<string>('');

  folioFilter = signal('');
  dateRange = signal<Date[] | null>(null);
  tenantLogo = signal('');

  sendingPending = signal(false);
  exporting = signal(false); // New state

  ngOnInit() {
    this.tenantLogo.set(this.authService.tenant()?.logoUrl || '');
    this.loadDocuments();
  }

  onBranchChanged(branch: any) {
    this.currentBranchId = branch.id;
    this.loadDocuments();
  }

  // LOGIC FOR EXPORT
  exportarLibro() {
    this.exporting.set(true);

    const now = new Date();
    // Default: Current Month
    let from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    let to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    // If dates selected in filter, use them
    if (this.dateRange() && this.dateRange()!.length > 0) {
      if (this.dateRange()![0]) from = this.dateRange()![0].toISOString().split('T')[0];
      if (this.dateRange()![1]) to = this.dateRange()![1].toISOString().split('T')[0];
    }

    this.billingService.downloadLibroVentasExcel(from, to).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Libro_Ventas_${from}_${to}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.messageService.add({ severity: 'success', summary: 'Exportado', detail: 'Libro de ventas descargado' });
        this.exporting.set(false);
      },
      error: (err) => {
        console.error('Export error', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo exportar el libro' });
        this.exporting.set(false);
      }
    });
  }

  enviarPendientes() {
    if (!confirm('¿Estás seguro de enviar todos los documentos pendientes al SII?')) return;
    this.sendingPending.set(true);
    this.billingService.enviarPendientes().subscribe({
      next: (res) => {
        this.messageService.add({ severity: 'success', summary: 'Enviado', detail: `Proceso finalizado. Enviados: ${res.sentCount || 0}` });
        this.loadDocuments();
        this.sendingPending.set(false);
      },
      error: (err) => {
        console.error('Error enviando pendientes', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron enviar los pendientes' });
        this.sendingPending.set(false);
      }
    });
  }

  loadDocuments(event?: any) {
    this.loading.set(true);
    const page = event ? Math.floor(event.first / event.rows) : 0;
    const size = event ? event.rows : 10;
    const branchId = this.currentBranchId;

    this.billingService.getDtes(undefined, undefined, page, size, branchId).subscribe({
      next: (response: any) => {
        let content = [];
        let total = 0;
        if (response) {
          if (response.content) {
            content = response.content;
            total = response.totalElements;
          } else if (Array.isArray(response)) {
            content = response;
            total = response.length;
          } else if (typeof response === 'string') {
            try {
              const parsed = JSON.parse(response);
              content = parsed.content || [];
              total = parsed.totalElements || 0;
            } catch (e) { }
          }
        }
        this.documents.set(content);
        this.totalRecords.set(total);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Frontend: Error loading', error);
        this.loading.set(false);
      }
    });
  }

  getSeverity(estado: string): any {
    switch (estado) {
      case 'ACEPTADO': return 'success';
      case 'RECHAZADO': return 'danger';
      case 'ENVIADO': return 'info';
      case 'PENDIENTE': return 'warning';
      default: return 'secondary';
    }
  }

  formatMoney(amount: number) {
    return this.billingService.formatCurrency(amount);
  }

  async viewDte(doc: Dte) {
    this.selectedDoc = doc;
    this.showDetailModal = true;
    this.previewPdf417.set('');
    this.previewQrCode.set('');
    try {
      const timbreData = this.barcodeService.generateTimbreData({
        tipoDte: doc.tipoDte,
        folio: doc.folio,
        fechaEmision: doc.fechaEmision,
        rutEmisor: doc.emisorRut,
        razonSocialEmisor: doc.emisorRazonSocial,
        montoTotal: doc.montoTotal
      });
      const pdf417 = await this.barcodeService.generatePDF417(timbreData);
      this.previewPdf417.set(pdf417);
      const qr = await this.barcodeService.generateQRCode(`https://sii.cl/${doc.folio}`);
      this.previewQrCode.set(qr);
    } catch (e) {
      console.error('Error generating barcodes', e);
    }
  }

  printDte(doc: Dte) {
    this.selectedDoc = doc;
    const receiptHtml = document.querySelector('.thermal-receipt')?.innerHTML || '';
    if (!receiptHtml && !this.showDetailModal) {
      this.viewDte(doc);
      setTimeout(() => this.executePrint(), 500);
      return;
    }
    this.executePrint();
  }

  executePrint() {
    const receiptElement = document.querySelector('.thermal-receipt');
    if (!receiptElement) return;
    const iframe = document.getElementById('print-frame') as HTMLIFrameElement;
    const doc = iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(`
        <html>
        <head>
            <title>Imprimir ${this.selectedDoc?.folio}</title>
            <style>
                @page { margin: 0; size: 80mm auto; }
                body { font-family: 'Courier New', monospace; margin: 0; padding: 5px; width: 80mm; }
                .thermal-receipt { width: 100%; }
                .receipt-header, .receipt-company, .receipt-customer, .receipt-totals { text-align: center; margin-bottom: 10px; }
                .receipt-divider { border-bottom: 1px dashed black; margin: 10px 0; }
                .receipt-item-row, .total-row { display: flex; justify-content: space-between; font-size: 11px; }
                .receipt-logo-img { width: 50px; border-radius: 50%; display: block; margin: 0 auto; }
                .pdf417-img { width: 100%; max-width: 250px; }
                .font-bold { font-weight: bold; }
                .text-xl { font-size: 14px; }
            </style>
        </head>
        <body>
            ${receiptElement.innerHTML}
            <script>window.onload = function() { window.print(); }</script>
        </body>
        </html>
     `);
    doc.close();
  }

  emailDte(doc: Dte) {
    const email = prompt('Ingrese el correo electrónico del destinatario:', doc.receptorEmail);
    if (!email) return;
    this.messageService.add({ severity: 'info', summary: 'Enviando...', detail: 'Enviando documento por correo...' });
    this.billingService.enviarPorEmail(doc.id, email).subscribe({
      next: () => this.messageService.add({ severity: 'success', summary: 'Enviado', detail: 'Correo enviado correctamente' }),
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo enviar el correo' })
    });
  }
}
