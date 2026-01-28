import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface AttendanceRecord {
    id: string;
    tenantId: string;
    employeeId: string;
    employeeName?: string; // Should be populated by backend or mapped in frontend
    clockInTime: string;
    clockOutTime?: string;
    status: 'PRESENT' | 'LATE' | 'ABSENT' | 'Left Early';
    workDurationSeconds?: number;
    breakDurationSeconds?: number;
}

export interface MonthlyAttendance {
    date: string;
    records: AttendanceRecord[];
}

export interface ClockResponse {
    type: 'CLOCK_IN' | 'CLOCK_OUT';
    employeeName: string;
    timestamp: string;
    status?: string;
}

export interface ValidateLinkResponse {
    valid: boolean;
    name?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AttendanceService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/operations/attendance`;
    private publicUrl = `${environment.apiUrl}/public/attendance`; // Assuming public endpoint convention

    constructor() { }

    /**
     * Get monthly attendance records for the tenant
     */
    getMonthly(year: number, month: number): Observable<AttendanceRecord[]> {
        const params = new HttpParams()
            .set('year', year.toString())
            .set('month', month.toString());

        return this.http.get<AttendanceRecord[]>(`${this.baseUrl}/monthly`, { params });
    }

    /**
     * Register clock-in via PIN (Authenticated context)
     */
    clockIn(pin: string): Observable<AttendanceRecord> {
        return this.http.post<AttendanceRecord>(`${this.baseUrl}/clock-in`, { pin });
    }

    /**
     * Validate public attendance link token
     */
    validateLink(token: string): Observable<ValidateLinkResponse> {
        return this.http.get<ValidateLinkResponse>(`${this.publicUrl}/validate/${token}`);
    }

    /**
     * Public clock-in via Token + PIN
     */
    publicClock(token: string, pin: string): Observable<ClockResponse> {
        return this.http.post<ClockResponse>(`${this.publicUrl}/clock/${token}`, { pin });
    }

    /**
     * Generate a new public attendance link
     */
    generatePublicLink(): Observable<{ token: string, url: string }> {
        // Mock implementation if backend not ready, but assuming endpoint structure
        return this.http.post<{ token: string, url: string }>(`${this.baseUrl}/generate-link`, {});
    }

    /**
     * Add justification for late arrival or absence
     */
    addJustification(recordId: string, justification: string): Observable<AttendanceRecord> {
        return this.http.put<AttendanceRecord>(`${this.baseUrl}/${recordId}/justification`, { justification });
    }

    exportReport(format: 'EXCEL' | 'PDF', year: number, month: number): Observable<Blob> {
        const params = new HttpParams()
            .set('format', format)
            .set('year', year.toString())
            .set('month', month.toString());

        return this.http.get(`${this.baseUrl}/report`, { params, responseType: 'blob' });
    }
}
