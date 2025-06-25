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
    path: 'consultas',
    loadComponent: () =>
      import('./consultas/consultas.page').then((m) => m.ConsultasPage),
  },
  {
    path: 'entregar-cuenta',
    loadComponent: () =>
      import('./entregar-cuenta/entregar-cuenta.page').then(
        (m) => m.EntregarCuentaPage
      ),
  },
  {
    path: 'pagar-pedido',
    loadComponent: () =>
      import('./pagar-pedido/pagar-pedido.page').then((m) => m.PagarPedidoPage),
  },
  {
    path: 'chat/:idPedido',
    loadComponent: () => import('./chat/chat.page').then((m) => m.ChatPage),
  },
  {
    path: 'chat',
    loadComponent: () => import('./chat/chat.page').then((m) => m.ChatPage),
  },
  {
    path: 'finalizar-pedidos',
    loadComponent: () =>
      import('./finalizar-pedidos/finalizar-pedidos.page').then(
        (m) => m.FinalizarPedidosPage
      ),
  },
  {
    path: 'tareas-sector',
    loadComponent: () =>
      import('./tareas-sector/tareas-sector.page').then(
        (m) => m.TareasSectorPage
      ),
  },
  {
    path: 'entregar-pedidos',
    loadComponent: () =>
      import('./entregar-pedidos/entregar-pedidos.page').then(
        (m) => m.EntregarPedidosPage
      ),
  },
  {
    path: 'confirmar-pedidos',
    loadComponent: () =>
      import('./confirmar-pedidos/confirmar-pedidos.page').then(
        (m) => m.ConfirmarPedidosPage
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
