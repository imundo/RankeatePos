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
                <button pButton label="Enviar Pendientes" icon="pi pi-send" class="action-btn warning" (click)="enviarPendientes()" [loading]="sendingPending()"></button>
                <button pButton label="Exportar" icon="pi pi-file-excel" class="action-btn success"></button>
             </div>
        </div>
      </div>

      <div class="filters-bar glass-panel mb-4">
        <span class="p-input-icon-left search-wrapper">
          <i class="pi pi-search"></i>
          <input pInputText placeholder="Buscar Folio o RUT..." class="search-input" [(ngModel)]="folioFilter" (keyup.enter)="loadDocuments()" />
        </span>
        
        <div class="date-filters">
           <p-calendar [(ngModel)]="dateRange" selectionMode="range" placeholder="Rango de Fechas" [showIcon]="true" class="input-dark"></p-calendar>
        </div>
        
        <button pButton icon="pi pi-search" class="p-button-rounded p-button-text" (click)="loadDocuments()"></button>
      </div>

      <div class="glass-panel table-wrapper">
        <p-table [value]="documents()" styleClass="p-datatable-lg" [paginator]="true" [rows]="10" [loading]="loading()">
          <ng-template pTemplate="header">
            <tr>
              <th>Folio</th>
              <th>Tipo</th>
              <th>Emisión</th>
              <th>Receptor</th>
              <th>Monto Total</th>
              <th>Estado SII</th>
              <th class="text-center">Acciones</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-doc>
            <tr class="hover-row">
              <td class="font-bold">#{{ doc.folio }}</td>
              <td>
                <span class="doc-type-badge" [class.boleta]="doc.tipoDte === 'BOLETA_ELECTRONICA'" [class.factura]="doc.tipoDte === 'FACTURA_ELECTRONICA'">
                  {{ doc.tipoDte === 'BOLETA_ELECTRONICA' ? 'Boleta' : 'Factura' }}
                </span>
              </td>
              <!-- Fix: Use UTC to prevent date shift -->
              <td>{{ doc.fechaEmision | date:'dd/MM/yyyy':'UTC' }}</td>
              <td>
                <div class="receptor-info">
                  <span class="name text-sm font-medium">{{ doc.receptorRazonSocial || 'Consumidor Final' }}</span>
                  <span class="rut text-xs text-gray-400">{{ doc.receptorRut }}</span>
                </div>
              </td>
              <td class="font-bold text-lg text-right">{{ formatMoney(doc.montoTotal) }}</td>
              <td>
                <p-tag [value]="doc.estado" [severity]="getSeverity(doc.estado)"></p-tag>
              </td>
              <td class="text-center">
                <div class="action-buttons">
                    <button pButton icon="pi pi-eye" class="p-button-text p-button-rounded p-button-info" pTooltip="Ver Detalle" (click)="viewDte(doc)"></button>
                    <button pButton icon="pi pi-print" class="p-button-text p-button-rounded p-button-secondary" pTooltip="Imprimir" (click)="printDte(doc)"></button>
                    <button pButton icon="pi pi-envelope" class="p-button-text p-button-rounded p-button-help" pTooltip="Enviar Email" (click)="emailDte(doc)"></button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
                <td colspan="7" class="text-center p-8 text-gray-400">
                    <i class="pi pi-info-circle text-2xl mb-2"></i>
                    <p>No se encontraron documentos para esta sucursal.</p>
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
        [showHeader]="false">
        
        <div class="modal-content" *ngIf="selectedDoc">
            <div class="modal-header">
                <h2>Detalle de Documento</h2>
                <button class="close-btn" (click)="showDetailModal = false">✕</button>
            </div>
            
            <div class="receipt-preview-container">
                <div class="thermal-receipt" id="modal-receipt">
                    <div class="receipt-header">
                        <div class="receipt-logo" *ngIf="!tenantLogo()">🧾</div>
                        <img [src]="tenantLogo()" *ngIf="tenantLogo()" class="receipt-logo-img"/>
                        
                        <div class="receipt-title">{{ selectedDoc.tipoDte === 'BOLETA_ELECTRONICA' ? 'BOLETA ELECTRÓNICA' : 'FACTURA ELECTRÓNICA' }}</div>
                        <div class="receipt-folio">N° {{ selectedDoc.folio }}</div>
                        <div class="receipt-date">{{ selectedDoc.fechaEmision | date:'dd/MM/yyyy HH:mm':'UTC' }}</div>
                    </div>

                    <div class="receipt-divider"></div>

                    <div class="receipt-company">
                        <div>{{ selectedDoc.emisorRazonSocial }}</div>
                        <div>RUT: {{ selectedDoc.emisorRut }}</div>
                        <div>{{ selectedDoc.emisorDireccion }}</div>
                    </div>

                    <div class="receipt-divider"></div>

                    <!-- Receptor (si es factura o tiene datos) -->
                    <div class="receipt-customer" *ngIf="selectedDoc.receptorRut">
                        <div>Receptor: {{ selectedDoc.receptorRazonSocial }}</div>
                        <div>RUT: {{ selectedDoc.receptorRut }}</div>
                    </div>
                     <div class="receipt-divider" *ngIf="selectedDoc.receptorRut"></div>

                    <div class="receipt-items">
                        <div class="receipt-item-row" *ngFor="let item of selectedDoc.items">
                            <span class="item-qty">{{ item.cantidad }}x</span>
                            <span class="item-name">{{ item.nombreItem }}</span>
                            <span class="item-price">{{ formatMoney(item.montoItem) }}</span>
                        </div>
                        <!-- Fallback si no hay items detallados -->
                         <div class="receipt-item-row" *ngIf="!selectedDoc.items?.length">
                            <span class="item-qty">1x</span>
                            <span class="item-name">Detalle no disponible</span>
                            <span class="item-price">{{ formatMoney(selectedDoc.montoTotal) }}</span>
                        </div>
                    </div>

                    <div class="receipt-divider"></div>

                    <div class="receipt-totals">
                       <div class="total-row" *ngIf="selectedDoc.montoNeto">
                            <span>Neto:</span>
                            <span>{{ formatMoney(selectedDoc.montoNeto) }}</span>
                        </div>
                        <div class="total-row" *ngIf="selectedDoc.montoIva">
                            <span>IVA (19%):</span>
                            <span>{{ formatMoney(selectedDoc.montoIva) }}</span>
                        </div>
                        <div class="total-row bold">
                            <span>TOTAL:</span>
                            <span>{{ formatMoney(selectedDoc.montoTotal) }}</span>
                        </div>
                    </div>
                    
                    <div class="receipt-barcode-section">
                         <div class="pdf417-container" *ngIf="previewPdf417()">
                            <img [src]="previewPdf417()" class="pdf417-img" />
                            <div class="barcode-label">Timbre Electrónico SII</div>
                         </div>
                         <div class="qr-container" *ngIf="previewQrCode()">
                             <img [src]="previewQrCode()" class="qr-img" />
                         </div>
                    </div>
                </div>
            </div>
            
            <div class="modal-actions">
                <button pButton label="Imprimir" icon="pi pi-print" class="p-button-outlined p-button-secondary w-full" (click)="printDte(selectedDoc)"></button>
                <button pButton label="Enviar Email" icon="pi pi-envelope" class="p-button-primary w-full" (click)="emailDte(selectedDoc)"></button>
            </div>
        </div>
      </p-dialog>
      
      <!-- Hidden Iframe for Printing -->
      <iframe id="print-frame" style="display:none"></iframe>
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
      .subtitle { color: #9CA3AF; margin-top: 0.5rem; }
    }

    .glass-panel {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      backdrop-filter: blur(10px);
    }

    .filters-bar {
      display: flex;
      gap: 1rem;
      align-items: center;
      padding: 1.5rem;
      flex-wrap: wrap;
    }
    
    .search-wrapper { flex: 1; min-width: 250px; }
    .search-input { width: 100%; border-radius: 8px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); }
    
    .table-wrapper { padding: 0.5rem; overflow: hidden; }
    
    .doc-type-badge {
      padding: 6px 10px;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      &.boleta { background: rgba(59, 130, 246, 0.15); color: #60A5FA; }
      &.factura { background: rgba(16, 185, 129, 0.15); color: #34D399; }
    }
    
    .action-btn { 
        border-radius: 8px; 
        &.warning { background: rgba(245, 158, 11, 0.1); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
        &.success { background: rgba(16, 185, 129, 0.1); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    }
    
    .hover-row:hover { background: rgba(255,255,255,0.03); }
    .action-buttons { display: flex; gap: 0.5rem; justify-content: center; }

    /* PREMIUM MODAL STYLES */
    :host ::ng-deep .premium-modal .p-dialog-content {
        padding: 0;
        background: #111827;
        border-radius: 16px;
        border: 1px solid rgba(255,255,255,0.1);
    }

    .modal-content { padding: 1.5rem; color: white; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .modal-header h2 { margin: 0; font-size: 1.25rem; font-weight: 600; }
    .close-btn { background: none; border: none; color: #9CA3AF; font-size: 1.5rem; cursor: pointer; }
    
    .modal-actions { display: flex; gap: 1rem; margin-top: 1.5rem; }

    /* RECEIPT STYLES (Copied & Adapted) */
    .receipt-preview-container {
        background: #fff;
        color: #000;
        padding: 1rem;
        border-radius: 8px;
        max-height: 400px;
        overflow-y: auto;
    }
    
    .thermal-receipt { 
        font-family: 'Courier New', Courier, monospace; 
        font-size: 12px; 
        line-height: 1.4;
    }
    
    .receipt-header { text-align: center; margin-bottom: 15px; display: flex; flex-direction: column; align-items: center; }
    .receipt-logo { font-size: 2rem; margin-bottom: 0.5rem; }
    .receipt-logo-img { width: 64px; height: 64px; object-fit: contain; border-radius: 50%; margin-bottom: 5px; }
    .receipt-title { font-weight: bold; font-size: 14px; margin: 5px 0; }
    .receipt-folio { font-size: 13px; margin-bottom: 5px; }
    .receipt-date { font-size: 11px; color: #555; }
    
    .receipt-divider { border-bottom: 1px dashed #000; margin: 10px 0; width: 100%; }
    
    .receipt-company, .receipt-customer { text-align: center; font-size: 11px; }
    
    .receipt-items { margin: 10px 0; }
    .receipt-item-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .item-name { flex: 1; margin: 0 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    
    .receipt-totals { text-align: right; margin-top: 10px; }
    .total-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
    .total-row.bold { font-weight: bold; font-size: 14px; border-top: 1px solid #000; padding-top: 5px; margin-top: 5px; }
    
    .receipt-barcode-section { margin-top: 15px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
    .pdf417-img { width: 100%; max-width: 200px; height: auto; display: block; }
    .qr-img { width: 100px; height: 100px; display: block; }
    .barcode-label { font-size: 9px; margin-top: 2px; }
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

  // Filters
  folioFilter = signal('');
  dateRange = signal<Date[] | null>(null);

  // Helpers
  tenantLogo = signal('');

  ngOnInit() {
    this.tenantLogo.set(this.authService.tenant()?.logoUrl || '');
    this.loadDocuments();
  }

  onBranchChanged(branch: any) {
    console.log('Facturacion: Branch changed to', branch.nombre);
    // CRITICAL FIX: Store branch ID to filter by it
    this.currentBranchId = branch.id;
    this.loadDocuments();
  }

  sendingPending = signal(false);

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
    const branchId = this.currentBranchId; // Use current selected branch

    // Date Filters
    // TODO: Pass dates to service if filters are set

    console.log(`Frontend: Requesting DTEs page=${page} branch=${branchId}`);

    this.billingService.getDtes(undefined, undefined, page, size, branchId).subscribe({
      next: (response: any) => {
        let content = [];
        let total = 0;

        // ... Parsing Logic (same as before) ...
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

  // ACTIONS

  async viewDte(doc: Dte) {
    this.selectedDoc = doc;
    this.showDetailModal = true;
    this.previewPdf417.set('');
    this.previewQrCode.set('');

    // Generate barcodes for cached view
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

      // QR Code (URL to public view or just basic data)
      const qr = await this.barcodeService.generateQRCode(`https://sii.cl/${doc.folio}`); // Placeholder URL
      this.previewQrCode.set(qr);

    } catch (e) {
      console.error('Error generating barcodes', e);
    }
  }

  printDte(doc: Dte) {
    // If not already viewing, set it so we can grab the element (trick)
    // Actually best to create a dedicated print window/iframe string
    this.selectedDoc = doc; // Ensure data is present

    // We reuse the 'modal-receipt' HTML if visible, or generate it.
    // If modal is not open, we might need to open it hidden or use a pure string template.
    // Simpler: Just generate the printing string directly.

    const receiptHtml = document.querySelector('.thermal-receipt')?.innerHTML || '';
    if (!receiptHtml && !this.showDetailModal) {
      // If modal not open, open it quickly or force render?
      // Let's just open the modal for the user to see what they are printing is better UX
      this.viewDte(doc);
      setTimeout(() => this.executePrint(), 500); // Wait for render
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
