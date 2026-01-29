import { Component, OnInit, signal, inject, OnDestroy } from '@angular/core';
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
    
    <div class="kiosk-container min-h-screen flex items-center justify-center p-4 font-sans antialiased text-white overflow-hidden relative selection:bg-indigo-500/30">
        
        <!-- Deep Gradient Background -->
        <div class="absolute inset-0 bg-gradient-to-br from-[#1e1b4b] via-[#0f172a] to-[#1e1b4b] z-0"></div>
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_50%)] z-0"></div>
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(236,72,153,0.15),transparent_50%)] z-0"></div>

        <!-- Main Content -->
        <div class="relative z-10 w-full max-w-[400px]">

            <!-- Loading State -->
            <div *ngIf="loading()" class="glass-card p-10 flex flex-col items-center justify-center animate-fade-in text-center">
                <div class="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-6"></div>
                <span class="text-white/50 text-xs font-semibold tracking-widest uppercase">Cargando...</span>
            </div>

            <!-- Error State -->
            <div *ngIf="!loading() && !isValidLink" class="glass-card p-10 text-center border-t-4 border-rose-500 animate-slide-up">
                <div class="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i class="pi pi-lock text-3xl text-rose-500"></i>
                </div>
                <h2 class="text-xl font-bold text-white mb-2">Acceso Restringido</h2>
                <p class="text-slate-400 text-sm">Enlace inválido o expirado.</p>
            </div>

            <!-- Lock Screen Card (Authenticated) -->
            <div *ngIf="!loading() && isValidLink" class="glass-card p-8 sm:p-10 animate-scale-in">
                
                <!-- Time & Date -->
                <div class="text-center mb-10">
                    <h1 class="text-6xl font-bold tracking-tight text-white mb-2 drop-shadow-lg">
                        {{ currentTime | date:'HH:mm' }}
                    </h1>
                    <p class="text-slate-400 text-lg font-medium">
                        {{ currentTime | date:'EEEE, d MMMM' | titlecase }}
                    </p>
                </div>

                <!-- Input Feedback -->
                <div class="text-center mb-8">
                    <div class="flex items-center justify-center gap-2 mb-6 text-indigo-200/80 font-medium text-sm">
                        <i class="pi pi-lock text-xs"></i>
                        <span>Ingresa tu PIN de Asistencia</span>
                    </div>

                    <div class="flex justify-center gap-4 h-4">
                        <div *ngFor="let dot of [0,1,2,3]" 
                             class="w-3.5 h-3.5 rounded-full border border-indigo-500/30 transition-all duration-300"
                             [ngClass]="{
                                'bg-indigo-500 border-indigo-500 scale-110 shadow-[0_0_12px_rgba(99,102,241,0.6)]': pin.length > dot,
                                'bg-transparent': pin.length <= dot
                             }">
                        </div>
                    </div>
                </div>

                <!-- Keypad -->
                <div class="grid grid-cols-3 gap-4 mb-2">
                    <button *ngFor="let num of [1,2,3,4,5,6,7,8,9]" 
                            class="keypad-btn" 
                            (click)="appendPin(num)">
                        {{ num }}
                    </button>
                    
                    <button class="keypad-btn action-red" (click)="clearPin()">
                        C
                    </button>
                    
                    <button class="keypad-btn" (click)="appendPin(0)">0</button>
                    
                    <button class="keypad-btn action-green" 
                            [disabled]="pin.length !== 4 || submitting"
                            (click)="submit()">
                        <i *ngIf="!submitting" class="pi pi-check text-lg"></i>
                        <i *ngIf="submitting" class="pi pi-spin pi-spinner text-lg"></i>
                    </button>
                </div>

            </div>

        </div>
    </div>
    `,
    styles: [`
    .glass-card {
        background: rgba(17, 24, 39, 0.75);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 2rem;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }

    .keypad-btn {
        aspect-ratio: 1;
        border-radius: 50%;
        background: rgba(30, 41, 59, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.05);
        color: white;
        font-size: 1.5rem;
        font-weight: 500;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        outline: none;
        user-select: none;
        
        &:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.1);
            transform: translateY(-1px);
        }

        &:active:not(:disabled) {
            transform: translateY(1px) scale(0.95);
        }

        &.action-red {
            color: #fb7185; /* Rose 400 */
            background: rgba(251, 113, 133, 0.1);
            border-color: rgba(251, 113, 133, 0.2);
            font-size: 1.2rem;
            
            &:hover { background: rgba(251, 113, 133, 0.2); }
        }

        &.action-green {
            color: #34d399; /* Emerald 400 */
            background: rgba(52, 211, 153, 0.1);
            border-color: rgba(52, 211, 153, 0.2);
            
            &:hover:not(:disabled) { background: rgba(52, 211, 153, 0.2); }
            &:disabled { opacity: 0.3; cursor: not-allowed; }
        }
    }

    /* Animations */
    .animate-fade-in { animation: fadeIn 0.8s ease-out; }
    .animate-slide-up { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
    .animate-scale-in { animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1); }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    `]
})
export class AttendanceClockInComponent implements OnInit, OnDestroy {
    private route = inject(ActivatedRoute);
    private attendanceService = inject(AttendanceService);
    private messageService = inject(MessageService);

    token: string = '';
    loading = signal(true);
    isValidLink = false;

    currentTime = new Date();
    pin = '';
    submitting = false;

    private timeInterval: any;

    ngOnInit() {
        this.token = this.route.snapshot.queryParamMap.get('token') || '';
        this.validateToken();

        this.timeInterval = setInterval(() => {
            this.currentTime = new Date();
        }, 1000);
    }

    ngOnDestroy() {
        if (this.timeInterval) clearInterval(this.timeInterval);
    }

    validateToken() {
        if (!this.token) {
            this.loading.set(false);
            this.isValidLink = false;
            return;
        }

        if (this.token === 'DEMO-TOKEN-123') {
            setTimeout(() => {
                this.loading.set(false);
                this.isValidLink = true;
            }, 500);
            return;
        }

        this.attendanceService.validateLink(this.token).subscribe({
            next: (res) => {
                this.isValidLink = res.valid;
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.isValidLink = false;
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
    }

    submit() {
        if (this.pin.length !== 4) return;
        this.submitting = true;

        const handleSuccess = (empName: string, type: 'CLOCK_IN' | 'CLOCK_OUT', status?: string) => {
            let msg = `${empName} - ${type === 'CLOCK_IN' ? 'Entrada' : 'Salida'}`;
            if (status === 'LATE') msg += ' (Atraso)';

            this.messageService.add({
                severity: 'success',
                summary: '¡Registrado!',
                detail: msg,
                life: 3000
            });

            setTimeout(() => {
                this.pin = '';
                this.submitting = false;
            }, 1000);
        };

        if (this.token === 'DEMO-TOKEN-123') {
            setTimeout(() => handleSuccess('Empleado Demo', 'CLOCK_IN'), 800);
            return;
        }

        this.attendanceService.publicClock(this.token, this.pin).subscribe({
            next: (res) => {
                handleSuccess(res.employeeName, res.type, res.status);
            },
            error: (err) => {
                const msg = err.error?.message || '';
                if (msg.includes('permiso activo')) {
                    this.messageService.add({ severity: 'warn', summary: 'Licencia', detail: 'Disfrute su tiempo libre.' });
                } else if (msg.includes('PIN inválido') || msg.includes('Found 0')) {
                    this.messageService.add({ severity: 'error', summary: 'PIN Incorrecto', detail: 'Intente nuevamente.' });
                } else {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Fallo de conexión.' });
                }
                this.pin = '';
                this.submitting = false;
            }
        });
    }
}
