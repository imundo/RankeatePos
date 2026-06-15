import { Component, inject, signal, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BillingService, CafInfo } from '../../../core/services/billing.service';

export interface ExtendedCafInfo extends Partial<CafInfo> {
  tipoDte: string;
  tipoDteDescripcion: string;
  isConfigured: boolean;
}

const STANDARD_DTES: { tipoDte: string; descripcion: string }[] = [
  { tipoDte: 'FACTURA_ELECTRONICA', descripcion: 'Factura Electrónica' },
  { tipoDte: 'FACTURA_EXENTA_ELECTRONICA', descripcion: 'Factura No Afecta o Exenta Electrónica' },
  { tipoDte: 'BOLETA_ELECTRONICA', descripcion: 'Boleta Electrónica' },
  { tipoDte: 'BOLETA_EXENTA_ELECTRONICA', descripcion: 'Boleta Exenta Electrónica' },
  { tipoDte: 'LIQUIDACION_FACTURA_ELECTRONICA', descripcion: 'Liquidación-Factura Electrónica' },
  { tipoDte: 'FACTURA_COMPRA_ELECTRONICA', descripcion: 'Factura de Compra Electrónica' },
  { tipoDte: 'GUIA_DESPACHO_ELECTRONICA', descripcion: 'Guía de Despacho Electrónica' },
  { tipoDte: 'NOTA_DEBITO', descripcion: 'Nota de Débito Electrónica' },
  { tipoDte: 'NOTA_CREDITO', descripcion: 'Nota de Crédito Electrónica' }
];

