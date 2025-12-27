import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlujoCajaRoutingModule } from './flujo-caja-routing.module';
import { FlujoCajaDashboardComponent } from './pages/flujo-caja-dashboard.component';

@NgModule({
    imports: [
        CommonModule,
        FlujoCajaRoutingModule,
        FlujoCajaDashboardComponent
    ]
})
export class FlujoCajaModule { }
