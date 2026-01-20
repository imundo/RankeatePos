import { Injectable, signal, computed } from '@angular/core';

export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration: number;
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    private toasts = signal<Toast[]>([]);

    readonly activeToasts = computed(() => this.toasts());

    show(message: string, type: Toast['type'] = 'info', duration: number = 3000): void {
        const id = crypto.randomUUID();
        const toast: Toast = { id, message, type, duration };

        this.toasts.update(list => [...list, toast]);

        if (duration > 0) {
            setTimeout(() => this.dismiss(id), duration);
        }
    }

    success(message: string, duration?: number): void {
        this.show(message, 'success', duration);
    }

    error(message: string, duration?: number): void {
        this.show(message, 'error', duration ?? 5000);
    }

    warning(message: string, duration?: number): void {
        this.show(message, 'warning', duration);
    }

    info(message: string, duration?: number): void {
        this.show(message, 'info', duration);
    }

    dismiss(id: string): void {
        this.toasts.update(list => list.filter(t => t.id !== id));
    }

    dismissAll(): void {
        this.toasts.set([]);
    }
}
