import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '@core/auth/auth.service';
import { environment } from '@env/environment';

interface WizardStep {
  title: string;
  icon: string;
  completed: boolean;
}

interface TenantWizardData {
  // Step 1: Business
  rut: string;
  razonSocial: string;
  nombreFantasia: string;
  giro: string;
  businessType: string;
  // Step 2: Location
  direccion: string;
  comuna: string;
  region: string;
  telefono: string;
  // Step 3: Plan
  plan: string;
  // Step 4: Admin User
  adminEmail: string;
  adminPassword: string;
  adminNombre: string;
  adminApellido: string;
  adminTelefono: string;
}

@Component({
  selector: 'app-tenant-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="wizard-container">
      <!-- Header -->
      <header class="wizard-header">
        <a routerLink="/admin/tenants" class="back-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Volver
        </a>
        <h1>🚀 Nuevo Cliente</h1>
        <span class="step-indicator">Paso {{ currentStep() + 1 }} de {{ steps.length }}</span>
      </header>

      <!-- Stepper -->
      <div class="stepper">
        @for (step of steps; track step.title; let i = $index) {
          <div 
            class="step" 
            [class.active]="i === currentStep()"
            [class.completed]="i < currentStep()"
            (click)="goToStep(i)">
            <div class="step-circle">
              @if (i < currentStep()) {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <path d="M5 12l5 5L20 7"/>
                </svg>
              } @else {
                {{ step.icon }}
              }
            </div>
            <span class="step-title">{{ step.title }}</span>
          </div>
          @if (i < steps.length - 1) {
            <div class="step-line" [class.completed]="i < currentStep()"></div>
          }
        }
      </div>

      <!-- Form Content -->
      <div class="form-content">
        <!-- Step 1: Business Data -->
        @if (currentStep() === 0) {
          <div class="step-content">
            <h2>📋 Datos del Negocio</h2>
            <p class="step-description">Información básica de la empresa</p>

            <div class="form-grid">
              <div class="form-group">
                <label>RUT Empresa *</label>
                <input 
                  type="text" 
                  [(ngModel)]="data.rut" 
                  placeholder="12.345.678-9"
                  required>
              </div>
              <div class="form-group">
                <label>Razón Social *</label>
                <input 
                  type="text" 
                  [(ngModel)]="data.razonSocial" 
                  placeholder="Mi Empresa SpA"
                  required>
              </div>
              <div class="form-group">
                <label>Nombre Fantasía</label>
                <input 
                  type="text" 
                  [(ngModel)]="data.nombreFantasia" 
                  placeholder="Mi Tienda">
              </div>
              <div class="form-group">
                <label>Giro *</label>
                <input 
                  type="text" 
                  [(ngModel)]="data.giro" 
                  placeholder="Comercio minorista">
              </div>
            </div>

            <div class="industry-selector">
              <label>Tipo de Industria *</label>
              <div class="industry-options">
                @for (industry of industries; track industry.value) {
                  <button 
                    type="button"
                    class="industry-option"
                    [class.selected]="data.businessType === industry.value"
                    (click)="data.businessType = industry.value">
                    <span class="industry-icon">{{ industry.icon }}</span>
                    <span class="industry-name">{{ industry.label }}</span>
                  </button>
                }
              </div>
            </div>
          </div>
        }

        <!-- Step 2: Location -->
        @if (currentStep() === 1) {
          <div class="step-content">
            <h2>📍 Ubicación</h2>
            <p class="step-description">Dirección y contacto del negocio</p>

            <div class="form-grid">
              <div class="form-group full-width">
                <label>Dirección</label>
                <input 
                  type="text" 
                  [(ngModel)]="data.direccion" 
                  placeholder="Av. Principal 123">
              </div>
              <div class="form-group">
                <label>Comuna</label>
                <input 
                  type="text" 
                  [(ngModel)]="data.comuna" 
                  placeholder="Santiago">
              </div>
              <div class="form-group">
                <label>Región</label>
                <select [(ngModel)]="data.region">
                  <option value="">Seleccionar...</option>
                  <option value="RM">Región Metropolitana</option>
                  <option value="V">Valparaíso</option>
                  <option value="VIII">Biobío</option>
                  <option value="X">Los Lagos</option>
                </select>
              </div>
              <div class="form-group">
                <label>Teléfono</label>
                <input 
                  type="tel" 
                  [(ngModel)]="data.telefono" 
                  placeholder="+56 9 1234 5678">
              </div>
            </div>
          </div>
        }

        <!-- Step 3: Plan -->
        @if (currentStep() === 2) {
          <div class="step-content plan-step">
            <h2>💳 Selección de Plan</h2>
            <p class="step-description">Elige el plan que mejor se adapte al negocio</p>

            <div class="plan-layout">
              <div class="plan-options">
                @for (plan of plans; track plan.value) {
                  <div 
                    class="plan-card"
                    [class.selected]="data.plan === plan.value"
                    [class.popular]="plan.popular"
                    (click)="data.plan = plan.value">
                    @if (plan.popular) {
                      <span class="popular-badge">Recomendado</span>
                    }
                    <h3>{{ plan.name }}</h3>
                    <div class="plan-price">
                      <span class="price">{{ plan.price }}</span>
                      <span class="period">/mes</span>
                    </div>
                    <div class="plan-limits">
                      <span>{{ plan.users }} usuarios</span>
                      <span>{{ plan.products }}</span>
                    </div>
                    <ul class="plan-features">
                      @for (feature of plan.features; track feature) {
                        <li>✓ {{ feature }}</li>
                      }
                    </ul>
                  </div>
                }
              </div>

              <!-- Modules Preview -->
              <div class="modules-preview">
                <h4>🧩 Módulos Incluidos en {{ getPlanLabel(data.plan) }}</h4>
                <div class="modules-list">
                  @for (module of getModulesForSelectedPlan(); track module.code) {
                    <div class="module-item" [class.included]="module.included">
                      <span class="module-icon">{{ module.icon }}</span>
                      <span class="module-name">{{ module.name }}</span>
                      <span class="module-status">{{ module.included ? '✅' : '🔒' }}</span>
                    </div>
                  }
                </div>
                <p class="upgrade-hint">💡 Puedes cambiar de plan en cualquier momento</p>
              </div>
            </div>
          </div>
        }

        <!-- Step 4: Admin User -->
        @if (currentStep() === 3) {
          <div class="step-content">
            <h2>👤 Usuario Administrador</h2>
            <p class="step-description">Datos de acceso del administrador del negocio</p>

            <div class="form-grid">
              <div class="form-group">
                <label>Nombre *</label>
                <input 
                  type="text" 
                  [(ngModel)]="data.adminNombre" 
                  placeholder="Juan"
                  required>
              </div>
              <div class="form-group">
                <label>Apellido</label>
                <input 
                  type="text" 
                  [(ngModel)]="data.adminApellido" 
                  placeholder="Pérez">
              </div>
              <div class="form-group">
                <label>Email *</label>
                <input 
                  type="email" 
                  [(ngModel)]="data.adminEmail" 
                  placeholder="admin@empresa.cl"
                  required>
              </div>
              <div class="form-group">
                <label>Contraseña *</label>
                <input 
                  type="password" 
                  [(ngModel)]="data.adminPassword" 
                  placeholder="Mínimo 6 caracteres"
                  required>
              </div>
              <div class="form-group">
                <label>Teléfono</label>
                <input 
                  type="tel" 
                  [(ngModel)]="data.adminTelefono" 
                  placeholder="+56 9 1234 5678">
              </div>
            </div>
          </div>
        }

        <!-- Step 5: Confirmation -->
        @if (currentStep() === 4) {
          <div class="step-content">
            <h2>✅ Confirmación</h2>
            <p class="step-description">Revisa los datos antes de crear el cliente</p>

            <div class="summary-grid">
              <div class="summary-section">
                <h4>📋 Negocio</h4>
                <p><strong>{{ data.razonSocial }}</strong></p>
                <p>RUT: {{ data.rut }}</p>
                <p>Giro: {{ data.giro }}</p>
                <p>Industria: {{ getIndustryLabel(data.businessType) }}</p>
              </div>
              <div class="summary-section">
                <h4>📍 Ubicación</h4>
                <p>{{ data.direccion || 'No especificada' }}</p>
                <p>{{ data.comuna }}, {{ data.region }}</p>
                <p>Tel: {{ data.telefono || 'No especificado' }}</p>
              </div>
              <div class="summary-section">
                <h4>💳 Plan</h4>
                <p><strong>{{ getPlanLabel(data.plan) }}</strong></p>
              </div>
              <div class="summary-section">
                <h4>👤 Administrador</h4>
                <p><strong>{{ data.adminNombre }} {{ data.adminApellido }}</strong></p>
                <p>{{ data.adminEmail }}</p>
              </div>
            </div>

            @if (error()) {
              <div class="error-message">
                ⚠️ {{ error() }}
              </div>
            }
          </div>
        }
      </div>

      <!-- Footer Actions -->
      <footer class="wizard-footer">
        <button 
          type="button" 
          class="btn-secondary"
          [disabled]="currentStep() === 0"
          (click)="prevStep()">
          ← Anterior
        </button>
        
        @if (currentStep() < steps.length - 1) {
          <button 
            type="button" 
            class="btn-primary"
            [disabled]="!canProceed()"
            (click)="nextStep()">
            Siguiente →
          </button>
        } @else {
          <button 
            type="button" 
            class="btn-success"
            [disabled]="loading() || !canProceed()"
            (click)="submit()">
            @if (loading()) {
              <span class="spinner"></span>
              Creando...
            } @else {
              🚀 Crear Cliente
            }
          </button>
        }
      </footer>
    </div>
  `,
  styles: [`
    .wizard-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%);
      color: white;
      display: flex;
      flex-direction: column;
    }

    .wizard-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem 2rem;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .back-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: rgba(255,255,255,0.6);
      text-decoration: none;
      font-size: 0.9rem;
      transition: color 0.2s;
    }

    .back-link:hover { color: white; }
    .back-link svg { width: 18px; height: 18px; }

    .wizard-header h1 {
      margin: 0;
      font-size: 1.5rem;
    }

    .step-indicator {
      color: rgba(255,255,255,0.5);
      font-size: 0.9rem;
    }

    /* Stepper */
    .stepper {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      gap: 0;
    }

    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      transition: all 0.3s;
    }

    .step-circle {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: rgba(255,255,255,0.1);
      border: 2px solid rgba(255,255,255,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      transition: all 0.3s;
    }

    .step.active .step-circle {
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      border-color: #8B5CF6;
      transform: scale(1.1);
    }

    .step.completed .step-circle {
      background: #10B981;
      border-color: #10B981;
    }

    .step.completed .step-circle svg {
      width: 24px;
      height: 24px;
    }

    .step-title {
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: rgba(255,255,255,0.5);
      transition: color 0.3s;
    }

    .step.active .step-title {
      color: white;
      font-weight: 600;
    }

    .step-line {
      width: 60px;
      height: 2px;
      background: rgba(255,255,255,0.2);
      margin: 0 1rem;
      transition: background 0.3s;
    }

    .step-line.completed {
      background: #10B981;
    }

    /* Form Content */
    .form-content {
      flex: 1;
      padding: 0 2rem 2rem;
      max-width: 900px;
      margin: 0 auto;
      width: 100%;
    }

    .step-content h2 {
      margin: 0 0 0.5rem;
      font-size: 1.5rem;
    }

    .step-description {
      color: rgba(255,255,255,0.5);
      margin: 0 0 2rem;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-group.full-width {
      grid-column: 1 / -1;
    }

    .form-group label {
      font-size: 0.875rem;
      color: rgba(255,255,255,0.7);
    }

    .form-group input,
    .form-group select {
      padding: 0.875rem 1rem;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      color: white;
      font-size: 1rem;
      transition: all 0.2s;
    }

    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: #6366F1;
      background: rgba(99,102,241,0.1);
    }

    .form-group input::placeholder {
      color: rgba(255,255,255,0.3);
    }

    /* Industry Selector */
    .industry-selector {
      margin-top: 2rem;
    }

    .industry-selector label {
      display: block;
      margin-bottom: 1rem;
      color: rgba(255,255,255,0.7);
    }

    .industry-options {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 1rem;
    }

    .industry-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1.5rem 1rem;
      background: rgba(255,255,255,0.05);
      border: 2px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      color: white;
    }

    .industry-option:hover {
      border-color: rgba(99,102,241,0.5);
      background: rgba(99,102,241,0.1);
    }

    .industry-option.selected {
      border-color: #6366F1;
      background: rgba(99,102,241,0.2);
    }

    .industry-icon { font-size: 2rem; }
    .industry-name { font-size: 0.8rem; }

    /* Plan Layout */
    .plan-step .plan-layout {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 2rem;
    }

    /* Plan Options */
    .plan-options {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .plan-limits {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      font-size: 0.85rem;
      color: rgba(255,255,255,0.5);
    }

    .plan-limits span {
      padding: 0.25rem 0.5rem;
      background: rgba(255,255,255,0.05);
      border-radius: 4px;
    }

    /* Modules Preview */
    .modules-preview {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 1.5rem;
      position: sticky;
      top: 2rem;
    }

    .modules-preview h4 {
      margin: 0 0 1.5rem;
      font-size: 1rem;
    }

    .modules-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .module-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: rgba(255,255,255,0.02);
      border-radius: 8px;
      transition: all 0.2s;
    }

    .module-item.included {
      background: rgba(16, 185, 129, 0.1);
    }

    .module-item:not(.included) {
      opacity: 0.5;
    }

    .module-icon {
      font-size: 1.25rem;
    }

    .module-name {
      flex: 1;
      font-size: 0.9rem;
    }

    .module-status {
      font-size: 0.9rem;
    }

    .upgrade-hint {
      margin-top: 1.5rem;
      padding: 0.75rem;
      background: rgba(99, 102, 241, 0.1);
      border-radius: 8px;
      font-size: 0.8rem;
      color: rgba(255,255,255,0.7);
      text-align: center;
    }

    .plan-card {
      position: relative;
      padding: 2rem;
      background: rgba(255,255,255,0.05);
      border: 2px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.3s;
    }

    .plan-card:hover {
      border-color: rgba(99,102,241,0.5);
      transform: translateY(-4px);
    }

    .plan-card.selected {
      border-color: #6366F1;
      background: rgba(99,102,241,0.15);
    }

    .plan-card.popular {
      border-color: #F59E0B;
    }

    .popular-badge {
      position: absolute;
      top: -12px;
      right: 20px;
      padding: 0.25rem 0.75rem;
      background: linear-gradient(135deg, #F59E0B, #EF4444);
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .plan-card h3 {
      margin: 0 0 1rem;
      font-size: 1.25rem;
    }

    .plan-price {
      margin-bottom: 1.5rem;
    }

    .plan-price .price {
      font-size: 2rem;
      font-weight: 700;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .plan-price .period {
      color: rgba(255,255,255,0.5);
    }

    .plan-features {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .plan-features li {
      padding: 0.5rem 0;
      color: rgba(255,255,255,0.7);
      font-size: 0.9rem;
    }

    /* Summary Grid */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .summary-section {
      padding: 1.5rem;
      background: rgba(255,255,255,0.05);
      border-radius: 12px;
    }

    .summary-section h4 {
      margin: 0 0 1rem;
      color: rgba(255,255,255,0.7);
    }

    .summary-section p {
      margin: 0.25rem 0;
    }

    .error-message {
      margin-top: 1.5rem;
      padding: 1rem;
      background: rgba(239,68,68,0.2);
      border: 1px solid rgba(239,68,68,0.5);
      border-radius: 10px;
      color: #FCA5A5;
    }

    /* Footer */
    .wizard-footer {
      display: flex;
      justify-content: space-between;
      padding: 1.5rem 2rem;
      border-top: 1px solid rgba(255,255,255,0.1);
      background: rgba(0,0,0,0.2);
    }

    .btn-primary, .btn-secondary, .btn-success {
      padding: 0.875rem 2rem;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-secondary {
      background: transparent;
      border: 1px solid rgba(255,255,255,0.2);
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      background: rgba(255,255,255,0.1);
    }

    .btn-primary {
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      border: none;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(99,102,241,0.4);
    }

    .btn-success {
      background: linear-gradient(135deg, #10B981, #059669);
      border: none;
      color: white;
    }

    .btn-success:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(16,185,129,0.4);
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .form-grid { grid-template-columns: 1fr; }
      .industry-options { grid-template-columns: repeat(3, 1fr); }
      .plan-options { grid-template-columns: 1fr; }
      .summary-grid { grid-template-columns: 1fr; }
      .stepper { flex-wrap: wrap; gap: 1rem; }
      .step-line { display: none; }
    }
  `]
})
export class TenantWizardComponent {
  private http = inject(HttpClient);
  private router = inject(Router);
  private authService = inject(AuthService);

  currentStep = signal(0);
  loading = signal(false);
  error = signal<string | null>(null);

  steps: WizardStep[] = [
    { title: 'Negocio', icon: '📋', completed: false },
    { title: 'Ubicación', icon: '📍', completed: false },
    { title: 'Plan', icon: '💳', completed: false },
    { title: 'Admin', icon: '👤', completed: false },
    { title: 'Confirmar', icon: '✅', completed: false }
  ];

  industries = [
    { value: 'RETAIL', label: 'Retail', icon: '🛒' },
    { value: 'PANADERIA', label: 'Panadería', icon: '🥖' },
    { value: 'EDUCACION', label: 'Cursos', icon: '🎓' },
    { value: 'EDITORIAL', label: 'Editorial', icon: '📚' },
    { value: 'RESTAURANTE', label: 'Restaurant', icon: '🍕' }
  ];

  plans = [
    {
      value: 'FREE',
      name: 'Starter',
      price: 'Gratis',
      users: '1',
      products: '100 productos',
      popular: false,
      features: ['POS básico', 'Inventario simple'],
      modules: ['pos']
    },
    {
      value: 'PRO',
      name: 'Pro',
      price: '$29.990',
      users: '3',
      products: 'Ilimitados',
      popular: true,
      features: ['Facturación electrónica', 'CRM básico', 'Soporte email'],
      modules: ['pos', 'inventory', 'invoicing', 'crm']
    },
    {
      value: 'BUSINESS',
      name: 'Business',
      price: '$79.990',
      users: '10',
      products: 'Ilimitados',
      popular: false,
      features: ['Multi-sucursal', 'Fidelización', 'Reportes avanzados', 'Soporte 24/7'],
      modules: ['pos', 'inventory', 'invoicing', 'crm', 'loyalty', 'kds', 'reservations', 'payroll', 'accounting']
    }
  ];

  allModules = [
    { code: 'pos', name: 'Punto de Venta', icon: '💰' },
    { code: 'inventory', name: 'Inventario', icon: '📦' },
    { code: 'invoicing', name: 'Facturación Electrónica', icon: '📄' },
    { code: 'crm', name: 'Clientes (CRM)', icon: '👥' },
    { code: 'loyalty', name: 'Fidelización', icon: '⭐' },
    { code: 'reservations', name: 'Reservas', icon: '📅' },
    { code: 'kds', name: 'Pantalla Cocina (KDS)', icon: '🍳' },
    { code: 'payroll', name: 'Remuneraciones', icon: '💼' },
    { code: 'accounting', name: 'Contabilidad', icon: '📊' }
  ];

  data: TenantWizardData = {
    rut: '',
    razonSocial: '',
    nombreFantasia: '',
    giro: '',
    businessType: '',
    direccion: '',
    comuna: '',
    region: '',
    telefono: '',
    plan: 'PRO',
    adminEmail: '',
    adminPassword: '',
    adminNombre: '',
    adminApellido: '',
    adminTelefono: ''
  };

  canProceed(): boolean {
    switch (this.currentStep()) {
      case 0:
        return !!(this.data.rut && this.data.razonSocial && this.data.giro && this.data.businessType);
      case 1:
        return true; // Location is optional
      case 2:
        return !!this.data.plan;
      case 3:
        return !!(this.data.adminEmail && this.data.adminPassword && this.data.adminNombre && this.data.adminPassword.length >= 6);
      case 4:
        return true;
      default:
        return false;
    }
  }

  goToStep(step: number) {
    if (step <= this.currentStep()) {
      this.currentStep.set(step);
    }
  }

  nextStep() {
    if (this.currentStep() < this.steps.length - 1) {
      this.currentStep.update(s => s + 1);
    }
  }

  prevStep() {
    if (this.currentStep() > 0) {
      this.currentStep.update(s => s - 1);
    }
  }

  getIndustryLabel(value: string): string {
    return this.industries.find(i => i.value === value)?.label || value;
  }

  getPlanLabel(value: string): string {
    return this.plans.find(p => p.value === value)?.name || value;
  }

  getModulesForSelectedPlan(): { code: string; name: string; icon: string; included: boolean }[] {
    const selectedPlan = this.plans.find(p => p.value === this.data.plan);
    const planModules = selectedPlan?.modules || [];

    return this.allModules.map(module => ({
      ...module,
      included: planModules.includes(module.code)
    }));
  }

  submit() {
    this.loading.set(true);
    this.error.set(null);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authService.getToken()}`
    });

    this.http.post(`${environment.authUrl}/api/admin/tenants/wizard`, this.data, { headers })
      .subscribe({
        next: (result: any) => {
          this.loading.set(false);
          // Navigate to tenant list with success message
          this.router.navigate(['/admin/tenants'], {
            queryParams: { created: result.tenantId }
          });
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err.error?.message || 'Error al crear el cliente');
        }
      });
  }
}
