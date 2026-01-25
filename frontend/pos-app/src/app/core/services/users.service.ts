import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { AuthService } from '../auth/auth.service';
import { PageResponse } from './catalog.service';

// DTOs
export interface UserBranch {
    id: string;
    nombre: string;
    codigo: string;
}

export interface User {
    id: string;
    email: string;
    nombre: string;
    apellido?: string;
    telefono?: string;
    activo: boolean;
    emailVerificado: boolean;
    ultimoLogin?: string;
    roles: string[];
    permissions: string[];
    branches: UserBranch[];
    createdAt: string;
}

export interface CreateUserRequest {
    email: string;
    password: string;
    nombre: string;
    apellido?: string;
    telefono?: string;
    roles?: string[];
    branchIds?: string[];
}

export interface UpdateUserRequest {
    nombre?: string;
    apellido?: string;
    telefono?: string;
    activo?: boolean;
    roles?: string[];
    branchIds?: string[];
}

@Injectable({
    providedIn: 'root'
})
export class UsersService {
    private baseUrl = environment.authUrl || 'http://localhost:8081/api';

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    private getHeaders(tenantId?: string) {
        return {
            'X-Tenant-Id': tenantId || this.authService.getTenantId() || '',
            'X-User-Id': this.authService.getUserId() || ''
        };
    }

    // ========== USERS ==========

    getUsers(page = 0, size = 20, search?: string, tenantId?: string): Observable<PageResponse<User>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        if (search) {
            params = params.set('search', search);
        }

        return this.http.get<PageResponse<User>>(`${this.baseUrl}/users`, {
            headers: this.getHeaders(tenantId),
            params
        });
    }

    getUser(id: string, tenantId?: string): Observable<User> {
        return this.http.get<User>(`${this.baseUrl}/users/${id}`, {
            headers: this.getHeaders(tenantId)
        });
    }

    createUser(request: CreateUserRequest, tenantId?: string): Observable<User> {
        return this.http.post<User>(`${this.baseUrl}/users`, request, {
            headers: this.getHeaders(tenantId)
        });
    }

    updateUser(id: string, request: UpdateUserRequest, tenantId?: string): Observable<User> {
        return this.http.put<User>(`${this.baseUrl}/users/${id}`, request, {
            headers: this.getHeaders(tenantId)
        });
    }

    deleteUser(id: string, tenantId?: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/users/${id}`, {
            headers: this.getHeaders(tenantId)
        });
    }

    // ========== ROLES ==========

    getRoles(tenantId?: string): Observable<string[]> {
        return this.http.get<string[]>(`${this.baseUrl}/users/roles`, {
            headers: this.getHeaders(tenantId)
        });
    }

    assignRoles(userId: string, roles: string[], tenantId?: string): Observable<User> {
        return this.http.put<User>(`${this.baseUrl}/users/${userId}/roles`, roles, {
            headers: this.getHeaders(tenantId)
        });
    }

    toggleUserActive(userId: string, tenantId?: string): Observable<User> {
        return this.http.put<User>(`${this.baseUrl}/users/${userId}/toggle-active`, {}, {
            headers: this.getHeaders(tenantId)
        });
    }
}
