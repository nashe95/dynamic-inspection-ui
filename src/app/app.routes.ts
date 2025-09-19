import { Routes } from '@angular/router';
import { InspectionComponent } from './modules/inspection/inspection.component';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'inspection',
        pathMatch: 'full'
    },
    {
        path: 'inspection',
        loadComponent: () => import('./modules/inspection/inspection.component').then(() => InspectionComponent),
    },
];
