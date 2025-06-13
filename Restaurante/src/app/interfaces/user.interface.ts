export interface User {
  id: number;
  email: string;
  password: string;
  rol: 'cliente' | 'supervisor' | 'dueño' | 'empleado' | 'anonimo';
  nombre?: string;
  apellido?: string;
  dni?: string;
  foto_url?: string;
  estado?: 'pendiente' | 'aprobado' | 'rechazado';
}

export interface QuickAccessUser {
  email: string;
  password: string;
  rol: string;
  displayName: string;
}

export type RegisterSource = 'login' | 'supervisor' | 'owner' | 'anonimo' | 'admin'; 