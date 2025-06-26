import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Pedido } from '../models/pedido';
import { Subscription } from 'rxjs';
import { PedidoService } from '../services/pedido.service';
import { Router, RouterLink } from '@angular/router';
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
import { CustomAlertComponent } from '../custom-alert/custom-alert.component';
import { MesaService } from '../services/mesa.service';

@Component({
  selector: 'app-finalizar-pedidos',
  templateUrl: './finalizar-pedidos.page.html',
  styleUrls: ['./finalizar-pedidos.page.scss'],
  standalone: true,
  imports: [
    RouterLink,
    CustomAlertComponent,
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
  ],
})
export class FinalizarPedidosPage implements OnInit {
  pedidos: Pedido[] = [];
  isLoading: boolean = false;
  private mySubscription!: Subscription;

  @ViewChild(CustomAlertComponent) customAlert!: CustomAlertComponent;

  constructor(
    private router: Router,
    private pedidoService: PedidoService,
    private mesaService: MesaService
  ) {}

  ngOnInit() {
    this.obtenerPedidosCobrados();
  }

  obtenerPedidosCobrados() {
    this.isLoading = true;
    this.pedidoService.obtenerPedidosPorEstado('cobrado').subscribe(
      (pedidos) => {
        if (pedidos.length > 0) {
          this.pedidos = pedidos;
        } else {
          this.pedidos = [];
        }
        this.isLoading = false;
      },
      (error) => {
        console.error('Error al obtener pedidos:', error);
        this.customAlert.showAlert('Error al cargar los pedidos.');
        this.isLoading = false;
      }
    );
  }

  finalizarPedido(pedidoId: string) {
    const pedido = this.pedidos.find((p) => p.id === pedidoId);
    if (!pedido) {
      return;
    }
    this.pedidoService
      .actualizarPedido({ id: pedidoId, estado: 'finalizado' })
      .then(async () => {
        console.log('Pedido actualizado:', pedidoId);

        if (pedido.mesaNumero) {
          console.log('Desasignando mesa:', pedido.mesaNumero);
          await this.mesaService.desasignarPorNumeroMesa(
            pedido.mesaNumero.toString()
          );
          console.log('Mesa desasignada exitosamente:', pedido.mesaNumero);
        } else {
          console.log('El pedido no tiene número de mesa asociado:', pedidoId);
        }
        this.obtenerPedidosCobrados();
      })
      .catch((error) => {
        console.error(
          'Error al finalizar el pedido o desasignar la mesa:',
          error
        );
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  ngOnDestroy() {
    if (this.mySubscription) {
      this.mySubscription.unsubscribe();
    }
  }
}
