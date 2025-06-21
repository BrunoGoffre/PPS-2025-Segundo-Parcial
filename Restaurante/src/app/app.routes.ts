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

	// Ruta por defecto
	{
		path: '**',
		redirectTo: '/login',
		pathMatch: 'full',
	},
];