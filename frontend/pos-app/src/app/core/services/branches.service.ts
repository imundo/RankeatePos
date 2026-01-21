import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Branch {
    id: string;
    codigo: string;
    nombre: string;
    direccion?: string;
    comuna?: string;
    ciudad?: string;
    telefono?: string;
    email?: string;
    activa: boolean;
    esPrincipal: boolean;
}

export interface CreateBranchRequest {
    codigo: string;
    nombre: string;
    direccion?: string;
    comuna?: string;
    ciudad?: string;
    telefono?: string;
    email?: string;
}

export interface UpdateBranchRequest {
    nombre?: string;
    direccion?: string;
    comuna?: string;
    ciudad?: string;
    telefono?: string;
    email?: string;
    activa?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class BranchService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.authUrl}/branches`;

    getBranches(): Observable<Branch[]> {
        return this.http.get<Branch[]>(this.apiUrl);
    }

    getBranch(id: string): Observable<Branch> {
        return this.http.get<Branch>(`${this.apiUrl}/${id}`);
    }

    createBranch(branch: CreateBranchRequest): Observable<Branch> {
        return this.http.post<Branch>(this.apiUrl, branch);
    }

    updateBranch(id: string, branch: UpdateBranchRequest): Observable<Branch> {
        return this.http.put<Branch>(`${this.apiUrl}/${id}`, branch);
    }

    deleteBranch(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    setPrincipal(id: string): Observable<Branch> {
        return this.http.post<Branch>(`${this.apiUrl}/${id}/principal`, {});
    }
}
