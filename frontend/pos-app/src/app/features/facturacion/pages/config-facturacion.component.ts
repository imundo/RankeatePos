import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface ConfigEmpresa {
  rut: string;
  razonSocial: string;
  giro: string;
  direccion: string;
  comuna: string;
  ciudad: string;
  telefono: string;
  email: string;
  nombreRepresentante: string;
  rutRepresentante: string;
  actividadEconomica: string;
  resolucionSii: string;
  fechaResolucion: string;
  ambiente: 'certificacion' | 'produccion';
  logoUrl?: string;
}

@Component({
  selector: 'app-config-facturacion',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="config-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-left">
          <h1>⚙️ Configuración</h1>
          <p class="subtitle">Datos de tu empresa para facturación electrónica</p>
        </div>
      </header>

      <!-- Estado de configuración -->
      <div class="config-status">
        <div class="status-item" [class.completed]="tieneConfigBasica()">
          <span class="status-icon">{{ tieneConfigBasica() ? '✓' : '1' }}</span>
          <span>Datos de Empresa</span>
        </div>
        <div class="status-line" [class.completed]="tieneConfigBasica()"></div>
        <div class="status-item" [class.completed]="tieneCertificado()">
          <span class="status-icon">{{ tieneCertificado() ? '✓' : '2' }}</span>
          <span>Certificado Digital</span>
        </div>
        <div class="status-line" [class.completed]="tieneCertificado()"></div>
        <div class="status-item" [class.completed]="tieneCaf()">
          <span class="status-icon">{{ tieneCaf() ? '✓' : '3' }}</span>
          <span>CAFs Cargados</span>
        </div>
      </div>

      <div class="config-grid">
        <!-- Datos de la empresa -->
        <section class="card empresa-section">
          <div class="card-header">
            <h2>🏢 Datos de la Empresa</h2>
            @if (!editando()) {
              <button class="btn-edit" (click)="editando.set(true)">Editar</button>
            }
          </div>

          @if (editando()) {
            <form [formGroup]="empresaForm" (ngSubmit)="guardarEmpresa()">
              <div class="form-grid">
                <div class="form-group">
                  <label>RUT Empresa *</label>
                  <input type="text" formControlName="rut" placeholder="12.345.678-9">
                </div>
                <div class="form-group">
                  <label>Razón Social *</label>
                  <input type="text" formControlName="razonSocial" placeholder="Mi Empresa SpA">
                </div>
                <div class="form-group full">
                  <label>Giro Comercial *</label>
                  <input type="text" formControlName="giro" placeholder="Venta al por menor">
                </div>
                <div class="form-group full">
                  <label>Dirección *</label>
                  <input type="text" formControlName="direccion" placeholder="Av. Principal 123">
                </div>
                <div class="form-group">
                  <label>Comuna *</label>
                  <input type="text" formControlName="comuna" placeholder="Santiago">
                </div>
                <div class="form-group">
                  <label>Ciudad *</label>
                  <input type="text" formControlName="ciudad" placeholder="Santiago">
                </div>
                <div class="form-group">
                  <label>Teléfono</label>
                  <input type="tel" formControlName="telefono" placeholder="+56 9 1234 5678">
                </div>
                <div class="form-group">
                  <label>Email</label>
                  <input type="email" formControlName="email" placeholder="contacto@empresa.cl">
                </div>
                <div class="form-group">
                  <label>N° Resolución SII</label>
                  <input type="text" formControlName="resolucionSii" placeholder="0">
                </div>
                <div class="form-group">
                  <label>Fecha Resolución</label>
                  <input type="date" formControlName="fechaResolucion">
                </div>
              </div>

              <div class="form-actions">
                <button type="button" class="btn-secondary" (click)="cancelarEdicion()">Cancelar</button>
                <button type="submit" class="btn-primary" [disabled]="!empresaForm.valid || guardando()">
                  @if (guardando()) {
                    <span class="spinner"></span> Guardando...
                  } @else {
                    Guardar Cambios
                  }
                </button>
              </div>
            </form>
          } @else {
            <div class="empresa-view">
              @if (config()) {
                <div class="info-grid">
                  <div class="info-item">
                    <span class="label">RUT</span>
                    <span class="value">{{ config()!.rut }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Razón Social</span>
                    <span class="value">{{ config()!.razonSocial }}</span>
                  </div>
                  <div class="info-item full">
                    <span class="label">Giro</span>
                    <span class="value">{{ config()!.giro }}</span>
                  </div>
                  <div class="info-item full">
                    <span class="label">Dirección</span>
                    <span class="value">{{ config()!.direccion }}, {{ config()!.comuna }}, {{ config()!.ciudad }}</span>
                  </div>
                </div>
              } @else {
                <div class="empty-config">
                  <p>No has configurado los datos de tu empresa</p>
                  <button class="btn-primary" (click)="editando.set(true)">Configurar ahora</button>
                </div>
              }
            </div>
          }
        </section>

        <!-- Certificado Digital -->
        <section class="card certificado-section">
          <h2>🔐 Certificado Digital</h2>
          
          @if (certificado()) {
            <div class="cert-info">
              <div class="cert-status valid">
                <span class="icon">✓</span>
                <span>Certificado Activo</span>
              </div>
              <div class="cert-details">
                <p><strong>{{ certificado()!.nombre }}</strong></p>
                <p>RUT: {{ certificado()!.rut }}</p>
                <p>Válido hasta: {{ certificado()!.vencimiento }}</p>
              </div>
              <button class="btn-secondary" (click)="cambiarCertificado()">Cambiar Certificado</button>
            </div>
          } @else {
            <div class="cert-upload">
              <div class="upload-zone" (click)="certInput.click()">
                <input #certInput type="file" accept=".pfx,.p12" (change)="onCertFileSelect($event)" hidden>
                <span class="icon">🔒</span>
                <p>Sube tu certificado digital (.pfx o .p12)</p>
                <p class="hint">Requerido para firmar documentos electrónicos</p>
              </div>
              
              @if (certFile()) {
                <div class="cert-form">
                  <div class="form-group">
                    <label>Contraseña del certificado</label>
                    <input type="password" [(ngModel)]="certPassword" placeholder="Ingresa la contraseña">
                  </div>
                  <button class="btn-primary" (click)="subirCertificado()" [disabled]="!certPassword || subiendoCert()">
                    @if (subiendoCert()) {
                      <span class="spinner"></span> Subiendo...
                    } @else {
                      Subir Certificado
                    }
                  </button>
                </div>
              }
            </div>
          }
        </section>

        <!-- Ambiente -->
        <section class="card ambiente-section">
          <h2>🌐 Ambiente SII</h2>
          
          <div class="ambiente-selector">
            <label class="ambiente-option" [class.selected]="ambiente() === 'certificacion'">
              <input type="radio" name="ambiente" value="certificacion" [checked]="ambiente() === 'certificacion'" (change)="cambiarAmbiente('certificacion')">
              <div class="option-content">
                <span class="option-icon">🧪</span>
                <span class="option-title">Certificación</span>
                <span class="option-desc">Ambiente de pruebas (Maullin)</span>
              </div>
            </label>
            
            <label class="ambiente-option" [class.selected]="ambiente() === 'produccion'" [class.disabled]="!puedeProduccion()">
              <input type="radio" name="ambiente" value="produccion" [checked]="ambiente() === 'produccion'" (change)="cambiarAmbiente('produccion')" [disabled]="!puedeProduccion()">
              <div class="option-content">
                <span class="option-icon">🚀</span>
                <span class="option-title">Producción</span>
                <span class="option-desc">Documentos tributarios reales</span>
              </div>
            </label>
          </div>

          @if (!puedeProduccion()) {
            <div class="ambiente-notice">
              <span>⚠️</span> Para pasar a producción necesitas completar la configuración y el set de pruebas SII
            </div>
          }
        </section>

        </section>
        
        <!-- Preferencias de Sistema -->
        <section class="card system-section">
          <h2>⚙️ Preferencias de Sistema</h2>
          
          <div class="preference-item">
            <div class="pref-info">
              <span class="pref-title">Modo Offline / Caché (Service Worker)</span>
              <span class="pref-desc">Permite entrar a la app sin internet, pero puede retrasar actualizaciones. Recomendado: Desactivado si tienes buena conexión.</span>
            </div>
            <label class="switch">
              <input type="checkbox" [checked]="swEnabled()" (change)="toggleSw($event)">
              <span class="slider round"></span>
            </label>
          </div>
        </section>

        <!-- Acceso rápido -->
        <section class="card quick-links">
          <h2>🔗 Accesos Rápidos</h2>
          <div class="links-grid">
            <a routerLink="../caf" class="quick-link">
              <span class="link-icon">🔢</span>
              <span class="link-text">Gestionar CAFs</span>
            </a>
            <a href="https://www.sii.cl" target="_blank" class="quick-link">
              <span class="link-icon">🏛️</span>
              <span class="link-text">Portal SII</span>
            </a>
            <a href="https://maullin.sii.cl" target="_blank" class="quick-link">
              <span class="link-icon">🧪</span>
              <span class="link-text">SII Certificación</span>
            </a>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .config-container {
      padding: 1.5rem;
      max-width: 1000px;
      margin: 0 auto;
      min-height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: white;
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

    /* Status */
    .config-status {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1.5rem;
      background: rgba(30, 41, 59, 0.6);
      backdrop-filter: blur(12px);
      border-radius: 14px;
      margin: 1.5rem 0;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .status-icon {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .status-item.completed .status-icon {
      background: #10B981;
      color: white;
    }

    .status-line {
      width: 60px;
      height: 2px;
      background: rgba(255, 255, 255, 0.1);
    }

    .status-line.completed {
      background: #10B981;
    }

    /* Cards */
    .config-grid {
      display: grid;
      gap: 1.5rem;
    }

    .card {
      background: rgba(30, 41, 59, 0.6);
      backdrop-filter: blur(12px);
      border-radius: 14px;
      padding: 1.5rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .card h2 {
      margin: 0 0 1.5rem;
      font-size: 1.1rem;
      color: white;
    }

    .card-header h2 {
      margin: 0;
    }

    .btn-edit {
      padding: 0.5rem 1rem;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.875rem;
      color: white;
      transition: all 0.2s;
    }

    .btn-edit:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    /* Form */
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group.full {
      grid-column: 1 / -1;
    }

    .form-group label {
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .form-group input {
      padding: 0.75rem 1rem;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 10px;
      font-size: 1rem;
      background: rgba(255, 255, 255, 0.05);
      color: white;
    }

    .form-group input::placeholder {
      color: rgba(255, 255, 255, 0.3);
    }

    .form-group input:focus {
      outline: none;
      border-color: #6366F1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .btn-primary, .btn-secondary {
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      border: none;
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    /* Info Grid */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .info-item {
      display: flex;
      flex-direction: column;
    }

    .info-item.full {
      grid-column: 1 / -1;
    }

    .info-item .label {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
      margin-bottom: 0.25rem;
    }

    .info-item .value {
      font-weight: 500;
      color: white;
    }

    .empty-config {
      text-align: center;
      padding: 2rem;
    }

    .empty-config p {
      color: rgba(255, 255, 255, 0.5);
      margin-bottom: 1rem;
    }

    /* Certificado */
    .cert-info {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .cert-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-radius: 10px;
    }

    .cert-status.valid {
      background: rgba(34, 197, 94, 0.2);
      color: #22C55E;
    }

    .cert-details p {
      margin: 0.25rem 0;
      color: rgba(255, 255, 255, 0.8);
    }

    .cert-upload .upload-zone {
      border: 2px dashed rgba(255, 255, 255, 0.2);
      border-radius: 14px;
      padding: 2rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .cert-upload .upload-zone:hover {
      border-color: #6366F1;
      background: rgba(99, 102, 241, 0.1);
    }

    .cert-upload .icon {
      font-size: 2.5rem;
      display: block;
      margin-bottom: 0.5rem;
    }

    .cert-upload p { color: rgba(255, 255, 255, 0.8); margin: 0.25rem 0; }

    .cert-upload .hint {
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.8rem;
    }

    .cert-form {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      gap: 1rem;
      align-items: flex-end;
    }

    .cert-form .form-group {
      flex: 1;
    }

    /* Ambiente */
    .ambiente-selector {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .ambiente-option {
      display: block;
      cursor: pointer;
    }

    .ambiente-option input {
      display: none;
    }

    .ambiente-option .option-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1.5rem;
      border: 2px solid rgba(255, 255, 255, 0.1);
      border-radius: 14px;
      transition: all 0.3s;
      background: rgba(255, 255, 255, 0.03);
    }

    .ambiente-option:hover .option-content {
      border-color: rgba(99, 102, 241, 0.5);
      transform: translateY(-4px);
    }

    .ambiente-option.selected .option-content {
      border-color: #6366F1;
      background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2));
      box-shadow: 0 0 30px rgba(99, 102, 241, 0.3);
    }

    .ambiente-option.disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .option-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .option-title {
      font-weight: 600;
      color: white;
    }

    .option-desc {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .ambiente-notice {
      margin-top: 1rem;
      padding: 0.75rem 1rem;
      background: rgba(249, 115, 22, 0.15);
      border: 1px solid rgba(249, 115, 22, 0.4);
      border-radius: 10px;
      font-size: 0.875rem;
      color: #F97316;
    }

    /* Quick Links */
    .links-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    .quick-link {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      text-decoration: none;
      color: white;
      transition: all 0.2s;
    }

    .quick-link:hover {
      background: rgba(99, 102, 241, 0.15);
      border-color: rgba(99, 102, 241, 0.4);
      transform: translateY(-2px);
    }

    .link-icon {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }

    .link-text {
      font-size: 0.875rem;
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
      .form-grid, .info-grid, .ambiente-selector, .links-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Switch Style */
    .preference-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .pref-title { display: block; font-weight: 500; margin-bottom: 0.25rem; }
    .pref-desc { font-size: 0.8rem; color: rgba(255, 255, 255, 0.5); }
    
    .switch {
      position: relative;
      display: inline-block;
      width: 50px;
      height: 28px;
    }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: rgba(255, 255, 255, 0.1);
      transition: .4s;
    }
    .slider:before {
      position: absolute;
      content: "";
      height: 20px;
      width: 20px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: .4s;
    }
    input:checked + .slider { background-color: #6366F1; }
    input:focus + .slider { box-shadow: 0 0 1px #6366F1; }
    input:checked + .slider:before { transform: translateX(22px); }
    .slider.round { border-radius: 34px; }
    .slider.round:before { border-radius: 50%; }
  `]
})
export class ConfigFacturacionComponent implements OnInit {
  private fb = inject(FormBuilder);

  config = signal<ConfigEmpresa | null>(null);
  certificado = signal<{ nombre: string; rut: string; vencimiento: string } | null>(null);
  ambiente = signal<'certificacion' | 'produccion'>('certificacion');
  editando = signal(false);
  guardando = signal(false);
  certFile = signal<File | null>(null);
  certPassword = '';
  subiendoCert = signal(false);

  empresaForm: FormGroup = this.fb.group({
    rut: ['', Validators.required],
    razonSocial: ['', Validators.required],
    giro: ['', Validators.required],
    direccion: ['', Validators.required],
    comuna: ['', Validators.required],
    ciudad: ['', Validators.required],
    telefono: [''],
    email: ['', Validators.email],
    resolucionSii: [''],
    fechaResolucion: ['']
  });

  ngOnInit() {
    this.cargarConfiguracion();
  }

  cargarConfiguracion() {
    // TODO: Cargar configuración desde el backend
    // Por ahora usa datos mock
    const stored = localStorage.getItem('config_empresa');
    if (stored) {
      const config = JSON.parse(stored);
      this.config.set(config);
      this.empresaForm.patchValue(config);
    }
  }

  tieneConfigBasica(): boolean {
    return !!this.config();
  }

  tieneCertificado(): boolean {
    return !!this.certificado();
  }

  tieneCaf(): boolean {
    // TODO: Verificar si hay CAFs cargados
    return false;
  }

  puedeProduccion(): boolean {
    return this.tieneConfigBasica() && this.tieneCertificado() && this.tieneCaf();
  }

  guardarEmpresa() {
    if (!this.empresaForm.valid) return;

    this.guardando.set(true);

    // Simular guardado
    setTimeout(() => {
      const config = this.empresaForm.value as ConfigEmpresa;
      this.config.set(config);
      localStorage.setItem('config_empresa', JSON.stringify(config));
      this.guardando.set(false);
      this.editando.set(false);
    }, 1000);
  }

  cancelarEdicion() {
    this.editando.set(false);
    if (this.config()) {
      this.empresaForm.patchValue(this.config()!);
    }
  }

  onCertFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.certFile.set(input.files[0]);
    }
  }

  subirCertificado() {
    // TODO: Implementar subida de certificado
    this.subiendoCert.set(true);
    setTimeout(() => {
      this.certificado.set({
        nombre: this.certFile()!.name,
        rut: this.config()?.rut || '12.345.678-9',
        vencimiento: '31/12/2025'
      });
      this.certFile.set(null);
      this.certPassword = '';
      this.subiendoCert.set(false);
    }, 2000);
  }

  cambiarCertificado() {
    this.certificado.set(null);
  }

  cambiarAmbiente(ambiente: 'certificacion' | 'produccion') {
    if (ambiente === 'produccion' && !this.puedeProduccion()) return;
    this.ambiente.set(ambiente);
  }

  swEnabled = signal(localStorage.getItem('POS_SETTINGS_SW_ENABLED') === 'true');

  toggleSw(event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    localStorage.setItem('POS_SETTINGS_SW_ENABLED', String(isChecked));
    this.swEnabled.set(isChecked);

    if (!isChecked) {
      // Unregister existing SW if any
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          for (let registration of registrations) {
            registration.unregister();
          }
          window.location.reload();
        });
      } else {
        window.location.reload();
      }
    } else {
      // Reload to let app.config.ts register it (requires page reload)
      window.location.reload();
    }
  }
}
