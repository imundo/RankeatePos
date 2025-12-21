import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FacturacionService, EmitirDteRequest, EmitirDteItem, TipoDte } from '../services/facturacion.service';

type TipoDocumento = 'BOLETA' | 'FACTURA' | 'NOTA_CREDITO' | 'NOTA_DEBITO';

@Component({
    selector: 'app-emitir-documento',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
    template: `
    <div class="emitir-container">
      <!-- Header -->
      <header class="page-header">
        <a routerLink="../dashboard" class="back-btn">← Volver</a>
        <div class="header-content">
          <h1>📝 Emitir Documento</h1>
          <p class="subtitle">Paso {{ paso() }} de 4</p>
        </div>
      </header>

      <!-- Progress bar -->
      <div class="progress-container">
        <div class="progress-steps">
          @for (step of pasos; track step.num; let i = $index) {
            <div class="step" [class.active]="paso() === step.num" [class.completed]="paso() > step.num">
              <div class="step-circle">
                @if (paso() > step.num) {
                  <span>✓</span>
                } @else {
                  <span>{{ step.num }}</span>
                }
              </div>
              <span class="step-label">{{ step.label }}</span>
            </div>
          }
        </div>
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="(paso() - 1) * 33.33"></div>
        </div>
      </div>

      <!-- Step Content -->
      <main class="step-content">
        <!-- Paso 1: Tipo de Documento -->
        @if (paso() === 1) {
          <div class="step-panel tipo-documento">
            <h2>¿Qué tipo de documento deseas emitir?</h2>
            <div class="tipo-grid">
              <button 
                class="tipo-card" 
                [class.selected]="tipoSeleccionado() === 'BOLETA'"
                (click)="seleccionarTipo('BOLETA')">
                <span class="icon">🧾</span>
                <span class="nombre">Boleta Electrónica</span>
                <span class="codigo">Código 39</span>
                <span class="desc">Venta a consumidor final</span>
              </button>
              <button 
                class="tipo-card"
                [class.selected]="tipoSeleccionado() === 'FACTURA'"
                (click)="seleccionarTipo('FACTURA')">
                <span class="icon">📄</span>
                <span class="nombre">Factura Electrónica</span>
                <span class="codigo">Código 33</span>
                <span class="desc">Venta con datos del cliente</span>
              </button>
              <button 
                class="tipo-card"
                [class.selected]="tipoSeleccionado() === 'NOTA_CREDITO'"
                (click)="seleccionarTipo('NOTA_CREDITO')">
                <span class="icon">🔻</span>
                <span class="nombre">Nota de Crédito</span>
                <span class="codigo">Código 61</span>
                <span class="desc">Anulación o descuento</span>
              </button>
              <button 
                class="tipo-card"
                [class.selected]="tipoSeleccionado() === 'NOTA_DEBITO'"
                (click)="seleccionarTipo('NOTA_DEBITO')">
                <span class="icon">🔺</span>
                <span class="nombre">Nota de Débito</span>
                <span class="codigo">Código 56</span>
                <span class="desc">Cobro adicional</span>
              </button>
            </div>
          </div>
        }

        <!-- Paso 2: Receptor -->
        @if (paso() === 2) {
          <div class="step-panel receptor">
            <h2>Datos del {{ tipoSeleccionado() === 'BOLETA' ? 'Cliente (Opcional)' : 'Receptor' }}</h2>
            
            @if (tipoSeleccionado() !== 'BOLETA') {
              <div class="required-notice">
                <span class="icon">ℹ️</span>
                Los datos del receptor son obligatorios para facturas
              </div>
            }

            <form [formGroup]="receptorForm" class="receptor-form">
              <div class="form-row">
                <div class="form-group">
                  <label for="rut">RUT</label>
                  <input 
                    id="rut" 
                    type="text" 
                    formControlName="rut"
                    placeholder="12.345.678-9"
                    (blur)="formatRut()">
                  <span class="hint">Formato: 12.345.678-9</span>
                </div>
                <div class="form-group">
                  <label for="razonSocial">Razón Social / Nombre</label>
                  <input 
                    id="razonSocial" 
                    type="text" 
                    formControlName="razonSocial"
                    placeholder="Nombre del cliente">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="giro">Giro Comercial</label>
                  <input 
                    id="giro" 
                    type="text" 
                    formControlName="giro"
                    placeholder="Actividad comercial">
                </div>
                <div class="form-group">
                  <label for="email">Email</label>
                  <input 
                    id="email" 
                    type="email" 
                    formControlName="email"
                    placeholder="correo@empresa.cl">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group full">
                  <label for="direccion">Dirección</label>
                  <input 
                    id="direccion" 
                    type="text" 
                    formControlName="direccion"
                    placeholder="Calle, número">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="comuna">Comuna</label>
                  <input 
                    id="comuna" 
                    type="text" 
                    formControlName="comuna"
                    placeholder="Comuna">
                </div>
                <div class="form-group">
                  <label for="ciudad">Ciudad</label>
                  <input 
                    id="ciudad" 
                    type="text" 
                    formControlName="ciudad"
                    placeholder="Ciudad">
                </div>
              </div>
            </form>
          </div>
        }

        <!-- Paso 3: Items -->
        @if (paso() === 3) {
          <div class="step-panel items">
            <h2>Productos o Servicios</h2>
            
            <div class="items-table">
              <div class="table-header">
                <span class="col-producto">Producto</span>
                <span class="col-cantidad">Cant.</span>
                <span class="col-precio">Precio</span>
                <span class="col-total">Total</span>
                <span class="col-actions"></span>
              </div>

              <div class="items-list">
                @for (item of items(); track $index) {
                  <div class="item-row">
                    <div class="col-producto">
                      <input 
                        type="text" 
                        [value]="item.nombreItem"
                        (input)="updateItem($index, 'nombreItem', $event)"
                        placeholder="Nombre del producto">
                    </div>
                    <div class="col-cantidad">
                      <input 
                        type="number" 
                        [value]="item.cantidad"
                        (input)="updateItem($index, 'cantidad', $event)"
                        min="1">
                    </div>
                    <div class="col-precio">
                      <input 
                        type="number" 
                        [value]="item.precioUnitario"
                        (input)="updateItem($index, 'precioUnitario', $event)"
                        min="0">
                    </div>
                    <div class="col-total">
                      {{ formatCurrency(item.cantidad * item.precioUnitario) }}
                    </div>
                    <div class="col-actions">
                      <button class="btn-delete" (click)="removeItem($index)" [disabled]="items().length === 1">
                        🗑️
                      </button>
                    </div>
                  </div>
                }
              </div>

              <button class="btn-add-item" (click)="addItem()">
                + Agregar producto
              </button>
            </div>

            <!-- Totales -->
            <div class="totales-section">
              <div class="totales-grid">
                <div class="total-row">
                  <span class="label">Subtotal:</span>
                  <span class="value">{{ formatCurrency(subtotal()) }}</span>
                </div>
                @if (tipoSeleccionado() !== 'BOLETA') {
                  <div class="total-row">
                    <span class="label">Neto:</span>
                    <span class="value">{{ formatCurrency(neto()) }}</span>
                  </div>
                  <div class="total-row">
                    <span class="label">IVA (19%):</span>
                    <span class="value">{{ formatCurrency(iva()) }}</span>
                  </div>
                }
                <div class="total-row total">
                  <span class="label">Total:</span>
                  <span class="value">{{ formatCurrency(total()) }}</span>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Paso 4: Confirmación -->
        @if (paso() === 4) {
          <div class="step-panel confirmacion">
            <h2>Confirmar y Emitir</h2>
            
            <div class="resumen-card">
              <div class="resumen-header">
                <span class="tipo-badge">{{ tipoSeleccionado() }}</span>
                <span class="total-display">{{ formatCurrency(total()) }}</span>
              </div>

              @if (receptorForm.value.rut) {
                <div class="resumen-section">
                  <h3>Receptor</h3>
                  <p><strong>{{ receptorForm.value.razonSocial }}</strong></p>
                  <p>RUT: {{ receptorForm.value.rut }}</p>
                  @if (receptorForm.value.email) {
                    <p>📧 {{ receptorForm.value.email }}</p>
                  }
                </div>
              }

              <div class="resumen-section">
                <h3>{{ items().length }} Producto(s)</h3>
                @for (item of items(); track $index) {
                  <div class="resumen-item">
                    <span>{{ item.nombreItem }}</span>
                    <span>{{ item.cantidad }} x {{ formatCurrency(item.precioUnitario) }}</span>
                  </div>
                }
              </div>

              <div class="resumen-totales">
                @if (tipoSeleccionado() !== 'BOLETA') {
                  <div class="row"><span>Neto:</span><span>{{ formatCurrency(neto()) }}</span></div>
                  <div class="row"><span>IVA:</span><span>{{ formatCurrency(iva()) }}</span></div>
                }
                <div class="row total"><span>TOTAL:</span><span>{{ formatCurrency(total()) }}</span></div>
              </div>
            </div>

            <div class="opciones-envio">
              <label class="checkbox-option">
                <input type="checkbox" [(ngModel)]="enviarSii">
                <span>🌐 Enviar al SII automáticamente</span>
              </label>
              <label class="checkbox-option">
                <input type="checkbox" [(ngModel)]="enviarEmail" [disabled]="!receptorForm.value.email">
                <span>📧 Enviar por email al cliente</span>
              </label>
            </div>
          </div>
        }
      </main>

      <!-- Navigation -->
      <footer class="step-navigation">
        <button 
          class="btn-secondary" 
          (click)="anterior()" 
          [disabled]="paso() === 1">
          ← Anterior
        </button>

        @if (paso() < 4) {
          <button 
            class="btn-primary" 
            (click)="siguiente()"
            [disabled]="!puedeAvanzar()">
            Siguiente →
          </button>
        } @else {
          <button 
            class="btn-success" 
            (click)="emitir()"
            [disabled]="loading()">
            @if (loading()) {
              <span class="spinner"></span> Procesando...
            } @else {
              ✓ Emitir Documento
            }
          </button>
        }
      </footer>
    </div>
  `,
    styles: [`
    .emitir-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 1.5rem;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .page-header {
      margin-bottom: 1.5rem;
    }

    .back-btn {
      color: var(--text-secondary, #666);
      text-decoration: none;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
      display: inline-block;
    }

    .header-content h1 {
      font-size: 1.5rem;
      margin: 0;
    }

    .subtitle {
      color: var(--text-secondary);
      margin: 0.25rem 0 0;
    }

    /* Progress */
    .progress-container {
      margin-bottom: 2rem;
    }

    .progress-steps {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
    }

    .step-circle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--bg-secondary, #e0e0e0);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      margin-bottom: 0.5rem;
      transition: all 0.3s;
    }

    .step.active .step-circle {
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      color: white;
      transform: scale(1.1);
    }

    .step.completed .step-circle {
      background: #10B981;
      color: white;
    }

    .step-label {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .step.active .step-label {
      color: var(--primary-color, #6366F1);
      font-weight: 600;
    }

    .progress-bar {
      height: 4px;
      background: var(--bg-secondary, #e0e0e0);
      border-radius: 2px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #6366F1, #8B5CF6);
      border-radius: 2px;
      transition: width 0.3s;
    }

    /* Step Content */
    .step-content {
      flex: 1;
    }

    .step-panel {
      background: var(--card-bg, #fff);
      border-radius: 16px;
      padding: 2rem;
      border: 1px solid var(--border-color, #e0e0e0);
    }

    .step-panel h2 {
      font-size: 1.25rem;
      margin: 0 0 1.5rem;
      text-align: center;
    }

    /* Tipo Documento */
    .tipo-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .tipo-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1.5rem;
      border: 2px solid var(--border-color, #e0e0e0);
      border-radius: 12px;
      background: var(--bg-secondary, #f5f5f5);
      cursor: pointer;
      transition: all 0.2s;
    }

    .tipo-card:hover {
      border-color: var(--primary-color, #6366F1);
      background: white;
    }

    .tipo-card.selected {
      border-color: var(--primary-color, #6366F1);
      background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1));
    }

    .tipo-card .icon {
      font-size: 2.5rem;
      margin-bottom: 0.75rem;
    }

    .tipo-card .nombre {
      font-weight: 600;
      font-size: 1rem;
    }

    .tipo-card .codigo {
      font-size: 0.75rem;
      color: var(--primary-color);
      margin-top: 0.25rem;
    }

    .tipo-card .desc {
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-top: 0.5rem;
      text-align: center;
    }

    /* Receptor Form */
    .required-notice {
      background: #fef3c7;
      color: #92400e;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .receptor-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-row {
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
      color: var(--text-primary);
    }

    .form-group input {
      padding: 0.75rem 1rem;
      border: 1px solid var(--border-color, #e0e0e0);
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.2s;
    }

    .form-group input:focus {
      outline: none;
      border-color: var(--primary-color, #6366F1);
      box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
    }

    .form-group .hint {
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-top: 0.25rem;
    }

    /* Items */
    .items-table {
      margin-bottom: 1.5rem;
    }

    .table-header {
      display: grid;
      grid-template-columns: 1fr 80px 120px 120px 40px;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: var(--bg-secondary);
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
    }

    .items-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .item-row {
      display: grid;
      grid-template-columns: 1fr 80px 120px 120px 40px;
      gap: 0.5rem;
      align-items: center;
    }

    .item-row input {
      padding: 0.5rem;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      font-size: 0.875rem;
    }

    .col-total {
      font-weight: 600;
      text-align: right;
    }

    .btn-delete {
      background: none;
      border: none;
      cursor: pointer;
      opacity: 0.5;
      transition: opacity 0.2s;
    }

    .btn-delete:hover:not(:disabled) {
      opacity: 1;
    }

    .btn-add-item {
      width: 100%;
      padding: 0.75rem;
      margin-top: 0.5rem;
      border: 2px dashed var(--border-color);
      border-radius: 8px;
      background: none;
      color: var(--primary-color);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-add-item:hover {
      border-color: var(--primary-color);
      background: rgba(99,102,241,0.05);
    }

    /* Totales */
    .totales-section {
      display: flex;
      justify-content: flex-end;
    }

    .totales-grid {
      background: var(--bg-secondary);
      padding: 1rem 1.5rem;
      border-radius: 8px;
      min-width: 250px;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
    }

    .total-row.total {
      border-top: 2px solid var(--border-color);
      margin-top: 0.5rem;
      padding-top: 0.75rem;
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--primary-color);
    }

    /* Confirmación */
    .resumen-card {
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .resumen-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border-color);
    }

    .tipo-badge {
      background: var(--primary-color);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .total-display {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary-color);
    }

    .resumen-section {
      margin-bottom: 1rem;
    }

    .resumen-section h3 {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin: 0 0 0.5rem;
    }

    .resumen-item {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
      padding: 0.25rem 0;
    }

    .resumen-totales {
      border-top: 1px solid var(--border-color);
      padding-top: 1rem;
      margin-top: 1rem;
    }

    .resumen-totales .row {
      display: flex;
      justify-content: space-between;
      padding: 0.25rem 0;
    }

    .resumen-totales .row.total {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--primary-color);
    }

    .opciones-envio {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .checkbox-option {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: var(--bg-secondary);
      border-radius: 8px;
      cursor: pointer;
    }

    .checkbox-option input {
      width: 18px;
      height: 18px;
    }

    /* Navigation */
    .step-navigation {
      display: flex;
      justify-content: space-between;
      padding: 1.5rem 0;
      margin-top: 1rem;
    }

    .btn-secondary, .btn-primary, .btn-success {
      padding: 0.875rem 2rem;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-secondary {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
    }

    .btn-primary {
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      border: none;
      color: white;
    }

    .btn-success {
      background: linear-gradient(135deg, #10B981, #059669);
      border: none;
      color: white;
    }

    .btn-primary:hover, .btn-success:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(99,102,241,0.3);
    }

    .btn-secondary:disabled, .btn-primary:disabled, .btn-success:disabled {
      opacity: 0.5;
      cursor: not-allowed;
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
      .tipo-grid {
        grid-template-columns: 1fr;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .table-header, .item-row {
        grid-template-columns: 1fr;
        gap: 0.25rem;
      }
    }
  `]
})
export class EmitirDocumentoComponent {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private facturacionService = inject(FacturacionService);

