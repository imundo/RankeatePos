import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

interface AccountOption {
    id: string;
    code: string;
    name: string;
}

@Component({
    selector: 'app-crear-asiento',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
    template: `
    <div class="page-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-left">
          <a routerLink="/contabilidad/libro-diario" class="back-link">← Volver al Libro Diario</a>
          <h1>➕ Nuevo Asiento Contable</h1>
        </div>
      </header>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-container">
        <!-- Basic Info -->
        <section class="form-section">
          <h2 class="section-title">Información General</h2>
          <div class="form-grid">
            <div class="form-group">
              <label>Fecha del Asiento</label>
              <input type="date" formControlName="entryDate" class="form-control" />
            </div>
            <div class="form-group">
              <label>Tipo de Asiento</label>
              <select formControlName="type" class="form-control">
                <option value="STANDARD">Normal</option>
                <option value="ADJUSTMENT">Ajuste</option>
                <option value="OPENING">Apertura</option>
                <option value="CLOSING">Cierre</option>
              </select>
            </div>
            <div class="form-group full-width">
              <label>Descripción / Glosa</label>
              <input type="text" formControlName="description" class="form-control" 
                     placeholder="Descripción del asiento contable..." />
            </div>
            <div class="form-group">
              <label>Referencia (opcional)</label>
              <input type="text" formControlName="referenceNumber" class="form-control" 
                     placeholder="Ej: Factura 12345" />
            </div>
          </div>
        </section>

        <!-- Lines Section -->
        <section class="form-section">
          <div class="section-header">
            <h2 class="section-title">Líneas del Asiento</h2>
            <button type="button" class="btn btn-secondary" (click)="addLine()">
              ➕ Agregar Línea
            </button>
          </div>

          <div class="lines-table">
            <div class="lines-header">
              <span class="col-account">Cuenta</span>
              <span class="col-desc">Descripción</span>
              <span class="col-debit">Debe</span>
              <span class="col-credit">Haber</span>
              <span class="col-actions"></span>
            </div>

            <div formArrayName="lines" class="lines-body">
              @for (line of linesArray.controls; track $index) {
                <div [formGroupName]="$index" class="line-row">
                  <div class="col-account">
                    <select formControlName="accountId" class="form-control">
                      <option value="">Seleccionar cuenta...</option>
                      @for (account of accounts(); track account.id) {
                        <option [value]="account.id">{{ account.code }} - {{ account.name }}</option>
                      }
                    </select>
                  </div>
                  <div class="col-desc">
                    <input type="text" formControlName="description" class="form-control" 
                           placeholder="Glosa de línea..." />
                  </div>
                  <div class="col-debit">
                    <input type="number" formControlName="debit" class="form-control debit-input" 
                           placeholder="0" (blur)="onDebitChange($index)" />
                  </div>
                  <div class="col-credit">
                    <input type="number" formControlName="credit" class="form-control credit-input" 
                           placeholder="0" (blur)="onCreditChange($index)" />
                  </div>
                  <div class="col-actions">
                    <button type="button" class="remove-btn" (click)="removeLine($index)" 
                            [disabled]="linesArray.length <= 2">
                      🗑️
                    </button>
                  </div>
                </div>
              }
            </div>

            <!-- Totals Row -->
            <div class="totals-row">
              <span class="totals-label">TOTALES</span>
              <span class="total-debit" [class.highlight]="totalDebit() > 0">
                {{ totalDebit() | currency:'CLP':'symbol-narrow':'1.0-0' }}
              </span>
              <span class="total-credit" [class.highlight]="totalCredit() > 0">
                {{ totalCredit() | currency:'CLP':'symbol-narrow':'1.0-0' }}
              </span>
            </div>

            <!-- Balance Status -->
            <div class="balance-status" [class.balanced]="isBalanced()" [class.unbalanced]="!isBalanced()">
              @if (isBalanced()) {
                <span class="status-icon">✅</span>
                <span>El asiento está cuadrado</span>
              } @else {
                <span class="status-icon">⚠️</span>
                <span>Diferencia: {{ difference() | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
              }
            </div>
          </div>
        </section>

        <!-- Actions -->
        <div class="form-actions">
          <button type="button" class="btn btn-outline" routerLink="/contabilidad/libro-diario">
            Cancelar
          </button>
          <button type="submit" class="btn btn-secondary" [disabled]="!form.valid || !isBalanced()">
            💾 Guardar como Borrador
          </button>
          <button type="button" class="btn btn-primary" 
                  [disabled]="!form.valid || !isBalanced()" 
                  (click)="saveAndPost()">
            ✅ Guardar y Contabilizar
          </button>
        </div>
      </form>
    </div>
  `,
    styles: [`
    .page-container {
      padding: 24px;
      min-height: 100vh;
      background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%);
    }

    .page-header {
      margin-bottom: 32px;
    }

    .header-left {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .back-link {
      color: rgba(255,255,255,0.6);
      text-decoration: none;
      font-size: 0.9rem;
    }

    h1 {
      color: #fff;
      font-size: 1.75rem;
      margin: 0;
    }

    .form-container {
      max-width: 1200px;
    }

    .form-section {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .section-title {
      color: #fff;
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0 0 20px;
    }

    .section-header .section-title {
      margin: 0;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-group.full-width {
      grid-column: 1 / -1;
    }

    .form-group label {
      color: rgba(255,255,255,0.7);
      font-size: 0.9rem;
      font-weight: 500;
    }

    .form-control {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 10px;
      padding: 12px 16px;
      color: #fff;
      font-size: 0.95rem;
      transition: all 0.2s;
    }

    .form-control:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
    }

    .form-control option {
      background: #1a1a3e;
      color: #fff;
    }

    /* Lines Table */
    .lines-table {
      background: rgba(0,0,0,0.2);
      border-radius: 12px;
      overflow: hidden;
    }

    .lines-header {
      display: grid;
      grid-template-columns: 2fr 1.5fr 150px 150px 60px;
      gap: 12px;
      padding: 14px 20px;
      background: rgba(255,255,255,0.05);
      color: rgba(255,255,255,0.6);
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .lines-body {
      max-height: 300px;
      overflow-y: auto;
    }

    .line-row {
      display: grid;
      grid-template-columns: 2fr 1.5fr 150px 150px 60px;
      gap: 12px;
      padding: 12px 20px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      align-items: center;
    }

    .line-row .form-control {
      padding: 10px 12px;
    }

    .debit-input { border-color: rgba(74, 222, 128, 0.3); }
    .credit-input { border-color: rgba(248, 113, 113, 0.3); }

    .remove-btn {
      background: rgba(239, 68, 68, 0.1);
      border: none;
      padding: 8px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .remove-btn:hover:not(:disabled) {
      background: rgba(239, 68, 68, 0.2);
    }

    .remove-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .totals-row {
      display: grid;
      grid-template-columns: 2fr 1.5fr 150px 150px 60px;
      gap: 12px;
      padding: 16px 20px;
      background: rgba(102, 126, 234, 0.1);
      font-weight: 700;
    }

    .totals-label {
      color: rgba(255,255,255,0.8);
      grid-column: span 2;
      text-align: right;
      padding-right: 20px;
    }

    .total-debit {
      color: #4ade80;
      text-align: center;
    }

    .total-credit {
      color: #f87171;
      text-align: center;
    }

    .total-debit.highlight, .total-credit.highlight {
      font-size: 1.1rem;
    }

    .balance-status {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 16px;
      font-weight: 600;
    }

    .balance-status.balanced {
      background: rgba(74, 222, 128, 0.1);
      color: #4ade80;
    }

    .balance-status.unbalanced {
      background: rgba(251, 191, 36, 0.1);
      color: #fbbf24;
    }

    .status-icon {
      font-size: 1.2rem;
    }

    /* Actions */
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      padding-top: 16px;
    }

    .btn {
      padding: 14px 28px;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.3s ease;
      font-size: 0.95rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-secondary {
      background: rgba(255,255,255,0.1);
      color: #fff;
    }

    .btn-outline {
      background: transparent;
      border: 1px solid rgba(255,255,255,0.2);
      color: rgba(255,255,255,0.7);
    }

    .btn:hover:not(:disabled) {
      transform: translateY(-2px);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
  `]
})
export class CrearAsientoComponent implements OnInit {
    form!: FormGroup;

