import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { RatingModule } from 'primeng/rating';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';

import { PerformanceReviewService, PerformanceReview, CreateReviewDTO } from '@app/core/services/performance-review.service';
import { StaffService, Employee } from '@app/core/services/staff.service';
import { DemoDataService } from '@app/core/services/demo-data.service';

@Component({
    selector: 'app-performance-review',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        DialogModule,
        RatingModule,
        InputTextareaModule,
        DropdownModule,
        ToastModule,
        TagModule,
        AvatarModule
    ],
    providers: [MessageService],
    template: `
    <p-toast></p-toast>
    <div class="reviews-container fade-in">
      
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>⭐ Evaluaciones de Desempeño</h1>
          <p class="subtitle">Gestión de talento, objetivos y feedback 360°</p>
        </div>
        <button pButton label="Nueva Evaluación" icon="pi pi-plus" class="p-button-rounded p-button-success" 
                (click)="openCreateModal()"></button>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card glass-card">
          <div class="stat-icon bg-gradient-to-br from-violet-500 to-purple-600">
            <i class="pi pi-star"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ averageScore() | number:'1.1-1' }}</span>
            <span class="stat-label">Promedio General</span>
          </div>
        </div>
        
        <div class="stat-card glass-card">
          <div class="stat-icon bg-gradient-to-br from-blue-500 to-cyan-600">
            <i class="pi pi-users"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ reviews().length }}</span>
            <span class="stat-label">Evaluaciones Total</span>
          </div>
        </div>

        <div class="stat-card glass-card">
          <div class="stat-icon bg-gradient-to-br from-emerald-500 to-green-600">
            <i class="pi pi-check-circle"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">95%</span>
            <span class="stat-label">Completadas</span>
          </div>
        </div>
      </div>

      <!-- Main Table -->
      <div class="glass-card table-wrapper">
        <p-table [value]="reviews()" [paginator]="true" [rows]="10" [loading]="loading()"
                 styleClass="p-datatable-striped" [rowHover]="true">
          <ng-template pTemplate="header">
            <tr>
              <th>Empleado</th>
              <th>Periodo</th>
              <th>Evaluador</th>
              <th>Puntaje</th>
              <th>Calificación</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-review>
            <tr class="row-hover">
              <td>
                <div class="employee-cell">
                  <p-avatar [label]="getInitials(review.employee?.firstName || review.employeeName)" shape="circle" styleClass="mr-2"></p-avatar>
                  <div class="flex flex-column">
                    <span class="font-bold text-white">{{ review.employee?.firstName || review.employeeName }} {{ review.employee?.lastName || '' }}</span>
                  </div>
                </div>
              </td>
              <td class="text-gray-300">{{ review.period }}</td>
              <td class="text-gray-400">{{ review.reviewerName }}</td>
              <td>
                <div class="flex align-items-center gap-2">
                   <p-rating [ngModel]="review.overallScore / 20" [readonly]="true" [cancel]="false" [stars]="5"></p-rating>
                   <span class="font-bold text-lg text-white">{{ review.overallScore }}%</span>
                </div>
              </td>
              <td>
                <p-tag [value]="getScoreLabel(review.overallScore).label" 
                       [severity]="getScoreLabel(review.overallScore).color" [rounded]="true"></p-tag>
              </td>
              <td>
                 <div class="status-badge" [class.completed]="review.status === 'COMPLETED'">
                    {{ review.status }}
                 </div>
              </td>
              <td>
                <button pButton icon="pi pi-eye" class="p-button-text p-button-rounded p-button-secondary" pTooltip="Ver Detalles"></button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="7" class="text-center p-6 text-gray-400">
                <i class="pi pi-file mb-3" style="font-size: 2rem"></i>
                <p>No hay evaluaciones registradas</p>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Create Modal -->
      <p-dialog [(visible)]="showModal" header="Nueva Evaluación" [modal]="true" [style]="{width: '500px'}" styleClass="premium-dialog">
        <div class="form-grid">
           <div class="field">
             <label>Empleado</label>
             <p-dropdown [options]="employees()" [(ngModel)]="formData.employeeId" 
                         optionLabel="fullName" optionValue="id" placeholder="Seleccionar" 
                         [filter]="true" appendTo="body" styleClass="w-full"></p-dropdown>
           </div>
           
           <div class="field">
             <label>Periodo</label>
             <input pInputText type="text" [(ngModel)]="formData.period" placeholder="Ej: 2024-Q1" class="premium-input w-full p-2 rounded-lg bg-slate-800 border-slate-700 text-white"/>
           </div>

           <div class="field">
             <label>Puntaje General (0-100)</label>
             <div class="flex align-items-center gap-3">
               <p-rating [(ngModel)]="ratingStars" [stars]="5" (onRate)="onRate($event)"></p-rating>
               <span class="text-xl font-bold ml-2">{{ formData.score }}%</span>
             </div>
           </div>

           <div class="field">
             <label>Feedback</label>
             <textarea pInputTextarea [(ngModel)]="formData.feedback" rows="4" class="w-full bg-slate-800 border-slate-700 text-white rounded-lg p-2" placeholder="Comentarios del desempeño..."></textarea>
           </div>
        </div>

        <ng-template pTemplate="footer">
           <button pButton label="Cancelar" class="p-button-text text-slate-300" (click)="showModal = false"></button>
           <button pButton label="Guardar Evaluación" class="p-button-success" (click)="createReview()" [loading]="saving()"></button>
        </ng-template>
      </p-dialog>

    </div>
  `,
    styles: [`
    .reviews-container {
      padding: 2rem;
      background: radial-gradient(circle at top right, rgba(139, 92, 246, 0.15), transparent 40%),
                  radial-gradient(circle at bottom left, rgba(59, 130, 246, 0.1), transparent 40%);
      min-height: 100vh;
      color: white;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 1.5rem;
    }

    .header-content h1 {
      margin: 0;
      font-size: 2.5rem;
      font-weight: 800;
      background: linear-gradient(135deg, #fff 30%, #c4b5fd 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle { color: #94A3B8; margin-top: 0.5rem; }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 1.5rem;
    }

    .stat-icon {
      width: 56px; height: 56px;
      border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      i { font-size: 1.5rem; color: white; }
    }

    .stat-value { font-size: 2rem; font-weight: 800; display: block; line-height: 1; margin-bottom: 0.25rem; }
    .stat-label { color: #94A3B8; font-size: 0.9rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

    .glass-card {
      background: rgba(30, 41, 59, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 24px;
      backdrop-filter: blur(12px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    
    .table-wrapper { padding: 1rem; }

    .employee-cell { display: flex; align-items: center; gap: 1rem; }
    
    .status-badge {
       padding: 4px 12px;
       border-radius: 999px;
       font-size: 0.75rem;
       font-weight: 700;
       background: rgba(255, 255, 255, 0.1);
       color: #94A3B8;
       display: inline-block;
       
       &.completed {
          background: rgba(16, 185, 129, 0.2);
          color: #34D399;
          border: 1px solid rgba(16, 185, 129, 0.3);
       }
    }

    .field { margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; }
  `]
})
export class PerformanceReviewComponent implements OnInit {
    private reviewService = inject(PerformanceReviewService);
    private staffService = inject(StaffService);
    private demoDataService = inject(DemoDataService);
    private messageService = inject(MessageService);