@Component({
  selector: 'app-gestion-caf',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="caf-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-left">
          <h1>🔢 Gestión de Folios (CAF)</h1>
          <p class="subtitle">Códigos de Autorización de Folios del SII</p>
        </div>
        <button class="btn-primary" (click)="abrirUpload()">
          + Subir CAF
        </button>
      </header>

      <!-- Alerta de folios bajos -->
      @if (cafsBajos().length > 0) {
        <div class="alert warning">
          <span class="alert-icon">⚠️</span>
          <div class="alert-content">
            <strong>Folios por agotarse</strong>
            <p>{{ cafsBajos().length }} tipo(s) de documento tienen menos de 20% de folios disponibles</p>
          </div>
        </div>
      }

      <!-- Upload Modal -->
      @if (showUpload()) {
        <div class="modal-overlay" (click)="cerrarUpload()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Subir Archivo CAF</h2>
              <button class="close-btn" (click)="cerrarUpload()">✕</button>
            </div>
            <div class="modal-body">
              <div 
                class="upload-zone" 
                [class.dragover]="isDragover"
                (dragover)="onDragOver($event)"
                (dragleave)="isDragover = false"
                (drop)="onDrop($event)"
                (click)="fileInput.click()">
                <input 
                  #fileInput 
                  type="file" 
                  accept=".xml"
                  (change)="onFileSelect($event)"
                  hidden>
                
                @if (!selectedFile()) {
                  <span class="upload-icon">📁</span>
                  <p class="upload-text">Arrastra tu archivo CAF aquí</p>
                  <p class="upload-hint">o haz clic para seleccionar (archivo .xml del SII)</p>
                } @else {
                  <span class="upload-icon">✓</span>
                  <p class="upload-text">{{ selectedFile()!.name }}</p>
                  <p class="upload-hint">Listo para subir</p>
                }
              </div>

              <div class="info-box">
                <h4>ℹ️ ¿Qué es un CAF?</h4>
                <p>El CAF (Código de Autorización de Folios) es un archivo XML que el SII te entrega con los folios autorizados para emitir documentos tributarios.</p>
                <p><a href="https://www.sii.cl/servicios_online/1040-.html" target="_blank">Solicitar folios en el SII →</a></p>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" (click)="cerrarUpload()">Cancelar</button>
              <button 
                class="btn-primary" 
                (click)="subirCaf()"
                [disabled]="!selectedFile() || uploading()">
                @if (uploading()) {
                  <span class="spinner"></span> Subiendo...
                } @else {
                  Subir CAF
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Lista de CAFs (Grid) -->
      <div class="cafs-grid">
        @for (caf of cafs(); track caf.tipoDte) {
          <div class="caf-card" 
               [class.unconfigured]="!caf.isConfigured"
               [class.warning]="caf.isConfigured && (caf.porcentajeUso || 0) > 80" 
               [class.danger]="caf.isConfigured && (caf.vencido || caf.agotado)">
            
            <!-- HEADER -->
            <div class="caf-header">
              <span class="caf-tipo">{{ caf.tipoDteDescripcion }}</span>
              <div class="dropdown-container">
                <button class="dropdown-trigger" (click)="toggleMenu(caf.tipoDte, $event)">
                  ⋮
                </button>
                @if (openMenuId() === caf.tipoDte) {
                  <div class="caf-actions-dropdown">
                    <button (click)="actionCargarCaf(caf)">Cargar Archivo de Folio</button>
                    <button (click)="actionObtenerSII(caf)">Obtener Folios desde SII</button>
                    <button (click)="actionAnular(caf)">Anular Folios</button>
                    <button (click)="actionConfigurar(caf)">Configurar Carga Automática</button>
                    <button (click)="actionHistorial(caf)">Historial de Carga de Folios</button>
                    <button (click)="actionTrazabilidad(caf)">Trazabilidad</button>
                    @if (caf.isConfigured && !caf.vencido && !caf.agotado) {
                      <div class="dropdown-divider"></div>
                      <button class="danger-text" (click)="desactivar(caf)">Desactivar CAF</button>
                    }
                  </div>
                }
              </div>
            </div>

            <!-- ESTADO -->
            <div class="caf-estado-row">
              <span class="estado-label">Estado</span>
              @if (!caf.isConfigured) {
                <span class="caf-badge inactive">Sin Configurar</span>
              } @else if (caf.vencido) {
                <span class="caf-badge danger">Vencido</span>
              } @else if (caf.agotado) {
                <span class="caf-badge danger">Agotado</span>
              } @else if ((caf.porcentajeUso || 0) > 80) {
                <span class="caf-badge warning">Bajo</span>
              } @else {
                <span class="caf-badge success">Activo</span>
              }
            </div>

            <hr class="card-divider" />

            <!-- CUERPO CENTRAL -->
            <div class="caf-body-main">
              <div class="folios-disponibles-container">
                <span class="label-muted">Folios disponibles</span>
                <div class="big-number" [class.inactive]="!caf.isConfigured">{{ caf.foliosDisponibles || 0 }}</div>
              </div>
              
              <div class="folios-actual-proximo">
                <div class="folio-col">
                  <span class="label-muted">Folio actual</span>
                  <span class="folio-value">{{ caf.folioActual || 0 }}</span>
                </div>
                <div class="folio-col right-align">
                  <span class="label-muted">Próximo folio</span>
                  <span class="folio-value">{{ (caf.folioActual || 0) + (caf.isConfigured ? 1 : 0) }}</span>
                </div>
              </div>
            </div>

            <hr class="card-divider" />

            <!-- FOOTER: UMBRAL -->
            <div class="caf-footer">
              <div class="umbral-info">
                <span class="umbral-label">Umbral de carga automática de folios</span>
                <span class="umbral-value">No activado</span>
              </div>
              <div class="umbral-icon" title="Carga automática inactiva">
                ⚙️
              </div>
            </div>

          </div>
        }
      </div>

      <!-- Guía rápida -->
      <section class="guide-section">
        <h2>📚 Guía Rápida</h2>
        <div class="guide-cards">
          <div class="guide-card">
            <span class="step-num">1</span>
            <h4>Solicita folios en el SII</h4>
            <p>Ingresa a tu portal SII y solicita folios para cada tipo de documento que necesites.</p>
          </div>
          <div class="guide-card">
            <span class="step-num">2</span>
            <h4>Descarga el archivo CAF</h4>
            <p>El SII te entregará un archivo XML con el código de autorización.</p>
          </div>
          <div class="guide-card">
            <span class="step-num">3</span>
            <h4>Sube el CAF aquí</h4>
            <p>Arrastra o selecciona el archivo para activar los folios en el sistema.</p>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .caf-container {
      padding: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
      min-height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: white;
      font-family: 'Inter', sans-serif;
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
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-secondary {
      padding: 0.75rem 1.5rem;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      font-weight: 500;
      cursor: pointer;
      color: white;
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    /* Alert */
    .alert {
      display: flex;
      gap: 1rem;
      padding: 1rem 1.25rem;
      border-radius: 10px;
      margin-bottom: 1.5rem;
    }

    .alert.warning {
      background: rgba(249, 115, 22, 0.15);
      border: 1px solid rgba(249, 115, 22, 0.4);
    }

    .alert-icon {
      font-size: 1.5rem;
    }

    .alert-content strong {
      display: block;
      color: #F97316;
    }

    .alert-content p {
      margin: 0.25rem 0 0;
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.875rem;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow: hidden;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.25rem;
      color: white;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      color: rgba(255, 255, 255, 0.5);
      transition: color 0.2s;
    }

    .close-btn:hover { color: white; }

    .modal-body {
      padding: 1.5rem;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .upload-zone {
      border: 2px dashed rgba(255, 255, 255, 0.2);
      border-radius: 14px;
      padding: 3rem 2rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: 1.5rem;
    }

    .upload-zone:hover, .upload-zone.dragover {
      border-color: #6366F1;
      background: rgba(99, 102, 241, 0.1);
    }

    .upload-icon {
      font-size: 3rem;
      display: block;
      margin-bottom: 1rem;
    }

    .upload-text {
      font-weight: 600;
      margin: 0;
      color: white;
    }

    .upload-hint {
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.875rem;
      margin: 0.5rem 0 0;
    }

    .info-box {
      background: rgba(255, 255, 255, 0.05);
      padding: 1rem;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .info-box h4 {
      margin: 0 0 0.5rem;
      font-size: 0.875rem;
      color: white;
    }

    .info-box p {
      margin: 0.25rem 0;
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.6);
    }

    .info-box a {
      color: #6366F1;
    }

    /* CAF Cards (New Redesign) */
    .cafs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .caf-card {
      background: rgba(30, 41, 59, 0.6);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 14px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      transition: all 0.3s;
      position: relative;
    }

    .caf-card:hover {
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
      border-color: rgba(255,255,255,0.2);
    }

    .caf-card.unconfigured {
      opacity: 0.8;
    }
    
    .caf-card.unconfigured:hover {
      opacity: 1;
    }

    .caf-card.warning { border-color: rgba(249, 115, 22, 0.5); }
    .caf-card.danger {
      border-color: rgba(239, 68, 68, 0.5);
      background: rgba(239, 68, 68, 0.1);
    }

    .caf-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
      position: relative;
    }

    .caf-tipo {
      font-weight: 600;
      font-size: 1rem;
      color: white;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding-right: 1rem;
    }

    .dropdown-container {
      position: relative;
    }

    .dropdown-trigger {
      background: transparent;
      border: none;
      color: rgba(255,255,255,0.6);
      font-size: 1.25rem;
      cursor: pointer;
      padding: 0 0.5rem;
      transition: color 0.2s;
    }

    .dropdown-trigger:hover {
      color: white;
    }

    .caf-actions-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 0.5rem 0;
      min-width: 220px;
      z-index: 100;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      display: flex;
      flex-direction: column;
    }

    .caf-actions-dropdown button {
      background: none;
      border: none;
      color: rgba(255,255,255,0.8);
      padding: 0.75rem 1rem;
      text-align: left;
      width: 100%;
      font-size: 0.875rem;
      cursor: pointer;
      transition: background 0.2s;
    }

    .caf-actions-dropdown button:hover {
      background: rgba(255,255,255,0.1);
      color: white;
    }

    .dropdown-divider {
      height: 1px;
      background: rgba(255,255,255,0.1);
      margin: 0.25rem 0;
    }

    .danger-text {
      color: #EF4444 !important;
    }
    .danger-text:hover {
      background: rgba(239, 68, 68, 0.1) !important;
    }

    .caf-estado-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .estado-label {
      font-size: 0.875rem;
      color: rgba(255,255,255,0.6);
    }

    .caf-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 6px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .caf-badge.success { background: rgba(34, 197, 94, 0.2); color: #4ADE80; }
    .caf-badge.warning { background: rgba(249, 115, 22, 0.2); color: #F97316; }
    .caf-badge.danger { background: rgba(239, 68, 68, 0.2); color: #EF4444; }
    .caf-badge.inactive { background: rgba(255, 255, 255, 0.1); color: rgba(255,255,255,0.5); }

    .card-divider {
      border: none;
      border-top: 1px solid rgba(255,255,255,0.1);
      margin: 1rem 0;
      width: 100%;
    }

    .caf-body-main {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .folios-disponibles-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .label-muted {
      font-size: 0.85rem;
      color: rgba(255,255,255,0.5);
    }

    .big-number {
      font-size: 2.5rem;
      font-weight: 700;
      color: white;
      line-height: 1;
    }

    .big-number.inactive {
      color: rgba(255,255,255,0.2);
    }

    .folios-actual-proximo {
      display: flex;
      justify-content: space-between;
      padding: 0 1rem;
    }

    .folio-col {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .folio-col.right-align {
      align-items: flex-end;
    }

    .folio-value {
      font-size: 1.1rem;
      font-weight: 600;
      color: rgba(255,255,255,0.9);
    }

    .caf-footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: auto;
    }

    .umbral-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .umbral-label {
      font-size: 0.75rem;
      color: rgba(255,255,255,0.7);
      font-weight: 600;
    }

    .umbral-value {
      font-size: 0.75rem;
      color: rgba(255,255,255,0.4);
    }

    .umbral-icon {
      font-size: 1.25rem;
      opacity: 0.5;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .umbral-icon:hover {
      opacity: 1;
    }

    /* Guide */
    .guide-section {
      background: rgba(30, 41, 59, 0.6);
      backdrop-filter: blur(12px);
      border-radius: 14px;
      padding: 1.5rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .guide-section h2 {
      margin: 0 0 1.5rem;
      font-size: 1.1rem;
      color: white;
    }

    .guide-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }

    .guide-card {
      text-align: center;
    }

    .step-num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      color: white;
      border-radius: 50%;
      font-weight: 700;
      margin-bottom: 1rem;
    }

    .guide-card h4 {
      margin: 0 0 0.5rem;
      color: white;
    }

    .guide-card p {
      margin: 0;
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .guide-cards {
        grid-template-columns: 1fr;
      }

      .page-header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }
    }
  `]
})
export class GestionCafComponent implements OnInit {
  private billingService = inject(BillingService);

  cafs = signal<ExtendedCafInfo[]>([]);
  showUpload = signal(false);
  selectedFile = signal<File | null>(null);
  uploading = signal(false);
  isDragover = false;

  cafsBajos = signal<CafInfo[]>([]);
  openMenuId = signal<string | null>(null);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.caf-actions-dropdown') && !target.closest('.dropdown-trigger')) {
      this.openMenuId.set(null);
    }
  }

  ngOnInit() {
    this.cargarCafs();
  }

  cargarCafs() {
    this.billingService.getCafs().subscribe({
      next: (cafs: CafInfo[]) => {
        const merged: ExtendedCafInfo[] = STANDARD_DTES.map(std => {
          const existing = cafs.find(c => c.tipoDte === std.tipoDte);
          if (existing) {
            return {
              ...existing,
              tipoDte: std.tipoDte,
              tipoDteDescripcion: std.descripcion,
              isConfigured: true
            };
          }
          return {
            tipoDte: std.tipoDte,
            tipoDteDescripcion: std.descripcion,
            isConfigured: false,
            foliosDisponibles: 0,
            folioActual: 0,
            folioDesde: 0,
            folioHasta: 0,
            porcentajeUso: 0
          };
        });
        
        // Add any uploaded CAFs that might not be in the STANDARD list just in case
        const extras = cafs.filter(c => !STANDARD_DTES.find(s => s.tipoDte === c.tipoDte));
        for (const ext of extras) {
          merged.push({
            ...ext,
            isConfigured: true
          });
        }

        this.cafs.set(merged);
        this.cafsBajos.set(cafs.filter(c => c.porcentajeUso > 80 && !c.vencido && !c.agotado));
      },
      error: (err: any) => console.error('Error cargando CAFs', err)
    });
  }

  toggleMenu(tipoDte: string, event: Event) {
    event.stopPropagation();
    if (this.openMenuId() === tipoDte) {
      this.openMenuId.set(null);
    } else {
      this.openMenuId.set(tipoDte);
    }
  }

  // Dropdown actions
  actionCargarCaf(caf: ExtendedCafInfo) {
    this.openMenuId.set(null);
    this.abrirUpload();
  }

  actionObtenerSII(caf: ExtendedCafInfo) {
    this.openMenuId.set(null);
    alert('Próximamente: Obtener folios automáticamente desde el SII.');
  }

  actionAnular(caf: ExtendedCafInfo) {
    this.openMenuId.set(null);
    alert('Próximamente: Anulación masiva de folios en el SII.');
  }

  actionConfigurar(caf: ExtendedCafInfo) {
    this.openMenuId.set(null);
    alert('Próximamente: Configurar umbral de recarga automática de folios.');
  }

  actionHistorial(caf: ExtendedCafInfo) {
    this.openMenuId.set(null);
    alert('Próximamente: Historial de CAFs cargados previamente.');
  }

  actionTrazabilidad(caf: ExtendedCafInfo) {
    this.openMenuId.set(null);
    alert('Próximamente: Trazabilidad de folios consumidos.');
  }

  // Upload Logic
  abrirUpload() {
    this.showUpload.set(true);
    this.selectedFile.set(null);
  }

  cerrarUpload() {
    this.showUpload.set(false);
    this.selectedFile.set(null);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragover = true;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragover = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.selectedFile.set(files[0]);
    }
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
    }
  }

  subirCaf() {
    const file = this.selectedFile();
    if (!file) return;

    this.uploading.set(true);
    this.billingService.subirCaf(file).subscribe({
      next: () => {
        this.uploading.set(false);
        this.cerrarUpload();
        this.cargarCafs();
        // Optional alert
      },
      error: (err: any) => {
        this.uploading.set(false);
        console.error('Error subiendo CAF', err);
        alert('Error al subir CAF: ' + (err.error?.message || err.message));
      }
    });
  }

  desactivar(caf: ExtendedCafInfo) {
    this.openMenuId.set(null);
    if (!caf.id) return;
    
    if (confirm(`¿Seguro que deseas desactivar este CAF (${caf.tipoDteDescripcion})? Los folios restantes ya no podrán usarse.`)) {
      this.billingService.desactivarCaf(caf.id).subscribe({
        next: () => {
          this.cargarCafs();
        },
        error: (err: any) => {
          console.error('Error desactivando CAF', err);
          alert('Error al desactivar CAF');
        }
      });
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-CL');
  }
}