    pasos = [
        { num: 1, label: 'Tipo' },
        { num: 2, label: 'Receptor' },
        { num: 3, label: 'Items' },
        { num: 4, label: 'Confirmar' }
    ];

    paso = signal(1);
    tipoSeleccionado = signal<TipoDocumento | null>(null);
    loading = signal(false);
    enviarSii = true;
    enviarEmail = false;

    receptorForm: FormGroup = this.fb.group({
        rut: [''],
        razonSocial: [''],
        giro: [''],
        email: ['', Validators.email],
        direccion: [''],
        comuna: [''],
        ciudad: ['']
    });

    items = signal<EmitirDteItem[]>([
        { nombreItem: '', cantidad: 1, precioUnitario: 0 }
    ]);

    subtotal = computed(() =>
        this.items().reduce((sum, item) => sum + (item.cantidad * item.precioUnitario), 0)
    );

    neto = computed(() => Math.round(this.subtotal() / 1.19));
    iva = computed(() => this.subtotal() - this.neto());
    total = computed(() => this.subtotal());

    seleccionarTipo(tipo: TipoDocumento) {
        this.tipoSeleccionado.set(tipo);
    }

    puedeAvanzar(): boolean {
        switch (this.paso()) {
            case 1: return this.tipoSeleccionado() !== null;
            case 2: return this.tipoSeleccionado() === 'BOLETA' ||
                (!!this.receptorForm.value.rut && !!this.receptorForm.value.razonSocial);
            case 3: return this.items().some(i => i.nombreItem && i.cantidad > 0 && i.precioUnitario > 0);
            default: return true;
        }
    }

