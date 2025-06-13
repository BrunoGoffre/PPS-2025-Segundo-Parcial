import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonicModule,
  AlertController,
  LoadingController,
  ToastController,
} from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { AuthService } from 'src/app/services/auth.service';
import { UserModel } from 'src/app/models/userModel.model';
import { User as LocalUser } from 'src/app/interfaces/user.interface';

@Component({
  selector: 'app-clientes-pendientes-aprobacion',
  templateUrl: './clientes-pendientes-aprobacion.page.html',
  styleUrls: ['./clientes-pendientes-aprobacion.page.scss'],
  standalone: false,
})
export class ClientesPendientesAprobacionPage implements OnInit {
  clientesPendientes: any[] = [];
  currentUser: LocalUser | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private location: Location,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  async ngOnInit() {
    // Verificar permisos antes de cargar datos
    await this.verificarPermisos();
    if (this.tienePermisos()) {
      this.cargarClientesPendientes();
    }
  }

  async verificarPermisos() {
    console.log('[CLIENTES-PAGE] Verificando permisos...');
    
    // Usar el método robusto del AuthService
    const user = await this.authService.getCurrentUserRobust();
    this.currentUser = user as unknown as LocalUser;
    
    console.log('[CLIENTES-PAGE] Usuario obtenido:', this.currentUser);
    console.log('[CLIENTES-PAGE] Rol del usuario:', this.currentUser?.rol);
    
    if (!this.currentUser || !this.tienePermisos()) {
      const toast = await this.toastController.create({
        message: 'No tiene permisos para acceder a esta sección. Rol actual: ' + (this.currentUser?.rol || 'undefined'),
        duration: 5000,
        color: 'danger',
      });
      await toast.present();
      this.router.navigate(['/home']);
    }
  }

  tienePermisos(): boolean {
    const tienePermiso = this.currentUser && 
           (this.currentUser.rol === 'dueño' || this.currentUser.rol === 'supervisor');
    
    console.log('[CLIENTES-PAGE] ¿Tiene permisos?', tienePermiso);
    return !!tienePermiso; // Convertir a boolean explícitamente
  }

  async cargarClientesPendientes() {
    const loading = await this.loadingController.create({
      message: 'Cargando clientes...',
    });
    await loading.present();

    try {
      const { data: users, error } =
        await this.authService.getPendingRegisteredClients();

      if (error) {
        throw error;
      }

      this.clientesPendientes = users || [];

      if (this.clientesPendientes.length === 0) {
        const toast = await this.toastController.create({
          message: 'No hay clientes pendientes de aprobación.',
          duration: 2000,
          color: 'warning',
        });
        toast.present();
      }
    } catch (error: any) {
      this.mostrarError('Error al cargar clientes: ' + error.message);
    } finally {
      loading.dismiss();
    }
  }

  async aceptarCliente(cliente: any) {
    const alert = await this.alertController.create({
      header: 'Confirmar Aprobación',
      message: `¿Estás seguro de que quieres aprobar a ${cliente.surname} ${cliente.name}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Aceptar',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Aprobando cliente...',
            });
            await loading.present();
            try {
              const { error } =
                await this.authService.updateClientApprovalStatus(
                  cliente.id,
                  true
                );

              if (error) {
                throw error;
              }
              const toast = await this.toastController.create({
                message: `Cliente ${cliente.surname} ${cliente.name} aprobado exitosamente.`,
                duration: 2000,
                color: 'success',
              });
              toast.present();
              this.cargarClientesPendientes();
            } catch (error: any) {
              this.mostrarError('Error al aprobar cliente: ' + error.message);
            } finally {
              loading.dismiss();
            }
          },
        },
      ],
    });
    await alert.present();
  }

  async rechazarCliente(cliente: any) {
    const alert = await this.alertController.create({
      header: 'Confirmar Rechazo',
      message: `¿Estás seguro de que quieres rechazar a ${cliente.surname} ${cliente.name}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Rechazar',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Rechazando cliente...',
            });
            await loading.present();
            try {
              const { error } =
                await this.authService.updateClientApprovalStatus(
                  cliente.id,
                  false
                );

              if (error) {
                throw error;
              }

              const toast = await this.toastController.create({
                message: `Cliente ${cliente.surname} ${cliente.name} rechazado.`,
                duration: 2000,
                color: 'danger',
              });
              toast.present();
              this.cargarClientesPendientes();
            } catch (error: any) {
              this.mostrarError('Error al rechazar cliente: ' + error.message);
            } finally {
              loading.dismiss();
            }
          },
        },
      ],
    });
    await alert.present();
  }

  async mostrarError(mensaje: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      message: mensaje,
      buttons: ['OK'],
    });
    await alert.present();
  }

  // Método para obtener la URL de la foto del cliente
  getPhotoUrl(cliente: any): string | null {
    if (cliente.Profile_Photos && Array.isArray(cliente.Profile_Photos) && cliente.Profile_Photos.length > 0) {
      return cliente.Profile_Photos[0].url;
    }
    return null;
  }

  // Método para obtener el label del rol basado en role_Id
  getRoleLabel(roleId: number): string {
    const roleLabels: Record<number, string> = {
      1: 'Dueño',
      2: 'Supervisor',
      3: 'Cliente',
      4: 'Cocinero',
      5: 'Mozo',
      6: 'Bartender',
      9: 'Anónimo',
      10: 'Maître',
    };
    return roleLabels[roleId] || 'Desconocido';
  }

  goBack() {
    this.location.back();
  }
}
