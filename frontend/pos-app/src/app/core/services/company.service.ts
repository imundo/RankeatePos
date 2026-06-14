import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, catchError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { environment } from '@env/environment';

export interface CompanyBranding {
  country?: string;
  currency?: string;
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
        this.http.get<any>(`${environment.apiUrl}/tenants/current`).subscribe({
            next: (tenant) => {
                this.branding.update(b => ({
                    ...this.getDefaultBranding(),
                    ...tenant,
                    nombre: tenant.nombreFantasia || tenant.razonSocial || b.nombre,
                    logoUrl: tenant.logoUrl || b.logoUrl,
                    primaryColor: tenant.primaryColor || b.primaryColor,
                    secondaryColor: tenant.secondaryColor || b.secondaryColor,
                    accentColor: tenant.accentColor || b.accentColor
                }));
                this.applyBrandingStyles(this.branding());
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error loading branding:', err);
                this.loading.set(false);
            }
        });
    }

    saveBranding(data: Partial<CompanyBranding>): Observable<CompanyBranding> {
        const payload = {
            logoUrl: data.logoUrl,
            primaryColor: data.primaryColor,
            secondaryColor: data.secondaryColor,
            accentColor: data.accentColor
        };
        
        return this.http.put<any>(`${environment.apiUrl}/tenants/current/branding`, payload).pipe(
            tap(updated => {
                this.branding.update(b => ({
                    ...b,
                    primaryColor: updated.primaryColor || b.primaryColor,
                    secondaryColor: updated.secondaryColor || b.secondaryColor,
                    accentColor: updated.accentColor || b.accentColor,
                    logoUrl: updated.logoUrl || b.logoUrl
                }));
                this.applyBrandingStyles(this.branding());
            })
        );
    }

    updateLogo(logoDataUrl: string): void {
        this.saveBranding({ logoUrl: logoDataUrl }).subscribe();
    }

    removeLogo(): void {
        this.saveBranding({ logoUrl: '' }).subscribe();
    }

    updateColors(primaryColor: string, secondaryColor: string, accentColor?: string): void {
        this.saveBranding({ primaryColor, secondaryColor, accentColor }).subscribe();
    }

    private applyBrandingStyles(branding: CompanyBranding): void {
        const root = document.documentElement;
        if (branding.primaryColor) {
            root.style.setProperty('--primary-color', branding.primaryColor);
            // Derive a gradient based on the primary color if we want it to be fully dynamic, 
            // for now, we just apply the primary color to the first stop.
            root.style.setProperty('--brand-primary', branding.primaryColor); 
        }
        if (branding.secondaryColor) {
            root.style.setProperty('--secondary-color', branding.secondaryColor);
            root.style.setProperty('--brand-secondary', branding.secondaryColor);
        }
        if (branding.accentColor) {
            root.style.setProperty('--brand-accent', branding.accentColor);
        }
    }

    // ========== DOCUMENTS ==========

    loadDocuments(): void {
        this.http.get<CompanyDocument[]>(`${environment.apiUrl}/tenants/current/documents`).subscribe({
            next: (docs) => {
                this.documents.set(docs);
            },
            error: (err) => console.error('Error loading documents:', err)
        });
    }

    addDocument(doc: Omit<CompanyDocument, 'id' | 'estado' | 'createdAt'>): Observable<CompanyDocument> {
        return this.http.post<CompanyDocument>(`${environment.apiUrl}/tenants/current/documents`, doc).pipe(
            tap(newDoc => {
                this.documents.update(docs => [...docs, newDoc]);
            })
        );
    }

    deleteDocument(id: string): Observable<void> {
        return this.http.delete<void>(`${environment.apiUrl}/tenants/current/documents/${id}`).pipe(
            tap(() => {
                this.documents.update(docs => docs.filter(d => d.id !== id));
            })
        );
    }

    // Check document expiration status locally for immediate UI feedback
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
    }
}
