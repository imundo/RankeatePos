import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./admin-login.component').then(m => m.AdminLoginComponent)
    },
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
    },
    {
        path: 'tenants/:id/edit',
        loadComponent: () => import('./tenant-wizard.component').then(m => m.TenantWizardComponent)
    },
    {
        path: 'tenants/:id/users',
        loadComponent: () => import('./tenant-users.component').then(m => m.TenantUsersComponent)
    },
    {
        path: 'tenants/:id/users/:userId/permissions',
        loadComponent: () => import('./user-permissions.component').then(m => m.UserPermissionsComponent)
    },
    // Catalog pages
    {
        path: 'plans',
        loadComponent: () => import('./plans-catalog.component').then(m => m.PlansCatalogComponent)
    },
    {
        path: 'modules',
        loadComponent: () => import('./modules-catalog.component').then(m => m.ModulesCatalogComponent)
    },
    {
        path: 'industries',
        loadComponent: () => import('./industries-catalog.component').then(m => m.IndustriesCatalogComponent)
    },
    {
        path: 'roles',
        loadComponent: () => import('./role-manager.component').then(m => m.RoleManagerComponent)
    },
    {
        path: 'audit-logs',
        loadComponent: () => import('./audit-log-viewer.component').then(m => m.AuditLogViewerComponent)
    },
    {
        path: 'branches',
        loadComponent: () => import('./branches.component').then(m => m.BranchesComponent)
    },
    {
        path: 'billing',
        loadComponent: () => import('../settings/billing-config/billing-config.component').then(m => m.BillingConfigComponent)
    }
];

