import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ComprasDashboardComponent } from './pages/compras-dashboard.component';

const routes: Routes = [
    { path: '', component: ComprasDashboardComponent },
    {
        path: 'proveedores',
        loadComponent: () => import('./pages/proveedores.component').then(m => m.ProveedoresComponent)
    },
    {
        path: 'ordenes-compra',
        loadComponent: () => import('./pages/ordenes-compra.component').then(m => m.OrdenesCompraComponent)
    },
    {
        path: 'ordenes-compra/nueva',
        loadComponent: () => import('./pages/crear-orden-compra.component').then(m => m.CrearOrdenCompraComponent)
    },
    {
        path: 'recepcion',
        loadComponent: () => import('./pages/recepcion-mercaderia.component').then(m => m.RecepcionMercaderiaComponent)
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ComprasRoutingModule { }
