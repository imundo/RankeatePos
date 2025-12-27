import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RemuneracionesRoutingModule } from './remuneraciones-routing.module';
import { RemuneracionesDashboardComponent } from './pages/remuneraciones-dashboard.component';

@NgModule({
    imports: [
        CommonModule,
        RemuneracionesRoutingModule,
        RemuneracionesDashboardComponent
    ]
})
export class RemuneracionesModule { }
