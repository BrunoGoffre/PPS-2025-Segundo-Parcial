import { Component, ViewChild } from '@angular/core';
import {
  IonContent,
  IonSpinner,
  IonHeader,
  IonButton,
  IonButtons,
  IonTitle,
  IonToolbar,
  IonIcon,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
// import { CapacitorBarcodeScanner } from '@capacitor/barcode-scanner';
import { NgIf, JsonPipe } from '@angular/common';
import { User } from '../models/user';
import { UsersService } from '../services/users.service';
import { AuthService } from '../services/auth.service';
import { AppAlertComponent } from '../app-alert/app-alert.component';
import { Pedido } from '../models/pedido';
import { PedidoService } from '../services/pedido.service';
import { StatusPedidoAlertComponent } from '../status-pedido-alert/status-pedido-alert.component';
import { PushNotificationsService } from '../services/push-notifications.service';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { CustomAlertComponent } from '../custom-alert/custom-alert.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonSpinner,
    IonHeader,
    IonButton,
    IonButtons,
    IonTitle,
    IonToolbar,
    IonIcon,
    NgIf,
    AppAlertComponent,
    StatusPedidoAlertComponent,
    CustomAlertComponent,
  ],
})
export class HomePage {
  @ViewChild(AppAlertComponent) appAlert!: AppAlertComponent;
  @ViewChild(StatusPedidoAlertComponent)
  statusPedidoAlert!: StatusPedidoAlertComponent;
  @ViewChild(CustomAlertComponent) customAlert!: CustomAlertComponent;

  user: User | null = null;
  pedido: Pedido | null = null;
  isLoading = false;
  isScanning = false;
  showStatusPedidoBtn = false;
  isPlayingSound = false;

  private mySubscription!: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    private userService: UsersService,
    private pedidoService: PedidoService,
    private pushNotificationsService: PushNotificationsService
  ) {}

  async ionViewWillEnter() {
    if (this.user == null) {
      this.user = await this.userService.getUser(this.authService.getUserId()!);
    }

    if (this.user?.perfil === 'cliente') {
      console.log('ID de cliente para la consulta:', this.user.id!);
      this.mySubscription = this.pedidoService
        .getPedidoCliente(this.user.id!)
        .subscribe((pedidos) => {
          console.log('PEDIDOS', pedidos);
          if (pedidos.length > 0) {
            this.pedido = pedidos[0];
            console.log('Pedido actualizado:', this.pedido);
            this.showStatusPedidoBtn = this.isStatusPostConfirmado(
              this.pedido.estado!
            );
            this.isScanning = true;
          } else {
            this.pedido = null;
            this.isScanning = false;
          }

          this.isLoading = false;
        });
    } else {
      this.isLoading = false;
    }
  }

  async crearPedido() {
    await this.ionViewWillEnter();
    if (!this.pedido) {
      this.pedido = {
        idCliente: this.user?.id!,
        mesaNumero: '-1',
        estado: 'lista-de-espera',
        encuestaCompletada: false,
        montoFinal: 0,
        productos: [],
      };
      this.pedidoService
        .createPedido(this.pedido)
        .then(() => {
          this.appAlert.showInfo(
            'Se encuentra en la lista de espera, en breve una mesa le será asignada',
            'success'
          );
        })
        .catch(() => {
          this.appAlert.showAlert('Ocurrió un error al crear el pedido');
        });
    } else {
      if (this.pedido.mesaNumero === '-1') {
        this.appAlert.showAlert('Se encuentra en la lista de espera.');
      } else {
        this.appAlert.showAlert('Ya cuenta con una mesa asignada.');
      }
    }
  }

  async LeerQRLocal() {
    // this.isScanning = true; //TODO: eliminar
    try {
      const result = await BarcodeScanner.scan();
      if (result.barcodes[0].rawValue == '/home') {
        this.isScanning = true;
      } else {
        this.appAlert.showAlert('Debe escanear el QR de ingreso.');
      }
    } catch (error) {
      this.appAlert.showAlert('Error al escanear el código QR.');
    }
  }
  async LeerQRMesa() {
    console.log('LeerQRMesa', this.pedido);
    if (!this.pedido) {
      this.appAlert.showAlert(
        'Debe colocarse en lista de espera antes de escanear mesa.'
      );
      return;
    } else if (this.pedido.mesaNumero == '-1') {
      this.appAlert.showAlert('Usted no posee una mesa asignada.');
      return;
    }
    //this.router.navigate(['/menu-mesa']); //TODO: comentar/descomentar para probar

    try {
      const result = await BarcodeScanner.scan();
      if (result.barcodes[0].rawValue === `mesa-${this.pedido?.mesaNumero}`) {
        this.router.navigate(['/menu-mesa']);
      } else {
        this.appAlert.showAlert(
          `Este no es el QR de su mesa. Usted tiene asignada la mesa número ${this.pedido?.mesaNumero}.`
        );
      }
    } catch (error) {
      this.appAlert.showAlert('Error al escanear el código QR.');
    }
  }

  goTo(path: string) {
    this.router.navigate([path]);
  }

  logout() {
    this.authService.logout();
    this.cleanData();
    this.playSound('1');
  }

  ionViewDidLeave() {
    if (this.mySubscription) {
      this.mySubscription.unsubscribe();
    }
  }

  private cleanData() {
    this.pedido = null;
    this.isScanning = false;
    this.user = null;
    this.isLoading = false;
  }

  async mostrarStatusPedido() {
    const idCliente = this.authService.getUserId();
    if (idCliente) {
      const statusPedido = await this.pedidoService.getStatusPedidoCliente(
        idCliente
      );

      if (statusPedido) {
        this.statusPedidoAlert.showAlert(statusPedido);
      } else {
        console.log(
          'No encontramos ningún pedido activo para el cliente: ',
          idCliente
        );
      }
    } else {
      console.log('No se encontró el ID del cliente | no está logueado');
    }
  }

  async checkStatusPedido() {
    const idCliente = this.authService.getUserId();

    if (idCliente) {
      const statusPedido = await this.pedidoService.getStatusPedidoCliente(
        idCliente
      );
      this.showStatusPedidoBtn = this.isStatusPostConfirmado(statusPedido!);
    } else {
      console.log('No se encontró el ID del cliente | no está logueado');
    }
  }

  private isStatusPostConfirmado(status: string) {
    const statusList = [
      'confirmado',
      'en-preparacion',
      'entregado',
      'cuenta-solicitada',
      'pagado',
      'finalizado',
    ];
    return status ? statusList.includes(status) : false;
  }

  // sonidos ------------------------------------------------------------
  playSound(sound: string) {
    if (this.isPlayingSound) {
      return;
    }

    const audioFile = this.getAudioFile(sound);

    if (!audioFile) {
      return;
    }

    const audio = new Audio(audioFile);

    this.isPlayingSound = true;

    audio
      .play()
      .then(() => {
        this.isPlayingSound = false;
      })
      .catch(() => {
        this.isPlayingSound = false;
      });

    audio.onended = () => {
      this.isPlayingSound = false;
    };
  }

  private sounds: { [key: string]: string } = {
    '1': 'logout',
  };

  private getAudioFile(sound: string) {
    const audioFile = this.sounds[sound];

    if (audioFile) {
      return `assets/sounds/${audioFile}.mp3`;
    }

    console.error(
      `No hay archivo de audio para el sonido: ${sound}, revisar los archivos de la carpeta o el número de sonido seleccionado`
    );
    return null;
  }
  // sonidos ------------------------------------------------------------
}
