import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonButtons,
  IonSpinner,
  IonList,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
} from '@ionic/angular/standalone';
import { Pedido } from '../models/pedido';
import { PedidoService } from '../services/pedido.service';
import { Router, RouterLink } from '@angular/router';
import { Message } from '../models/message';
import { User } from '../models/user';

@Component({
  selector: 'app-consultas',
  templateUrl: './consultas.page.html',
  styleUrls: ['./consultas.page.scss'],
  standalone: true,
  imports: [
    IonCardContent,
    IonCardSubtitle,
    IonCardTitle,
    IonCardHeader,
    IonCard,
    IonList,
    IonSpinner,
    IonButtons,
    IonIcon,
    IonButton,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    RouterLink,
  ],
})
export class ConsultasPage {
  loading: boolean = true;
  pedidosConMensajes: {
    pedido: Pedido;
    mensajes: Message[];
    estadoConsulta: string;
    cliente: User;
  }[] = [];

  constructor(private pedidosService: PedidoService, private router: Router) {}

  async ionViewWillEnter() {
    this.loading = true;
    this.pedidosConMensajes =
      await this.pedidosService.obtenerPedidosActivosConMensajes();
    this.loading = false;
  }

  abrirConsulta(pedido: Pedido) {
    console.log(pedido);

    this.router.navigate([`/chat/${pedido.id}`]);
  }
}
