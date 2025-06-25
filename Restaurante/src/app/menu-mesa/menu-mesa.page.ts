import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonButtons,
  IonIcon,
} from '@ionic/angular/standalone';
import { Router, RouterLink } from '@angular/router';
import { User } from '../models/user';
import { Pedido } from '../models/pedido';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { UsersService } from '../services/users.service';
import { PedidoService } from '../services/pedido.service';
import { StatusPedidoAlertComponent } from '../status-pedido-alert/status-pedido-alert.component';
import { CustomAlertComponent } from '../custom-alert/custom-alert.component';

@Component({
  selector: 'app-menu-mesa',
  templateUrl: './menu-mesa.page.html',
  styleUrls: ['./menu-mesa.page.scss'],
  standalone: true,
  imports: [
    CustomAlertComponent,
    StatusPedidoAlertComponent,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    IonButton,
    IonButtons,
    IonIcon,
    RouterLink,
  ],
})
export class MenuMesaPage implements OnInit {
  usuario: User | null = null;
  pedido: Pedido | null = null;
  loading: boolean = true;
  mostrarBotonEstadoPedido: boolean = false;
  private mySubscription!: Subscription;
  estado: string | null = '';

  @ViewChild(StatusPedidoAlertComponent)
  estadoPedidoAlert!: StatusPedidoAlertComponent;
  @ViewChild(CustomAlertComponent) customAlert!: CustomAlertComponent;

  constructor(
    private authService: AuthService,
    private router: Router,
    private usuarioService: UsersService,
    private pedidoService: PedidoService
  ) {}

  async ngOnInit() {
    if (this.usuario == null) {
      this.usuario = await this.usuarioService.getUser(
        this.authService.getUserId()!
      );
    }

    if (this.usuario?.perfil === 'cliente') {
      this.mySubscription = this.pedidoService
        .getPedidoCliente(this.usuario.id!)
        .subscribe((pedidos) => {
          if (pedidos.length > 0) {
            this.pedido = pedidos[0];

            this.mostrarBotonEstadoPedido = this.esEstadoPostConfirmado(
              this.pedido.estado
            );
          } else {
            this.pedido = null;
          }
          this.loading = false;
        });
    } else {
      this.loading = false;
    }
  }

  async verificarEstadoPedido() {
    const idCliente = this.authService.getUserId();
    if (idCliente) {
      const estadoPedido = await this.pedidoService.getStatusPedidoCliente(
        idCliente
      );
      console.log(estadoPedido);
      this.mostrarBotonEstadoPedido = this.esEstadoPostConfirmado(estadoPedido);
    } else {
      console.log('');
    }
  }

  async mostrarEstadoPedido() {
    const idCliente = this.authService.getUserId();

    if (idCliente) {
      const estadoPedido = await this.pedidoService.getStatusPedidoCliente(
        idCliente
      );
      this.estado = estadoPedido;
      if (estadoPedido) {
        this.estadoPedidoAlert.showAlert(estadoPedido);
      } else {
        console.log('No se encontró ningún pedido activo para este cliente.');
      }
    } else {
      console.log('Usuario no autenticado.');
    }
  }

  pedirCuenta(pedidoId: string | undefined, estado: string) {
    if (!pedidoId) {
      this.customAlert.showAlert(
        'Error al procesar su solicitud. Intente nuevamente.'
      );
      return;
    }
    switch (this.pedido?.estado) {
      case 'recibido':
        this.customAlert.showInfo('Su cuenta ha sido solicitada', 'success');
        this.pedidoService.updatePedidoEstado(pedidoId, estado); // Aquí estado sería 'cuenta-pedida'
        break;
      case 'cuenta-pedida':
        this.customAlert.showAlert(
          'Ya ha solicitado la cuenta, aguarde a que se la genere el mozo.'
        );
        break;
      case 'cuenta-enviada':
        this.goTo('pagar-pedido');
        break;
      case 'cobrado':
        this.customAlert.showAlert(
          'Ya ha pagado la cuenta, aguarde a que le cierren la mesa.'
        );
        break;
      default:
        this.customAlert.showAlert('No ha recibido su pedido aún.');
    }
  }

  private esEstadoPostConfirmado(estado: string | null): boolean {
    const estadosPermitidos = [
      'realizado',
      'confirmado',
      'preparado',
      'entregado',
      'recibido',
      'cuenta-pedida',
      'cuenta-enviada',
      'cobrado',
      'finalizado',
    ];
    return estado ? estadosPermitidos.includes(estado) : false;
  }

  goTo(path: string) {
    this.router.navigate([path]);
  }
}
