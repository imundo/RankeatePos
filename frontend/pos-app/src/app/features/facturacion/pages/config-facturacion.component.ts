import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TaxTerminologyService, CountryCode } from '../../../core/services/tax-terminology.service';

interface ConfigEmpresa {
  country: CountryCode;
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
    <div class="config-wrapper">
      <div class="ambient-glow"></div>
      
      <div class="config-container">
        <!-- Header -->
        <header class="premium-header">
          <div class="header-left">
            <div class="brand-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </div>
            <div>
              <h1>Configuración</h1>
              <p class="subtitle">Datos de la empresa y Facturación Electrónica</p>
            </div>
          </div>
          <a routerLink="../dashboard" class="btn-glass-back">Volver al Dashboard</a>
        </header>

        <!-- Progress Steps -->
        <div class="progress-steps-container">
          <div class="step-item" [class.active]="tieneConfigBasica()">
            <div class="step-circle"><span class="icon">{{ tieneConfigBasica() ? '✓' : '1' }}</span></div>
            <span class="step-label">Datos</span>
          </div>
          <div class="step-line" [class.active]="tieneConfigBasica()"></div>
          <div class="step-item" [class.active]="tieneCertificado()">
            <div class="step-circle"><span class="icon">{{ tieneCertificado() ? '✓' : '2' }}</span></div>
            <span class="step-label">Firma</span>
          </div>
          <div class="step-line" [class.active]="tieneCertificado()"></div>
          <div class="step-item" [class.active]="tieneCaf()">
            <div class="step-circle"><span class="icon">{{ tieneCaf() ? '✓' : '3' }}</span></div>
            <span class="step-label">{{ terms().authorizationName }}s</span>
          </div>
        </div>

        <!-- Layout 2 Columnas -->
        <div class="config-layout">
          
          <!-- Columna Izquierda (Principal) -->
          <div class="col-main">
            <!-- Selector Jurisdicción -->
            <section class="premium-panel highlight-panel">
              <div class="panel-header borderless">
                <div class="header-titles">
                  <h2>🌍 Jurisdicción Activa</h2>
                  <p>Configura el país tributario de esta sucursal.</p>
                </div>
                <div class="custom-select-wrapper">
                  <select [ngModel]="currentCountry()" (ngModelChange)="onCountryChange($event)" class="glass-select">
                    <option value="CL">🇨🇱 Chile (SII)</option>
                    <option value="PE">🇵🇪 Perú (SUNAT)</option>
                    <option value="VE">🇻🇪 Venezuela (SENIAT)</option>
                    <option value="AR">🇦🇷 Argentina (AFIP)</option>
                    <option value="GENERIC">🌐 Genérico</option>
                  </select>
                </div>
              </div>
            </section>

            <!-- Datos de Empresa -->
            <section class="premium-panel">
              <div class="panel-header">
                <div class="header-titles">
                  <h2>🏢 Datos de la Empresa</h2>
                  <p>Información legal obligatoria para facturar</p>
                </div>
                @if (!editando()) {
                  <button class="btn-outline-glow small" (click)="editando.set(true)">Editar Datos</button>
                }
              </div>

