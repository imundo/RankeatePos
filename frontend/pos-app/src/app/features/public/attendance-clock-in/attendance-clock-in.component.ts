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
    
    <div class="kiosk-container font-sans antialiased selection:bg-emerald-500/30">
        <!-- Ambient Background (Non-interactive) -->
        <div class="fixed inset-0 pointer-events-none overflow-hidden z-0">
            <div class="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-emerald-500/10 rounded-full blur-[120px]"></div>
            <div class="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-500/10 rounded-full blur-[120px]"></div>
        </div>

        <!-- Main Content -->
        <div class="relative z-10 min-h-screen flex items-center justify-center p-4 lg:p-8">
            
            <!-- Loading State -->
            <div *ngIf="loading()" class="flex flex-col items-center animate-fade-in">
                <div class="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-6"></div>
                <span class="text-white/60 tracking-[0.2em] uppercase text-xs font-semibold">Inicializando Sistema</span>
            </div>

            <!-- Error State -->
            <div *ngIf="!loading() && !isValidLink" class="glass-card max-w-md w-full p-8 text-center border-l-4 border-l-rose-500 animate-slide-up">
                <div class="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i class="pi pi-lock text-2xl text-rose-500"></i>
                </div>
                <h2 class="text-2xl font-bold text-white mb-2">Enlace Expirado</h2>
                <p class="text-slate-400">Este terminal ha perdido su conexión segura. Contacte al administrador.</p>
            </div>

            <!-- Active Terminal State -->
            <div *ngIf="!loading() && isValidLink" class="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center animate-fade-in">
                
                <!-- Left Column: Clock & Branding -->
                <div class="text-center lg:text-left space-y-8 order-2 lg:order-1">
                    <!-- Status Indicator -->
                    <div class="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                        <span class="relative flex h-2.5 w-2.5">
                          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <span class="text-xs font-medium tracking-wide text-emerald-100/90 uppercase">Terminal En Línea</span>
                    </div>
                    
                    <!-- Clock -->
                    <div class="space-y-2">
                        <h1 class="text-7xl lg:text-9xl font-light tracking-tighter text-white tabular-nums drop-shadow-2xl">
                            {{ currentTime | date:'HH:mm' }}
                        </h1>
                        <p class="text-xl lg:text-3xl text-slate-400 font-light">
                            {{ currentTime | date:'EEEE, d MMMM' | titlecase }}
                        </p>
                    </div>

                    <!-- Instructions -->
                    <div class="hidden lg:block max-w-md">
                        <div class="h-px w-20 bg-gradient-to-r from-emerald-500 to-transparent mb-6"></div>
                        <p class="text-lg text-slate-300 leading-relaxed">
                            Bienvenido. Ingrese su <span class="text-white font-medium">PIN de 4 dígitos</span> para registrar su actividad de forma segura.
                        </p>
                    </div>
                </div>

                <!-- Right Column: Keypad -->
                <div class="order-1 lg:order-2 w-full max-w-[420px] mx-auto lg:mx-0">
                    <div class="glass-card p-6 sm:p-10 relative overflow-hidden group">
                        
                        <!-- Internal Glow -->
                        <div class="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 group-hover:opacity-75"></div>

                        <!-- Header & PIN Feedback -->
                        <div class="relative z-10 flex flex-col items-center mb-10">
                            <h3 class="text-white font-medium mb-8 text-lg">Ingrese PIN Personal</h3>
                            
                            <div class="flex gap-6">
                                <div *ngFor="let dot of [0,1,2,3]" 
                                     class="w-4 h-4 rounded-full border border-white/20 transition-all duration-300"
                                     [ngClass]="{
                                        'bg-emerald-500 border-emerald-500 scale-125 shadow-[0_0_15px_rgba(16,185,129,0.5)]': pin.length > dot,
                                        'bg-transparent': pin.length <= dot
                                     }">
                                </div>
                            </div>
                        </div>

                        <!-- Numeric Keypad -->
                        <div class="grid grid-cols-3 gap-4 mb-4 relative z-20">
                            <button *ngFor="let num of [1,2,3,4,5,6,7,8,9]" 
                                    class="keypad-btn" 
                                    (click)="appendPin(num)"
                                    tabindex="0">
                                {{ num }}
                            </button>
                            
                            <button class="keypad-btn action" (click)="clearPin()" aria-label="Clear">
                                <i class="pi pi-times text-xl text-rose-400"></i>
                            </button>
                            
                            <button class="keypad-btn" (click)="appendPin(0)">0</button>
                            
                            <button class="keypad-btn action bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20" 
                                    [disabled]="pin.length !== 4 || submitting"
                                    [ngClass]="{'opacity-50 cursor-not-allowed': pin.length !== 4}"
                                    (click)="submit()"
                                    aria-label="Submit">
                                <i *ngIf="!submitting" class="pi pi-arrow-right text-xl"></i>
                                <i *ngIf="submitting" class="pi pi-spin pi-spinner text-xl"></i>
                            </button>
                        </div>
                        
                        <div class="text-center mt-6">
                            <p class="text-[10px] uppercase tracking-widest text-slate-600 font-bold">Secure Access v2.0</p>
                        </div>

                        <!-- Success Overlay (Absolute inside card) -->
                        <div *ngIf="successMessage" 
                             class="absolute inset-0 z-50 bg-emerald-600 flex flex-col items-center justify-center text-white text-center p-8 animate-fade-in-quick">
                            <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm animate-bounce-small">
                                <i class="pi pi-check text-3xl font-bold"></i>
                            </div>
                            <h2 class="text-2xl font-bold mb-2 tracking-tight">¡Registrado!</h2>
                            <p class="text-emerald-100 font-medium text-lg leading-snug">{{ successMessage }}</p>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    </div>
    `,
    styles: [`
    :host {
        display: block;
        min-height: 100vh;
        background-color: #020617; /* Slate 950 */
    }

    .kiosk-container {
        min-height: 100vh;
        width: 100%;
        color: white;
    }

    .glass-card {
        background: rgba(15, 23, 42, 0.6); /* Slate 900 / 60% */
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 2rem;
        box-shadow: 0 0 0 1px rgba(0,0,0,0.1), 0 20px 40px -8px rgba(0,0,0,0.4);
    }

    .keypad-btn {
        aspect-ratio: 1;
        border-radius: 1.5rem; /* Squircle */
        background: rgba(30, 41, 59, 0.5); /* Slate 800 / 50% */
        border: 1px solid rgba(255, 255, 255, 0.05);
        color: white;
        font-size: 1.5rem;
        font-weight: 400;
        transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        outline: none;
        user-select: none;
        
        &:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.08);
            transform: translateY(-2px);
            border-color: rgba(255, 255, 255, 0.15);
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        &:active:not(:disabled) {
            transform: translateY(0) scale(0.96);
            background: rgba(255, 255, 255, 0.05);
        }

        &.action {
            background: rgba(15, 23, 42, 0.5);
            border-color: transparent;
        }

        &:focus-visible {
            ring: 2px solid theme('colors.emerald.500');
            ring-offset: 2px;
            ring-offset-color: #020617;
        }
    }

    .animate-fade-in { animation: fadeIn 1s ease-out forwards; }
    .animate-slide-up { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .animate-fade-in-quick { animation: fadeIn 0.3s ease-out forwards; }
    .animate-bounce-small { animation: bounceSmall 2s infinite; }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    @keyframes bounceSmall {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
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
            }, 800);
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

        const handleSuccess = (empName: string, type: 'CLOCK_IN' | 'CLOCK_OUT', status?: string) => {
            if (status === 'LATE') {
                this.successMessage = `${empName}\nEntrada Registrada (Atraso)`;
            } else {
                this.successMessage = `${empName}\n${type === 'CLOCK_IN' ? 'Entrada Registrada' : 'Salida Registrada'}`;
            }

            // Reset sequence
            setTimeout(() => {
                this.pin = '';
                this.successMessage = '';
                this.submitting = false;
            }, 3000);
        };

        if (this.token === 'DEMO-TOKEN-123') {
            setTimeout(() => handleSuccess('Empleado Demo', 'CLOCK_IN'), 1000);
            return;
        }

        this.attendanceService.publicClock(this.token, this.pin).subscribe({
            next: (res) => {
                handleSuccess(res.employeeName, res.type, res.status);
            },
            error: (err) => {
                const msg = err.error?.message || '';
                // Translate common backend errors
                if (msg.includes('permiso activo')) {
                    this.messageService.add({ severity: 'warn', summary: 'Vacaciones/Licencia', detail: 'Disfrute su tiempo libre. No se requiere marcar.' });
                } else if (msg.includes('PIN inválido') || msg.includes('Found 0')) {
                    this.messageService.add({ severity: 'error', summary: 'PIN Incorrecto', detail: 'Verifique su código de acceso.' });
                } else {
                    this.messageService.add({ severity: 'error', summary: 'Error de Sistema', detail: 'No se pudo conectar con el servidor.' });
                }

                // Shake effect could be added here
                this.pin = '';
                this.submitting = false;
            }
        });
    }
}
