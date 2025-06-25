import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonGrid, IonRow, IonIcon, IonCol, IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,  IonButton, IonCardTitle, IonButtons, IonSpinner } from '@ionic/angular/standalone';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UsersService } from '../services/users.service';
import { DniValidator } from '../validators/dniValidator.validator';
import { User } from '../models/user';
import { AppAlertComponent } from '../app-alert/app-alert.component';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { addIcons } from 'ionicons';
import { arrowBackOutline } from 'ionicons/icons';
import { passwordMatchValidator } from '../validators/passwordValidator.validator';
import { Keyboard } from '@capacitor/keyboard';
import { PushNotificationsService } from '../services/push-notifications.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [IonSpinner, IonButtons,AppAlertComponent, ReactiveFormsModule, CommonModule, FormsModule, IonGrid, IonRow, IonIcon, IonCol, IonButton, IonCardContent, IonCard, IonContent, IonHeader, IonTitle, IonToolbar, IonCardTitle, RouterLink]
})
export class RegisterPage implements OnInit {

  @ViewChild(IonContent, { static: true }) content!: IonContent;
  @ViewChild(AppAlertComponent) appAlert!: AppAlertComponent;

  imagePreview: string | undefined;

  tipoCliente:string = 'anonimo';
  clienteForm!:FormGroup;
  path:string = '';
  file:File|null=null;
  fileNames: Record<string, string | null> = {
    imagen: null,
  };
  cliente:User = { nombre:'', apellido:'', dni:'', mail:'', imagen:'', perfil:'cliente', tipo:'', estadoAprobacion:'pendiente', encuestaCompletada:false };
  flagError: boolean = false;
  msjError: string = "";
  loading: boolean = false;
  isPlayingSound = false; 

  constructor(
    public router:Router, 
    private authService:AuthService, 
    private usuariosService:UsersService, 
    private fb: FormBuilder,
    private pushNotificationsService: PushNotificationsService
  ) {
    Keyboard.addListener('keyboardWillHide', () => {
      this.content.scrollToPoint(0, 0, 300); // Vuelve al inicio en 300 ms
    });
    addIcons({arrowBackOutline});
  }
  
  ngOnInit() {
    this.configurarFormulario();
  }
  
  configurarFormulario()
  {
    const controlesBase = {
      nombre: new FormControl('', [Validators.required, Validators.pattern('^[a-zA-ZáÁéÉíÍóÓúÚñÑüÜ ]+$')]),
    };

    if (this.tipoCliente !== 'anonimo') {
      this.clienteForm = this.fb.group({
        ...controlesBase,
        apellido: new FormControl('', [Validators.required, Validators.pattern('^[a-zA-ZáÁéÉíÍóÓúÚñÑüÜ ]+$')]),
        dni: new FormControl('', {validators:[Validators.required, Validators.pattern('^[0-9]+$'), DniValidator()],  updateOn: 'blur' }),
        mail: new FormControl('', {validators: [Validators.required, Validators.email], updateOn: 'blur'}),
        clave: new FormControl('', {validators:[Validators.required, Validators.minLength(6)], updateOn: 'blur'}),
        clave2: new FormControl('', {validators:[Validators.required, Validators.minLength(6)]}),
        tipoCliente: new FormControl('registrado', Validators.required)
      }, {validator: passwordMatchValidator()} );
    } 
    else 
    {
      this.clienteForm = this.fb.group({
        ...controlesBase,
        tipoCliente: new FormControl('anonimo', Validators.required)
      });
    }
  }

  onChangeCrear(event: any) {
    this.tipoCliente = event.target.value;
    this.configurarFormulario();
  }

  async altaCliente() {
    this.loading = true;

    if (this.clienteForm.valid && this.imagePreview) { 
      this.cliente!.nombre = this.clienteForm.get('nombre')?.value;
      this.cliente!.tipo = this.tipoCliente;

      try {
        // Convertir la imagen de dataURL a File para Supabase
        const imageFile = await this.dataURLtoFile(this.imagePreview, 'avatar.jpg');

        if (this.tipoCliente == 'registrado') {
          this.cliente!.apellido = this.apellido?.value;
          this.cliente!.dni = this.dni?.value;
          this.cliente!.mail = this.mail?.value.toLowerCase();
          this.cliente!.estadoAprobacion = 'pendiente';

          // Usar el nuevo método de registro con Supabase
          const success = await this.authService.registerWithAvatar(
            this.cliente, 
            imageFile, 
            this.clave?.value || ''
          );

          if (success) {
            this.playSound('1');
            
            // Enviar push notification ANTES de resetForm
            this.sendNewClientNotification();
            
            this.resetForm();
            this.authService.logoutSinRedireccion();
            this.appAlert.showInfo('Alta exitosa. Aguarde a ser aprobado.', 'success');
            this.router.navigate(['/login']);
          } else {
            throw new Error('Error al registrar usuario');
          }
        } else {
          const randomDigits = Math.floor(100000 + Math.random() * 900000);
          this.cliente!.mail = `anon_${randomDigits}@anon.com`;
          this.cliente!.nombre = 'aprobado';

          // Usar el nuevo método de registro con Supabase
          const success = await this.authService.registerWithAvatar(
            this.cliente, 
            imageFile, 
            '123456'
          );

          if (success) {
            this.playSound('1');
            this.resetForm();
            this.router.navigate(['/home']);
          } else {
            throw new Error('Error al registrar usuario anónimo');
          }
        }
      } catch (e: any) {
        this.handleError(e);
      }
    } else {
      this.loading = false;
    }
  }

