import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { CompanyService, CompanyBranding, CompanyDocument } from '@core/services/company.service';

// CompanyInfo is an alias for CompanyBranding display purposes
type CompanyInfo = CompanyBranding;

@Component({
  selector: 'app-company-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="company-container">
      <header class="company-header">
        <div class="header-left">
          <button class="btn-icon" routerLink="/settings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div class="header-title">
            <h1>Gestión de Empresa</h1>
            <span class="subtitle">{{ companyInfo().nombre || 'Mi Empresa' }}</span>
          </div>
        </div>
        <button class="btn-primary" (click)="saveChanges()" [disabled]="saving()">
          {{ saving() ? 'Guardando...' : '💾 Guardar Cambios' }}
        </button>
      </header>

      <!-- Tabs -->
      <div class="tabs-bar">
        <button class="tab" [class.active]="activeTab === 'info'" (click)="activeTab = 'info'">
          🏢 Información
        </button>
        <button class="tab" [class.active]="activeTab === 'branding'" (click)="activeTab = 'branding'">
          🎨 Branding
        </button>
        <button class="tab" [class.active]="activeTab === 'documents'" (click)="activeTab = 'documents'">
          📄 Documentos ({{ documents().length }})
        </button>
      </div>

      <!-- Company Info Tab -->
      @if (activeTab === 'info') {
        <section class="tab-content">
          <div class="form-grid">
            <div class="form-group">
              <label>Nombre de la Empresa</label>
              <input type="text" [(ngModel)]="companyInfo().nombre" placeholder="Panadería El Trigal">
            </div>
            <div class="form-group">
              <label>RUT</label>
              <input type="text" [(ngModel)]="companyInfo().rut" placeholder="12.345.678-9">
            </div>
            <div class="form-group full-width">
              <label>Giro Comercial</label>
              <input type="text" [(ngModel)]="companyInfo().giro" placeholder="Elaboración y venta de productos de panadería">
            </div>
            <div class="form-group full-width">
              <label>Dirección</label>
              <input type="text" [(ngModel)]="companyInfo().direccion" placeholder="Av. Principal 123">
            </div>
            <div class="form-group">
              <label>Comuna</label>
              <input type="text" [(ngModel)]="companyInfo().comuna" placeholder="Providencia">
            </div>
            <div class="form-group">
              <label>Ciudad</label>
              <input type="text" [(ngModel)]="companyInfo().ciudad" placeholder="Santiago">
            </div>
            <div class="form-group">
              <label>Teléfono</label>
              <input type="tel" [(ngModel)]="companyInfo().telefono" placeholder="+56 9 1234 5678">
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" [(ngModel)]="companyInfo().email" placeholder="contacto@empresa.cl">
            </div>
            <div class="form-group full-width">
              <label>Sitio Web</label>
              <input type="url" [(ngModel)]="companyInfo().website" placeholder="https://www.empresa.cl">
            </div>
          </div>
        </section>
      }

      <!-- Branding Tab -->
      @if (activeTab === 'branding') {
        <section class="tab-content">
          <div class="branding-section">
            <div class="logo-upload-area">
              <h3>Logo de la Empresa</h3>
              <p class="text-muted">Este logo se mostrará en el POS y documentos</p>
              
              <div class="logo-preview" [class.has-logo]="companyInfo().logoUrl">
                @if (companyInfo().logoUrl) {
                  <img [src]="companyInfo().logoUrl" alt="Logo" />
                } @else {
                  <div class="logo-placeholder">
                    <span>🏢</span>
                    <p>Sin logo</p>
                  </div>
                }
              </div>
              
              <div class="upload-actions">
                <label class="btn-upload">
                  <input type="file" accept="image/*" (change)="onLogoSelected($event)" hidden>
                  📤 Subir Logo
                </label>
                @if (companyInfo().logoUrl) {
                  <button class="btn-danger" (click)="removeLogo()">🗑️ Eliminar</button>
                }
              </div>
              
              <p class="upload-hint">Formatos: PNG, JPG, SVG. Máximo 2MB. Recomendado: 200x200px</p>
            </div>

            <div class="colors-section">
              <h3>Colores de Marca</h3>
              <div class="color-pickers">
                <div class="color-item">
                  <label>Color Primario</label>
                  <input type="color" [value]="primaryColor" (input)="onPrimaryColorChange($event)" />
                </div>
                <div class="color-item">
                  <label>Color Secundario</label>
                  <input type="color" [value]="secondaryColor" (input)="onSecondaryColorChange($event)" />
                </div>
              </div>
            </div>
          </div>
        </section>
      }

      <!-- Documents Tab -->
      @if (activeTab === 'documents') {
        <section class="tab-content">
          <div class="documents-header">
            <h3>Permisos y Documentos</h3>
            <button class="btn-primary" (click)="showAddDocument = true">
              ➕ Agregar Documento
            </button>
          </div>

          <div class="documents-grid">
            @for (doc of documents(); track doc.id) {
              <div class="document-card" [class]="doc.estado.toLowerCase()">
                <div class="doc-icon">
                  {{ getDocumentIcon(doc.tipo) }}
                </div>
                <div class="doc-info">
                  <h4>{{ doc.nombre }}</h4>
                  <span class="doc-type">{{ doc.tipo }}</span>
                  @if (doc.fechaVencimiento) {
                    <span class="doc-expiry">Vence: {{ doc.fechaVencimiento }}</span>
                  }
                </div>
                <div class="doc-status">
                  <span class="status-badge" [class]="doc.estado.toLowerCase()">
                    {{ getStatusLabel(doc.estado) }}
                  </span>
                </div>
                <div class="doc-actions">
                  <button class="btn-icon-sm" title="Ver">👁️</button>
                  <button class="btn-icon-sm" title="Editar">✏️</button>
                  <button class="btn-icon-sm danger" title="Eliminar" (click)="deleteDocument(doc.id)">🗑️</button>
                </div>
              </div>
            }

            @if (documents().length === 0) {
              <div class="empty-documents">
                <span>📄</span>
                <p>No hay documentos registrados</p>
                <button class="btn-primary" (click)="showAddDocument = true">Agregar primer documento</button>
              </div>
            }
          </div>
        </section>
      }

      <!-- Add Document Modal -->
      @if (showAddDocument) {
        <div class="modal-overlay" (click)="showAddDocument = false">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <h2>Agregar Documento</h2>
            
            <div class="form-group">
              <label>Nombre del Documento</label>
              <input type="text" [(ngModel)]="newDocument.nombre" placeholder="Ej: Patente Comercial">
            </div>
            
            <div class="form-group">
              <label>Tipo de Documento</label>
              <select [(ngModel)]="newDocument.tipo">
                <option value="PATENTE">Patente Comercial</option>
                <option value="SANITARIO">Permiso Sanitario</option>
                <option value="BOMBEROS">Certificado Bomberos</option>
                <option value="MUNICIPAL">Permiso Municipal</option>
                <option value="TRIBUTARIO">Documento Tributario</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Fecha de Vencimiento (opcional)</label>
              <input type="date" [(ngModel)]="newDocument.fechaVencimiento">
            </div>
            
            <div class="form-group">
              <label>Archivo</label>
              <label class="file-upload">
                <input type="file" accept=".pdf,.jpg,.png" hidden>
                📎 Seleccionar archivo
              </label>
            </div>
            
            <div class="modal-actions">
              <button class="btn-cancel" (click)="showAddDocument = false">Cancelar</button>
              <button class="btn-confirm" (click)="addDocument()">Agregar</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .company-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: white;
    }

    .company-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.5rem;
      background: rgba(30, 41, 59, 0.8);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .btn-icon {
      width: 40px;
      height: 40px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      background: transparent;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      
      svg { width: 20px; height: 20px; }
    }

    .header-title h1 { margin: 0; font-size: 1.5rem; }
    .header-title .subtitle { font-size: 0.8rem; color: rgba(255, 255, 255, 0.5); }

    .btn-primary {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      border: none;
      border-radius: 10px;
      color: white;
      font-weight: 500;
      cursor: pointer;
      
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }

    .tabs-bar {
      display: flex;
      gap: 0.5rem;
      padding: 1rem 1.5rem;
      overflow-x: auto;
    }

    .tab {
      padding: 0.75rem 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.85rem;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;
      
      &.active {
        background: linear-gradient(135deg, #6366F1, #8B5CF6);
        border-color: transparent;
        color: white;
      }
    }

    .tab-content {
      padding: 1.5rem;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      
      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }

    .form-group {
      &.full-width { grid-column: 1 / -1; }
      
      label {
        display: block;
        margin-bottom: 0.5rem;
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.7);
      }
      
      input, select {
        width: 100%;
        padding: 0.875rem 1rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        color: white;
        font-size: 1rem;
        
        &:focus {
          outline: none;
          border-color: #6366F1;
        }
      }
      
      select option { background: #1e293b; }
    }

    .branding-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      
      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }

    .logo-upload-area {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 2rem;
      text-align: center;
      
      h3 { margin: 0 0 0.5rem; }
      .text-muted { color: rgba(255, 255, 255, 0.5); margin: 0 0 1.5rem; font-size: 0.875rem; }
    }

    .logo-preview {
      width: 150px;
      height: 150px;
      margin: 0 auto 1.5rem;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.05);
      border: 2px dashed rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      
      &.has-logo {
        border-style: solid;
        border-color: rgba(99, 102, 241, 0.4);
      }
      
      img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
    }

    .logo-placeholder {
      text-align: center;
      color: rgba(255, 255, 255, 0.4);
      
      span { font-size: 3rem; }
      p { margin: 0.5rem 0 0; font-size: 0.875rem; }
    }

    .upload-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
      margin-bottom: 1rem;
    }

    .btn-upload {
      padding: 0.75rem 1.25rem;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      border-radius: 10px;
      color: white;
      font-weight: 500;
      cursor: pointer;
    }

    .btn-danger {
      padding: 0.75rem 1.25rem;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.5);
      border-radius: 10px;
      color: #EF4444;
      cursor: pointer;
    }

    .upload-hint {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.4);
      margin: 0;
    }

    .colors-section {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 2rem;
      
      h3 { margin: 0 0 1.5rem; }
    }

    .color-pickers {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .color-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      
      label { flex: 1; color: rgba(255, 255, 255, 0.7); }
      
      input[type="color"] {
        width: 50px;
        height: 40px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
      }
    }

    .documents-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      
      h3 { margin: 0; }
    }

    .documents-grid {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .document-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      
      &.por_vencer {
        border-color: rgba(245, 158, 11, 0.4);
        background: rgba(245, 158, 11, 0.05);
      }
      
      &.vencido {
        border-color: rgba(239, 68, 68, 0.4);
        background: rgba(239, 68, 68, 0.05);
      }
    }

    .doc-icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(99, 102, 241, 0.15);
      border-radius: 12px;
      font-size: 1.5rem;
    }

    .doc-info {
      flex: 1;
      
      h4 { margin: 0 0 0.25rem; font-size: 1rem; }
      .doc-type { font-size: 0.75rem; color: rgba(255, 255, 255, 0.5); display: block; }
      .doc-expiry { font-size: 0.75rem; color: rgba(255, 255, 255, 0.4); }
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 500;
      
      &.vigente { background: rgba(16, 185, 129, 0.2); color: #10B981; }
      &.por_vencer { background: rgba(245, 158, 11, 0.2); color: #F59E0B; }
      &.vencido { background: rgba(239, 68, 68, 0.2); color: #EF4444; }
    }

    .doc-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-icon-sm {
      width: 32px;
      height: 32px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      background: transparent;
      cursor: pointer;
      
      &.danger { color: #EF4444; }
    }

    .empty-documents {
      text-align: center;
      padding: 4rem 2rem;
      color: rgba(255, 255, 255, 0.5);
      
      span { font-size: 4rem; display: block; margin-bottom: 1rem; }
      p { margin: 0 0 1.5rem; }
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      z-index: 100;
    }

    .modal-content {
      background: #1e293b;
      border-radius: 16px;
      padding: 1.5rem;
      width: 100%;
      max-width: 450px;
      
      h2 { margin: 0 0 1.5rem; font-size: 1.25rem; }
    }

    .file-upload {
      display: block;
      padding: 0.875rem 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px dashed rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      text-align: center;
      cursor: pointer;
      color: rgba(255, 255, 255, 0.7);
    }

    .modal-actions {
      display: flex;
      gap: 1rem;
      margin-top: 1.5rem;
    }

    .btn-cancel {
      flex: 1;
      padding: 0.875rem;
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      color: white;
      cursor: pointer;
    }

    .btn-confirm {
      flex: 1;
      padding: 0.875rem;
      background: linear-gradient(135deg, #10B981, #059669);
      border: none;
      border-radius: 10px;
      color: white;
      font-weight: 500;
      cursor: pointer;
    }
  `]
})
export class CompanyManagementComponent implements OnInit {
  private authService = inject(AuthService);
  private companyService = inject(CompanyService);

  activeTab: 'info' | 'branding' | 'documents' = 'info';
  saving = signal(false);
  showAddDocument = false;

  // Use service signals
  companyInfo = this.companyService.branding;
  documents = this.companyService.documents;

  // Color state
  primaryColor = '#6366F1';
  secondaryColor = '#EC4899';

  newDocument = {
    nombre: '',
    tipo: 'PATENTE',
    fechaVencimiento: ''
  };

  ngOnInit() {
    this.loadCompanyData();
  }

  loadCompanyData() {
    this.companyService.loadBranding();
    this.companyService.loadDocuments();
    this.companyService.refreshDocumentStatuses();

    // Sync color inputs with service state
    const branding = this.companyService.branding();
    this.primaryColor = branding.primaryColor || '#6366F1';
    this.secondaryColor = branding.secondaryColor || '#EC4899';
  }

  async saveChanges() {
    this.saving.set(true);
    try {
      const data = this.companyInfo();
      this.companyService.saveBranding({
        ...data,
        primaryColor: this.primaryColor,
        secondaryColor: this.secondaryColor
      });
      await new Promise(r => setTimeout(r, 500)); // Brief delay for UX
      console.log('Saved:', this.companyInfo());
    } finally {
      this.saving.set(false);
    }
  }

  onPrimaryColorChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.primaryColor = input.value;
    this.companyService.updateColors(this.primaryColor, this.secondaryColor);
  }

  onSecondaryColorChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.secondaryColor = input.value;
    this.companyService.updateColors(this.primaryColor, this.secondaryColor);
  }

  onLogoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.companyService.updateLogo(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  removeLogo() {
    this.companyService.removeLogo();
  }

  addDocument() {
    this.companyService.addDocument({
      nombre: this.newDocument.nombre,
      tipo: this.newDocument.tipo,
      fechaVencimiento: this.newDocument.fechaVencimiento || undefined,
      estado: 'VIGENTE'
    });
    this.showAddDocument = false;
    this.newDocument = { nombre: '', tipo: 'PATENTE', fechaVencimiento: '' };
  }

  deleteDocument(id: string) {
    this.companyService.deleteDocument(id);
  }

  getDocumentIcon(tipo: string): string {
    const icons: Record<string, string> = {
      'PATENTE': '📜',
      'SANITARIO': '🏥',
      'BOMBEROS': '🚒',
      'MUNICIPAL': '🏛️',
      'TRIBUTARIO': '💰',
      'OTRO': '📄'
    };
    return icons[tipo] || '📄';
  }

  getStatusLabel(estado: string): string {
    const labels: Record<string, string> = {
      'VIGENTE': '✓ Vigente',
      'POR_VENCER': '⚠️ Por vencer',
      'VENCIDO': '✗ Vencido'
    };
    return labels[estado] || estado;
  }
}
