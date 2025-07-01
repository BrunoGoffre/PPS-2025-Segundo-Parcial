import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../models/user';
import { Pedido } from '../models/pedido';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
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
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { CustomAlertComponent } from '../custom-alert/custom-alert.component';
import { UsersService } from '../services/users.service';

@Component({
  selector: 'app-pagar-pedido',
  templateUrl: './pagar-pedido.page.html',
  styleUrls: ['./pagar-pedido.page.scss'],
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
export class PagarPedidoPage {
  usuario: User | null = null;
  pedido: Pedido | null = null;
  mostrarBotonEstadoPedido: boolean = false;
  private mySubscription!: Subscription;
  isLoading = true;
  totalProducto: number = 0;
  totalCuenta: number = 0;
  porcentaje: number = 0;
  porcentajeSeleccionado: number = 0;
  porcentaje20: number = 0;
  porcentaje15: number = 0;
  porcentaje10: number = 0;
  porcentaje5: number = 0;
  porcentaje0: number = 0;
  agregaPropina: boolean = false;
  agregaPropina2: boolean = false;

  @ViewChild(CustomAlertComponent) customAlert!: CustomAlertComponent;

  constructor(
    private authService: AuthService,
    private router: Router,
    private usuarioService: UsersService,
    private pedidoService: PedidoService
  ) {}

  async ionViewWillEnter() {
    if (this.usuario == null) {
      this.usuario = await this.usuarioService.getUser(
        this.authService.userActive!.uid
      );
    }

    if (this.usuario?.perfil === 'cliente') {
      this.mySubscription = this.pedidoService
        .getPedidoCliente(this.usuario.id!)
        .subscribe((pedidos) => {
          if (pedidos.length > 0) {
            this.pedido = pedidos[0];
            this.procesarPedidos(this.pedido);
            this.porcentaje20 = (this.pedido.montoFinal * 20) / 100;
            this.porcentaje15 = (this.pedido.montoFinal * 15) / 100;
            this.porcentaje10 = (this.pedido.montoFinal * 10) / 100;
            this.porcentaje5 = (this.pedido.montoFinal * 5) / 100;
          } else {
            this.pedido = null;
            this.isLoading = false;
          }
        });
    } else {
      this.isLoading = false;
    }
  }

  AgregarPropina() {
    this.agregaPropina = true;
  }

  async escanearPropinaQR() {
    try {
      const result = await BarcodeScanner.scan();
      const valorQR = result.barcodes[0].rawValue;

      // Mapa de valores QR a porcentajes
      const porcentajesPropina: { [key: string]: number } = {
        '20': 20,
        '15': 15,
        '10': 10,
        '5': 5,
        '1': 0,
      };

      if (valorQR in porcentajesPropina) {
        const porcentajeSeleccionado = porcentajesPropina[valorQR];
        this.porcentajeSeleccionado = porcentajeSeleccionado;
        this.porcentaje = (this.totalCuenta * porcentajeSeleccionado) / 100;
        this.totalCuenta = this.totalCuenta + this.porcentaje;
        this.agregaPropina2 = true;
      } else {
        this.customAlert.showAlert(`QR no válido para propina`);
      }
    } catch (error) {
      this.customAlert.showAlert('Error al escanear el código QR.');
    }
  }

  cancelarPropina() {
    this.agregaPropina2 = false;
    if (this.pedido?.montoFinal) this.totalCuenta = this.pedido?.montoFinal;
    this.porcentaje = 0;
    this.porcentajeSeleccionado = 0;
  }

  async procesarPedidos(pedido: Pedido) {
    for (const producto of pedido.productos || []) {
      const productoData = await this.pedidoService.obtenerProductoPorId(
        producto.idProducto
      );
      this.totalCuenta = pedido.montoFinal;
      producto.nombre = productoData
        ? productoData['nombre']
        : 'Nombre no disponible';
      producto.precio = productoData
        ? productoData['precio']
        : 'Precio no disponible';
    }
    this.isLoading = false;
  }

  pagarPedido() {
    if (this.pedido)
      this.pedidoService
        .actualizarPedido({
          id: this.pedido.id,
          estado: 'cobrado',
          productos: this.pedido.productos,
          montoFinal: this.totalCuenta,
          tiempoEstimado: this.pedido.tiempoEstimado,
          propina: this.porcentaje,
        })
        .then(() => {
          this.customAlert.showInfo(
            'Pedido pagado. Aguarde la confirmación del mozo.',
            'success'
          );
          setTimeout(() => {
            this.router.navigate(['/home']);
          }, 2000);
        });
  }

  goTo(path: string) {
    this.router.navigate([path]);
  }
}
