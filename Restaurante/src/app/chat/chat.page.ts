import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonSpinner,
  IonButtons,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PedidoService } from '../services/pedido.service';
import {
  Firestore,
  collection,
  query,
  where,
  orderBy,
  collectionData,
  addDoc,
} from '@angular/fire/firestore';
import { Pedido } from '../models/pedido';
import { Message } from '../models/message';
import { User } from '../models/user';
import { UsersService } from '../services/users.service';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';
import { Keyboard } from '@capacitor/keyboard';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [
    IonIcon,
    IonButton,
    IonButtons,
    IonSpinner,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    RouterLink,
  ],
})
export class ChatPage implements AfterViewChecked {
  @ViewChild(IonContent, { static: false }) content!: IonContent;

  pedido!: Pedido | null;
  mensajes: any[] = [];
  textoMensaje: string = '';
  usuario: User | null = null;
  loading: boolean = true;
  private mySubscription!: Subscription;
  private shouldScrollToBottom = true;

  constructor(
    private route: ActivatedRoute,
    private pedidoService: PedidoService,
    private firestore: Firestore,
    private usuarioService: UsersService,
    private authService: AuthService
  ) {}

  async ionViewWillEnter() {
    // Configurar listener para el teclado
    Keyboard.addListener('keyboardDidShow', () => {
      this.shouldScrollToBottom = true;
      this.scrollToBottom();
    });

    this.loading = true;

    // Obtener usuario actual
    if (this.usuario == null) {
      this.usuario = await this.usuarioService.getUser(
        this.authService.userActive!.uid
      );
    }

    // Obtener pedido según tipo de usuario
    if (this.usuario?.tipo === 'mozo') {
      const routeIdPedido = this.route.snapshot.paramMap.get('idPedido');
      if (routeIdPedido) {
        this.pedido = await this.pedidoService.obtenerPedidoPorId(
          routeIdPedido
        );
      }
    } else if (this.usuario?.perfil === 'cliente') {
      this.pedido = await this.pedidoService.getPedidoClientePromise(
        this.usuario.id!
      );
    }

    // Cargar mensajes si hay un pedido
    if (this.pedido) {
      this.cargarMensajes(this.pedido.id!);
    } else {
      console.error('No se encontró el pedido.');
      this.loading = false;
    }
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  enviarMensaje() {
    if (this.textoMensaje.trim() != '') {
      const coleccion = collection(this.firestore, 'mensajes');
      const nuevoMensaje: Message = {
        mensaje: this.textoMensaje.trim(),
        usuario: this.usuario!,
        idPedido: this.pedido!.id!,
        fecha: new Date(),
      };
      addDoc(coleccion, nuevoMensaje);
      this.textoMensaje = '';
      this.shouldScrollToBottom = true;
    }
  }

  cargarMensajes(idPedido: string) {
    const mensajesRef = collection(this.firestore, 'mensajes');
    const q = query(
      mensajesRef,
      where('idPedido', '==', idPedido),
      orderBy('fecha')
    );

    this.mySubscription = collectionData(q).subscribe((mensajes) => {
      this.mensajes = mensajes;
      this.shouldScrollToBottom = true;
      this.loading = false;
    });
  }

  scrollToBottom() {
    try {
      setTimeout(() => {
        if (this.content) {
          this.content.scrollToBottom(300);
        }
      }, 100);
    } catch (err) {
      console.error('Error al hacer scroll:', err);
    }
  }

  ionViewWillLeave() {
    if (this.mySubscription) {
      this.mySubscription.unsubscribe();
    }

    // Eliminar listener del teclado
    Keyboard.removeAllListeners();
  }
}