  // Método para resetear el formulario
  private resetForm() {
    this.cliente = { nombre:'', apellido:'', dni:'', mail:'', imagen:'', perfil:'cliente', tipo:'', estadoAprobacion:'', id:'', encuestaCompletada:false };
    this.imagePreview = undefined;
    this.clienteForm.controls['nombre'].setValue('');
    this.clienteForm.controls['nombre'].markAsUntouched();
    this.clienteForm.controls['nombre'].markAsPristine();

    if (this.tipoCliente == 'registrado') {
      this.clienteForm.controls['apellido'].setValue('');
      this.clienteForm.controls['dni'].setValue('');
      this.clienteForm.controls['mail'].setValue('');
      this.clienteForm.controls['clave'].setValue('');
      this.clienteForm.controls['clave2'].setValue('');
      this.clienteForm.controls['apellido'].markAsUntouched();
      this.clienteForm.controls['apellido'].markAsPristine();
      this.clienteForm.controls['dni'].markAsUntouched();
      this.clienteForm.controls['dni'].markAsPristine();
      this.clienteForm.controls['mail'].markAsUntouched();
      this.clienteForm.controls['mail'].markAsPristine();
      this.clienteForm.controls['clave'].markAsUntouched();
      this.clienteForm.controls['clave'].markAsPristine();
      this.clienteForm.controls['clave2'].markAsUntouched();
      this.clienteForm.controls['clave2'].markAsPristine();
    }

    this.loading = false;
  }

  // Método para manejar errores
  private handleError(e: any) {
    this.loading = false;
    this.flagError = true;
    
    switch(e.code) {
      case "auth/email-already-in-use":
        this.msjError = "El correo se encuentra en uso.";
        break;
      case "auth/weak-password":
        this.msjError = "La contraseña debe tener al menos 6 caracteres."
        break;
      case "auth/invalid-email":
        this.msjError = "Correo inválido."
        break;
      default:
        this.msjError = e.message || e.code || "Error desconocido";
        break;
    }
  }

  volver(){
    this.router.navigateByUrl('/login');
  }

  async escanearDni(){
    try {
      
      // Verificar si el escaneo está disponible
      const isAvailable = await BarcodeScanner.isSupported();
      if (!isAvailable) {
        this.appAlert.showInfo('El escaneo de códigos de barras no está disponible en este dispositivo', 'default');
        return;
      }
      
      // Verificar permisos
      const granted = await BarcodeScanner.requestPermissions();
      if (!granted) {
        this.appAlert.showInfo('Se requiere permiso de cámara para escanear el DNI', 'default');
        return;
      }
      
      // Iniciar escaneo
      const { barcodes } = await BarcodeScanner.scan();
      
      if (barcodes.length > 0) {
        const content = barcodes[0].rawValue;
        if (content) {
          const partes = content.split("@");
          
          if (partes.length >= 5) {
            this.clienteForm.controls['nombre'].setValue(partes[2]);
            this.clienteForm.controls['apellido'].setValue(partes[1]);
            this.clienteForm.controls['dni'].setValue(partes[4]);
          } else {
            this.appAlert.showInfo('Formato de DNI no reconocido', 'default');
          }
        }
      }
    } catch (error) {
      this.appAlert.showInfo('Error al escanear el DNI', 'default');
    }
  }

  async takePicture() {
    try {
      const image = await Camera.getPhoto({
        quality: 50,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      this.imagePreview = image.dataUrl;
    } catch (error) {
    }
  }

  // Convertir dataURL a Blob para subir a Supabase
  dataURLtoBlob(dataUrl: string): Blob {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
  
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
  
    return new Blob([u8arr], { type: mime });
  }

  // Convertir dataURL a File para Supabase
  async dataURLtoFile(dataUrl: string, filename: string): Promise<File> {
    const blob = this.dataURLtoBlob(dataUrl);
    return new File([blob], filename, { type: blob.type });
  }
  
  get nombre() { return this.clienteForm.get('nombre'); }
  get apellido() { return this.clienteForm.get('apellido'); }
  get edad() { return this.clienteForm.get('edad'); }
  get dni() { return this.clienteForm.get('dni'); }
  get mail() { return this.clienteForm.get('mail'); }
  get clave() {return this.clienteForm.get('clave');}
  get clave2() {return this.clienteForm.get('clave2');}

  // sonidos ------------------------------------------------------------
  private sounds: { [key: string]: string } = {
    '1': 'welcome',
  };

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

    audio.play().then(() => {
      this.isPlayingSound = false;
    })
    .catch(() => {
      this.isPlayingSound = false;
    });

    audio.onended = () => {
      this.isPlayingSound = false;
    };
  }

  getAudioFile(sound: string) {
    const audioFile = this.sounds[sound];
    
    if (audioFile) {
      return `assets/sounds/${audioFile}.mp3`;
    }
    
    console.error(`No hay archivo de audio para el sonido: ${sound}, revisar los archivos de la carpeta o el número de sonido seleccionado`);
    return null;
  }
  // sonidos ------------------------------------------------------------

  // Push Notifications ------------------------------------------------
  private async sendNewClientNotification() {
    try {
      const clienteName = `${this.cliente.nombre} ${this.cliente.apellido}`.trim();
      await this.pushNotificationsService.notifyClientePendiente(clienteName);
    } catch (error) {
      // No detenemos el flujo de registro si falla la notificación
    }
  }
}
