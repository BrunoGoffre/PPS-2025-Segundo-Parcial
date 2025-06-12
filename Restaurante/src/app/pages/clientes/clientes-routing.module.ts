import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ClientesPendientesAprobacionPage } from './clientes-pendientes-aprobacion.page';

const routes: Routes = [
  {
    path: 'clientes',
    component: ClientesPendientesAprobacionPage,
  },
  {
    path: '',
    redirectTo: 'clientes',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClientesRoutingModule {}
