import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmService, CustomerProfile, CreditTransaction } from '../../core/services/crm.service';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { BadgeModule } from 'primeng/badge';
import { InputNumberModule } from 'primeng/inputnumber';

@Component({
    selector: 'app-receivables',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        DialogModule,
        ToastModule,
        BadgeModule,
        InputNumberModule
    ],
    providers: [MessageService],
    template: `
    <div class="receivables-container">
      <header class="header">
        <div class="title-section">
          <h1>📒 Cuentas por Cobrar</h1>
          <p class="subtitle">Gestión de créditos (Fiado) y abonos de clientes</p>
        </div>
        <div class="actions">
          <button class="btn btn-primary" (click)="loadDebtors()">
            <i class="pi pi-refresh"></i> Actualizar
          </button>
        </div>
      </header>

      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon warning">⚠️</div>
          <div class="stat-content">
            <span class="stat-value">{{ formatPrice(totalDebt()) }}</span>
            <span class="stat-label">Deuda Total Pendiente</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon info">👥</div>
          <div class="stat-content">
            <span class="stat-value">{{ debtors().length }}</span>
            <span class="stat-label">Clientes con Deuda</span>
          </div>
        </div>
      </div>

      <!-- Main Table -->
      <div class="card">
        <p-table 
          [value]="debtors()" 
          [paginator]="true" 
          [rows]="10" 
          [loading]="loading()"
          [globalFilterFields]="['nombre', 'email', 'telefono']"
          #dt>
          
          <ng-template pTemplate="caption">
            <div class="table-header">
              <span class="p-input-icon-left search-input">
                <i class="pi pi-search"></i>
                <input pInputText type="text" (input)="dt.filterGlobal($any($event.target).value, 'contains')" placeholder="Buscar cliente..." />
              </span>
            </div>
          </ng-template>

          <ng-template pTemplate="header">
            <tr>
              <th>Cliente</th>
              <th>Contacto</th>
              <th>Límite de Crédito</th>
              <th>Deuda Actual</th>
              <th>Crédito Disponible</th>
              <th style="width: 15rem">Acciones</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-customer>
            <tr>
              <td>
                <div class="customer-info">
                  <div class="avatar">{{ customer.nombre.charAt(0).toUpperCase() }}</div>
                  <div class="details">
                    <span class="name">{{ customer.nombre }}</span>
                    <span class="badge" [class]="customer.segmento?.toLowerCase() || 'regular'">{{ customer.segmento || 'REGULAR' }}</span>
                  </div>
                </div>
              </td>
              <td>
                <div class="contact-info">
                  <div class="email" *ngIf="customer.email"><i class="pi pi-envelope"></i> {{ customer.email }}</div>
                  <div class="phone" *ngIf="customer.telefono"><i class="pi pi-phone"></i> {{ customer.telefono }}</div>
                </div>
              </td>
              <td>{{ formatPrice(customer.creditLimit) }}</td>
              <td>
                <span class="debt-amount">{{ formatPrice(customer.currentDebt) }}</span>
              </td>
              <td>{{ formatPrice(customer.availableCredit) }}</td>
              <td>
                <div class="flex-actions">
                  <button pButton pRipple icon="pi pi-money-bill" class="p-button-success p-button-sm" label="Abonar" (click)="openPaymentModal(customer)"></button>
                  <button pButton pRipple icon="pi pi-history" class="p-button-info p-button-sm p-button-outlined" (click)="viewHistory(customer)"></button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="6" class="text-center p-4">No hay clientes con deuda pendiente.</td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Payment Modal -->
      <p-dialog [(visible)]="showPaymentModal" [header]="'Registrar Abono - ' + (selectedCustomer()?.nombre || '')" [modal]="true" [style]="{width: '450px'}">
        <div class="payment-form">
          <div class="info-box info">
            <strong>Deuda Actual:</strong> {{ formatPrice(selectedCustomer()?.currentDebt || 0) }}
          </div>
          
          <div class="field">
            <label for="amount">Monto a Abonar</label>
            <p-inputNumber id="amount" [(ngModel)]="paymentAmount" mode="currency" currency="CLP" locale="es-CL" class="w-full"></p-inputNumber>
          </div>

          <div class="field">
            <label for="method">Método de Pago</label>
            <div class="payment-methods">
              <button class="method-btn" [class.active]="paymentMethod === 'EFECTIVO'" (click)="paymentMethod = 'EFECTIVO'">💵 Efectivo</button>
              <button class="method-btn" [class.active]="paymentMethod === 'TRANSFERENCIA'" (click)="paymentMethod = 'TRANSFERENCIA'">🏦 Transf.</button>
              <button class="method-btn" [class.active]="paymentMethod === 'TARJETA'" (click)="paymentMethod = 'TARJETA'">💳 Tarjeta</button>
            </div>
          </div>

          <div class="field">
            <label for="notes">Notas (Opcional)</label>
            <input pInputText id="notes" [(ngModel)]="paymentNotes" class="w-full" />
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button pButton pRipple label="Cancelar" icon="pi pi-times" class="p-button-text" (click)="showPaymentModal = false"></button>
          <button pButton pRipple label="Registrar Abono" icon="pi pi-check" class="p-button-success" (click)="submitPayment()" [loading]="submittingPayment()" [disabled]="!paymentAmount || paymentAmount <= 0 || paymentAmount > (selectedCustomer()?.currentDebt || 0)"></button>
        </ng-template>
      </p-dialog>

      <!-- History Modal -->
      <p-dialog [(visible)]="showHistoryModal" [header]="'Historial de Crédito - ' + (selectedCustomer()?.nombre || '')" [modal]="true" [style]="{width: '600px'}">
        <div class="history-list">
          <div *ngIf="loadingHistory()" class="loading">Cargando historial...</div>
          <div *ngIf="!loadingHistory() && history().length === 0" class="empty">No hay movimientos registrados.</div>
          
          <div class="timeline" *ngIf="!loadingHistory() && history().length > 0">
            <div class="timeline-item" *ngFor="let tx of history()">
              <div class="tx-icon" [ngClass]="getTxClass(tx.type)">
                <i [class]="getTxIcon(tx.type)"></i>
              </div>
              <div class="tx-content">
                <div class="tx-header">
                  <span class="tx-type">{{ getTxLabel(tx.type) }}</span>
                  <span class="tx-date">{{ tx.createdAt | date:'short' }}</span>
                </div>
                <div class="tx-amount" [ngClass]="getTxClass(tx.type)">
                  {{ tx.type === 'PAYMENT' ? '+' : '-' }}{{ formatPrice(tx.amount) }}
                </div>
                <div class="tx-notes" *ngIf="tx.notes">{{ tx.notes }}</div>
              </div>
            </div>
          </div>
        </div>
      </p-dialog>
      
      <p-toast></p-toast>
    </div>
  `,
    styles: [`
    .receivables-container {
      padding: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;

      .title-section {
        h1 {
          font-size: 1.75rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
          color: var(--text-color);
        }
        .subtitle {
          color: var(--text-color-secondary);
          margin: 0;
        }
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;

      .stat-card {
        background: var(--surface-card);
        border: 1px solid var(--surface-border);
        border-radius: 12px;
        padding: 1.5rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        box-shadow: 0 4px 6px rgba(0,0,0,0.05);

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          
          &.warning { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
          &.info { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        }

        .stat-content {
          display: flex;
          flex-direction: column;

          .stat-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--text-color);
          }
          .stat-label {
            font-size: 0.875rem;
            color: var(--text-color-secondary);
          }
        }
      }
    }

    .card {
      background: var(--surface-card);
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      border: 1px solid var(--surface-border);
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      
      .search-input {
        width: 100%;
        max-width: 300px;
        
        input {
          width: 100%;
        }
      }
    }

    .customer-info {
      display: flex;
      align-items: center;
      gap: 1rem;

      .avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--primary-color);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 1.2rem;
      }
      .details {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;

        .name { font-weight: 600; }
        .badge {
          font-size: 0.7rem;
          padding: 0.15rem 0.5rem;
          border-radius: 4px;
          display: inline-block;
          font-weight: bold;
          &.vip { background: #fee2e2; color: #dc2626; }
          &.frequent { background: #dbeafe; color: #2563eb; }
          &.new { background: #dcfce7; color: #16a34a; }
          &.regular { background: #f3f4f6; color: #4b5563; }
        }
      }
    }

    .contact-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.85rem;
      color: var(--text-color-secondary);
      
      i { font-size: 0.8rem; margin-right: 0.25rem; }
    }

    .debt-amount {
      font-weight: 700;
      color: var(--red-500, #ef4444);
      font-size: 1.1rem;
    }

    .flex-actions {
      display: flex;
      gap: 0.5rem;
    }

    /* Modal Form */
    .payment-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;

      .field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        
        label { font-weight: 600; }
      }

      .info-box {
        padding: 1rem;
        border-radius: 8px;
        background: rgba(59, 130, 246, 0.1);
        color: #1d4ed8;
        border: 1px solid rgba(59, 130, 246, 0.2);
        font-size: 1.1rem;
      }

      .payment-methods {
        display: flex;
        gap: 0.5rem;

        .method-btn {
          flex: 1;
          padding: 0.75rem;
          border: 1px solid var(--surface-border);
          border-radius: 8px;
          background: var(--surface-card);
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;

          &:hover { border-color: var(--primary-color); }
          &.active {
            background: var(--primary-color);
            color: white;
            border-color: var(--primary-color);
          }
        }
      }
    }

    /* History Timeline */
    .history-list {
      max-height: 400px;
      overflow-y: auto;
      padding-right: 1rem;
    }

    .timeline {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      position: relative;

      &::before {
        content: '';
        position: absolute;
        left: 19px;
        top: 0;
        bottom: 0;
        width: 2px;
        background: var(--surface-border);
      }

      .timeline-item {
        display: flex;
        gap: 1rem;
        position: relative;
        z-index: 1;

        .tx-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--surface-card);
          border: 2px solid var(--surface-border);
          
          &.payment { border-color: #22c55e; color: #22c55e; }
          &.sale { border-color: #ef4444; color: #ef4444; }
          &.adj { border-color: #f59e0b; color: #f59e0b; }
        }

        .tx-content {
          flex: 1;
          background: var(--surface-ground);
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid var(--surface-border);

          .tx-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5rem;

            .tx-type { font-weight: 600; }
            .tx-date { font-size: 0.85rem; color: var(--text-color-secondary); }
          }

          .tx-amount {
            font-size: 1.2rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            
            &.payment { color: #22c55e; }
            &.sale { color: #ef4444; }
          }
          
          .tx-notes { font-size: 0.9rem; color: var(--text-color-secondary); font-style: italic; }
        }
      }
    }
  `]
})
export class ReceivablesComponent implements OnInit {
    private crmService = inject(CrmService);
    private messageService = inject(MessageService);

