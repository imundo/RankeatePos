import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BillingService, CafInfo } from '../../../../core/services/billing.service';

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

      <!-- Lista de CAFs -->
      <div class="cafs-grid">
        @for (caf of cafs(); track caf.id) {
          <div class="caf-card" [class.warning]="caf.porcentajeUso > 80" [class.danger]="caf.vencido || caf.agotado">
            <div class="caf-header">
              <span class="caf-tipo">{{ caf.tipoDteDescripcion }}</span>
              @if (caf.vencido) {
                <span class="caf-badge danger">Vencido</span>
              } @else if (caf.agotado) {
                <span class="caf-badge danger">Agotado</span>
              } @else if (caf.porcentajeUso > 80) {
                <span class="caf-badge warning">Bajo</span>
              } @else {
                <span class="caf-badge success">Activo</span>
              }
            </div>

            <div class="caf-stats">
              <div class="stat-main">
                <span class="stat-number">{{ caf.foliosDisponibles }}</span>
                <span class="stat-label">disponibles</span>
              </div>
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  [style.width.%]="caf.porcentajeUso"
                  [class.warning]="caf.porcentajeUso > 80"
                  [class.danger]="caf.porcentajeUso > 95">
                </div>
              </div>
            </div>

            <div class="caf-details">
              <div class="detail-row">
                <span>Rango:</span>
                <span>{{ caf.folioDesde }} - {{ caf.folioHasta }}</span>
              </div>
              <div class="detail-row">
                <span>Actual:</span>
                <span>{{ caf.folioActual }}</span>
              </div>
              <div class="detail-row">
                <span>Autorizado:</span>
                <span>{{ formatDate(caf.fechaAutorizacion) }}</span>
              </div>
              @if (caf.fechaVencimiento) {
                <div class="detail-row" [class.danger]="caf.vencido">
                  <span>Vence:</span>
                  <span>{{ formatDate(caf.fechaVencimiento) }}</span>
                </div>
              }
            </div>

            <div class="caf-actions">
              @if (!caf.vencido && !caf.agotado) {
                <button class="action-btn danger" (click)="desactivar(caf)" title="Desactivar CAF">
                  🗑️ Desactivar
                </button>
              }
            </div>
          </div>
        } @empty {
          <div class="empty-state">
            <span class="icon">📭</span>
            <h3>No hay CAFs cargados</h3>
            <p>Sube tu primer CAF para comenzar a emitir documentos</p>
            <button class="btn-primary" (click)="abrirUpload()">Subir CAF</button>
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

    /* CAF Cards */
    .cafs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .caf-card {
      background: rgba(30, 41, 59, 0.6);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 14px;
      padding: 1.5rem;
      transition: all 0.3s;
    }

    .caf-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
    }

    .caf-card.warning {
      border-color: rgba(249, 115, 22, 0.5);
    }

    .caf-card.danger {
      border-color: rgba(239, 68, 68, 0.5);
      background: rgba(239, 68, 68, 0.1);
    }

    .caf-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .caf-tipo {
      font-weight: 600;
      color: white;
    }

    .caf-badge {
      padding: 0.35rem 0.75rem;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .caf-badge.success { background: rgba(34, 197, 94, 0.2); color: #22C55E; }
    .caf-badge.warning { background: rgba(249, 115, 22, 0.2); color: #F97316; }
    .caf-badge.danger { background: rgba(239, 68, 68, 0.2); color: #EF4444; }

    .caf-stats {
      margin-bottom: 1rem;
    }

    .stat-main {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .stat-number {
      font-size: 2rem;
      font-weight: 700;
      color: #6366F1;
    }

    .caf-card.warning .stat-number { color: #F97316; }
    .caf-card.danger .stat-number { color: #EF4444; }

    .stat-label {
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.875rem;
    }

    .progress-bar {
      height: 6px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #6366F1, #8B5CF6);
      transition: width 0.3s;
    }

    .progress-fill.warning {
      background: linear-gradient(90deg, #F97316, #FB923C);
    }

    .progress-fill.danger {
      background: linear-gradient(90deg, #EF4444, #F87171);
    }

    .caf-details {
      margin-bottom: 1rem;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
      padding: 0.25rem 0;
    }

    .detail-row span:first-child {
      color: rgba(255, 255, 255, 0.5);
    }

    .detail-row span:last-child {
      color: white;
    }

    .detail-row.danger span:last-child {
      color: #EF4444;
    }

    .caf-actions {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      flex: 1;
      padding: 0.5rem;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.05);
      cursor: pointer;
      font-size: 0.8rem;
      transition: all 0.2s;
      color: white;
    }

    .action-btn.danger:hover {
      border-color: rgba(239, 68, 68, 0.5);
      background: rgba(239, 68, 68, 0.1);
      color: #EF4444;
    }

    /* Empty state */
    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 4rem 2rem;
      background: rgba(30, 41, 59, 0.6);
      backdrop-filter: blur(12px);
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.1);
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

  cafs = signal<CafInfo[]>([]);
  showUpload = signal(false);
  selectedFile = signal<File | null>(null);
  uploading = signal(false);
  isDragover = false;

  cafsBajos = signal<CafInfo[]>([]);

  ngOnInit() {
    this.cargarCafs();
  }

  cargarCafs() {
    this.billingService.getCafs().subscribe({
      next: (cafs) => {
        this.cafs.set(cafs);
        this.cafsBajos.set(cafs.filter(c => c.porcentajeUso > 80 && !c.vencido && !c.agotado));
      },
      error: (err) => console.error('Error cargando CAFs', err)
    });
  }

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
        alert('CAF subido exitosamente');
      },
      error: (err) => {
        this.uploading.set(false);
        console.error('Error subiendo CAF', err);
        alert('Error al subir CAF: ' + (err.error?.message || err.message));
      }
    });
  }

  desactivar(caf: CafInfo) {
    if (confirm(`¿Seguro que deseas desactivar este CAF? Los folios restantes ya no podrán usarse.`)) {
      this.billingService.desactivarCaf(caf.id).subscribe({
        next: () => {
          this.cargarCafs();
          alert('CAF desactivado');
        },
        error: (err) => {
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
