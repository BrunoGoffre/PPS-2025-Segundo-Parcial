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
import { PedidoService } from '../services/pedido.service';
import { Pedido } from '../models/pedido';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-confirmar-pedidos',
  templateUrl: './confirmar-pedidos.page.html',
  styleUrls: ['./confirmar-pedidos.page.scss'],
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
export class ConfirmarPedidosPage implements OnInit {
  isLoading: boolean = true;
  pedidosPorMesa: { [mesa: number]: Pedido[] } = {};
  hayPedidos: boolean = false;

  constructor(private pedidoService: PedidoService) {}

  ngOnInit() {
    this.obtenerPedidosRealizados();
  }

  obtenerPedidosRealizados() {
    this.pedidoService
      .obtenerPedidosPorEstado('realizado')
      .subscribe(async (pedidos) => {
        this.hayPedidos = pedidos.length > 0;
        for (const pedido of pedidos) {
          for (const producto of pedido.productos || []) {
            const productoData = await this.pedidoService.obtenerProductoPorId(
              producto.idProducto
            );
            producto.descripcion = productoData
              ? productoData['descripcion']
              : 'Descripción no disponible';
          }
        }
        this.pedidosPorMesa = this.agruparPedidosPorMesa(pedidos);
        this.isLoading = false;
      });
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

  confirmarPedido(pedidoId: string) {
    this.pedidoService
      .updatePedidoEstado(pedidoId, 'confirmado')
      .then(() => {
        console.log('Pedido confirmado');
      })
      .catch((error) => {
        console.error('Error al confirmar el pedido:', error);
      });
  }
}