              @if (editando()) {
                <form [formGroup]="empresaForm" (ngSubmit)="guardarEmpresa()" class="glass-form">
                  <div class="form-grid">
                    <div class="input-group">
                      <label>{{ terms().taxIdName }} Empresa *</label>
                      <input type="text" formControlName="rut" class="glass-input" placeholder="Ej: 12345678-9">
                    </div>
                    <div class="input-group">
                      <label>Razón Social *</label>
                      <input type="text" formControlName="razonSocial" class="glass-input" placeholder="Mi Empresa SpA">
                    </div>
                    <div class="input-group span-2">
                      <label>Giro Comercial *</label>
                      <input type="text" formControlName="giro" class="glass-input" placeholder="Venta al por menor">
                    </div>
                    <div class="input-group span-2">
                      <label>Dirección *</label>
                      <input type="text" formControlName="direccion" class="glass-input" placeholder="Av. Principal 123">
                    </div>
                    <div class="input-group">
                      <label>Comuna *</label>
                      <input type="text" formControlName="comuna" class="glass-input" placeholder="Santiago">
                    </div>
                    <div class="input-group">
                      <label>Ciudad *</label>
                      <input type="text" formControlName="ciudad" class="glass-input" placeholder="Santiago">
                    </div>
                    <div class="input-group">
                      <label>Teléfono</label>
                      <input type="tel" formControlName="telefono" class="glass-input" placeholder="+56 9 1234 5678">
                    </div>
                    <div class="input-group">
                      <label>Email</label>
                      <input type="email" formControlName="email" class="glass-input" placeholder="contacto@empresa.cl">
                    </div>
                    <div class="input-group">
                      <label>N° Res. {{ terms().taxAuthority }}</label>
                      <input type="text" formControlName="resolucionSii" class="glass-input" placeholder="0">
                    </div>
                    <div class="input-group">
                      <label>Fecha Resolución</label>
                      <input type="date" formControlName="fechaResolucion" class="glass-input">
                    </div>
                  </div>

                  <div class="form-actions">
                    <button type="button" class="btn-ghost" (click)="cancelarEdicion()">Cancelar</button>
                    <button type="submit" class="btn-glow-primary" [disabled]="!empresaForm.valid || guardando()">
                      @if (guardando()) {
                        <span class="spinner"></span> Guardando...
                      } @else {
                        Guardar Cambios
                      }
                    </button>
                  </div>
                </form>
              } @else {
                <div class="data-preview-grid">
                  @if (config()) {
                    <div class="data-item">
                      <span class="d-label">{{ terms().taxIdName }}</span>
                      <span class="d-value highlight">{{ config()!.rut }}</span>
                    </div>
                    <div class="data-item">
                      <span class="d-label">Razón Social</span>
                      <span class="d-value">{{ config()!.razonSocial }}</span>
                    </div>
                    <div class="data-item span-2">
                      <span class="d-label">Giro</span>
                      <span class="d-value">{{ config()!.giro }}</span>
                    </div>
                    <div class="data-item span-2">
                      <span class="d-label">Dirección Fiscal</span>
                      <span class="d-value">{{ config()!.direccion }}, {{ config()!.comuna }}, {{ config()!.ciudad }}</span>
                    </div>
                  } @else {
                    <div class="empty-state span-2">
                      <div class="empty-ring small"></div>
                      <p>Empresa no configurada</p>
                      <button class="btn-glow-primary" (click)="editando.set(true)">Empezar</button>
                    </div>
                  }
                </div>
              }
            </section>
          </div>

          <!-- Columna Derecha (Secundaria) -->
          <div class="col-side">
            <!-- Certificado Digital -->
            <section class="premium-panel">
              <div class="panel-header borderless">
                <div class="header-titles">
                  <h2>🔐 Certificado Digital</h2>
                  <p>Firma electrónica obligatoria</p>
                </div>
              </div>
              
              @if (certificado()) {
                <div class="cert-card valid">
                  <div class="cert-icon-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
                  <div class="cert-meta">
                    <p class="cert-name">{{ certificado()!.nombre }}</p>
                    <p class="cert-sub">{{ terms().taxIdName }}: {{ certificado()!.rut }}</p>
                    <p class="cert-sub exp">Expira: {{ certificado()!.vencimiento }}</p>
                  </div>
                  <button class="btn-ghost small" (click)="cambiarCertificado()">Cambiar</button>
                </div>
              } @else {
                <div class="upload-dropzone" (click)="certInput.click()">
                  <input #certInput type="file" accept=".pfx,.p12" (change)="onCertFileSelect($event)" hidden>
                  <div class="drop-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></div>
                  <p class="drop-title">Subir .pfx o .p12</p>
                  <p class="drop-desc">Clic aquí o arrastra el archivo</p>
                </div>
                
                @if (certFile()) {
                  <div class="upload-actions glass-form">
                    <div class="input-group">
                      <input type="password" [(ngModel)]="certPassword" class="glass-input" placeholder="Contraseña del certificado">
                    </div>
                    <button class="btn-glow-primary full-w" (click)="subirCertificado()" [disabled]="!certPassword || subiendoCert()">
                      @if (subiendoCert()) { <span class="spinner"></span> } @else { Instalar }
                    </button>
                  </div>
                }
              }
            </section>

            <!-- Ambiente -->
            <section class="premium-panel">
              <div class="panel-header borderless">
                <div class="header-titles">
                  <h2>🌐 Ambiente Tributario</h2>
                  <p>Estado de homologación con {{ terms().taxAuthority }}</p>
                </div>
              </div>
              
