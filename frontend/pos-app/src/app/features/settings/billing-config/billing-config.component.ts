import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BillingConfigService, BillingConfig } from '../../../core/services/billing-config.service';
import { MessageService } from 'primeng/api';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { ToastModule } from 'primeng/toast';
import { PasswordModule } from 'primeng/password';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
    selector: 'app-billing-config',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        CardModule,
        ButtonModule,
        InputTextModule,
        DropdownModule,
        InputSwitchModule,
        ToastModule,
        PasswordModule,
        DividerModule,
        ProgressSpinnerModule
    ],
    providers: [MessageService],
    template: `
    <div class="billing-config-container fadein animation-duration-500">
      <p-toast></p-toast>
      
      <div class="grid justify-content-center">
        <div class="col-12 md:col-10 lg:col-8">
            <div class="surface-card p-4 shadow-2 border-round-xl">
                <div class="text-900 font-bold text-3xl mb-2">Configuración de Facturación</div>
                <div class="text-500 mb-5">Gestione la conexión con los entes fiscales (SII, SUNAT, AFIP, etc.)</div>

                <form [formGroup]="configForm" (ngSubmit)="save()">
                    <div class="grid formgrid p-fluid">
                        
                        <!-- Country Selection -->
                        <div class="col-12 md:col-6 field">
                            <label class="font-medium text-900">País / Región</label>
                            <p-dropdown 
                                [options]="countries" 
                                formControlName="country" 
                                optionLabel="name" 
                                optionValue="code"
                                placeholder="Seleccione País">
                                <ng-template pTemplate="selectedItem">
                                    <div class="flex align-items-center gap-2" *ngIf="configForm.get('country')?.value">
                                        <span>{{getCountryName(configForm.get('country')?.value)}}</span>
                                    </div>
                                </ng-template>
                                <ng-template let-country pTemplate="item">
                                    <div class="flex align-items-center gap-2">
                                        <div>{{country.name}}</div>
                                    </div>
                                </ng-template>
                            </p-dropdown>
                        </div>

                        <!-- Environment Selection -->
                        <div class="col-12 md:col-6 field">
                            <label class="font-medium text-900">Ambiente</label>
                            <p-dropdown 
                                [options]="environments" 
                                formControlName="environment" 
                                optionLabel="name" 
                                optionValue="code">
                            </p-dropdown>
                        </div>

                        <p-divider class="w-full"></p-divider>

                        <!-- Dynamic Fields: Chile -->
                        <div *ngIf="isChile()" class="col-12 bg-blue-50 border-round p-3 mb-4 border-1 border-blue-100">
                            <div class="text-blue-900 font-medium mb-2 flex align-items-center">
                                <i class="pi pi-info-circle mr-2"></i> Configuración SII Chile
                            </div>
                            <div class="text-blue-700 text-sm mb-3">
                                Requiere certificado digital personal (.p12) para firmar documentos.
                            </div>
                            <div class="field">
                                <label class="text-blue-900">Contraseña del Certificado Digital</label>
                                <p-password 
                                    formControlName="certificatePassword" 
                                    [toggleMask]="true" 
                                    [feedback]="false"
                                    styleClass="w-full"
                                    inputStyleClass="w-full">
                                </p-password>
                            </div>
                        </div>

                        <!-- Dynamic Fields: API Key Auth -->
                        <div *ngIf="isApiKeyAuth()" class="col-12 bg-purple-50 border-round p-3 mb-4 border-1 border-purple-100">
                             <div class="text-purple-900 font-medium mb-2">Autenticación por API Key</div>
                             <div class="field">
                                <label class="text-purple-900">API Key / Token</label>
                                <input pInputText type="password" formControlName="apiKey" class="w-full">
                             </div>
                        </div>

                        <!-- Active Toggle -->
                        <div class="col-12 flex align-items-center justify-content-between mt-4">
                            <div class="flex align-items-center">
                                <p-inputSwitch formControlName="active"></p-inputSwitch>
                                <span class="ml-2 font-medium text-900">Integración Activa</span>
                            </div>

                            <p-button 
                                label="Guardar Configuración" 
                                icon="pi pi-check" 
                                type="submit" 
                                [loading]="loading"
                                styleClass="p-button-primary border-round-lg px-4">
                            </p-button>
                        </div>

                    </div>
                </form>
            </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    :host {
      display: block;
      width: 100%;
      background-color: var(--surface-ground);
      min-height: 100vh;
      padding: 2rem;
    }
  `]
})
export class BillingConfigComponent implements OnInit {
    configForm: FormGroup;
    loading = false;

    countries = [
        { name: 'Chile (SII)', code: 'CHILE' },
        { name: 'Perú (SUNAT)', code: 'PERU' },
        { name: 'Argentina (AFIP)', code: 'ARGENTINA' },
        { name: 'Venezuela (SENIAT)', code: 'VENEZUELA' },
        { name: 'Modo Pruebas (Mock)', code: 'GENERIC_MOCK' }
    ];

    environments = [
        { name: 'Certificación / Pruebas', code: 'CERTIFICATION' },
        { name: 'Producción', code: 'PRODUCTION' }
    ];

    constructor(
        private fb: FormBuilder,
        private billingService: BillingConfigService,
        private messageService: MessageService
    ) {
        this.configForm = this.fb.group({
            id: [null],
            country: ['GENERIC_MOCK', Validators.required],
            environment: ['CERTIFICATION', Validators.required],
            apiKey: [''],
            certificatePassword: [''],
            active: [true]
        });
    }

    ngOnInit() {
        this.loadConfig();
    }

    loadConfig() {
        this.loading = true;
        this.billingService.getConfig().subscribe({
            next: (config) => {
                if (config) {
                    this.configForm.patchValue(config);
                }
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    save() {
        if (this.configForm.invalid) return;
        this.loading = true;

        const config = this.configForm.value;

        this.billingService.saveConfig(config).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Configuración guardada correctamente' });
                this.loading = false;
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la configuración' });
                this.loading = false;
            }
        });
    }

    isChile(): boolean {
        return this.configForm.get('country')?.value === 'CHILE';
    }

    isApiKeyAuth(): boolean {
        const country = this.configForm.get('country')?.value;
        return ['PERU', 'ARGENTINA', 'VENEZUELA'].includes(country);
    }

    getCountryName(code: string): string {
        return this.countries.find(c => c.code === code)?.name || code;
    }
}
