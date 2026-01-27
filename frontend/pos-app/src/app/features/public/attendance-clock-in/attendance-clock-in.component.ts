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
    
    <div class="kiosk-container font-sans">
        <!-- Ambient Background -->
        <div class="ambient-bg"></div>
        <div class="ambient-overlay"></div>

        <!-- Main Content -->
        <div class="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 sm:p-8">
            
            <!-- Loading -->
            <div *ngIf="loading()" class="glass-panel p-8 rounded-3xl flex flex-col items-center animate-pulse">
                <i class="pi pi-spin pi-spinner text-4xl text-white/50 mb-4"></i>
                <span class="text-white/70 tracking-widest uppercase text-sm">Iniciando Sistema</span>
            </div>

            <!-- Error State -->
            <div *ngIf="!loading() && !isValidLink" class="glass-panel p-10 rounded-3xl text-center max-w-md w-full border-l-4 border-red-500">
                <div class="h-20 w-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i class="pi pi-lock text-3xl text-red-400"></i>
                </div>
                <h2 class="text-2xl font-bold text-white mb-2">Acceso Restringido</h2>
                <p class="text-slate-400 leading-relaxed">El enlace de este terminal ha expirado o no es válido. Por favor contacte a administración.</p>
            </div>

            <!-- Valid State: Clock UI -->
            <div *ngIf="!loading() && isValidLink" class="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                
                <!-- Left: Info & Clock -->
                <div class="text-center lg:text-left text-white space-y-2 lg:space-y-6 animate-slide-in-left">
                    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-medium tracking-wide text-emerald-300 uppercase mb-4">
                        <span class="relative flex h-2 w-2">
                          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Terminal Activo
                    </div>
                    
                    <div>
                        <h1 class="text-6xl lg:text-8xl font-light tracking-tighter mb-2">{{ currentTime | date:'HH:mm' }}</h1>
                        <p class="text-xl lg:text-2xl text-slate-300 font-light">{{ currentTime | date:'EEEE, d MMMM' | titlecase }}</p>
                    </div>

                    <div class="hidden lg:block pt-8 text-slate-400 text-sm max-w-md">
                        <p class="mb-2">👋 <strong>Bienvenido al equipo</strong></p>
                        <p>Ingrese su PIN personal para registrar su entrada o salida. El sistema calculará automáticamente sus horas trabajadas.</p>
                    </div>
                </div>

                <!-- Right: Pin Pad -->
                <div class="glass-panel p-8 lg:p-10 rounded-[2.5rem] w-full max-w-md mx-auto animate-slide-in-right relative overflow-hidden">
                    
                    <!-- Decorative Glow -->
                    <div class="absolute -top-20 -right-20 w-60 h-60 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>

                    <div class="relative z-10 flex flex-col h-full">
                        <div class="text-center mb-10">
                            <h3 class="text-white text-lg font-medium mb-6">Ingrese su PIN</h3>
                            
                            <!-- PIN Dots Feedback -->
                            <div class="flex justify-center gap-4 h-4 mb-2">
                                <div *ngFor="let dot of [0,1,2,3]" 
                                     class="w-4 h-4 rounded-full transition-all duration-300 border border-white/30"
                                     [ngClass]="{
                                        'bg-emerald-400 border-emerald-400 scale-110 shadow-[0_0_10px_rgba(52,211,153,0.5)]': pin.length > dot,
                                        'bg-white/5': pin.length <= dot
                                     }"></div>
                            </div>
                        </div>

                        <!-- Keypad -->
                        <div class="grid grid-cols-3 gap-4 mb-8">
                            <button *ngFor="let num of [1,2,3,4,5,6,7,8,9]" 
                                    class="keypad-btn" 
                                    (click)="appendPin(num)">
                                {{ num }}
                            </button>
                            
                            <button class="keypad-btn action text-rose-400" (click)="clearPin()">
                                <i class="pi pi-times text-xl"></i>
                            </button>
                            
                            <button class="keypad-btn" (click)="appendPin(0)">0</button>
                            
                            <button class="keypad-btn action bg-emerald-500/20 text-emerald-400 border-emerald-500/50 hover:bg-emerald-500/30" 
                                    [disabled]="pin.length !== 4 || submitting"
                                    (click)="submit()">
                                <i *ngIf="!submitting" class="pi pi-check text-xl"></i>
                                <i *ngIf="submitting" class="pi pi-spin pi-spinner text-xl"></i>
                            </button>
                        </div>

                        <div class="text-center text-xs text-slate-500 uppercase tracking-widest mt-auto">
                            PosCL Secure Access
                        </div>
                    </div>

                    <!-- Success Overlay -->
                     <div *ngIf="successMessage" class="absolute inset-0 z-20 bg-emerald-600/90 backdrop-blur-md flex flex-col items-center justify-center text-white text-center p-6 animate-fade-in">
                        <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-xl">
                            <i class="pi pi-check text-4xl text-emerald-600"></i>
                        </div>
                        <h2 class="text-2xl font-bold mb-2">¡Registrado!</h2>
                        <p class="text-lg opacity-90">{{ successMessage }}</p>
                        <p class="mt-8 text-sm opacity-75">Reseteando pantalla...</p>
                     </div>
                </div>

            </div>
        </div>
    </div>
    `,
    styles: [`
    .kiosk-container {
        position: relative;
        min-height: 100vh;
        overflow: hidden;
        background-color: #0f172a;
        color: white;
    }

    .ambient-bg {
        position: absolute;
        width: 150vw;
        height: 150vh;
        top: -25%; left: -25%;
        background: radial-gradient(circle at 50% 50%, #1e293b 10%, #020617 90%);
        z-index: 0;
    }

    .ambient-overlay {
        position: absolute;
        inset: 0;
        background-image: 
            linear-gradient(to bottom right, rgba(16, 185, 129, 0.05), transparent 40%),
            linear-gradient(to bottom left, rgba(59, 130, 246, 0.05), transparent 40%);
        z-index: 1;
    }

    .glass-panel {
        background: rgba(30, 41, 59, 0.4);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }

    .keypad-btn {
        aspect-ratio: 1;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: white;
        font-size: 1.5rem;
        font-weight: 300;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        user-select: none;
        
        &:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.1);
            transform: translateY(-2px);
            border-color: rgba(255, 255, 255, 0.2);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        &:active:not(:disabled) {
            transform: translateY(1px) scale(0.95);
        }

        &.action {
            background: rgba(0, 0, 0, 0.2);
            border-color: transparent;
        }

        &:disabled {
            opacity: 0.3;
            cursor: not-allowed;
            transform: none;
        }
    }

    .animate-slide-in-left { animation: slideInLeft 0.8s ease-out; }
    .animate-slide-in-right { animation: slideInRight 0.8s ease-out; }
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }

    @keyframes slideInLeft {
        from { opacity: 0; transform: translateX(-30px); }
        to { opacity: 1; transform: translateX(0); }
    }
    @keyframes slideInRight {
        from { opacity: 0; transform: translateX(30px); }
        to { opacity: 1; transform: translateX(0); }
    }
    @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
    }
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
    successMessage = '';

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
            }, 800); // Fake delay for UX
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
        this.successMessage = '';
    }

    submit() {
        if (this.pin.length !== 4) return;
        this.submitting = true;
        this.successMessage = '';

        const handleSuccess = (empName: string, type: 'CLOCK_IN' | 'CLOCK_OUT') => {
            this.successMessage = `${empName} - ${type === 'CLOCK_IN' ? 'Entrada Registrada' : 'Salida Registrada'}`;

            // Reset sequence
            setTimeout(() => {
                this.pin = '';
                this.successMessage = '';
                this.submitting = false;
            }, 3500);
        };

        if (this.token === 'DEMO-TOKEN-123') {
            // Demo success
            setTimeout(() => handleSuccess('Empleado Demo', 'CLOCK_IN'), 1000);
            return;
        }

        this.attendanceService.publicClock(this.token, this.pin).subscribe({
            next: (res) => {
                handleSuccess(res.employeeName, res.type);
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'PIN incorrecto o empleado no encontrado' });
                this.pin = ''; // Shake effect could be nice here
                this.submitting = false;
            }
        });
    }
}
