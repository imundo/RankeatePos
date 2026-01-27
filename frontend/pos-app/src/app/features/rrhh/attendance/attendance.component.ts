import { Component, signal, inject } from '@angular/core';
import { DemoDataService } from '@app/core/services/demo-data.service';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, ButtonModule, ToastModule],
  providers: [MessageService],
  template: `
    <div class="attendance-container">
      <div class="clock-card glass-panel">
        <div class="time-display">
          <span class="time">{{ currentTime() | date:'HH:mm' }}</span>
          <span class="date">{{ currentTime() | date:'EEEE, d MMMM' }}</span>
        </div>

        <div class="pin-pad-section">
          <h3>🔐 Ingresa tu PIN de Asistencia</h3>
          
          <div class="pin-display">
            @for (dot of [1,2,3,4]; track dot) {
              <div class="pin-dot" [class.filled]="pin().length >= dot"></div>
            }
          </div>

          <div class="numpad">
            @for (num of [1,2,3,4,5,6,7,8,9]; track num) {
              <button class="num-btn" (click)="addPin(num)" [disabled]="loading()">{{ num }}</button>
            }
            <button class="num-btn action" (click)="clearPin()" [disabled]="loading()">C</button>
            <button class="num-btn" (click)="addPin(0)" [disabled]="loading()">0</button>
            <button class="num-btn action action-ok" (click)="submitPin()" [disabled]="loading()">
              @if (loading()) {
                <i class="pi pi-spin pi-spinner"></i>
              } @else {
                <i class="pi pi-check"></i>
              }
            </button>
          </div>
        </div>

        <div class="status-message" *ngIf="lastAction()" [class.error]="isError()">
          {{ lastAction() }}
        </div>
      </div>
      <p-toast></p-toast>
    </div>
  `,
  styles: [`
    .attendance-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: radial-gradient(circle at top right, rgba(99, 102, 241, 0.2), transparent 40%),
                  radial-gradient(circle at bottom left, rgba(236, 72, 153, 0.2), transparent 40%),
                  #0f172a;
    }

    .glass-panel {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 3rem;
      width: 400px;
      text-align: center;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
    }

    .time-display {
      margin-bottom: 2rem;
      
      .time {
        display: block;
        font-size: 3.5rem;
        font-weight: 700;
        color: white;
        text-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
      }
      
      .date {
        color: #94A3B8;
        font-size: 1.1rem;
        text-transform: capitalize;
      }
    }

    .pin-display {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin: 1.5rem 0;
      
      .pin-dot {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 2px solid #6366F1;
        transition: all 0.2s;
        
        &.filled {
          background: #6366F1;
          box-shadow: 0 0 10px #6366F1;
        }
      }
    }

    .numpad {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-top: 2rem;
    }

    .num-btn {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.05);
      color: white;
      font-size: 1.5rem;
      cursor: pointer;
      transition: all 0.1s;
      margin: 0 auto;
      
      &:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: scale(1.05);
      }
      
      &:active {
        transform: scale(0.95);
      }
      
      &.action {
        color: #fca5a5;
        border-color: rgba(252, 165, 165, 0.3);
      }
      
      &.action-ok {
        color: #86efac;
        border-color: rgba(134, 239, 172, 0.3);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .status-message {
      margin-top: 1.5rem;
      padding: 0.5rem;
      border-radius: 8px;
      background: rgba(16, 185, 129, 0.1);
      color: #34d399;
      font-weight: 500;
      
      &.error {
        background: rgba(239, 68, 68, 0.1);
        color: #f87171;
      }
    }
  `]
})
export class AttendanceComponent {
  private http = inject(HttpClient);
  private demoDataService = inject(DemoDataService);

  currentTime = signal(new Date());
  pin = signal('');
  lastAction = signal<string | null>(null);
  loading = signal(false);
  isError = signal(false);

  constructor(private messageService: MessageService) {
    setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);
  }

  addPin(num: number) {
    if (this.pin().length < 4) {
      this.pin.update(p => p + num);
    }
  }

  clearPin() {
    this.pin.set('');
  }

  submitPin() {
    if (this.pin().length === 4) {
      this.loading.set(true);
      const pin = this.pin();

      this.http.post<any>(`${environment.apiUrl}/operations/attendance/clock-in`, { pin })
        .subscribe({
          next: (res) => this.handleSuccess(res),
          error: (err) => {
            // Fallback to Demo Data
            const demoEmp = this.demoDataService.getTenantDemoData('demo').rrhh.employees.find(e => e.pinCode === pin);
            if (demoEmp) {
              // Simulate network delay
              setTimeout(() => {
                this.handleSuccess({ status: 'PRESENT', employee: demoEmp });
              }, 500);
            } else {
              const errorMsg = '❌ ' + (err.error?.message || 'Error de conexión y PIN no encontrado en demo');
              this.handleError(errorMsg);
            }
          }
        });
    }
  }

  private handleSuccess(res: any) {
    const status = res.status === 'PRESENT' || res.status === 'CHECK_IN' ? 'Entrada' : 'Salida';
    const msg = `✅ ${status} registrada para ${res.employee.firstName}`;

    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: msg });
    this.lastAction.set(msg);
    this.isError.set(false);
    this.pin.set('');
    this.loading.set(false);
    setTimeout(() => this.lastAction.set(null), 3000);
  }

  private handleError(msg: string) {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
    this.lastAction.set(msg);
    this.isError.set(true);
    this.pin.set('');
    this.loading.set(false);
  }
}
