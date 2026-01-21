import { Component, inject, signal, OnInit, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BranchService, Branch } from '@core/services/branches.service'; // Adjust import if needed, using alias
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-branch-switcher',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="relative inline-block text-left" *ngIf="branches().length > 1">
      <button 
        type="button" 
        (click)="isOpen.set(!isOpen())"
        class="inline-flex items-center justify-between w-full gap-2 px-3 py-2 text-sm font-medium text-white bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
        [class.ring-2]="isOpen()">
        
        <div class="flex items-center gap-2">
          <span class="text-xs text-indigo-200">Sucursal:</span>
          <span class="truncate max-w-[150px]">{{ currentBranch()?.nombre || 'Seleccionar' }}</span>
        </div>
        
        <svg class="w-4 h-4 ml-1 transition-transform" [class.rotate-180]="isOpen()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      <!-- Dropdown menu -->
      <div *ngIf="isOpen()" 
           class="absolute right-0 z-50 mt-2 w-56 origin-top-right bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in zoom-in duration-200">
        <div class="py-1">
          <div class="px-4 py-2 border-b border-gray-100">
            <p class="text-xs text-gray-500 uppercase font-bold">Cambiar Sucursal</p>
          </div>
          
          <button *ngFor="let branch of branches()"
                  (click)="selectBranch(branch)"
                  class="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors group">
            <div class="flex-1 text-left">
              <div class="font-medium">{{ branch.nombre }}</div>
              <div class="text-xs text-gray-400 group-hover:text-indigo-400">{{ branch.codigo }}</div>
            </div>
            <span *ngIf="currentBranch()?.id === branch.id" class="text-indigo-600">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </span>
          </button>
        </div>
      </div>
      
      <!-- Backdrop -->
      <div *ngIf="isOpen()" (click)="isOpen.set(false)" class="fixed inset-0 z-40 cursor-default"></div>
    </div>
  `
})
export class BranchSwitcherComponent implements OnInit {
    private branchService = inject(BranchService);

    branches = signal<Branch[]>([]);
    currentBranch = signal<Branch | null>(null);
    isOpen = signal(false);

    @Output() branchChanged = new EventEmitter<Branch>();

    ngOnInit() {
        this.loadBranches();
    }

    loadBranches() {
        this.branchService.getBranches().subscribe(branches => {
            this.branches.set(branches.filter(b => b.activa));
            this.restoreSelection();
        });
    }

    restoreSelection() {
        const savedId = localStorage.getItem('selected_branch_id');
        const branches = this.branches();

        let selected: Branch | undefined;

        if (savedId) {
            selected = branches.find(b => b.id === savedId);
        }

        if (!selected && branches.length > 0) {
            // Default to principal or first
            selected = branches.find(b => b.esPrincipal) || branches[0];
        }

        if (selected) {
            this.setBranch(selected, false);
        }
    }

    selectBranch(branch: Branch) {
        this.setBranch(branch, true);
        this.isOpen.set(false);
    }

    private setBranch(branch: Branch, emit: boolean) {
        this.currentBranch.set(branch);
        localStorage.setItem('selected_branch_id', branch.id);
        if (emit) {
            this.branchChanged.emit(branch);
            window.location.reload(); // Simple context switch
        }
    }
}
