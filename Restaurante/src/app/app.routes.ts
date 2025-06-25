import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'encuesta-empleado',
    loadComponent: () =>
      import('./encuestas/encuesta-empleado/encuesta-empleado.page').then(
        (m) => m.EncuestaEmpleadoPage
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'menu-mesa',
    loadComponent: () =>
      import('./menu-mesa/menu-mesa.page').then((m) => m.MenuMesaPage),
  },
  {
    path: 'encuesta-clientes',
    loadComponent: () =>
      import('./encuestas/encuesta-clientes/encuesta-clientes.page').then(
        (m) => m.EncuestaPage
      ),
  },
  {
    path: 'pedido-cliente',
    loadComponent: () =>
      import('./pedido-cliente/pedido-cliente.page').then(
        (m) => m.PedidoClientePage
      ),
  },
  {
    path: 'resultados-encuestas',
    loadComponent: () =>
      import('./encuestas/resultados-encuestas/resultados-encuestas.page').then(
        (m) => m.ResultadosEncuestasPage
      ),
  },
  {
    path: 'clientes-pendientes',
    loadComponent: () =>
      import('./clientes-pendientes/clientes-pendientes.page').then(
        (m) => m.ClientesPendientesPage
      ),
  },
  {
    path: 'lista-espera',
    loadComponent: () =>
      import('./lista-espera/lista-espera.page').then((m) => m.ListaEsperaPage),
  },
  // Ruta por defecto
  {
    path: '**',
    redirectTo: '/login',
    pathMatch: 'full',
  },
];
