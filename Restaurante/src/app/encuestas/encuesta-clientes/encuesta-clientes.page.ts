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
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonTitle,
  IonContent,
} from '@ionic/angular/standalone';
import { StorageService } from '../../services/storage.service';
import { Camera, CameraResultType, Photo } from '@capacitor/camera';
import { CustomAlertComponent } from '../../custom-alert/custom-alert.component';
import { NavController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { UsersService } from 'src/app/services/users.service';

@Component({
  selector: 'app-encuesta',
  templateUrl: './encuesta-clientes.page.html',
  styleUrls: ['./encuesta-clientes.page.scss'],
  standalone: true,
  imports: [
    IonTitle,
    IonIcon,
    IonButton,
    IonButtons,
    IonToolbar,
    IonHeader,
    IonSpinner,
    CustomAlertComponent,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    IonContent,
  ],
})
export class EncuestaPage {
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
    private usuariosService: UsersService
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
      const userInfo = await this.usuariosService.getUserFullName();
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
    if (this.fotos.length >= 3) {
      this.mostrarAlertaEncuesta(
        'Límite de fotos alcanzado.\nNo puedes agregar más de tres fotos.'
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

  /*async onSubmit() {
        if (this.encuestaForm.valid) {
          this.loading = true;
          
          const encuestaData = {
            ...this.encuestaForm.value,
            fotos: this.fotos,
            fecha: new Date().toISOString(),
            encuestaCompletada: true,
            nombre: this.userName,
            apellido: this.userLastName
            
          };
      
          const userEmail = this.authService.getUserEmail(); 
          const docRef = doc(this.firestore, `encuestas/${userEmail}`);
          await setDoc(docRef, encuestaData); 
      
         /* setTimeout(() => {
            this.loading = false;
            this.mostrarAlertaEncuesta('¡Gracias! Hemos recibido tus respuestas.', () => {
              this.encuestaForm.reset();
              this.fotos = [];
              this.router.navigate(['/home']);
            });
          }, 3000);
        } else {
          this.mostrarAlertaEncuesta('Por favor, completa todos los campos requeridos.');
        }
      }*/

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
      const userDocRef = doc(
        this.firestore,
        `usuarios/${this.authService.userActive?.uid}`
      );
      await updateDoc(userDocRef, { encuestaCompletada: true });
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
            this.router.navigate(['/menu-mesa']);
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

  /*mostrarAlertaEncuesta(mensaje: string, callback?: () => void) {
      this.customAlert.showAlert(mensaje, 'encuesta');
      if (callback) {
        this.customAlert.closeAlert = callback;
      }
    }*/

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
