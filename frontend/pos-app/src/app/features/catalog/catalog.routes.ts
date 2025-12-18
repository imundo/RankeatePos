import { Routes } from '@angular/router';

export const CATALOG_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./catalog-list/catalog-list.component').then(m => m.CatalogListComponent)
    },
    {
        path: 'manager',
        loadComponent: () => import('./catalog-manager/catalog-manager.component').then(m => m.CatalogManagerComponent)
    }
];
