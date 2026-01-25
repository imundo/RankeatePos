import { Component, inject, signal, OnInit, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BranchService, Branch } from '@core/services/branches.service'; // Adjust import if needed, using alias
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-branch-switcher',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="branch-switcher relative" *ngIf="branches().length > 1">
      <button 
        type="button" 
        (click)="isOpen.set(!isOpen())"
        class="switcher-btn group"
        [class.active]="isOpen()">
        
        <div class="btn-content">
          <div class="icon-wrapper">
            <svg class="w-4 h-4 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m8-2a2 2 0 00-2-2H9a2 2 0 00-2 2v2m7-2a2 2 0 01-2-2h-3"/>
            </svg>
          </div>
          <div class="text-info">
            <span class="label">Sucursal Actual</span>
            <span class="value">{{ currentBranch()?.nombre || 'Seleccionar' }}</span>
          </div>
        </div>
        
        <div class="chevron-wrapper" [class.rotate]="isOpen()">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
      </button>

      <!-- Dropdown menu -->
      <div *ngIf="isOpen()" 
           class="dropdown-menu">
        <div class="dropdown-header">
          <span class="header-title">Mis Sucursales</span>
          <span class="header-badge">{{ branches().length }}</span>
        </div>
        
        <div class="dropdown-content">
          <button *ngFor="let branch of branches()"
                  (click)="selectBranch(branch)"
                  class="branch-item group"
                  [class.selected]="currentBranch()?.id === branch.id">
            <div class="item-visuals">
              <div class="item-icon">
                <span class="text-xs font-bold">{{ branch.codigo.substring(0,2) }}</span>
              </div>
            </div>
            <div class="item-info">
              <div class="item-name">{{ branch.nombre }}</div>
              <div class="item-meta">
                <span class="item-code">{{ branch.codigo }}</span>
                <span class="item-city" *ngIf="branch.ciudad">• {{ branch.ciudad }}</span>
              </div>
            </div>
            <div class="item-status" *ngIf="currentBranch()?.id === branch.id">
              <div class="status-dot"></div>
            </div>
          </button>
        </div>
      </div>
      
      <!-- Backdrop -->
      <div *ngIf="isOpen()" (click)="isOpen.set(false)" class="fixed inset-0 z-40 cursor-default"></div>
    </div>
  `,
  styles: [`
    .branch-switcher {
      font-family: 'Inter', sans-serif;
    }
    
    .switcher-btn {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.5rem 0.75rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      width: 240px;
      backdrop-filter: blur(8px);
    }
    
    .switcher-btn:hover, .switcher-btn.active {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
    }
    
    .btn-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-align: left;
    }
    
    .icon-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: rgba(99, 102, 241, 0.1);
      border-radius: 8px;
    }
    
    .text-info {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }
    
    .label {
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: rgba(255, 255, 255, 0.5);
      font-weight: 600;
    }
    
    .value {
      font-size: 0.85rem;
      font-weight: 500;
      color: white;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 130px;
    }
    
    .chevron-wrapper {
      color: rgba(255, 255, 255, 0.4);
      transition: transform 0.3s ease;
    }
    
    .chevron-wrapper.rotate {
      transform: rotate(180deg);
      color: white;
    }
    
    /* Dropdown */
    .dropdown-menu {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      width: 280px;
      background: #1a1b26;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.5);
      z-index: 50;
      overflow: hidden;
      animation: slideDown 0.2s ease-out;
    }
    
    .dropdown-header {
      padding: 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      background: rgba(0, 0, 0, 0.2);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .header-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.6);
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .header-badge {
      background: rgba(99, 102, 241, 0.2);
      color: #818cf8;
      font-size: 0.7rem;
      padding: 2px 8px;
      border-radius: 10px;
      font-weight: 600;
    }
    
    .dropdown-content {
      padding: 0.5rem;
      max-height: 300px;
      overflow-y: auto;
    }
    
    .branch-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.75rem;
      border-radius: 10px;
      background: transparent;
      border: none;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s ease;
    }
    
    .branch-item:hover {
      background: rgba(255, 255, 255, 0.05);
    }
    
    .branch-item.selected {
      background: rgba(99, 102, 241, 0.1);
    }
    
    .item-visuals {
      position: relative;
    }
    
    .item-icon {
      width: 36px;
      height: 36px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255, 255, 255, 0.6);
      transition: all 0.2s;
    }
    
    .branch-item.selected .item-icon {
      background: #4f46e5;
      color: white;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
    }
    
    .item-info {
      flex: 1;
      overflow: hidden;
    }
    
    .item-name {
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.9rem;
      font-weight: 500;
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .branch-item.selected .item-name {
      color: white;
    }
    
    .item-meta {
      display: flex;
      gap: 4px;
      color: rgba(255, 255, 255, 0.4);
      font-size: 0.75rem;
    }
    
    .status-dot {
      width: 8px;
      height: 8px;
      background: #4f46e5;
      border-radius: 50%;
      box-shadow: 0 0 8px #4f46e5;
    }
    
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
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
