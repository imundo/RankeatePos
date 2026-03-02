import { Routes } from '@angular/router';
import { ReceivablesComponent } from './receivables.component';

export const CRM_ROUTES: Routes = [
    {
        path: 'cuentas-por-cobrar',
        component: ReceivablesComponent
    },
    {
        path: '',
        redirectTo: 'cuentas-por-cobrar',
        pathMatch: 'full'
    }
];
