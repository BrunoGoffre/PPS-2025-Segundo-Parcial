import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { User as LocalUser } from '../interfaces/user.interface';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  currentUser: LocalUser | null = null;
  isLoading = true;

  constructor(
    private router: Router,
    private authService: AuthService,
    private alertController: AlertController
  ) {}

  async ngOnInit() {
    await this.loadCurrentUser();
  }

  async loadCurrentUser() {
    try {
      const authUser = await this.authService.getCurrentUserRobust();
      if (authUser) {
        this.currentUser = authUser as unknown as LocalUser;
      }
      // Nota: No redirigimos a login si no hay usuario, 
      // permitimos acceso a home para usuarios no autenticados
    } catch (error) {
      console.error('Error al cargar usuario:', error);
      // No redirigimos en caso de error, solo mostramos el home sin usuario
    } finally {
      this.isLoading = false;
    }
  }

  // Getter para verificar si es dueño o supervisor
  get canAccessClientes() {
    return this.currentUser && 
           (this.currentUser.rol === 'dueño' || this.currentUser.rol === 'supervisor');
  }

  // Getter para verificar si es dueño
  get isDueno() {
    return this.currentUser?.rol === 'dueño';
  }

  // Getter para verificar si es supervisor
  get isSupervisor() {
    return this.currentUser?.rol === 'supervisor';
  }

  // Getter para verificar si es empleado
  get isEmpleado() {
    return this.currentUser?.rol === 'empleado';
  }

  // Navegación a clientes
  goToClientes() {
    if (this.canAccessClientes) {
      this.router.navigateByUrl('/clientes/clientes');
    }
  }

  // Navegación a alta de empleados
  goToAltaEmpleado() {
    if (this.canAccessClientes) {
      this.router.navigateByUrl('/empleado');
    }
  }

  // Cerrar sesión
  async logout() {
    const alert = await this.alertController.create({
      header: 'Cerrar sesión',
      message: '¿Estás seguro que quieres cerrar sesión?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Cerrar sesión',
          handler: async () => {
            await this.authService.logout();
            this.router.navigateByUrl('/login');
          }
        }
      ]
    });
    await alert.present();
  }

  // Obtener saludo personalizado
  getGreeting(): string {
    const now = new Date();
    const hour = now.getHours();
    
    if (hour < 12) {
      return 'Buenos días';
    } else if (hour < 18) {
      return 'Buenas tardes';
    } else {
      return 'Buenas noches';
    }
  }

  // Navegación a login
  goToLogin() {
    this.router.navigateByUrl('/login');
  }

  // Navegación a registro
  goToRegister() {
    this.router.navigateByUrl('/register');
  }
}
