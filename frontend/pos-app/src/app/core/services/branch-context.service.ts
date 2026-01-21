import { Injectable, signal, computed } from '@angular/core';

export interface BranchContext {
    id: string;
    nombre: string;
    codigo: string;
}

@Injectable({
    providedIn: 'root'
})
export class BranchContextService {
    private readonly STORAGE_KEY = 'active_branch';

    // Reactive state
    private _activeBranch = signal<BranchContext | null>(this.loadFromStorage());

    // Public computed signals
    readonly activeBranch = computed(() => this._activeBranch());
    readonly activeBranchId = computed(() => this._activeBranch()?.id || null);
    readonly hasBranchContext = computed(() => this._activeBranch() !== null);

    constructor() {
        // Listen to storage events from other tabs
        window.addEventListener('storage', (event) => {
            if (event.key === this.STORAGE_KEY) {
                this._activeBranch.set(this.loadFromStorage());
            }
        });
    }

    /**
     * Set the active branch context
     */
    setActiveBranch(branch: BranchContext | null): void {
        this._activeBranch.set(branch);
        this.saveToStorage(branch);
    }

    /**
     * Clear the active branch context
     */
    clearContext(): void {
        this._activeBranch.set(null);
        localStorage.removeItem(this.STORAGE_KEY);
    }

    /**
     * Get branch ID for HTTP headers
     */
    getBranchIdForHeader(): string | null {
        return this._activeBranch()?.id || null;
    }

    private loadFromStorage(): BranchContext | null {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    }

    private saveToStorage(branch: BranchContext | null): void {
        if (branch) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(branch));
        } else {
            localStorage.removeItem(this.STORAGE_KEY);
        }
    }
}
