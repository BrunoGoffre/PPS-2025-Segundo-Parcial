import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonicModule,
  AlertController,
  LoadingController,
  ToastController,
} from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { UserModel } from 'src/app/models/userModel.model';

@Component({
  selector: 'app-clientes-pendientes-aprobacion',
  templateUrl: './clientes-pendientes-aprobacion.page.html',
  styleUrls: ['./clientes-pendientes-aprobacion.page.scss'],
  standalone: false,
})
export class ClientesPendientesAprobacionPage implements OnInit {
  clientesPendientes: UserModel[] = [];

  constructor(
    private authService: AuthService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.cargarClientesPendientes();
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

      this.clientesPendientes = (users as UserModel[]) || [];

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

  async aceptarCliente(cliente: UserModel) {
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

  async rechazarCliente(cliente: UserModel) {
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
}
