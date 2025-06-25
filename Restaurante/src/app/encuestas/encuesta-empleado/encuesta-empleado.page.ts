import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  IonSpinner,
  IonRadio,
  IonSelectOption,
  IonItem,
  IonLabel,
  IonButton,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonIcon,
} from '@ionic/angular/standalone';
import { StorageService } from '../../services/storage.service';
import { Camera, CameraResultType, Photo } from '@capacitor/camera';
import { CustomAlertComponent } from '../../custom-alert/custom-alert.component';
import { NavController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { UsersService } from 'src/app/services/users.service';

@Component({
  selector: 'app-encuesta-empleado',
  templateUrl: './encuesta-empleado.page.html',
  styleUrls: ['./encuesta-empleado.page.scss'],
  standalone: true,
  imports: [
    IonIcon,
    IonButtons,
    IonSpinner,
    CustomAlertComponent,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    IonTitle,
    IonHeader,
    IonToolbar,
    IonButton,
  ],
})
export class EncuestaEmpleadoPage {
  encuestaForm: FormGroup;
  fotos: string[] = [];
  @ViewChild(CustomAlertComponent) customAlert!: CustomAlertComponent;
  loading: boolean = false;
  loadingMessage: string = 'Enviando encuesta...';

  userName: string = '';
  userLastName: string = '';

  constructor(
    private navCtrl: NavController,
    private firestore: Firestore,
    private fb: FormBuilder,
    private storageService: StorageService,
    private router: Router,
    private authService: AuthService,
    private usuarioService: UsersService
  ) {
    this.encuestaForm = this.fb.group({
      satisfaccion: [50, Validators.required],
      calificacion: ['', Validators.required],
      aspectos: this.fb.group({
        comida: [false],
        limpieza: [false],
        ambiente: [false],
        atencionAlCliente: [false],
      }),
      frecuencia: ['', Validators.required],
      comentarios: [''],
    });
  }

  async ngOnInit() {
    const userEmail = this.authService.getUserEmail();

    if (userEmail) {
      const userInfo = await this.usuarioService.getUserFullName();
      if (userInfo) {
        this.userName = userInfo.nombre;
        this.userLastName = userInfo.apellido;
      }

      const encuestaCompletada = await this.verificarEncuestaCompletada(
        userEmail
      );
      if (encuestaCompletada) {
        await this.mostrarAlertaEncuestaYEsperar(
          'Ya has completado la encuesta para esta estadía.'
        );
        this.router.navigate(['/home']);
      }
    } else {
      console.log('Error: No se pudo obtener el email del usuario.');
    }
  }

  private async verificarEncuestaCompletada(
    userEmail: string
  ): Promise<boolean> {
    const docRef = doc(this.firestore, `encuestas/${userEmail}`);
    const docSnap = await getDoc(docRef);

    return docSnap.exists() && docSnap.data()['encuestaCompletada'] === true;
  }

  private mostrarAlertaEncuestaYEsperar(mensaje: string): Promise<void> {
    return new Promise((resolve) => {
      this.customAlert.showAlert(mensaje, 'encuesta');

      const checkAlertClosed = setInterval(() => {
        if (!this.customAlert.show) {
          clearInterval(checkAlertClosed);
          resolve();
        }
      }, 100);
    });
  }

  async agregarFoto() {
    if (this.fotos.length >= 1) {
      this.mostrarAlertaEncuesta(
        'Límite de fotos alcanzado.\nNo puedes agregar más de una fotos.'
      );
      return;
    }

    const image: Photo = await Camera.getPhoto({
      quality: 50,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      promptLabelHeader: 'Selecciona una opción',
      promptLabelPhoto: 'Tomar Foto',
      promptLabelPicture: 'Desde el Álbum',
    });

    if (image) {
      const url = await this.storageService.subirImg(image, 'encuesta');
      if (url) {
        this.fotos.push(url);
      }
    }
  }

  async onSubmit() {
    if (this.encuestaForm.valid) {
      this.loading = true;

      // Preparar los datos de la encuesta
      const encuestaData = {
        ...this.encuestaForm.value,
        fotos: this.fotos,
        fecha: new Date().toISOString(),
        encuestaCompletada: true,
        nombre: this.userName,
        apellido: this.userLastName,
      };

      // Guardar la encuesta en Firestore
      const userEmail = this.authService.getUserEmail();
      const docRef = doc(this.firestore, `encuestas/${userEmail}`);
      try {
        await setDoc(docRef, encuestaData);

        // Mostrar alerta de éxito y resetear el formulario
        this.loading = false;
        this.mostrarAlertaEncuesta(
          '¡Gracias! Hemos recibido tus respuestas.',
          () => {
            this.encuestaForm.reset();
            this.fotos = [];
            this.router.navigate(['/home']);
          },
          'success' // Añadido para que sea de tipo éxito
        );
      } catch (error) {
        console.error('Error al guardar la encuesta:', error);
        this.mostrarAlertaEncuesta(
          'Ocurrió un error al enviar la encuesta. Inténtalo nuevamente.'
        );
      }
    } else {
      // Mostrar alerta de error si el formulario no es válido
      this.mostrarAlertaEncuesta(
        'Por favor, completa todos los campos requeridos.'
      );
    }
  }

  mostrarAlertaEncuesta(
    mensaje: string,
    callback?: () => void,
    tipo: 'default' | 'encuesta' | 'success' = 'default'
  ) {
    this.customAlert.showAlert(mensaje, tipo); // Pasar el tipo de alerta
    if (callback) {
      this.customAlert.closeAlert = callback;
    }
  }

  goBack() {
    this.navCtrl.back();
  }
}
