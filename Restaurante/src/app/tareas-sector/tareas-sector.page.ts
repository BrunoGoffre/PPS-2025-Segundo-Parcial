import { Component, OnInit, ViewChild, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonSpinner,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonButtons,
  IonIcon,
} from '@ionic/angular/standalone';
import { PedidoService } from '../services/pedido.service';
import { User } from '../models/user';
import { UsersService } from '../services/users.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { CustomAlertComponent } from '../custom-alert/custom-alert.component';
import { doc, Firestore, getDoc, updateDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-tareas-sector',
  templateUrl: './tareas-sector.page.html',
  styleUrls: ['./tareas-sector.page.scss'],
  standalone: true,
  imports: [
    IonIcon,
    IonButtons,
    CustomAlertComponent,
    IonCardContent,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    IonSpinner,
  ],
})
export class TareasSectorPage {
  @ViewChild(CustomAlertComponent) customAlert!: CustomAlertComponent;
  productosPorEncargado: any[] = [];
  pedidosConfirmados: any[] = [];
  pedidosConProductos: any[] = [];
  usuario: User | null = null;
  pedidoId: string = '';
  loading: boolean = true;

  constructor(
    private pedidosService: PedidoService,
    private usuarioService: UsersService,
    private authService: AuthService,
    private router: Router,
    private firestore: Firestore
  ) {}

  async ionViewWillEnter() {
    this.loading = true;
    if (this.usuario == null) {
      this.usuario = await this.usuarioService.getUser(
        this.authService.userActive!.uid
      );
    }
    this.cargarPedidosConfirmados();
  }

  async cargarProductosPorEncargado(pedidoId: string, encargado: string) {
    this.pedidosService.obtenerProductosPorEncargado(
      pedidoId,
      encargado,
      (productos) => {
        const pedidoConProductos = {
          pedidoId,
          pedidoDetalles: this.pedidosConfirmados.find(
            (pedido) => pedido.id === pedidoId
          ),
          productos,
        };
        const index = this.pedidosConProductos.findIndex(
          (p) => p.pedidoId === pedidoId
        );
        if (index !== -1) {
          this.pedidosConProductos[index] = pedidoConProductos;
        } else {
          this.pedidosConProductos.push(pedidoConProductos);
        }
        this.loading = false;
      }
    );
  }

  volver() {
    this.router.navigate(['/home']);
  }

  async cargarPedidosConfirmados() {
    this.pedidosService.obtenerPedidosConfirmados((pedidos) => {
      if (pedidos.length === 0) {
        this.loading = false;
      }
      this.pedidosConProductos = [];
      for (let pedido of pedidos) {
        const tipoEncargado = this.usuario?.tipo || 'defaultEncargado';
        if (pedido.id && tipoEncargado) {
          this.cargarProductosPorEncargado(pedido.id, tipoEncargado);
        } else {
          console.warn('El pedido ID o el tipo de usuario no están definidos.');
          this.loading = false;
        }
      }
    });
  }

  async marcarComoPreparado(pedidoId: string, productoId: string) {
    if (pedidoId && productoId) {
      this.loading = true;
      await this.pedidosService.actualizarEstadoProducto(
        pedidoId,
        productoId,
        'preparado'
      );

      const pedidoRef = doc(this.firestore, `pedidos/${pedidoId}`);
      const pedidoSnapshot = await getDoc(pedidoRef);
      if (pedidoSnapshot.exists()) {
        const pedidoData = pedidoSnapshot.data();
        const todosPreparados = pedidoData['productos'].every(
          (producto: any) => producto.estado === 'preparado'
        );
        if (todosPreparados) {
          await updateDoc(pedidoRef, { estado: 'preparado' });
          this.loading = false;
        } else {
          this.loading = false;
        }
      } else {
        this.loading = false;
      }
    } else {
      console.warn('Falta el pedidoId o productoId');
    }
  }
}
