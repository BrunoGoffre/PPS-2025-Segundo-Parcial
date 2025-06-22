import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonGrid, IonRow, IonIcon, IonCol, IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,  IonButton, IonCardTitle, IonButtons, IonSpinner } from '@ionic/angular/standalone';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UsersService } from '../services/users.service';
import { StorageService } from '../services/storage.service'
import { DniValidator } from '../validators/dniValidator.validator';
import { User } from '../models/user';
import { AppAlertComponent } from '../app-alert/app-alert.component';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { addIcons } from 'ionicons';
import { arrowBackOutline } from 'ionicons/icons';
import { passwordMatchValidator } from '../validators/passwordValidator.validator';
import { Keyboard } from '@capacitor/keyboard';

type Idioma = 'ingles' 
type Numero = '1' 

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [IonSpinner, IonButtons,AppAlertComponent, ReactiveFormsModule, CommonModule, FormsModule, IonGrid, IonRow, IonIcon, IonCol, IonButton, IonCardContent, IonCard, IonContent, IonHeader, IonTitle, IonToolbar, IonCardTitle, RouterLink]
})
export class RegisterPage implements OnInit {

  @ViewChild(IonContent, { static: true }) content!: IonContent;
  @ViewChild(AppAlertComponent) customAlert!: AppAlertComponent;

  imagePreview: string | undefined;

  tipoCliente:string = 'anonimo';
  clienteForm!:FormGroup;
  path:string = '';
  file:File|null=null;
  fileNames: Record<string, string | null> = {
    imagen: null,
  };
  cliente:User = { nombre:'', apellido:'', dni:'', mail:'', imagen:'', perfil:'cliente', tipo:'', estadoAprobacion:'', encuestaCompletada:false };
  flagError: boolean = false;
  msjError: string = "";
  loading: boolean = false;

  constructor(public router:Router, private authService:AuthService, private usuariosService:UsersService, private fb: FormBuilder, private storageService: StorageService) 
  {
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

      if (this.clienteForm.valid) { 
        this.cliente!.nombre = this.clienteForm.get('nombre')?.value;
        this.cliente!.tipo = this.tipoCliente;

        if(this.tipoCliente == 'registrado'){
          this.cliente!.apellido = this.apellido?.value;
          this.cliente!.dni = this.dni?.value;
          this.cliente!.mail = this.mail?.value;
          this.cliente!.estadoAprobacion = 'pendiente';

          await this.Registrarse(this.cliente!.mail || '', this.clave?.value || '', this.cliente!); // TODO: cambiar a clave aleatoria
        }
        else{
          const randomDigits = Math.floor(100000 + Math.random() * 900000);
          this.cliente!.mail = `anon_${randomDigits}@anon.com`;

          await this.Registrarse(this.cliente!.mail, '123456', this.cliente!); // TODO: cambiar a clave aleatoria
        }
    }
    else
    {
      this.loading = false;
    }
  }

  async Registrarse(mail:string, clave:string, cliente:User) {
      this.authService.register({ email: mail, password: clave })
      .then(async (res)=>{ 
        this.cliente.id = res?.user.uid;

        const imageBlob = this.dataURLtoBlob(this.imagePreview!);
        const filePath = `fotosUsuarios/${Date.now()}.jpg`; 

        await this.storageService.uploadImage(filePath, imageBlob)
        .then((url: string) => {          
          this.cliente!.imagen = url;
        });
        
        await this.usuariosService.createUser(cliente)
        .then(()=>{
          this.LeerNumero('1');

          this.cliente = { nombre:'', apellido:'', dni:'', mail:'', imagen:'', perfil:'cliente', tipo:'', estadoAprobacion:'', id:'', encuestaCompletada:false };
          this.imagePreview = undefined;
          this.clienteForm.controls['nombre'].setValue('');

          this.clienteForm.controls['nombre'].markAsUntouched();
          this.clienteForm.controls['nombre'].markAsPristine();

          if(this.tipoCliente == 'registrado'){
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

            this.loading = false;
            this.authService.logoutSinRedireccion();
            this.customAlert.showInfo('Alta exitosa. Aguarde a ser aprobado.' , 'success');
          }
          else
          {
            this.loading = false;
            this.router.navigate(['/home']);
          }
        });
      })
     .catch((e)=>{
      this.loading = false;
      this.flagError = true;
      switch(e.code){
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
          this.msjError = e.code;
          break;
      }
     })
  }

  volver(){
    this.router.navigateByUrl('/login');
  }

  async escanearDni(){
    try {
      await BarcodeScanner.checkPermission({ force: true });
      const result = await BarcodeScanner.startScan();
      
      if (result.hasContent) {
        const partes = result.content!.split("@");

        this.clienteForm.controls['nombre'].setValue(partes[2]);
        this.clienteForm.controls['apellido'].setValue(partes[1]);
        this.clienteForm.controls['dni'].setValue(partes[4]);
      }
    } catch (error) {
      console.error("Error al escanear el dni:", error);
    } finally {
      BarcodeScanner.stopScan();
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
  
  get nombre() { return this.clienteForm.get('nombre'); }
  get apellido() { return this.clienteForm.get('apellido'); }
  get edad() { return this.clienteForm.get('edad'); }
  get dni() { return this.clienteForm.get('dni'); }
  get mail() { return this.clienteForm.get('mail'); }
  get clave() {return this.clienteForm.get('clave');}
  get clave2() {return this.clienteForm.get('clave2');}

  // **************************** S O N I D O S **************************** //

  idiomaActual: Idioma = 'ingles';
  private sonidos: { [key in Idioma]: { [key in Numero]: string } } = {
    'ingles': {
      '1': 'conected',
    },
  };
  isPlaying = false; 

  LeerNumero(Numero: Numero){
    if (this.isPlaying) {
      return;  
    }
    const src = this.getAudioSrc(Numero);  
    if (src) {
      const audio = new Audio(src);
      this.isPlaying = true;  
      audio.play().then(() => {
      }).catch(error => {
        this.isPlaying = false;  
      });
      audio.onended = () => {
        this.isPlaying = false;
      };
    }
  }

  getAudioSrc(Numero: Numero): string {
    const sonido = this.sonidos[this.idiomaActual][Numero];
    if (!sonido) {
      return '';
    }
    return `assets/sounds/${sonido}.mp3`;
  }
}
