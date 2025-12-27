import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FlujoCajaDashboardComponent } from './pages/flujo-caja-dashboard.component';

const routes: Routes = [
    { path: '', component: FlujoCajaDashboardComponent },
    {
        path: 'proyeccion',
        loadComponent: () => import('./pages/proyeccion-flujo.component').then(m => m.ProyeccionFlujoComponent)
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class FlujoCajaRoutingModule { }
