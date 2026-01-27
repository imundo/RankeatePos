import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface Shift {
    id: string;
    employee: any; // Simplified employee object
    startTime: string;
    endTime: string;
    type: 'MORNING' | 'AFTERNOON' | 'NIGHT' | 'CUSTOM';
    status: 'SCHEDULED' | 'COMPLETED' | 'ABSENT';
}

export interface CreateShiftRequest {
    employeeId: string;
    start: string; // ISO DateTime
    end: string; // ISO DateTime
    type: string;
}

@Injectable({
    providedIn: 'root'
})
export class ShiftService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/operations/shifts`;

    getShifts(start: Date, end: Date): Observable<Shift[]> {
        const params = new HttpParams()
            .set('start', start.toISOString())
            .set('end', end.toISOString());
        return this.http.get<Shift[]>(this.baseUrl, { params });
    }

    createShift(request: CreateShiftRequest): Observable<Shift> {
        return this.http.post<Shift>(this.baseUrl, request);
    }

    updateShift(id: string, request: CreateShiftRequest): Observable<Shift> {
        return this.http.put<Shift>(`${this.baseUrl}/${id}`, request);
    }

    deleteShift(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }
}