    reviews = signal<PerformanceReview[]>([]);
    employees = signal<Employee[]>([]);
    loading = signal(true);

    // Stats
    averageScore = signal(0);

    // Modal
    showModal = false;
    saving = signal(false);
    ratingStars = 0;

    formData: CreateReviewDTO = {
        employeeId: '',
        period: '',
        reviewer: 'Admin',
        score: 0,
        feedback: ''
    };

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.loading.set(true);

        // Load Employees
        this.staffService.getAllActive().subscribe({
            next: (emps) => {
                if (emps.length === 0) this.loadDemoEmployees();
                else this.employees.set(emps);
            },
            error: () => this.loadDemoEmployees()
        });

        // Load Reviews
        // En un caso real filtrariamos por tenant, aqui simulamos obtener todas
        this.reviewService.getByEmployee('all').subscribe({
            next: (data) => {
                this.handleReviewsLoaded(data);
            },
            error: () => this.loadDemoReviews()
        });
    }

    loadDemoEmployees() {
        const demoData = this.demoDataService.getTenantDemoData('demo');
        this.employees.set(demoData.rrhh.employees as any[]);
    }

    loadDemoReviews() {
        // Generate Mock Reviews based on employees
        const emps = this.employees();
        const mocks: any[] = emps.map(e => ({
            id: Math.random().toString(36).substr(2, 9),
            employee: e,
            employeeName: e.firstName + ' ' + e.lastName,
            period: '2024-Q4',
            reviewDate: new Date().toISOString(),
            reviewerName: 'Admin RRHH',
            overallScore: 60 + Math.floor(Math.random() * 40), // 60-100
            feedback: 'Buen desempeño general, demostró compromiso con el equipo.',
            status: 'COMPLETED'
        }));

        this.handleReviewsLoaded(mocks);
    }

    handleReviewsLoaded(data: any[]) {
        this.reviews.set(data);

        const total = data.reduce((acc, curr) => acc + curr.overallScore, 0);
        this.averageScore.set(data.length ? total / data.length : 0);

        this.loading.set(false);
    }

    openCreateModal() {
        this.formData = { employeeId: '', period: '2025-Q1', reviewer: 'Admin', score: 0, feedback: '' };
        this.ratingStars = 0;
        this.showModal = true;
    }

    onRate(event: any) {
        this.formData.score = event.value * 20; // 5 stars -> 100 points
    }

    createReview() {
        if (!this.formData.employeeId || !this.formData.score) {
            this.messageService.add({ severity: 'warn', detail: 'Complete empleado y puntaje' });
            return;
        }

        this.saving.set(true);
        this.reviewService.create(this.formData).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Evaluación creada' });
                this.showModal = false;
                this.loadData();
                this.saving.set(false);
            },
            error: () => {
                // Fallback demo
                setTimeout(() => {
                    this.messageService.add({ severity: 'success', summary: 'Demo', detail: 'Evaluación simulada creada' });

                    // Add simple local mock to list without reloading everything
                    const emp = this.employees().find(e => e.id === this.formData.employeeId);
                    const newReview = {
                        id: 'new-demo',
                        employee: emp,
                        employeeName: emp ? emp.firstName + ' ' + emp.lastName : 'N/A',
                        period: this.formData.period,
                        reviewDate: new Date().toISOString(),
                        reviewerName: this.formData.reviewer,
                        overallScore: this.formData.score,
                        feedback: this.formData.feedback,
                        status: 'COMPLETED'
                    };

                    this.reviews.update(prev => [newReview as any, ...prev]);
                    this.showModal = false;
                    this.saving.set(false);
                }, 1000);
            }
        });
    }

    getScoreLabel(score: number) {
        return this.reviewService.getScoreLabel(score);
    }

    getInitials(name: string): string {
        if (!name) return '';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
}
