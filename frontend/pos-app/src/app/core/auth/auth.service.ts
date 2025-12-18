import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '@env/environment';

export interface AuthUser {
    id: string;
    email: string;
    nombre: string;
    apellido?: string;
    roles: string[];
    permissions: string[];
}

export interface AuthTenant {
    id: string;
    rut: string;
    nombre: string;
    businessType: string;
    plan: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
    user: AuthUser;
    tenant: AuthTenant;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    rut: string;
    razonSocial: string;
    nombreFantasia?: string;
    giro?: string;
    direccion?: string;
    comuna?: string;
    region?: string;
    businessType?: string;
    email: string;
    password: string;
    nombre: string;
    apellido?: string;
    telefono?: string;
}

const TOKEN_KEY = 'pos_access_token';
const REFRESH_TOKEN_KEY = 'pos_refresh_token';
const USER_KEY = 'pos_user';
const TENANT_KEY = 'pos_tenant';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private userSignal = signal<AuthUser | null>(this.loadUser());
    private tenantSignal = signal<AuthTenant | null>(this.loadTenant());

    user = this.userSignal.asReadonly();
    tenant = this.tenantSignal.asReadonly();

    isAuthenticated = computed(() => !!this.userSignal() && !!this.getToken());

    constructor(
        private http: HttpClient,
        private router: Router
    ) { }

    register(request: RegisterRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${environment.authUrl}/auth/register`, request).pipe(
            tap(response => this.handleAuthResponse(response)),
            catchError(err => throwError(() => err))
        );
    }

    login(request: LoginRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${environment.authUrl}/auth/login`, request).pipe(
            tap(response => this.handleAuthResponse(response)),
            catchError(err => throwError(() => err))
        );
    }

    refreshToken(): Observable<AuthResponse> {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (!refreshToken) {
            return throwError(() => new Error('No refresh token'));
        }

        return this.http.post<AuthResponse>(`${environment.authUrl}/auth/refresh`, { refreshToken }).pipe(
            tap(response => this.handleAuthResponse(response)),
            catchError(err => {
                this.logout();
                return throwError(() => err);
            })
        );
    }

    logout(): void {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TENANT_KEY);
        this.userSignal.set(null);
        this.tenantSignal.set(null);
        this.router.navigate(['/auth/login']);
    }

    getToken(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    }

    getTenantId(): string | null {
        return this.tenantSignal()?.id ?? null;
    }

    getUserId(): string | null {
        return this.userSignal()?.id ?? null;
    }

    hasRole(role: string): boolean {
        return this.userSignal()?.roles?.includes(role) ?? false;
    }

    hasPermission(permission: string): boolean {
        return this.userSignal()?.permissions?.includes(permission) ?? false;
    }

    private handleAuthResponse(response: AuthResponse): void {
        localStorage.setItem(TOKEN_KEY, response.accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
        localStorage.setItem(TENANT_KEY, JSON.stringify(response.tenant));
        this.userSignal.set(response.user);
        this.tenantSignal.set(response.tenant);
    }

    private loadUser(): AuthUser | null {
        const stored = localStorage.getItem(USER_KEY);
        return stored ? JSON.parse(stored) : null;
    }

    private loadTenant(): AuthTenant | null {
        const stored = localStorage.getItem(TENANT_KEY);
        return stored ? JSON.parse(stored) : null;
    }
}
