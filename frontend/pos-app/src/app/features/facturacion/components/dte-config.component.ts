import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';

interface CertificateInfo {
    uploaded: boolean;
    fileName?: string;
    expiryDate?: Date;
    issuer?: string;
}

interface CafInfo {
    tipoDte: string;
    folioInicio: number;
    folioFin: number;
    foliosDisponibles: number;
}

@Component({
    selector: 'app-dte-config',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="dte-config-container">
      <!-- Header -->
      <div class="config-header">
        <h2>⚙️ Configuración DTE - Facturación Electrónica</h2>
        <p class="subtitle">Gestiona certificados digitales y CAFs para emisión de documentos tributarios</p>
      </div>

      <!-- Status Dashboard -->
      <div class="status-dashboard">
        <div class="status-card" [class.active]="certificate().uploaded">
          <div class="icon">🔐</div>
          <div class="info">
            <h3>Certificado Digital</h3>
            <p class="status">{{ certificate().uploaded ? 'Activo' : 'No configurado' }}</p>
            @if (certificate().expiryDate) {
              <p class="expiry">Vence: {{ certificate().expiryDate | date:'dd/MM/yyyy' }}</p>
            }
          </div>
        </div>

        <div class="status-card" [class.active]="cafs().length > 0">
          <div class="icon">📄</div>
          <div class="info">
            <h3>CAFs Activos</h3>
            <p class="status">{{ cafs().length }} tipo(s) de documento</p>
            <p class="expiry">{{ totalFoliosDisponibles() }} folios disponibles</p>
          </div>
        </div>

        <div class="status-card" [class.active]="emisorConfigured()">
          <div class="icon">🏢</div>
          <div class="info">
            <h3>Datos Emisor</h3>
            <p class="status">{{ emisorConfigured() ? 'Configurado' : 'Pendiente' }}</p>
          </div>
        </div>
      </div>

      <!-- Certificate Upload Section -->
      <div class="config-section">
        <div class="section-header">
          <h3>📤 Certificado Digital (.pfx)</h3>
          <p>Sube tu certificado digital para firmar documentos electrónicos</p>
        </div>

        <div class="upload-area" 
             [class.has-file]="selectedCertFile()"
             (dragover)="onDragOver($event)"
             (drop)="onDrop($event, 'cert')">
          <input 
            type="file" 
            #certInput 
            accept=".pfx,.p12"
            (change)="onCertFileSelected($event)"
            style="display: none">
          
          @if (!selectedCertFile()) {
            <div class="upload-placeholder" (click)="certInput.click()">
              <div class="upload-icon">📁</div>
              <p class="upload-text">Arrastra tu archivo .pfx aquí</p>
              <p class="upload-subtext">o haz clic para seleccionar</p>
            </div>
          } @else {
            <div class="file-preview">
              <div class="file-icon">✅</div>
              <div class="file-info">
                <p class="file-name">{{ selectedCertFile()?.name }}</p>
                <p class="file-size">{{ formatFileSize(selectedCertFile()?.size) }}</p>
              </div>
              <button class="remove-btn" (click)="removeCertFile()">✕</button>
            </div>
          }
        </div>

        @if (selectedCertFile()) {
          <div class="password-input">
            <label>Contraseña del certificado:</label>
            <input 
              type="password" 
              [(ngModel)]="certPassword"
              placeholder="Ingresa la contraseña"
              class="input-field">
            <button 
              class="btn-primary"
              (click)="uploadCertificate()"
              [disabled]="!certPassword || uploadingCert()">
              @if (uploadingCert()) {
                <span class="spinner"></span> Subiendo...
              } @else {
                🔐 Subir Certificado
              }
            </button>
          </div>
        }
      </div>

      <!-- CAF Upload Section -->
      <div class="config-section">
        <div class="section-header">
          <h3>📋 CAFs (Código de Autorización de Folios)</h3>
          <p>Sube archivos CAF obtenidos desde el SII para cada tipo de documento</p>
        </div>

        <div class="caf-upload-grid">
          @for (docType of documentTypes; track docType.code) {
            <div class="caf-card">
              <div class="caf-header">
                <span class="doc-icon">{{ docType.icon }}</span>
                <h4>{{ docType.name }}</h4>
              </div>
              
              <input 
                type="file" 
                #cafInput
                accept=".xml"
                (change)="onCafFileSelected($event, docType.code)"
                style="display: none">
              
              <div class="caf-status">
                @if (getCafInfo(docType.code); as caf) {
                  <div class="caf-active">
                    <p class="folios">{{ caf.foliosDisponibles }} folios disponibles</p>
                    <p class="range">Rango: {{ caf.folioInicio }} - {{ caf.folioFin }}</p>
                  </div>
                } @else {
                  <p class="no-caf">Sin CAF configurado</p>
                }
              </div>

              <button 
                class="btn-upload"
                (click)="cafInput.click()">
                @if (getCafInfo(docType.code)) {
                  🔄 Actualizar CAF
                } @else {
                  ➕ Subir CAF
                }
              </button>
            </div>
          }
        </div>
      </div>

      <!-- Emisor Configuration -->
      <div class="config-section">
        <div class="section-header">
          <h3>🏢 Datos del Emisor</h3>
          <p>Información que aparecerá en tus documentos tributarios</p>
        </div>

        <div class="emisor-form">
          <div class="form-row">
            <div class="form-field">
              <label>Razón Social *</label>
              <input type="text" [(ngModel)]="emisor.razonSocial" class="input-field">
            </div>
            <div class="form-field">
              <label>RUT *</label>
              <input type="text" [(ngModel)]="emisor.rut" class="input-field" placeholder="12.345.678-9">
            </div>
          </div>

          <div class="form-row">
            <div class="form-field">
              <label>Giro Comercial *</label>
              <input type="text" [(ngModel)]="emisor.giro" class="input-field">
            </div>
            <div class="form-field">
              <label>Actividad Económica</label>
              <input type="text" [(ngModel)]="emisor.actividadEconomica" class="input-field">
            </div>
          </div>

          <div class="form-row">
            <div class="form-field full-width">
              <label>Dirección *</label>
              <input type="text" [(ngModel)]="emisor.direccion" class="input-field">
            </div>
          </div>

          <div class="form-row">
            <div class="form-field">
              <label>Comuna *</label>
              <input type="text" [(ngModel)]="emisor.comuna" class="input-field">
            </div>
            <div class="form-field">
              <label>Ciudad</label>
              <input type="text" [(ngModel)]="emisor.ciudad" class="input-field">
            </div>
          </div>

          <button class="btn-primary btn-save" (click)="saveEmisorConfig()">
            💾 Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .dte-config-container {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .config-header {
      margin-bottom: 2rem;
      
      h2 {
        font-size: 2rem;
        font-weight: 700;
        color: #1e293b;
        margin: 0 0 0.5rem 0;
      }

      .subtitle {
        color: #64748b;
        margin: 0;
      }
    }

    .status-dashboard {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .status-card {
      display: flex;
      gap: 1rem;
      padding: 1.5rem;
      background: white;
      border-radius: 12px;
      border: 2px solid #e2e8f0;
      transition: all 0.3s;

      &.active {
        border-color: #10b981;
        background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
      }

      .icon {
        font-size: 2.5rem;
      }

      .info {
        flex: 1;

        h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 0.25rem 0;
        }

        .status {
          font-size: 0.875rem;
          color: #10b981;
          font-weight: 600;
          margin: 0;
        }

        .expiry {
          font-size: 0.75rem;
          color: #64748b;
          margin: 0.25rem 0 0 0;
        }
      }
    }

    .config-section {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      margin-bottom: 2rem;
      border: 1px solid #e2e8f0;
    }

    .section-header {
      margin-bottom: 1.5rem;

      h3 {
        font-size: 1.25rem;
        font-weight: 700;
        color: #1e293b;
        margin: 0 0 0.5rem 0;
      }

      p {
        color: #64748b;
        margin: 0;
        font-size: 0.875rem;
      }
    }

    .upload-area {
      border: 2px dashed #cbd5e1;
      border-radius: 12px;
      padding: 2rem;
      text-align: center;
      transition: all 0.3s;
      cursor: pointer;

      &:hover {
        border-color: #6366f1;
        background: #f8fafc;
      }

      &.has-file {
        border-style: solid;
        border-color: #10b981;
        background: #f0fdf4;
      }
    }

    .upload-placeholder {
      .upload-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
      }

      .upload-text {
        font-size: 1.125rem;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 0.5rem 0;
      }

      .upload-subtext {
        font-size: 0.875rem;
        color: #64748b;
        margin: 0;
      }
    }

    .file-preview {
      display: flex;
      align-items: center;
      gap: 1rem;
      text-align: left;

      .file-icon {
        font-size: 2rem;
      }

      .file-info {
        flex: 1;

        .file-name {
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 0.25rem 0;
        }

        .file-size {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0;
        }
      }

      .remove-btn {
        background: #ef4444;
        color: white;
        border: none;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        cursor: pointer;
        font-size: 1.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;

        &:hover {
          background: #dc2626;
        }
      }
    }

    .password-input {
      margin-top: 1.5rem;
      display: flex;
      gap: 1rem;
      align-items: flex-end;

      label {
        min-width: 180px;
        font-weight: 600;
        color: #1e293b;
      }

      .input-field {
        flex: 1;
      }
    }

    .input-field {
      padding: 0.75rem 1rem;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.2s;

      &:focus {
        outline: none;
        border-color: #6366f1;
      }
    }

    .btn-primary {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 0.5rem;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .caf-upload-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1rem;
    }

    .caf-card {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.5rem;
      transition: all 0.2s;

      &:hover {
        border-color: #6366f1;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .caf-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;

        .doc-icon {
          font-size: 1.5rem;
        }

        h4 {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }
      }

      .caf-status {
        margin-bottom: 1rem;
        min-height: 60px;

        .caf-active {
          .folios {
            font-weight: 600;
            color: #10b981;
            margin: 0 0 0.25rem 0;
          }

          .range {
            font-size: 0.875rem;
            color: #64748b;
            margin: 0;
          }
        }

        .no-caf {
          color: #94a3b8;
          font-size: 0.875rem;
          font-style: italic;
        }
      }

      .btn-upload {
        width: 100%;
        padding: 0.75rem;
        background: #f1f5f9;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: #e2e8f0;
          border-color: #94a3b8;
        }
      }
    }

    .emisor-form {
      .form-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .form-field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        &.full-width {
          grid-column: 1 / -1;
        }

        label {
          font-weight: 600;
          color: #1e293b;
          font-size: 0.875rem;
        }
      }

      .btn-save {
        margin-top: 1.5rem;
        width: auto;
      }
    }
  `]
})
export class DteConfigComponent {
    certificate = signal<CertificateInfo>({ uploaded: false });
    cafs = signal<CafInfo[]>([]);
    selectedCertFile = signal<File | null>(null);
    uploadingCert = signal(false);
    certPassword = '';

    documentTypes = [
        { code: 'BOLETA', name: 'Boleta Electrónica', icon: '🧾' },
        { code: 'FACTURA', name: 'Factura Electrónica', icon: '📄' },
        { code: 'NOTA_CREDITO', name: 'Nota de Crédito', icon: '💳' },
        { code: 'NOTA_DEBITO', name: 'Nota de Débito', icon: '💵' },
        { code: 'GUIA_DESPACHO', name: 'Guía de Despacho', icon: '📦' },
    ];

    emisor = {
        razonSocial: '',
        rut: '',
        giro: '',
        actividadEconomica: '',
        direccion: '',
        comuna: '',
        ciudad: ''
    };

    constructor(private messageService: MessageService) {
        this.loadConfiguration();
    }

    totalFoliosDisponibles() {
        return this.cafs().reduce((sum, caf) => sum + caf.foliosDisponibles, 0);
    }

    emisorConfigured() {
        return this.emisor.razonSocial && this.emisor.rut && this.emisor.direccion;
    }

    getCafInfo(tipoDte: string): CafInfo | undefined {
        return this.cafs().find(caf => caf.tipoDte === tipoDte);
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
    }

    onDrop(event: DragEvent, type: 'cert' | 'caf') {
        event.preventDefault();
        event.stopPropagation();

        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            if (type === 'cert') {
                this.selectedCertFile.set(files[0]);
            }
        }
    }

    onCertFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.selectedCertFile.set(input.files[0]);
        }
    }

    removeCertFile() {
        this.selectedCertFile.set(null);
        this.certPassword = '';
    }

    formatFileSize(bytes?: number): string {
        if (!bytes) return '';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    uploadCertificate() {
        if (!this.selectedCertFile() || !this.certPassword) return;

        this.uploadingCert.set(true);

        // TODO: Implement actual upload to backend
        setTimeout(() => {
            this.certificate.set({
                uploaded: true,
                fileName: this.selectedCertFile()!.name,
                expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                issuer: 'SII Chile'
            });

            this.uploadingCert.set(false);
            this.selectedCertFile.set(null);
            this.certPassword = '';

            this.messageService.add({
                severity: 'success',
                summary: 'Certificado Subido',
                detail: 'El certificado digital ha sido configurado correctamente'
            });
        }, 2000);
    }

  on CafFileSelected(event: Event, tipoDte: string) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            // TODO: Implement actual CAF upload
            this.messageService.add({
                severity: 'success',
                summary: 'CAF Subido',
                detail: `CAF para ${tipoDte} cargado correctamente`
            });
        }
    }

    saveEmisorConfig() {
        // TODO: Implement actual save to backend
        this.messageService.add({
            severity: 'success',
            summary: 'Configuración Guardada',
            detail: 'Los datos del emisor han sido actualizados'
        });
    }

    loadConfiguration() {
        // TODO: Load from backend
        // Mock data for demonstration
    }
}
