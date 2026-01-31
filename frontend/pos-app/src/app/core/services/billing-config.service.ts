import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BillingConfig {
    id?: string;
    tenantId?: string;
    country: 'CHILE' | 'PERU' | 'ARGENTINA' | 'VENEZUELA' | 'GENERIC_MOCK';
    environment: 'CERTIFICATION' | 'PRODUCTION';
    apiKey?: string;
    certificatePassword?: string;
    active: boolean;
    updatedAt?: string;
}

@Injectable({
    providedIn: 'root'
})
export class BillingConfigService {
    private apiUrl = `${environment.apiUrl}/billing/config`;

    constructor(private http: HttpClient) { }

    getConfig(): Observable<BillingConfig> {
        return this.http.get<BillingConfig>(this.apiUrl);
    }

    saveConfig(config: BillingConfig): Observable<BillingConfig> {
        return this.http.post<BillingConfig>(this.apiUrl, config);
    }
}
