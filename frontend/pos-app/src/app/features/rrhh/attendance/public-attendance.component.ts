import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AttendanceService, ClockResponse } from '@app/core/services/attendance.service';

@Component({
    selector: 'app-public-attendance',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        InputTextModule,
        ButtonModule,
        CardModule,
        ToastModule
    ],
    providers: [MessageService],
    template: `
    <div class="public-attendance-container">
      <!-- Invalid/Loading State -->
      <div class="invalid-state" *ngIf="!linkValid() && !loading()">
        <div class="error-card">
          <i class="pi pi-exclamation-circle"></i>
          <h2>Link Inválido</h2>
          <p>Este enlace de asistencia no existe o ha sido desactivado.</p>
        </div>
      </div>

      <div class="loading-state" *ngIf="loading()">
        <i class="pi pi-spin pi-spinner"></i>
        <p>Validando enlace...</p>
      </div>

      <!-- Valid Link - Clock In Form -->
      <div class="clock-container" *ngIf="linkValid() && !loading()">
        <div class="clock-card">
          <div class="company-logo" *ngIf="linkName()">
            <h1>{{ linkName() }}</h1>
          </div>

          <div class="clock-display">
            <span class="time">{{ currentTime() }}</span>
            <span class="date">{{ currentDate() }}</span>
          </div>

          <!-- Result Message -->
          <div class="result-message" *ngIf="clockResult()" [class.success]="true">
            <i class="pi pi-check-circle"></i>
            <div class="result-info">
              <h3>{{ clockResult()!.type === 'CLOCK_IN' ? '¡Entrada Registrada!' : '¡Salida Registrada!' }}</h3>
              <p>{{ clockResult()!.employeeName }}</p>
              <span class="timestamp">{{ formatTime(clockResult()!.timestamp) }}</span>
            </div>
          </div>

          <!-- PIN Input -->
          <div class="pin-form" *ngIf="!clockResult()">
            <h2>Ingresa tu PIN</h2>
            <p class="hint">Usa tu PIN de 4 dígitos para marcar asistencia</p>
            
            <div class="pin-input-container">
              <input 
                type="password" 
                pInputText 
                [(ngModel)]="pinCode"
                maxlength="4"
                class="pin-input"
                placeholder="••••"
                (keyup.enter)="submitPin()"
                autofocus
              />
            </div>

            <button 
              pButton 
              label="Registrar Asistencia" 
              class="submit-btn"
              [loading]="submitting()"
              (click)="submitPin()"
              [disabled]="pinCode.length !== 4"
            ></button>
          </div>

          <!-- Reset Button after success -->
          <button 
            pButton 
            label="Nueva Marcación" 
            class="p-button-outlined reset-btn"
            *ngIf="clockResult()"
            (click)="reset()"
          ></button>
        </div>

        <p class="footer-text">Sistema de Control de Asistencia</p>
      </div>

      <p-toast position="top-center"></p-toast>
    </div>
  `,
    styles: [`
    .public-attendance-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      padding: 2rem;
    }

    .loading-state, .invalid-state {
      text-align: center;
      color: white;

      i {
        font-size: 4rem;
        margin-bottom: 1rem;
      }
    }

    .error-card {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 16px;
      padding: 3rem;
      text-align: center;

      i { color: #EF4444; }
      h2 { margin: 1rem 0 0.5rem; }
      p { color: rgba(255, 255, 255, 0.7); }
    }

    .clock-container {
      width: 100%;
      max-width: 400px;
    }

    .clock-card {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 2.5rem;
      text-align: center;
    }

    .company-logo {
      margin-bottom: 2rem;

      h1 {
        margin: 0;
        font-size: 1.8rem;
        background: linear-gradient(90deg, #6366F1, #8B5CF6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    }

    .clock-display {
      margin-bottom: 2rem;

      .time {
        font-size: 4rem;
        font-weight: 700;
        color: white;
        display: block;
        font-family: 'Inter', monospace;
        letter-spacing: -2px;
      }

      .date {
        font-size: 1.1rem;
        color: rgba(255, 255, 255, 0.6);
        text-transform: capitalize;
      }
    }

    .result-message {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 16px;
      padding: 2rem;
      margin-bottom: 2rem;

      i {
        font-size: 3rem;
        color: #10B981;
        margin-bottom: 1rem;
      }

      h3 {
        margin: 0;
        color: #10B981;
        font-size: 1.3rem;
      }

      p {
        margin: 0.5rem 0;
        color: white;
        font-size: 1.2rem;
      }

      .timestamp {
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.6);
      }
    }

    .pin-form {
      h2 {
        margin: 0 0 0.5rem;
        color: white;
        font-size: 1.5rem;
      }

      .hint {
        color: rgba(255, 255, 255, 0.5);
        margin: 0 0 2rem;
        font-size: 0.9rem;
      }
    }

    .pin-input-container {
      margin-bottom: 2rem;
    }

    .pin-input {
      width: 180px;
      text-align: center;
      font-size: 2.5rem;
      letter-spacing: 8px;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      color: white;
      font-family: monospace;

      &::placeholder {
        color: rgba(255, 255, 255, 0.3);
        letter-spacing: 8px;
      }

      &:focus {
        border-color: #6366F1;
        outline: none;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3);
      }
    }

    .submit-btn {
      width: 100%;
      padding: 1rem;
      font-size: 1.1rem;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      border: none;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .reset-btn {
      width: 100%;
      margin-top: 1rem;
      color: white;
      border-color: rgba(255, 255, 255, 0.3);
    }

    .footer-text {
      text-align: center;
      margin-top: 2rem;
      color: rgba(255, 255, 255, 0.4);
      font-size: 0.85rem;
    }

    @media (max-width: 480px) {
      .clock-card { padding: 1.5rem; }
      .clock-display .time { font-size: 3rem; }
      .pin-input { width: 160px; font-size: 2rem; }
    }
  `]
})
export class PublicAttendanceComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private attendanceService = inject(AttendanceService);
    private messageService = inject(MessageService);

    loading = signal(true);
    linkValid = signal(false);
    linkName = signal<string | null>(null);
    submitting = signal(false);
    clockResult = signal<ClockResponse | null>(null);
    currentTime = signal('');
    currentDate = signal('');

    pinCode = '';
    private token = '';

    ngOnInit() {
        this.token = this.route.snapshot.paramMap.get('token') || '';
        this.validateLink();
        this.startClock();
    }

    validateLink() {
        if (!this.token) {
            this.loading.set(false);
            return;
        }

        this.attendanceService.validateLink(this.token).subscribe({
            next: (result) => {
                this.linkValid.set(result.valid);
                this.linkName.set(result.name || null);
                this.loading.set(false);
            },
            error: () => {
                this.linkValid.set(false);
                this.loading.set(false);
            }
        });
    }

    startClock() {
        const updateTime = () => {
            const now = new Date();
            this.currentTime.set(
                now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            );
            this.currentDate.set(
                now.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
            );
        };

        updateTime();
        setInterval(updateTime, 1000);
    }

    submitPin() {
        if (this.pinCode.length !== 4) {
            this.messageService.add({ severity: 'warn', summary: 'PIN Inválido', detail: 'El PIN debe tener 4 dígitos' });
            return;
        }

        this.submitting.set(true);

        this.attendanceService.publicClock(this.token, this.pinCode).subscribe({
            next: (result) => {
                this.clockResult.set(result);
                this.submitting.set(false);
                this.pinCode = '';
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: err.error?.message || 'PIN inválido o error de conexión',
                    life: 5000
                });
                this.submitting.set(false);
                this.pinCode = '';
            }
        });
    }

    formatTime(timestamp: string): string {
        return new Date(timestamp).toLocaleTimeString('es-CL', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    reset() {
        this.clockResult.set(null);
        this.pinCode = '';
    }
}
