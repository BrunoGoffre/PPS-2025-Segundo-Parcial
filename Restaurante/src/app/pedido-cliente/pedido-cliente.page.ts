import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonIcon,
  IonButtons,
  IonButton,
  IonSpinner,
  IonInput,
} from '@ionic/angular/standalone';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { Producto } from '../models/producto';
import { addIcons } from 'ionicons';
import { timeOutline, arrowBackOutline } from 'ionicons/icons';
import { RouterLink } from '@angular/router';
import { Pedido } from '../models/pedido';
import { PedidoService } from '../services/pedido.service';
import { AuthService } from '../services/auth.service';
import { CustomAlertComponent } from '../custom-alert/custom-alert.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pedido-cliente',
  templateUrl: './pedido-cliente.page.html',
  styleUrls: ['./pedido-cliente.page.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonButtons,
    IonIcon,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    RouterLink,
    IonSpinner,
    CustomAlertComponent,
    IonInput,
  ],
})
export class PedidoClientePage implements OnInit {
  @ViewChild(CustomAlertComponent) customAlert!: CustomAlertComponent;

  isLoading: boolean = true;
  productos: Producto[] = [];
  pedido!: Pedido;
  tiempoPedidoMaximo: number = 0;
  totalPedido: number = 0;

  constructor(
    private firestore: Firestore,
    private pedidoService: PedidoService,
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({ arrowBackOutline, timeOutline });
  }

  async ngOnInit() {
    await this.obtenerProductos().then((productos) => {
      this.productos = productos;
    });
    await this.pedidoService
      .getPedidoClientePromise(this.authService.userActive!.uid)
      .then((pedido) => {
        if (pedido != null) {
          this.pedido = pedido;
        }
      });
    this.isLoading = false;
  }

  async obtenerProductos(): Promise<Producto[]> {
    const productosRef = collection(this.firestore, 'productos');
    return getDocs(productosRef).then((snapshot) => {
      return snapshot.docs.map((doc) => {
        const data = doc.data() as Producto;
        return { ...data, id: doc.id };
      });
    });
  }

  incrementarCantidad(producto: Producto) {
    console.log(producto);
    const productoPedido = this.pedido.productos!.find(
      (p) => p.idProducto === producto.id
    );

    if (productoPedido) {
      productoPedido.cantidad += 1;
    } else {
      this.pedido.productos!.push({
        idProducto: producto.id,
        cantidad: 1,
        estado: 'pendiente',
      });
    }
    console.log(this.pedido);
    this.actualizarPedido();
  }

  disminuirCantidad(producto: Producto) {
    const productoPedido = this.pedido.productos!.find(
      (p) => p.idProducto === producto.id
    );

    if (productoPedido && productoPedido.cantidad > 1) {
      productoPedido.cantidad -= 1;
    } else if (productoPedido && productoPedido.cantidad === 1) {
      this.pedido.productos = this.pedido.productos!.filter(
        (p) => p.idProducto !== producto.id
      );
    }

    this.actualizarPedido();
  }

  actualizarPedido() {
    // Calcula el total del pedido
    this.totalPedido = this.pedido.productos!.reduce((total, p) => {
      const prod = this.productos.find((prod) => prod.id === p.idProducto);
      console.log(prod);
      if (prod && prod.precio) {
        const precio =
          typeof prod.precio === 'string'
            ? parseFloat(prod.precio)
            : Number(prod.precio);
        return total + precio * p.cantidad;
      }
      return total;
    }, 0);

    // Calcula el tiempo máximo de los productos en el pedido
    if (this.pedido.productos && this.pedido.productos.length > 0) {
      const tiempos = this.pedido.productos.map((p) => {
        const prod = this.productos.find((prod) => prod.id === p.idProducto);
        if (prod && prod.tiempo) {
          return typeof prod.tiempo === 'string'
            ? parseFloat(prod.tiempo)
            : Number(prod.tiempo);
        }
        return 0;
      });
      this.tiempoPedidoMaximo = Math.max(...tiempos);
    } else {
      this.tiempoPedidoMaximo = 0;
    }
  }

  realizarPedido() {
    this.pedidoService
      .actualizarPedido({
        id: this.pedido.id,
        estado: 'realizado',
        productos: this.pedido.productos,
        montoFinal: this.totalPedido,
        tiempoEstimado: this.tiempoPedidoMaximo,
        propina: 0,
      })
      .then(() => {
        this.customAlert.showInfo(
          'Pedido realizado. Aguarde la confirmación del mozo.',
          'success'
        );
        this.router.navigate(['/home']);
      });
  }

  obtenerCantidadProducto(idProducto: string): number {
    if (!this.pedido || !this.pedido.productos) {
      return 0;
    }
    const productoPedido = this.pedido.productos!.find(
      (p) => p.idProducto === idProducto
    );
    return productoPedido ? productoPedido.cantidad : 0;
  }
}
