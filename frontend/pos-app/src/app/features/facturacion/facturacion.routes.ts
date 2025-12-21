import { Routes } from '@angular/router';

export const FACTURACION_ROUTES: Routes = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    {
        path: 'dashboard',
        loadComponent: () => import('./pages/facturacion-dashboard.component').then(m => m.FacturacionDashboardComponent)
    },
    {
        path: 'emitir',
        loadComponent: () => import('./pages/emitir-documento.component').then(m => m.EmitirDocumentoComponent)
    },
    {
        path: 'documentos',
        loadComponent: () => import('./pages/lista-documentos.component').then(m => m.ListaDocumentosComponent)
    },
    {
        path: 'documentos/:id',
        loadComponent: () => import('./pages/detalle-documento.component').then(m => m.DetalleDocumentoComponent)
    },
    {
        path: 'caf',
        loadComponent: () => import('./pages/gestion-caf.component').then(m => m.GestionCafComponent)
    },
    {
        path: 'libro-ventas',
        loadComponent: () => import('./pages/libro-ventas.component').then(m => m.LibroVentasComponent)
    },
    {
        path: 'configuracion',
        loadComponent: () => import('./pages/config-facturacion.component').then(m => m.ConfigFacturacionComponent)
    }
];
