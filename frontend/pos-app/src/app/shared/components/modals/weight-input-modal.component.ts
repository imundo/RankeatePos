import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-weight-input-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="modal-overlay" *ngIf="visible">
      <div class="modal-content">
        <div class="modal-header">
          <h2>⚖️ Ingresar Peso</h2>
          <button class="close-btn" (click)="cancel()">×</button>
        </div>
        
        <div class="modal-body">
          <div class="product-info" *ngIf="productName">
            <span class="label">Producto:</span>
            <span class="value">{{ productName }}</span>
          </div>

          <div class="input-group">
            <label>Peso (kg)</label>
            <input 
              type="number" 
              [(ngModel)]="weight" 
              (keyup.enter)="confirm()"
              placeholder="0.000"
              step="0.001"
              autofocus
              #weightInput>
          </div>

          <div class="keypad">
            <button *ngFor="let num of [1,2,3,4,5,6,7,8,9,0,'.']" (click)="appendNumber(num)">
              {{ num }}
            </button>
            <button class="backspace" (click)="backspace()">⌫</button>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" (click)="cancel()">Cancelar</button>
          <button class="btn-confirm" (click)="confirm()" [disabled]="!weight || weight <= 0">
            Confirmar Peso
          </button>
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
      align-items: center;
      z-index: 1000;
    }

    .modal-content {
      background: #1e293b;
      color: white;
      border-radius: 16px;
      width: 90%;
      max-width: 400px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.1);
      overflow: hidden;
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
    }

    .product-info {
      margin-bottom: 1.5rem;
      padding: 0.75rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .product-info .label {
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.875rem;
    }

    .product-info .value {
      font-weight: 600;
      color: #6366f1;
    }

    .input-group label {
      display: block;
      margin-bottom: 0.5rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .input-group input {
      width: 100%;
      padding: 1rem;
      background: rgba(0, 0, 0, 0.3);
      border: 2px solid rgba(99, 102, 241, 0.5);
      border-radius: 12px;
      font-size: 2rem;
      color: white;
      text-align: center;
      outline: none;
    }

    .input-group input:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2);
    }

    .keypad {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
      margin-top: 1.5rem;
    }

    .keypad button {
      padding: 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      color: white;
      font-size: 1.25rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .keypad button:active {
      transform: scale(0.95);
      background: rgba(255, 255, 255, 0.1);
    }

    .keypad .backspace {
      background: rgba(239, 68, 68, 0.2);
      border-color: rgba(239, 68, 68, 0.3);
      color: #fca5a5;
    }

    .modal-footer {
      padding: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      gap: 1rem;
    }

    .btn-cancel {
      flex: 1;
      padding: 1rem;
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      color: white;
      cursor: pointer;
    }

    .btn-confirm {
      flex: 2;
      padding: 1rem;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border: none;
      border-radius: 12px;
      color: white;
      font-weight: 600;
      cursor: pointer;
      font-size: 1.1rem;
    }

    .btn-confirm:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class WeightInputModalComponent {
    @Input() visible = false;
    @Input() productName: string = '';
    @Output() onConfirm = new EventEmitter<number>();
    @Output() onCancel = new EventEmitter<void>();

    weight: number | null = null;
    weightString = '';

    appendNumber(num: number | string) {
        if (num === '.' && this.weightString.includes('.')) return;
        this.weightString += num;
        this.weight = parseFloat(this.weightString);
    }

    backspace() {
        this.weightString = this.weightString.slice(0, -1);
        this.weight = this.weightString ? parseFloat(this.weightString) : null;
    }

    confirm() {
        if (this.weight && this.weight > 0) {
            this.onConfirm.emit(this.weight);
            this.reset();
        }
    }

    cancel() {
        this.onCancel.emit();
        this.reset();
    }

    reset() {
        this.weight = null;
        this.weightString = '';
        this.visible = false;
    }
}
