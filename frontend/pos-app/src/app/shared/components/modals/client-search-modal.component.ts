import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Client {
    id?: string;
    rut: string;
    razonSocial: string;
    email?: string;
    direccion?: string;
    comuna?: string;
    giro?: string;
}

@Component({
    selector: 'app-client-search-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="modal-overlay" *ngIf="visible">
      <div class="modal-content">
        <div class="modal-header">
          <h2>👥 Buscar Cliente</h2>
          <button class="close-btn" (click)="cancel()">×</button>
        </div>
        
        <div class="modal-body">
          <div class="search-bar">
            <input 
              type="text" 
              [(ngModel)]="searchTerm" 
              (keyup.enter)="search()"
              placeholder="Buscar por RUT o Nombre..."
              autofocus>
            <button class="btn-search" (click)="search()">🔍</button>
          </div>

          <div class="results-list">
            <div 
              class="result-item" 
              *ngFor="let client of results" 
              (click)="select(client)">
              <div class="client-info">
                <span class="client-name">{{ client.razonSocial }}</span>
                <span class="client-rut">{{ client.rut }}</span>
              </div>
              <button class="btn-select">Seleccionar</button>
            </div>
            
            <div class="no-results" *ngIf="searched && results.length === 0">
              <p>No se encontraron clientes.</p>
              <button class="btn-create" (click)="createQuickClient()">
                ➕ Crear Nuevo Cliente
              </button>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" (click)="cancel()">Cancelar</button>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding-top: 4rem;
      z-index: 1000;
    }

    .modal-content {
      background: #1e293b;
      color: white;
      border-radius: 16px;
      width: 90%;
      max-width: 500px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      flex-direction: column;
      max-height: 80vh;
    }

    .modal-header {
      padding: 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.25rem;
      color: white;
    }

    .close-btn {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.5);
      font-size: 1.5rem;
      cursor: pointer;
    }

    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
    }

    .search-bar {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .search-bar input {
      flex: 1;
      padding: 0.75rem 1rem;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      color: white;
      font-size: 1rem;
    }

    .search-bar input:focus {
      border-color: #6366f1;
      outline: none;
    }

    .btn-search {
      padding: 0.75rem 1.25rem;
      background: #3b82f6;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-size: 1.2rem;
    }

    .results-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .result-item {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      padding: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .result-item:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: #6366f1;
    }

    .client-info {
      display: flex;
      flex-direction: column;
    }

    .client-name {
      font-weight: 600;
      color: white;
    }

    .client-rut {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .btn-select {
      padding: 0.5rem 1rem;
      background: rgba(99, 102, 241, 0.2);
      color: #818cf8;
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 8px;
      font-size: 0.875rem;
    }

    .no-results {
      text-align: center;
      padding: 2rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .btn-create {
      margin-top: 1rem;
      padding: 0.75rem 1.5rem;
      background: #10b981;
      color: white;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 500;
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: flex-end;
    }

    .btn-cancel {
      padding: 0.75rem 1.5rem;
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      color: white;
      cursor: pointer;
    }
  `]
})
export class ClientSearchModalComponent {
    @Input() visible = false;
    @Output() onSelect = new EventEmitter<Client>();
    @Output() onCancel = new EventEmitter<void>();

    searchTerm = '';
    results: Client[] = [];
    searched = false;

    // Mock Data
    private mockClients: Client[] = [
        { rut: '11.111.111-1', razonSocial: 'Cliente Genérico', email: 'cliente@ejemplo.com', giro: 'Particular' },
        { rut: '76.123.456-7', razonSocial: 'Empresa Demo SpA', email: 'contacto@demo.cl', giro: 'Venta de Insumos', direccion: 'Av. Providencia 1234', comuna: 'Providencia' },
        { rut: '12.345.678-9', razonSocial: 'Juan Pérez', email: 'juan.perez@email.com', giro: 'Particular', direccion: 'Calle Falsa 123', comuna: 'Santiago' }
    ];

    search() {
        this.searched = true;
        if (!this.searchTerm.trim()) {
            this.results = [];
            return;
        }

        const term = this.searchTerm.toLowerCase();
        this.results = this.mockClients.filter(c =>
            c.rut.toLowerCase().includes(term) ||
            c.razonSocial.toLowerCase().includes(term)
        );
    }

    select(client: Client) {
        this.onSelect.emit(client);
        this.close();
    }

    createQuickClient() {
        // Simular creación rápida
        const newClient: Client = {
            rut: this.termIsRut(this.searchTerm) ? this.searchTerm.toUpperCase() : '',
            razonSocial: !this.termIsRut(this.searchTerm) ? this.searchTerm : 'Nuevo Cliente',
            giro: 'Particular'
        };
        this.select(newClient);
    }

    cancel() {
        this.onCancel.emit();
        this.close();
    }

    close() {
        this.visible = false;
        this.searchTerm = '';
        this.results = [];
        this.searched = false;
    }

    private termIsRut(term: string): boolean {
        return /^[0-9]+-[0-9kK]$/.test(term) || /^[0-9.]+-[0-9kK]$/.test(term);
    }
}