              <div class="env-switcher">
                <label class="env-tab" [class.active]="ambiente() === 'certificacion'">
                  <input type="radio" name="ambiente" value="certificacion" [checked]="ambiente() === 'certificacion'" (change)="cambiarAmbiente('certificacion')">
                  <div class="env-content">
                    <span class="env-icon">🧪</span>
                    <div>
                      <strong>Pruebas</strong>
                      <span>Sin validez legal</span>
                    </div>
                  </div>
                </label>
                
                <label class="env-tab" [class.active]="ambiente() === 'produccion'" [class.disabled]="!puedeProduccion()">
                  <input type="radio" name="ambiente" value="produccion" [checked]="ambiente() === 'produccion'" (change)="cambiarAmbiente('produccion')" [disabled]="!puedeProduccion()">
                  <div class="env-content">
                    <span class="env-icon">🚀</span>
                    <div>
                      <strong>Producción</strong>
                      <span>DTE Reales</span>
                    </div>
                  </div>
                </label>
              </div>

              @if (!puedeProduccion()) {
                <div class="alert-box warning">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <p>Requiere certificar el set de pruebas ante {{ terms().taxAuthority }}.</p>
                </div>
              }
            </section>

            <!-- Preferencias -->
            <section class="premium-panel">
              <div class="panel-header borderless">
                <div class="header-titles">
                  <h2>⚙️ Preferencias</h2>
                </div>
              </div>
              <div class="toggle-row">
                <div class="toggle-info">
                  <strong>Modo Offline (Caché)</strong>
                  <span>Acceso sin internet. (Puede retrasar actualizaciones)</span>
                </div>
                <label class="modern-switch">
                  <input type="checkbox" [checked]="swEnabled()" (change)="toggleSw($event)">
                  <span class="switch-slider"></span>
                </label>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block; min-height: 100vh;
      background-color: #09090b; color: #fafafa;
      font-family: 'Inter', system-ui, sans-serif;
      position: relative; overflow-x: hidden;
    }

    /* Base Layout */
    .ambient-glow {
      position: absolute; top: -20%; right: -10%; width: 60vw; height: 60vh;
      background: radial-gradient(circle, rgba(236,72,153,0.1) 0%, rgba(99,102,241,0.05) 40%, transparent 70%);
      pointer-events: none; z-index: 0;
    }
    .config-container {
      position: relative; z-index: 1; max-width: 1200px; margin: 0 auto; padding: 2rem;
      display: flex; flex-direction: column; gap: 2rem;
    }

    /* Header */
    .premium-header {
      display: flex; justify-content: space-between; align-items: center;
      padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .header-left { display: flex; align-items: center; gap: 1.25rem; }
    .brand-icon {
      width: 56px; height: 56px; border-radius: 16px;
      background: linear-gradient(135deg, rgba(236,72,153,0.15), rgba(99,102,241,0.1));
      border: 1px solid rgba(236,72,153,0.2);
      display: flex; align-items: center; justify-content: center; color: #f472b6;
    }
    .brand-icon svg { width: 28px; height: 28px; }
    .premium-header h1 {
      margin: 0; font-size: 1.75rem; font-weight: 700; letter-spacing: -0.5px;
      background: linear-gradient(to right, #fff, #a1a1aa);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .subtitle { margin: 0.25rem 0 0; color: #a1a1aa; font-size: 0.95rem; font-weight: 500; }
    
    .btn-glass-back {
      padding: 0.6rem 1.25rem; border-radius: 10px;
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);
      color: #d4d4d8; text-decoration: none; font-size: 0.85rem; font-weight: 500;
      transition: all 0.2s;
    }
    .btn-glass-back:hover { background: rgba(255,255,255,0.08); color: #fff; }

    /* Progress Steps */
    .progress-steps-container {
      display: flex; align-items: center; justify-content: center; gap: 1rem;
      background: rgba(24,24,27,0.4); backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 1.5rem 2rem;
    }
    .step-item { display: flex; align-items: center; gap: 0.75rem; opacity: 0.5; transition: opacity 0.3s; }
    .step-item.active { opacity: 1; }
    .step-circle {
      width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.1);
      display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 600;
    }
    .step-item.active .step-circle { background: #10b981; color: white; box-shadow: 0 0 15px rgba(16,185,129,0.3); }
    .step-label { font-weight: 500; font-size: 0.9rem; }
    .step-line { height: 2px; width: 60px; background: rgba(255,255,255,0.1); border-radius: 1px; transition: background 0.3s; }
    .step-line.active { background: #10b981; }

    /* Layout */
    .config-layout { display: grid; grid-template-columns: 1.6fr 1fr; gap: 1.5rem; }
    @media (max-width: 1024px) { .config-layout { grid-template-columns: 1fr; } }
    
    .col-main { display: flex; flex-direction: column; gap: 1.5rem; }
    .col-side { display: flex; flex-direction: column; gap: 1.5rem; }

    /* Panels */
    .premium-panel {
      background: rgba(24, 24, 27, 0.6); backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; padding: 1.75rem;
    }
    .highlight-panel {
      background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05));
      border-color: rgba(99,102,241,0.2); box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    .panel-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 1.5rem; padding-bottom: 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .panel-header.borderless { border-bottom: none; margin-bottom: 1rem; padding-bottom: 0; }
    .header-titles h2 { margin: 0 0 0.25rem 0; font-size: 1.15rem; font-weight: 600; color: #f4f4f5; }
    .header-titles p { margin: 0; font-size: 0.85rem; color: #a1a1aa; }

    /* Custom Select */
    .custom-select-wrapper { position: relative; }
    .glass-select {
      appearance: none; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1);
      color: #fff; padding: 0.6rem 2.5rem 0.6rem 1rem; border-radius: 10px;
      font-size: 0.9rem; font-weight: 500; outline: none; cursor: pointer; transition: border 0.2s;
    }
    .glass-select:focus { border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99,102,241,0.2); }
    .glass-select option { background: #18181b; color: #fff; }
    .custom-select-wrapper::after {
      content: '▼'; position: absolute; right: 1rem; top: 50%; transform: translateY(-50%);
      font-size: 0.6rem; color: #a1a1aa; pointer-events: none;
    }

    /* Forms */
    .glass-form { display: flex; flex-direction: column; gap: 1.5rem; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
    .input-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .input-group.span-2 { grid-column: 1 / -1; }
    .input-group label { font-size: 0.8rem; font-weight: 500; color: #a1a1aa; }
    .glass-input {
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px; padding: 0.75rem 1rem; color: #fff; font-size: 0.95rem;
      transition: all 0.2s;
    }
    .glass-input:focus {
      outline: none; border-color: #6366f1; background: rgba(0,0,0,0.2);
      box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
    }
    .glass-input::placeholder { color: rgba(255,255,255,0.2); }
    
    .form-actions {
      display: flex; justify-content: flex-end; gap: 1rem;
      padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.05);
    }
    
    /* Buttons */
    .btn-outline-glow {
      background: transparent; border: 1px solid rgba(99,102,241,0.4);
      color: #818cf8; padding: 0.6rem 1.25rem; border-radius: 8px; font-weight: 500; cursor: pointer;
      transition: all 0.2s;
    }
    .btn-outline-glow:hover { background: rgba(99,102,241,0.1); box-shadow: 0 0 15px rgba(99,102,241,0.2); }
    .btn-outline-glow.small { padding: 0.4rem 1rem; font-size: 0.85rem; }
    
    .btn-ghost {
      background: transparent; border: 1px solid transparent; color: #a1a1aa;
      padding: 0.6rem 1.25rem; border-radius: 8px; font-weight: 500; cursor: pointer; transition: all 0.2s;
    }
    .btn-ghost:hover { background: rgba(255,255,255,0.05); color: #fff; }
    .btn-ghost.small { padding: 0.4rem 0.8rem; font-size: 0.8rem; border: 1px solid rgba(255,255,255,0.1); }
    
    .btn-glow-primary {
      background: linear-gradient(135deg, #4f46e5, #7c3aed); border: none;
      color: white; padding: 0.6rem 1.5rem; border-radius: 8px; font-weight: 500; cursor: pointer;
      display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s;
    }
    .btn-glow-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(99,102,241,0.4); }
    .btn-glow-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-glow-primary.full-w { width: 100%; justify-content: center; }

    /* Data Preview */
    .data-preview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .data-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .data-item.span-2 { grid-column: 1 / -1; }
    .d-label { font-size: 0.75rem; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.5px; }
    .d-value { font-size: 0.95rem; color: #e4e4e7; font-weight: 500; }
    .d-value.highlight { color: #818cf8; font-weight: 600; }

    /* Empty States */
    .empty-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 2.5rem 1rem; text-align: center; background: rgba(0,0,0,0.2); border-radius: 16px;
      border: 1px dashed rgba(255,255,255,0.1);
    }
    .empty-ring.small { width: 48px; height: 48px; border: 2px dashed rgba(255,255,255,0.1); border-radius: 50%; margin-bottom: 1rem; }
    .empty-state p { color: #a1a1aa; margin-bottom: 1rem; font-size: 0.9rem; }

    /* Cert Card */
    .cert-card {
      display: flex; align-items: flex-start; gap: 1rem; padding: 1.25rem;
      background: rgba(34,197,94,0.05); border: 1px solid rgba(34,197,94,0.2); border-radius: 16px;
    }
    .cert-icon-wrap { width: 40px; height: 40px; border-radius: 10px; background: rgba(34,197,94,0.1); display: flex; align-items: center; justify-content: center; color: #4ade80; flex-shrink: 0; }
    .cert-icon-wrap svg { width: 20px; height: 20px; }
    .cert-meta { flex: 1; }
    .cert-name { margin: 0 0 0.2rem; font-weight: 600; color: #4ade80; font-size: 0.95rem; }
    .cert-sub { margin: 0; font-size: 0.8rem; color: #a1a1aa; }
    .cert-sub.exp { color: #d4d4d8; margin-top: 0.25rem; }

    /* Dropzone */
    .upload-dropzone {
      border: 2px dashed rgba(99,102,241,0.3); border-radius: 16px; padding: 2.5rem 1.5rem;
      text-align: center; cursor: pointer; background: rgba(99,102,241,0.02); transition: all 0.2s;
    }
    .upload-dropzone:hover { border-color: #818cf8; background: rgba(99,102,241,0.05); }
    .drop-icon { width: 56px; height: 56px; margin: 0 auto 1rem; border-radius: 50%; background: rgba(99,102,241,0.1); display: flex; align-items: center; justify-content: center; color: #818cf8; }
    .drop-icon svg { width: 28px; height: 28px; }
    .drop-title { margin: 0 0 0.25rem; font-weight: 600; color: #e4e4e7; }
    .drop-desc { margin: 0; font-size: 0.8rem; color: #a1a1aa; }
    .upload-actions { margin-top: 1rem; }

    /* Env Switcher */
    .env-switcher { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1rem; }
    .env-tab {
      display: flex; align-items: center; padding: 1rem; border-radius: 12px;
      background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
      cursor: pointer; transition: all 0.2s; position: relative; overflow: hidden;
    }
    .env-tab input { display: none; }
    .env-tab:hover:not(.disabled) { background: rgba(255,255,255,0.04); }
    .env-tab.active { background: rgba(99,102,241,0.1); border-color: rgba(99,102,241,0.3); box-shadow: inset 0 0 0 1px rgba(99,102,241,0.2); }
    .env-tab.disabled { opacity: 0.5; cursor: not-allowed; }
    .env-content { display: flex; align-items: center; gap: 1rem; }
    .env-icon { font-size: 1.5rem; }
    .env-content div { display: flex; flex-direction: column; gap: 0.15rem; }
    .env-content strong { font-size: 0.95rem; color: #f4f4f5; font-weight: 600; }
    .env-content span { font-size: 0.8rem; color: #a1a1aa; }

    /* Alert */
    .alert-box {
      display: flex; align-items: flex-start; gap: 0.75rem; padding: 1rem; border-radius: 12px;
      font-size: 0.85rem; line-height: 1.4;
    }
    .alert-box.warning { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); color: #fcd34d; }
    .alert-box svg { width: 18px; height: 18px; flex-shrink: 0; margin-top: 2px; }
    .alert-box p { margin: 0; }

    /* Modern Switch */
    .toggle-row { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 0.5rem 0; }
    .toggle-info { display: flex; flex-direction: column; gap: 0.2rem; }
    .toggle-info strong { font-size: 0.9rem; color: #e4e4e7; font-weight: 500; }
    .toggle-info span { font-size: 0.8rem; color: #a1a1aa; }
    
    .modern-switch { position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink: 0; }
    .modern-switch input { opacity: 0; width: 0; height: 0; }
    .switch-slider {
      position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
      background-color: rgba(255,255,255,0.1); border-radius: 24px; transition: .4s;
    }
    .switch-slider:before {
      position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px;
      background-color: white; border-radius: 50%; transition: .4s;
    }
    .modern-switch input:checked + .switch-slider { background-color: #6366f1; }
    .modern-switch input:checked + .switch-slider:before { transform: translateX(20px); }

    /* Spinner */
    .spinner {
      display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
      border-radius: 50%; border-top-color: #fff; animation: spin 1s ease-in-out infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ConfigFacturacionComponent implements OnInit {
  readonly terminology = inject(TaxTerminologyService);
  terms = this.terminology.term;
  currentCountry = this.terminology.country;

  fb = inject(FormBuilder);

  config = signal<ConfigEmpresa | null>(null);
  certificado = signal<{ nombre: string, rut: string, vencimiento: string } | null>(null);
  tieneCaf = signal<boolean>(false);

  // Estados UI
  editando = signal<boolean>(false);
  guardando = signal<boolean>(false);
  subiendoCert = signal<boolean>(false);

  // Formularios
  empresaForm: FormGroup;
  certFile = signal<File | null>(null);
  certPassword = '';

  // Accesos rápidos mock
  swEnabled = signal<boolean>(false);
  ambiente = signal<'certificacion' | 'produccion'>('certificacion');
  puedeProduccion = signal<boolean>(false);

  constructor() {
    this.empresaForm = this.fb.group({
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
  }

  ngOnInit() {
    this.cargarDatos();
  }

  onCountryChange(country: any) {
    this.terminology.setCountry(country as CountryCode);
  }

  private cargarDatos() {
    setTimeout(() => {
      // Mock de datos para prueba
      this.config.set({
        country: 'CL',
        rut: '76.123.456-7',
        razonSocial: 'Mi Empresa SpA',
        giro: 'Desarrollo de Software',
        direccion: 'Av. Providencia 1234, Of 501',
        comuna: 'Providencia',
        ciudad: 'Santiago',
        telefono: '+56 9 1234 5678',
        email: 'contacto@empresa.cl',
        nombreRepresentante: 'Juan Pérez',
        rutRepresentante: '12.345.678-9',
        actividadEconomica: '620200',
        resolucionSii: '80',
        fechaResolucion: '2023-01-15',
        ambiente: 'certificacion'
      });

      this.tieneCaf.set(true);
      this.certificado.set({
        nombre: 'JUAN PEREZ SOTO',
        rut: '12.345.678-9',
        vencimiento: '25/12/2026'
      });
      this.puedeProduccion.set(false);
    }, 500);
  }

  tieneConfigBasica(): boolean {
    return this.config() !== null;
  }

  tieneCertificado(): boolean {
    return this.certificado() !== null;
  }

  cancelarEdicion() {
    this.editando.set(false);
    this.empresaForm.reset();
    if (this.config()) {
      this.empresaForm.patchValue(this.config()!);
    }
  }

  guardarEmpresa() {
    if (this.empresaForm.invalid) return;

    this.guardando.set(true);
    setTimeout(() => {
      this.config.set({ ...this.config()!, ...this.empresaForm.value });
      this.editando.set(false);
      this.guardando.set(false);
    }, 1000);
  }

  onCertFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.certFile.set(input.files[0]);
    }
  }

  cambiarCertificado() {
    this.certificado.set(null);
    this.certFile.set(null);
    this.certPassword = '';
  }

  subirCertificado() {
    if (!this.certFile() || !this.certPassword) return;

    this.subiendoCert.set(true);
    setTimeout(() => {
      this.certificado.set({
        nombre: 'EMPRESA DEMO',
        rut: '76.123.456-7',
        vencimiento: '31/12/2026'
      });
      this.subiendoCert.set(false);
      this.certFile.set(null);
      this.certPassword = '';
    }, 1500);
  }

  toggleSw(event: Event) {
    const input = event.target as HTMLInputElement;
    this.swEnabled.set(input.checked);
  }

  cambiarAmbiente(amb: 'certificacion' | 'produccion') {
    if (amb === 'produccion' && !this.puedeProduccion()) return;
    this.ambiente.set(amb);
  }
}