    debtors = signal<CustomerProfile[]>([]);
    loading = signal(false);
    totalDebt = signal(0);

    // Payment Modal State
    showPaymentModal = false;
    selectedCustomer = signal<CustomerProfile | null>(null);
    paymentAmount = 0;
    paymentMethod = 'EFECTIVO';
    paymentNotes = '';
    submittingPayment = signal(false);

    // History State
    showHistoryModal = false;
    history = signal<CreditTransaction[]>([]);
    loadingHistory = signal(false);

    ngOnInit() {
        this.loadDebtors();
    }

    loadDebtors() {
        this.loading.set(true);
        this.crmService.getDebtors(0, 100).subscribe({
            next: (res) => {
                // Mock data fallback if empty for UI testing
                let data = res.content || [];
                this.debtors.set(data);
                this.totalDebt.set(data.reduce((sum, d) => sum + (d.currentDebt || 0), 0));
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error loading debtors:', err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las cuentas por cobrar' });
                this.loading.set(false);
            }
        });
    }

    openPaymentModal(customer: CustomerProfile) {
        this.selectedCustomer.set(customer);
        this.paymentAmount = customer.currentDebt; // Auto-fill with total debt
        this.paymentMethod = 'EFECTIVO';
        this.paymentNotes = '';
        this.showPaymentModal = true;
    }

    submitPayment() {
        const customer = this.selectedCustomer();
        if (!customer || !customer.id || this.paymentAmount <= 0) return;

        this.submittingPayment.set(true);
        this.crmService.payCredit(customer.id, this.paymentAmount, this.paymentMethod, this.paymentNotes).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Abono Registrado', detail: `Se han abonado ${this.formatPrice(this.paymentAmount)} a la cuenta.` });
                this.showPaymentModal = false;
                this.submittingPayment.set(false);
                this.loadDebtors(); // Refresh list
            },
            error: (err) => {
                console.error('Error paying credit:', err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar el abono' });
                this.submittingPayment.set(false);
            }
        });
    }

    viewHistory(customer: CustomerProfile) {
        if (!customer.id) return;
        this.selectedCustomer.set(customer);
        this.showHistoryModal = true;
        this.loadingHistory.set(true);

        this.crmService.getCreditHistory(customer.id).subscribe({
            next: (txs) => {
                this.history.set(txs);
                this.loadingHistory.set(false);
            },
            error: (err) => {
                console.error('Error loading history:', err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el historial' });
                this.loadingHistory.set(false);
            }
        });
    }

    formatPrice(amount: number): string {
        if (!amount && amount !== 0) return '$0';
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0
        }).format(amount);
    }

    getTxLabel(type: string): string {
        switch (type) {
            case 'SALE_ON_CREDIT': return 'Venta al Fiado';
            case 'PAYMENT': return 'Abono / Pago';
            case 'ADJUSTMENT': return 'Ajuste Manual';
            default: return type;
        }
    }

    getTxIcon(type: string): string {
        switch (type) {
            case 'SALE_ON_CREDIT': return 'pi pi-shopping-bag';
            case 'PAYMENT': return 'pi pi-check-circle';
            case 'ADJUSTMENT': return 'pi pi-compass';
            default: return 'pi pi-circle';
        }
    }

    getTxClass(type: string): string {
        switch (type) {
            case 'SALE_ON_CREDIT': return 'sale';
            case 'PAYMENT': return 'payment';
            case 'ADJUSTMENT': return 'adj';
            default: return '';
        }
    }
}
