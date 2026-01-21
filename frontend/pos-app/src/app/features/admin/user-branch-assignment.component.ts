import { Component, OnInit, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { BranchService, Branch } from '../../core/services/branches.service';

@Component({
    selector: 'app-user-branch-assignment',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h3 class="font-semibold text-slate-800">Sucursales Asignadas</h3>
        <button (click)="editing = !editing" 
                class="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
          {{ editing ? 'Cancelar' : 'Editar' }}
        </button>
      </div>
      
      <div class="p-6">
        <!-- Loading -->
        <div *ngIf="loading" class="flex justify-center py-8">
          <div class="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
        </div>
        
        <!-- View Mode -->
        <div *ngIf="!loading && !editing">
          <div *ngIf="assignedBranches.length === 0" class="text-center py-8 text-slate-500">
            <svg class="w-10 h-10 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
            <p>Sin sucursales asignadas</p>
          </div>
          
          <div class="flex flex-wrap gap-2">
            <span *ngFor="let branch of assignedBranches" 
                  class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-sm">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              {{ branch.nombre }}
            </span>
          </div>
        </div>
        
        <!-- Edit Mode -->
        <div *ngIf="!loading && editing">
          <div class="space-y-2 max-h-64 overflow-y-auto">
            <label *ngFor="let branch of allBranches" 
                   class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                   [class.border-indigo-500]="isBranchSelected(branch.id)"
                   [class.bg-indigo-50]="isBranchSelected(branch.id)">
              <input type="checkbox" 
                     [checked]="isBranchSelected(branch.id)"
                     (change)="toggleBranch(branch.id)"
                     class="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500">
              <div class="flex-1">
                <span class="font-medium text-slate-800">{{ branch.nombre }}</span>
                <span class="text-sm text-slate-500 ml-2">{{ branch.codigo }}</span>
              </div>
              <span *ngIf="branch.esPrincipal" class="text-xs text-amber-600 font-medium">Principal</span>
            </label>
          </div>
          
          <div class="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
            <button (click)="editing = false" class="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
              Cancelar
            </button>
            <button (click)="save()" 
                    [disabled]="saving"
                    class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
              {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class UserBranchAssignmentComponent implements OnInit {
    @Input() userId!: string;
    @Output() changed = new EventEmitter<void>();

    private http = inject(HttpClient);
    private branchService = inject(BranchService);

    allBranches: Branch[] = [];
    assignedBranches: Branch[] = [];
    selectedBranchIds: Set<string> = new Set();
    loading = true;
    editing = false;
    saving = false;

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.loading = true;

        // Load all branches
        this.branchService.getBranches().subscribe({
            next: (branches) => {
                this.allBranches = branches;
                this.loadUserBranches();
            },
            error: (err) => {
                console.error('Error loading branches', err);
                this.loading = false;
            }
        });
    }

    loadUserBranches() {
        this.http.get<string[]>(`${environment.authUrl}/users/${this.userId}/branches`).subscribe({
            next: (branchIds) => {
                this.selectedBranchIds = new Set(branchIds);
                this.assignedBranches = this.allBranches.filter(b => branchIds.includes(b.id));
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading user branches', err);
                this.loading = false;
            }
        });
    }

    isBranchSelected(branchId: string): boolean {
        return this.selectedBranchIds.has(branchId);
    }

    toggleBranch(branchId: string) {
        if (this.selectedBranchIds.has(branchId)) {
            this.selectedBranchIds.delete(branchId);
        } else {
            this.selectedBranchIds.add(branchId);
        }
    }

    save() {
        this.saving = true;
        const branchIds = Array.from(this.selectedBranchIds);

        this.http.put(`${environment.authUrl}/users/${this.userId}/branches`, { branchIds }).subscribe({
            next: () => {
                this.assignedBranches = this.allBranches.filter(b => this.selectedBranchIds.has(b.id));
                this.editing = false;
                this.saving = false;
                this.changed.emit();
            },
            error: (err) => {
                console.error('Error saving branches', err);
                this.saving = false;
            }
        });
    }
}
