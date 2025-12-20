import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    {
        path: 'dashboard',
        loadComponent: () => import('./admin-dashboard.component').then(m => m.AdminDashboardComponent)
    },
    {
        path: 'tenants',
        loadComponent: () => import('./tenant-list.component').then(m => m.TenantListComponent)
    },
    {
        path: 'tenants/new',
        loadComponent: () => import('./tenant-wizard.component').then(m => m.TenantWizardComponent)
    }
];