    accounts = signal<AccountOption[]>([
        { id: '1', code: '1.1.1', name: 'Caja' },
        { id: '2', code: '1.1.2', name: 'Bancos' },
        { id: '3', code: '1.1.3', name: 'Clientes' },
        { id: '4', code: '1.1.4', name: 'Inventario' },
        { id: '5', code: '1.1.5', name: 'IVA Crédito Fiscal' },
        { id: '6', code: '2.1.1', name: 'Proveedores' },
        { id: '7', code: '2.1.2', name: 'IVA Débito Fiscal' },
        { id: '8', code: '4.1', name: 'Ingresos por Ventas' },
        { id: '9', code: '5.1', name: 'Costo de Ventas' },
        { id: '10', code: '6.1', name: 'Gastos de Administración' }
    ]);

    totalDebit = signal(0);
    totalCredit = signal(0);
    difference = signal(0);

    constructor(private fb: FormBuilder, private router: Router) { }

    ngOnInit(): void {
        this.initForm();
    }

    initForm(): void {
        this.form = this.fb.group({
            entryDate: [new Date().toISOString().split('T')[0], Validators.required],
            type: ['STANDARD', Validators.required],
            description: ['', [Validators.required, Validators.maxLength(500)]],
            referenceNumber: [''],
            lines: this.fb.array([])
        });

        // Add initial two lines
        this.addLine();
        this.addLine();
    }

