import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, catchError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { environment } from '@env/environment';

export interface CompanyBranding {
    id?: string;
    tenantId?: string;
    nombre: string;
    rut: string;
    giro: string;
    direccion: string;
    comuna: string;
    ciudad: string;
    telefono: string;
    email: string;
    website: string;
    logoUrl: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    theme: 'dark' | 'light' | 'custom';
}

export interface CompanyDocument {
    id: string;
    tenantId?: string;
    nombre: string;
    tipo: string;
    fechaVencimiento?: string;
    archivoUrl?: string;
    estado: 'VIGENTE' | 'POR_VENCER' | 'VENCIDO';
    createdAt?: string;
}

const STORAGE_KEY = 'company_branding';
const DOCS_STORAGE_KEY = 'company_documents';

@Injectable({
    providedIn: 'root'
})
export class CompanyService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private baseUrl = `${environment.apiUrl}/company`;

    // Signals for reactive state
    readonly branding = signal<CompanyBranding>(this.getDefaultBranding());
    readonly documents = signal<CompanyDocument[]>([]);
    readonly loading = signal(false);

    private getDefaultBranding(): CompanyBranding {
        return {
            nombre: '',
            rut: '',
            giro: '',
            direccion: '',
            comuna: '',
            ciudad: '',
            telefono: '',
            email: '',
            website: '',
            logoUrl: '',
            primaryColor: '#6366F1',
            secondaryColor: '#EC4899',
            accentColor: '#10B981',
            theme: 'dark'
        };
    }

    // ========== BRANDING ==========

    loadBranding(): void {
        this.loading.set(true);

        // Try localStorage first
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
            try {
                const data = JSON.parse(cached);
                this.branding.set({ ...this.getDefaultBranding(), ...data });
            } catch (e) {
                console.error('Error parsing cached branding:', e);
            }
        }

        // Also load from tenant info
        const tenant = this.authService.tenant();
        if (tenant) {
            this.branding.update(b => ({
                ...b,
                nombre: tenant.nombre || b.nombre,
                rut: tenant.rut || b.rut
            }));
        }

        this.loading.set(false);
    }

    saveBranding(data: Partial<CompanyBranding>): Observable<CompanyBranding> {
        const updated = { ...this.branding(), ...data };

        // Save to localStorage immediately
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        this.branding.set(updated);

        // Apply CSS variables
        this.applyBrandingStyles(updated);

        return of(updated);
    }

    updateLogo(logoDataUrl: string): void {
        this.branding.update(b => ({ ...b, logoUrl: logoDataUrl }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.branding()));
    }

    removeLogo(): void {
        this.branding.update(b => ({ ...b, logoUrl: '' }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.branding()));
    }

    updateColors(primaryColor: string, secondaryColor: string, accentColor?: string): void {
        this.branding.update(b => ({
            ...b,
            primaryColor,
            secondaryColor,
            accentColor: accentColor || b.accentColor
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.branding()));
        this.applyBrandingStyles(this.branding());
    }

    private applyBrandingStyles(branding: CompanyBranding): void {
        const root = document.documentElement;
        root.style.setProperty('--brand-primary', branding.primaryColor);
        root.style.setProperty('--brand-secondary', branding.secondaryColor);
        root.style.setProperty('--brand-accent', branding.accentColor);
    }

    // ========== DOCUMENTS ==========

    loadDocuments(): void {
        // Load from localStorage
        const cached = localStorage.getItem(DOCS_STORAGE_KEY);
        if (cached) {
            try {
                this.documents.set(JSON.parse(cached));
            } catch (e) {
                console.error('Error parsing cached documents:', e);
                this.documents.set([]);
            }
        }
    }

    addDocument(doc: Omit<CompanyDocument, 'id'>): CompanyDocument {
        const newDoc: CompanyDocument = {
            ...doc,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString()
        };

        this.documents.update(docs => [...docs, newDoc]);
        localStorage.setItem(DOCS_STORAGE_KEY, JSON.stringify(this.documents()));

        return newDoc;
    }

    updateDocument(id: string, data: Partial<CompanyDocument>): void {
        this.documents.update(docs =>
            docs.map(d => d.id === id ? { ...d, ...data } : d)
        );
        localStorage.setItem(DOCS_STORAGE_KEY, JSON.stringify(this.documents()));
    }

    deleteDocument(id: string): void {
        this.documents.update(docs => docs.filter(d => d.id !== id));
        localStorage.setItem(DOCS_STORAGE_KEY, JSON.stringify(this.documents()));
    }

    // Check document expiration status
    checkDocumentStatus(doc: CompanyDocument): 'VIGENTE' | 'POR_VENCER' | 'VENCIDO' {
        if (!doc.fechaVencimiento) return 'VIGENTE';

        const expiry = new Date(doc.fechaVencimiento);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry < 0) return 'VENCIDO';
        if (daysUntilExpiry <= 30) return 'POR_VENCER';
        return 'VIGENTE';
    }

    refreshDocumentStatuses(): void {
        this.documents.update(docs =>
            docs.map(d => ({ ...d, estado: this.checkDocumentStatus(d) }))
        );
        localStorage.setItem(DOCS_STORAGE_KEY, JSON.stringify(this.documents()));
    }
}
