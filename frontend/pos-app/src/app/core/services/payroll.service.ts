import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface PayrollRun {
    id: string;
    name: string;
    periodStart: string;
    periodEnd: string;
    status: string;
    totalEmployees: number;
    totalAmount: number;
    processedAt: string;
}

export interface Payroll {
    id: string;
    employee: any; // Simplified for now
    periodStart: string;
    periodEnd: string;
    baseSalary: number;
    taxableIncome: number;
    totalBonuses: number;
    totalDiscounts: number;
    totalPaid: number;
    status: string;
    details?: PayrollDetail[];
}

export interface PayrollDetail {
    conceptCode: string;
    conceptName: string;
    conceptType: string;
    amount: number;
    rate?: number;
}

@Injectable({
    providedIn: 'root'
})
export class PayrollService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/operations/payroll`;

    calculateMonthly(year: number, month: number): Observable<PayrollRun> {
        const params = new HttpParams()
            .set('year', year.toString())
            .set('month', month.toString());
        return this.http.post<PayrollRun>(`${this.baseUrl}/calculate`, {}, { params });
    }

    getHistory(): Observable<Payroll[]> {
        return this.http.get<Payroll[]>(`${this.baseUrl}/history`);
    }

    markAsPaid(id: string): Observable<Payroll> {
        return this.http.put<Payroll>(`${this.baseUrl}/${id}/pay`, {});
    }

    downloadPdf(id: string): Observable<Blob> {
        return this.http.get(`${this.baseUrl}/${id}/pdf`, { responseType: 'blob' });
    }
}
