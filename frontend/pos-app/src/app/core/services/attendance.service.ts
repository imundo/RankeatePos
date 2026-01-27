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

@Injectable({
    providedIn: 'root'
})
export class AttendanceService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/operations/attendance`;

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
     * Register clock-in via PIN
     * Note: This might be used in a shared kiosk mode
     */
    clockIn(pin: string): Observable<AttendanceRecord> {
        return this.http.post<AttendanceRecord>(`${this.baseUrl}/clock-in`, { pin });
    }
}
