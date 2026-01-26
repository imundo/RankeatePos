import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-purchase-requests',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        ButtonModule,
        TagModule,
        DialogModule,
        InputTextModule,
        InputNumberModule,
        FormsModule
    ],
    template: `
    <div class="requests-container fade-in">
      <div class="page-header">
        <div class="header-content">
          <h1>📋 Solicitudes de Compra</h1>
          <p class="subtitle">Requerimientos internos de stock</p>
        </div>
        <button pButton label="Nueva Solicitud" icon="pi pi-plus" class="p-button-rounded p-button-info" (click)="showNewRequest = true"></button>
      </div>

      <!-- Requests List -->
      <div class="glass-panel">
        <p-table [value]="requests()" styleClass="p-datatable-lg">
          <ng-template pTemplate="header">
            <tr>
              <th>ID</th>
              <th>Solicitante</th>
              <th>Productos</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-req>
            <tr>
              <td class="font-bold text-blue-400">#{{ req.id }}</td>
              <td>{{ req.requester }}</td>
              <td>{{ req.items }}</td>
              <td>{{ req.date | date:'dd/MM/yyyy' }}</td>
              <td>
                <p-tag [value]="req.status" [severity]="getStatusSeverity(req.status)"></p-tag>
              </td>
              <td>
                <button pButton icon="pi pi-eye" class="p-button-text p-button-rounded"></button>
                <button *ngIf="req.status === 'PENDIENTE'" pButton icon="pi pi-check" class="p-button-text p-button-rounded p-button-success" title="Aprobar a Orden de Compra"></button>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- New Request Modal -->
      <p-dialog [(visible)]="showNewRequest" header="Nueva Solicitud Stock" [modal]="true" [style]="{width: '500px'}" styleClass="glass-dialog">
        <div class="form-grid">
          <div class="field">
            <label>Producto</label>
            <span class="p-input-icon-left w-full">
              <i class="pi pi-search"></i>
              <input pInputText placeholder="Buscar producto..." class="w-full" />
            </span>
          </div>
          <div class="field">
            <label>Cantidad</label>
            <p-inputNumber inputId="qty" [showButtons]="true" buttonLayout="horizontal" inputStyleClass="text-center" [min]="1"></p-inputNumber>
          </div>
          <div class="field">
            <label>Notas</label>
            <textarea pInputTextarea rows="3" class="w-full input-dark" placeholder="Motivo de la solicitud..."></textarea>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="Guardar" class="p-button-primary" (click)="showNewRequest = false"></button>
        </ng-template>
      </p-dialog>
    </div>
  `,
    styles: [`
    .requests-container {
      padding: 2rem;
      min-height: 100vh;
      background: var(--surface-card);
    }
    
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .header-content h1 {
      margin: 0;
      font-size: 1.8rem;
      background: linear-gradient(90deg, #60A5FA, #2563EB);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle { color: var(--text-secondary-color); margin-top: 0.5rem; }

    .glass-panel {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 1rem;
      overflow: hidden;
    }
    
    :host ::ng-deep .glass-dialog .p-dialog-content, 
    :host ::ng-deep .glass-dialog .p-dialog-header {
      background: #1e293b;
      color: white;
    }
  `]
})
export class PurchaseRequestComponent {
    showNewRequest = false;
    requests = signal([
        { id: '1001', requester: 'Juan Pérez', items: 'Harina (10u), Levadura (50u)', date: new Date(), status: 'PENDIENTE' },
        { id: '1000', requester: 'Maria Soto', items: 'Bebidas 3L (20u)', date: new Date(Date.now() - 86400000), status: 'APROBADO' },
    ]);

    getStatusSeverity(status: string) {
        switch (status) {
            case 'PENDIENTE': return 'warning';
            case 'APROBADO': return 'success';
            case 'RECHAZADO': return 'danger';
            default: return 'info';
        }
    }
}
