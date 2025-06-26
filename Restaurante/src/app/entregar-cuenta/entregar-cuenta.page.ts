import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButtons,
  IonSpinner,
  IonIcon,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonList,
  IonItem,
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { Pedido } from '../models/pedido';
import { PedidoService } from '../services/pedido.service';

@Component({
  selector: 'app-entregar-cuenta',
  templateUrl: './entregar-cuenta.page.html',
  styleUrls: ['./entregar-cuenta.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonButtons,
    IonSpinner,
    IonIcon,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonButton,
    IonList,
    IonItem,
    RouterLink,
  ],
})
export class EntregarCuentaPage implements OnInit {
  isLoading: boolean = true;
  pedidosPorMesa: { [mesa: number]: Pedido[] } = {};
  public Object = Object;

  constructor(private pedidoService: PedidoService) {}

  ngOnInit() {
    this.obtenerPedidos();
  }

  async obtenerPedidos() {
    this.pedidoService
      .obtenerPedidosPorEstado('cuenta-pedida')
      .subscribe((pedidosConfirmados) => {
        const pedidos = pedidosConfirmados;
        this.procesarPedidos(pedidos);
      });
  }

  async procesarPedidos(pedidos: Pedido[]) {
    for (const pedido of pedidos) {
      for (const producto of pedido.productos || []) {
        const productoData = await this.pedidoService.obtenerProductoPorId(
          producto.idProducto
        );
        producto.nombre = productoData
          ? productoData['nombre']
          : 'Nombre no disponible';
        producto.precio = productoData
          ? productoData['precio']
          : 'Precio no disponible';
      }
    }
    this.pedidosPorMesa = this.agruparPedidosPorMesa(pedidos);
    console.log('Pedidos por mesa agrupados:', this.pedidosPorMesa); // Verifica el agrupamiento final
    this.isLoading = false;
  }

  agruparPedidosPorMesa(pedidos: Pedido[]): { [mesa: number]: Pedido[] } {
    return pedidos.reduce((acc: { [mesa: number]: Pedido[] }, pedido) => {
      const mesa = +pedido.mesaNumero;
      if (!acc[mesa]) {
        acc[mesa] = [];
      }
      acc[mesa].push(pedido);
      return acc;
    }, {} as { [mesa: number]: Pedido[] });
  }

  entregarPedido(pedidoId: string) {
    this.pedidoService
      .updatePedidoEstado(pedidoId, 'cuenta-enviada')
      .then(() => {
        console.log('Pedido entregado');
      })
      .catch((error) => {
        console.error('Error al confirmar el pedido:', error);
      });
  }
}