    get linesArray(): FormArray {
        return this.form.get('lines') as FormArray;
    }

    addLine(): void {
        const line = this.fb.group({
            accountId: ['', Validators.required],
            description: [''],
            debit: [0, [Validators.required, Validators.min(0)]],
            credit: [0, [Validators.required, Validators.min(0)]]
        });
        this.linesArray.push(line);
    }

    removeLine(index: number): void {
        if (this.linesArray.length > 2) {
            this.linesArray.removeAt(index);
            this.calculateTotals();
        }
    }

    onDebitChange(index: number): void {
        const line = this.linesArray.at(index);
        if (line.get('debit')?.value > 0) {
            line.get('credit')?.setValue(0);
        }
        this.calculateTotals();
    }

    onCreditChange(index: number): void {
        const line = this.linesArray.at(index);
        if (line.get('credit')?.value > 0) {
            line.get('debit')?.setValue(0);
        }
        this.calculateTotals();
    }

    calculateTotals(): void {
        let debit = 0;
        let credit = 0;

        for (const line of this.linesArray.controls) {
            debit += Number(line.get('debit')?.value || 0);
            credit += Number(line.get('credit')?.value || 0);
        }

        this.totalDebit.set(debit);
        this.totalCredit.set(credit);
        this.difference.set(Math.abs(debit - credit));
    }

    isBalanced(): boolean {
        return this.totalDebit() > 0 && this.totalDebit() === this.totalCredit();
    }

    onSubmit(): void {
        if (this.form.valid && this.isBalanced()) {
            console.log('Save as draft:', this.form.value);
            this.router.navigate(['/contabilidad/libro-diario']);
        }
    }

    saveAndPost(): void {
        if (this.form.valid && this.isBalanced()) {
            console.log('Save and post:', this.form.value);
            this.router.navigate(['/contabilidad/libro-diario']);
        }
    }
}
