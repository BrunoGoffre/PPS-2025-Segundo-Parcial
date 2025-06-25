import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonSelect,
  IonSelectOption,
  IonButtons,
  IonIcon,
  IonSpinner,
} from '@ionic/angular/standalone';
import { MesaService } from '../services/mesa.service';
import { UsersService } from '../services/users.service';
import { User } from '../models/user';
import { Observable, of, Subject } from 'rxjs';
import { DocumentData } from '@angular/fire/firestore';
import { CustomAlertComponent } from '../custom-alert/custom-alert.component';
import { PedidoService } from '../services/pedido.service';
import { Pedido } from '../models/pedido';
import { RouterLink } from '@angular/router';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-lista-espera',
  templateUrl: './lista-espera.page.html',
  styleUrls: ['./lista-espera.page.scss'],
  standalone: true,
  imports: [
    CustomAlertComponent,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    IonButtons,
    IonIcon,
    RouterLink,
    IonSpinner,
  ],
})
export class ListaEsperaPage {
  @ViewChild(CustomAlertComponent) customAlert!: CustomAlertComponent;

  mesasLibres$: Observable<DocumentData[]> = of([]);
  pedidoSeleccionado: { pedido: Pedido; cliente: User } | null = null;
  mesaSeleccionada: any | null = null;

  pedidos: Pedido[] | null = null;
  pedidosConCliente: { pedido: Pedido; cliente: User }[] = []; // Array para pedidos con datos de usuario
  private unsubscribe$ = new Subject<void>();
  loading: boolean = true;

  constructor(
    private mesaService: MesaService,
    private usuarioService: UsersService,
    private pedidoService: PedidoService
  ) {}

  ionViewWillEnter() {
    this.loading = true;
    this.obtenerMesasLibres();
    this.pedidoService
      .obtenerPedidosPorEstado('lista-espera')
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(async (pedidos) => {
        this.pedidos = pedidos;

        if (this.pedidos.length > 0) {
          const idClientes = pedidos.map((pedido) => pedido.idCliente);
          this.usuarioService
            .getUsersByIds(idClientes)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((usuarios) => {
              this.pedidosConCliente = pedidos.map((pedido) => ({
                pedido,
                cliente: usuarios.find(
                  (usuario) => usuario.id === pedido.idCliente
                )!,
              }));
              this.loading = false;
            });
        } else {
          this.pedidosConCliente = [];
          this.loading = false;
        }
      });
  }

  async obtenerMesasLibres() {
    this.mesasLibres$ = this.mesaService.obtenerMesasLibres();
  }

  async asignarMesaAlCliente(pedido: { pedido: Pedido; cliente: User }) {
    if (this.mesaSeleccionada) {
      try {
        await this.mesaService.asignarMesa(
          this.mesaSeleccionada.id,
          pedido.cliente.id
        );
        await this.pedidoService.asignarMesa(
          this.mesaSeleccionada.numero,
          pedido.pedido.id
        );
        this.customAlert.showInfo(
          `Mesa ${this.mesaSeleccionada.numero} asignada a ${pedido.cliente.nombre}`,
          'success'
        );

        this.pedidoSeleccionado = null;
        this.mesaSeleccionada = null;
      } catch (error) {
        this.customAlert.showAlert('Error al asignar mesa.');
      }
    } else {
      this.customAlert.showAlert('Debe elegir una mesa.');
    }
  }

  seleccionarPedido(pedido: { pedido: Pedido; cliente: User }) {
    this.pedidoSeleccionado = pedido;
  }

  borrarDelListado(pedidoId: string | undefined) {
    this.pedidoService.updatePedidoEstado(pedidoId, 'cancelado');
    this.customAlert.showInfo(`Cliente eliminado de la lista`, 'success');
  }

  ionViewWillLeave() {
    this.unsubscribe$.next(); // Emite el valor para cancelar las suscripciones
    this.unsubscribe$.complete(); // Completa el Subject
  }
}
