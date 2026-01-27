import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';
import { Employee } from './staff.service';

export interface PerformanceReview {
    id: string;
    tenantId: string;
    employee: Employee; // o employeeId si el backend devuelve objeto completo
    period: string;
    reviewDate: string;
    reviewerName: string;
    overallScore: number;
    feedback: string;
    goals?: string;
    status: 'DRAFT' | 'COMPLETED' | 'ACKNOWLEDGED';
    createdAt: string;
}

export interface CreateReviewDTO {
    employeeId: string;
    period: string;
    reviewer: string;
    score: number;
    feedback: string;
}

@Injectable({
    providedIn: 'root'
})
export class PerformanceReviewService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/operations/reviews`;

    create(review: CreateReviewDTO): Observable<PerformanceReview> {
        return this.http.post<PerformanceReview>(this.apiUrl, review);
    }

    getByEmployee(employeeId: string): Observable<PerformanceReview[]> {
        return this.http.get<PerformanceReview[]>(`${this.apiUrl}/employee/${employeeId}`);
    }

    // Helper para obtener label del score
    getScoreLabel(score: number): { label: string, color: 'success' | 'info' | 'warning' | 'danger' } {
        if (score >= 90) return { label: 'Sobresaliente', color: 'success' };
        if (score >= 70) return { label: 'Cumple Expectativas', color: 'info' };
        if (score >= 50) return { label: 'Necesita Mejora', color: 'warning' };
        return { label: 'Insuficiente', color: 'danger' };
    }
}