    siguiente() {
        if (this.puedeAvanzar() && this.paso() < 4) {
            this.paso.update(p => p + 1);
        }
    }

    anterior() {
        if (this.paso() > 1) {
            this.paso.update(p => p - 1);
        }
    }

    addItem() {
        this.items.update(items => [...items, { nombreItem: '', cantidad: 1, precioUnitario: 0 }]);
    }

    removeItem(index: number) {
        if (this.items().length > 1) {
            this.items.update(items => items.filter((_, i) => i !== index));
        }
    }

    updateItem(index: number, field: keyof EmitirDteItem, event: Event) {
        const value = (event.target as HTMLInputElement).value;
        this.items.update(items => {
            const updated = [...items];
            if (field === 'cantidad' || field === 'precioUnitario') {
                (updated[index] as any)[field] = parseFloat(value) || 0;
            } else {
                (updated[index] as any)[field] = value;
            }
            return updated;
        });
    }

    formatRut() {
        const rut = this.receptorForm.value.rut;
        if (rut) {
            this.receptorForm.patchValue({ rut: this.facturacionService.formatRut(rut) });
        }
    }

    formatCurrency(value: number): string {
        return this.facturacionService.formatCurrency(value);
    }

    async emitir() {
        this.loading.set(true);

        const request: EmitirDteRequest = {
            receptorRut: this.receptorForm.value.rut || undefined,
            receptorRazonSocial: this.receptorForm.value.razonSocial || undefined,
            receptorGiro: this.receptorForm.value.giro || undefined,
            receptorDireccion: this.receptorForm.value.direccion || undefined,
            receptorComuna: this.receptorForm.value.comuna || undefined,
            receptorEmail: this.receptorForm.value.email || undefined,
            items: this.items().map(item => ({
                nombreItem: item.nombreItem,
                cantidad: item.cantidad,
                precioUnitario: item.precioUnitario
            })),
            enviarSii: this.enviarSii,
            enviarEmail: this.enviarEmail
        };

        const emitFn = this.tipoSeleccionado() === 'BOLETA'
            ? this.facturacionService.emitirBoleta(request)
            : this.tipoSeleccionado() === 'FACTURA'
                ? this.facturacionService.emitirFactura(request)
                : this.tipoSeleccionado() === 'NOTA_CREDITO'
                    ? this.facturacionService.emitirNotaCredito(request)
                    : this.facturacionService.emitirNotaDebito(request);

        emitFn.subscribe({
            next: (dte) => {
                this.loading.set(false);
                // Navegar a detalle del documento
                this.router.navigate(['/facturacion/documentos', dte.id]);
            },
            error: (err) => {
                this.loading.set(false);
                console.error('Error emitiendo documento', err);
                alert('Error al emitir documento: ' + (err.error?.message || err.message));
            }
        });
    }
}
