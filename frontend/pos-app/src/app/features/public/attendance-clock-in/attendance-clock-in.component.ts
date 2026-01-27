import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AttendanceService } from '@app/core/services/attendance.service';

@Component({
    selector: 'app-attendance-clock-in',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, ToastModule],
    providers: [MessageService],
    template: `
    <p-toast position="top-center"></p-toast>
    <div class="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-4 fade-in">
        
        <!-- Loading State -->
        <div *ngIf="loading()" class="text-center">
            <i class="pi pi-spin pi-spinner text-4xl text-emerald-500"></i>
            <p class="mt-4 text-slate-400">Verificando enlace...</p>
        </div>

        <!-- Invalid Token -->
        <div *ngIf="!loading() && !isValidLink" class="text-center p-6 glass-card rounded-2xl max-w-md w-full">
            <i class="pi pi-times-circle text-5xl text-red-500 mb-4"></i>
            <h2 class="text-xl font-bold mb-2">Enlace Inválido o Expirado</h2>
            <p class="text-slate-400">Solicite un nuevo enlace a su administrador.</p>
        </div>

        <!-- Clock In Interface -->
        <div *ngIf="!loading() && isValidLink" class="w-full max-w-sm">
            <div class="glass-card p-8 rounded-3xl text-center relative overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-blue-600/10 z-0"></div>
                
                <div class="relative z-10">
                    <div class="mb-6">
                        <i class="pi pi-clock text-4xl text-emerald-400 mb-2 block"></i>
                        <h1 class="text-3xl font-bold text-white">{{ currentTime | date:'HH:mm' }}</h1>
                        <p class="text-emerald-200">{{ currentTime | date:'EEEE, d MMMM' }}</p>
                    </div>

                    <p class="mb-6 text-slate-300">Ingrese su PIN personal</p>
                    
                    <div class="mb-6 flex justify-center">
                         <input type="password" [(ngModel)]="pin" 
                                class="text-center text-2xl tracking-widest bg-slate-800/50 border border-slate-600 rounded-xl p-3 w-32 focus:border-emerald-500 focus:outline-none transition-colors"
                                maxlength="4" readonly>
                    </div>

                    <div class="grid grid-cols-3 gap-3 mb-6">
                        <ng-container *ngFor="let num of [1,2,3,4,5,6,7,8,9]">
                            <button class="numpad-btn" (click)="appendPin(num)">{{ num }}</button>
                        </ng-container>
                        <button class="numpad-btn text-red-400" (click)="clearPin()"><i class="pi pi-times"></i></button>
                        <button class="numpad-btn" (click)="appendPin(0)">0</button>
                        <button class="numpad-btn text-emerald-400" (click)="submit()" [disabled]="pin.length !== 4">
                            <i class="pi pi-check" *ngIf="!submitting"></i>
                            <i class="pi pi-spin pi-spinner" *ngIf="submitting"></i>
                        </button>
                    </div>

                    <div *ngIf="successMessage" class="mt-4 p-3 bg-emerald-500/20 text-emerald-300 rounded-xl animate-fade-in-up">
                        <i class="pi pi-check-circle mr-2"></i> {{ successMessage }}
                    </div>
                </div>
            </div>
            
            <p class="text-center text-slate-500 text-sm mt-6">Sistema de Asistencia PosCL</p>
        </div>
    </div>
    `,
    styles: [`
    .glass-card {
      background: rgba(30, 41, 59, 0.4);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    }
    .numpad-btn {
        aspect-ratio: 1;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 50%;
        color: white;
        font-size: 1.25rem;
        transition: all 0.2s;
        display: flex; align-items: center; justify-content: center;
        
        &:active { background: rgba(255,255,255,0.15); transform: scale(0.95); }
        &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
    .animate-fade-in-up { animation: fadeInUp 0.5s ease-out; }
    @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    `]
})
export class AttendanceClockInComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private attendanceService = inject(AttendanceService);
    private messageService = inject(MessageService);

    token: string = '';
    loading = signal(true);
    isValidLink = false;

    currentTime = new Date();
    pin = '';
    submitting = false;
    successMessage = '';

    ngOnInit() {
        this.token = this.route.snapshot.paramMap.get('token') || '';
        this.validateToken();

        setInterval(() => {
            this.currentTime = new Date();
        }, 1000);
    }

    validateToken() {
        if (!this.token) {
            this.loading.set(false);
            this.isValidLink = false;
            return;
        }

        // Mock validation if backend not ready
        if (this.token === 'DEMO-TOKEN-123') {
            this.loading.set(false);
            this.isValidLink = true;
            return;
        }

        this.attendanceService.validateLink(this.token).subscribe({
            next: (res) => {
                this.isValidLink = res.valid;
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.isValidLink = false; // Set strictly false on error
            }
        });
    }

    appendPin(num: number) {
        if (this.pin.length < 4) {
            this.pin += num;
        }
    }

    clearPin() {
        this.pin = '';
        this.successMessage = '';
    }

    submit() {
        if (this.pin.length !== 4) return;
        this.submitting = true;
        this.successMessage = '';

        this.attendanceService.publicClock(this.token, this.pin).subscribe({
            next: (res) => {
                this.successMessage = `Marcaje exitoso: ${res.employeeName} (${res.type === 'CLOCK_IN' ? 'Entrada' : 'Salida'})`;
                this.pin = '';
                this.submitting = false;

                setTimeout(() => {
                    this.successMessage = '';
                }, 3000);
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'PIN incorrecto o empleado no encontrado' });
                this.pin = '';
                this.submitting = false;
            }
        });
    }
}
