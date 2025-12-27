import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PresupuestoRoutingModule } from './presupuesto-routing.module';
import { PresupuestoDashboardComponent } from './pages/presupuesto-dashboard.component';

@NgModule({
    imports: [
        CommonModule,
        PresupuestoRoutingModule,
        PresupuestoDashboardComponent
    ]
})
export class PresupuestoModule { }
