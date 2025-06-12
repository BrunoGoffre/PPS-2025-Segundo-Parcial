import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AltaEmpleadoPage } from './alta-empleado.page';

const routes: Routes = [
  {
    path: 'alta',
    component: AltaEmpleadoPage,
  },
  {
    path: '',
    redirectTo: 'alta',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EmpleadoPageRoutingModule {}
