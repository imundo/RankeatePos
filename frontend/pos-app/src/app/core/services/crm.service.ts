import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface CustomerProfile {
    id?: string;
    tenantId?: string;
    nombre: string;
    email: string;
    telefono: string;
    segmento: string; // VIP, FREQUENT, NEW, REGULAR
    creditLimit: number;
    currentDebt: number;
    availableCredit: number;
    lastPurchaseDate?: string;
    purchaseCount: number;
    totalLTV: number;
}

export interface CreditTransaction {
    id?: string;
    tenantId?: string;
    customerId: string;
    type: 'SALE_ON_CREDIT' | 'PAYMENT' | 'ADJUSTMENT';
    amount: number;
    referenceId?: string;
    notes?: string;
    createdAt?: string;
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

@Injectable({
    providedIn: 'root'
})
export class CrmService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/crm`;

    // --- Profiles ---

    getProfiles(page = 0, size = 20): Observable<PageResponse<CustomerProfile>> {
        return this.http.get<PageResponse<CustomerProfile>>(`${this.apiUrl}/profiles?page=${page}&size=${size}`);
    }

    searchProfiles(query: string): Observable<CustomerProfile[]> {
        return this.http.get<CustomerProfile[]>(`${this.apiUrl}/profiles/search?q=${query}`);
    }

    getProfile(id: string): Observable<CustomerProfile> {
        return this.http.get<CustomerProfile>(`${this.apiUrl}/profiles/${id}`);
    }

    createProfile(profile: Partial<CustomerProfile>): Observable<CustomerProfile> {
        return this.http.post<CustomerProfile>(`${this.apiUrl}/profiles`, profile);
    }

    updateCreditLimit(id: string, newLimit: number): Observable<CustomerProfile> {
        return this.http.put<CustomerProfile>(`${this.apiUrl}/profiles/${id}/limit`, { creditLimit: newLimit });
    }

    // --- Credit & Accounts Receivable (Fiado) ---

    getDebtors(page = 0, size = 20): Observable<PageResponse<CustomerProfile>> {
        return this.http.get<PageResponse<CustomerProfile>>(`${this.apiUrl}/credit/debtors?page=${page}&size=${size}`);
    }

    payCredit(customerId: string, amount: number, paymentMethod: string, notes?: string): Observable<CreditTransaction> {
        return this.http.post<CreditTransaction>(`${this.apiUrl}/credit/${customerId}/pay`, {
            amount,
            paymentMethod,
            notes
        });
    }

    getCreditHistory(customerId: string): Observable<CreditTransaction[]> {
        return this.http.get<CreditTransaction[]>(`${this.apiUrl}/credit/${customerId}/history`);
    }
}
