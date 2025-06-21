import { PedidoService } from '../services/pedido.service';
import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';
import { AuthService } from '../services/auth.service';


@Component({
  selector: 'app-estado-pedido-alert',
  templateUrl: './status-pedido-alert.component.html',
  styleUrls: ['./status-pedido-alert.component.scss'],
  imports: [NgIf],
  standalone: true,
})

export class StatusPedidoAlertComponent {

  @Input() estadoPedido: string = ''; 
  show: boolean = false;
  confirmado: boolean = false;
  private pedidoId: string | null | undefined = null;

 
  constructor(private pedidoService: PedidoService,   private authService: AuthService) {}

  async showAlert(estado: string) {
    this.estadoPedido = estado;
    this.show = true;
    this.confirmado = false;

    await this.obtenerPedidoDelUsuario();
  }


  closeAlert() {
    this.show = false;
  }

 
  private friendlyStatus: { [key: string]: string } = {
    'realizado': 'Su pedido ha sido realizado, aguarde a que se lo preparen',
    'confirmado': 'En preparación',
    'preparado': 'Llegará en un momento a la mesa',
   // 'entregado': 'Entregado. Por favor, confirme si lo recibió.',
    'recibido': 'Pedido en la mesa. ¡Que lo disfrutes!',
    'cuenta-pedida': 'Esperando a recibir la cuenta',
    'cobrado': 'Cobrado',
    'finalizado': 'Finalizado'
  };



  getFriendlyStatus(estado: string): string {
    return this.friendlyStatus[estado] || 'Estado desconocido';
  }

 
   get mensajeEstadoPedido(): string {
    if (this.estadoPedido === 'entregado' && !this.confirmado) {
      return 'Su pedido se encuentra: Entregado. Por favor, confirme si lo recibió.';
    }
    return this.getFriendlyStatus(this.estadoPedido);
  }

  confirmarPedido() {
    if (this.pedidoId) {
      this.confirmado = true;
      this.estadoPedido = 'recibido';
      this.playSound();

      this.pedidoService
        .updatePedidoEstado(this.pedidoId, 'recibido')
        .then(() => console.log(`Pedido ${this.pedidoId} actualizado a "recibido"`))
        .catch((error) => console.error('Error al actualizar el estado en Firebase:', error));
    } else {
      console.error('No se encontró un pedido activo para el usuario.');
    }
  }

  private playSound() {
    const audio = new Audio('assets/sounds/conected.mp3');
    audio.play().catch((error) => console.error('Error al reproducir el sonido:', error));
  }

  private async obtenerPedidoDelUsuario() {
    const idUsuario = this.authService.getUserId();

    if (!idUsuario) {
      console.error('No se pudo obtener el ID del usuario activo.');
      return;
    }

    try {
      const pedido = await this.pedidoService.obtenerPedidoClientePromise(idUsuario);
      if (pedido) {
        this.pedidoId = pedido.id;
        console.log(`Pedido encontrado para el usuario: ${this.pedidoId}`);
      } else {
        console.error('No se encontró un pedido activo para el usuario.');
      }
    } catch (error) {
      console.error('Error al buscar el pedido del usuario:', error);
    }
  }


}
