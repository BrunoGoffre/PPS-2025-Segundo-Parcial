import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RegisterSource } from 'src/app/interfaces/user.interface';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { ToolsService } from 'src/app/services/tools.service';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false
})
export class RegisterPage implements OnInit {
  registerForm!: FormGroup;
  registerSource: RegisterSource = 'login';
  esAnonimo: boolean = false;
  selectedPhoto: File | null = null;
  
  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private toolsService: ToolsService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    this.initForm();
  }

  initForm() {
    // Creamos un formulario base con campos comunes
    this.registerForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      nombre: ['', Validators.required],
      foto: ['', Validators.required]
    });

    // Agregamos campos adicionales según el source
    if (this.registerSource === 'login' && !this.esAnonimo) {
      this.registerForm.addControl('apellido', this.formBuilder.control('', Validators.required));
      this.registerForm.addControl('dni', this.formBuilder.control('', Validators.required));
      this.registerForm.addControl('cuil', this.formBuilder.control(''));
    }
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['source']) {
        this.registerSource = params['source'] as RegisterSource;
        this.initForm();
      }
    });
  }

  async onSubmit() {
    if (this.registerForm.valid) {
      const loading = await this.loadingController.create({
        message: 'Registrando...'
      });
      await loading.present();

      try {
        const formData = this.registerForm.value;
        const fullName = this.esAnonimo ? formData.nombre : `${formData.nombre} ${formData.apellido || ''}`;
        
        // Determinar el rol según el origen
        let rol: 'cliente' | 'supervisor' | 'dueño' | 'empleado' | 'anonimo' = 'cliente';
        if (this.registerSource === 'supervisor') {
          rol = 'supervisor';
        } else if (this.registerSource === 'owner') {
          rol = 'dueño';
        } else if (this.esAnonimo) {
          rol = 'anonimo';
        }
        
        // Datos adicionales según el tipo de usuario
        const userData: {
          apellido?: string;
          dni?: string;
          cuil?: string;
          photoFile?: File;
        } = {};
        
        // Agregar la foto si fue seleccionada
        if (this.selectedPhoto) {
          userData.photoFile = this.selectedPhoto;
        }
        
        // Agregar datos específicos solo si no es anónimo
        if (!this.esAnonimo && this.registerSource === 'login') {
          userData.apellido = formData.apellido;
          userData.dni = formData.dni;
          if (formData.cuil) {
            userData.cuil = formData.cuil;
          }
        }
        
        const result = await this.authService.register(
          formData.email,
          formData.password,
          fullName,
          this.esAnonimo,
          rol,
          userData
        );

        if (result.success) {
          const toast = await this.toastController.create({
            message: 'Registro exitoso',
            duration: 2000,
            color: 'success'
          });
          toast.present();
          
          // Redirigir según el origen
          if (this.isSourceLogin) {
            this.router.navigate(['/login']);
          } else {
            this.router.navigate(['/home']);
          }
        } else {
          this.mostrarError(result.message || 'Error en el registro');
        }
      } catch (error: any) {
        this.mostrarError(error.message || 'Error en el registro');
      } finally {
        loading.dismiss();
      }
    }
  }

  async mostrarError(mensaje: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      message: mensaje,
      buttons: ['OK']
    });
    await alert.present();
  }

  toggleModoAnonimo() {
    this.esAnonimo = !this.esAnonimo;
    
    if (this.esAnonimo) {
      this.registerForm.removeControl('apellido');
      this.registerForm.removeControl('dni');
      this.registerForm.removeControl('cuil');
    } else {
      this.registerForm.addControl('apellido', this.formBuilder.control('', Validators.required));
      this.registerForm.addControl('dni', this.formBuilder.control('', Validators.required));
      this.registerForm.addControl('cuil', this.formBuilder.control(''));
    }
  }

  async leerQR() {
    let loading: HTMLIonLoadingElement | null = null;
    
    try {
      // Mostrar un mensaje para que el usuario sepa que puede tomar tiempo
      const infoToast = await this.toastController.create({
        message: 'Preparando la cámara para escanear el DNI',
        duration: 3000,
        position: 'bottom'
      });
      await infoToast.present();
      
      // Mostrar loading
      loading = await this.loadingController.create({
        message: 'Preparando cámara...',
        spinner: 'circles',
        backdropDismiss: true,
      });
      
      await loading.present();
      
      // Agregar un timeout manual para cerrar el loading en caso de que se quede colgado
      const timeoutId = setTimeout(async () => {
        if (loading && loading.isConnected) {
          console.log('[REGISTER-PAGE] Cerrando loading por timeout');
          await loading.dismiss();
          this.mostrarError('La cámara está tardando demasiado en iniciar. Por favor, ingrese los datos manualmente.');
        }
      }, 20000); // 20 segundos de timeout
      
      console.log('[REGISTER-PAGE] Iniciando lectura de QR');
      const qrData = await this.toolsService.ReadQr();
      console.log('[REGISTER-PAGE] Datos del QR recibidos:', qrData);
      // la data llega asi 00432121939@ STOCKI @LADISLAO ALEX @M @37171743 @B @25/11/1992 @13/04/2016 @239
      // apellido es STOCKI
      // const apellido = qrData.split('@')[1];
      // const nombre = qrData.split('@')[2];
      // const dni = qrData.split('@')[3];
      // el cuit se forma con el dni y el ultimo dato, en este caso 239, pero el cuit seria 23-37171743-9
      // const cuit = (qrData.split('@')[7]).slice(0, 2) + '-' + qrData.split('@')[4] + '-' + (qrData.split('@')[7]).slice(2);
      
      // Limpiar el timeout ya que la operación terminó
      clearTimeout(timeoutId);
      
      // Asegurarse de cerrar el loading
      if (loading && loading.isConnected) {
        await loading.dismiss();
        loading = null;
      }
      
      if (qrData) {
        console.log('[REGISTER-PAGE] Procesando datos del QR:', qrData);
        
        // Tratar de identificar el formato
        if (qrData.includes('@')) {
          // Formato separado por pipes: "APELLIDO@NOMBRE@DNI"
          const datos = qrData.split('@');
          if (datos.length >= 3) {
            this.registerForm.patchValue({
              apellido: datos[1].trim(),
              nombre: datos[2].trim(),
              dni: datos[4].trim(),
              cuil: (datos[8]).slice(0, 2) + '-' + datos[4] + '-' + (datos[8]).slice(2)
            });
            
            const toast = await this.toastController.create({
              message: 'Datos del DNI cargados correctamente',
              duration: 2000,
              color: 'success'
            });
            toast.present();
          } else {
            console.log('[REGISTER-PAGE] Formato de QR no reconocido');
            this.mostrarError('Formato de QR no reconocido');
          }
        } else if (qrData.includes('@')) {
          // Posible formato de correo electrónico
          this.registerForm.patchValue({
            email: qrData.trim()
          });
          
          const toast = await this.toastController.create({
            message: 'Email cargado desde QR',
            duration: 2000,
            color: 'success'
          });
          toast.present();
        } else if (/^\d+$/.test(qrData)) {
          // Solo números, probablemente un DNI
          this.registerForm.patchValue({
            dni: qrData.trim()
          });
          
          const toast = await this.toastController.create({
            message: 'DNI cargado desde QR',
            duration: 2000,
            color: 'success'
          });
          toast.present();
        } else {
          // Formato desconocido
          const alert = await this.alertController.create({
            header: 'Datos detectados',
            message: 'El código QR contiene información en un formato no reconocido. ¿Desea usar estos datos como DNI?',
            buttons: [
              {
                text: 'No',
                role: 'cancel'
              },
              {
                text: 'Sí',
                handler: () => {
                  this.registerForm.patchValue({
                    dni: qrData.trim()
                  });
                }
              }
            ]
          });
          await alert.present();
        }
      } else {
        console.log('[REGISTER-PAGE] No se obtuvieron datos del QR');
        const toast = await this.toastController.create({
          message: 'No se pudo leer el código QR',
          duration: 2000,
          color: 'warning'
        });
        toast.present();
      }
    } catch (error) {
      console.log('[REGISTER-PAGE] Error al leer el código QR:', error);
      
      // Cerrar el loading si estuviera abierto
      if (loading && loading.isConnected) {
        await loading.dismiss();
      }
      
      await this.toolsService.VibrateError();
      
      // Mensaje más específico según el error
      if (error instanceof Error && error.message.includes('Timeout')) {
        this.mostrarError('El proceso de escaneo tomó demasiado tiempo. Por favor, ingrese los datos manualmente.');
      } else {
        this.mostrarError('Error al leer el código QR. Por favor, ingrese los datos manualmente.');
      }
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedPhoto = file;
      // Para mostrar una vista previa si es necesario
      // this.previewPhoto(file);
    }
  }

  get isSourceLogin() {
    return this.registerSource === 'login';
  }

  get showDniFields() {
    return this.registerSource === 'login' && !this.esAnonimo;
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  getErrorMessage(field: string): string {
    const control = this.registerForm.get(field);
    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }
    if (control?.hasError('email')) {
      return 'Email inválido';
    }
    if (control?.hasError('minlength')) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    return '';
  }

  isFieldInvalid(field: string): boolean {
    const control = this.registerForm.get(field);
    return (control?.invalid && (control?.dirty || control?.touched)) || false;
  }

  async mostrarAyudaQR() {
    const alert = await this.alertController.create({
      header: 'Ayuda con el lector QR',
      message: 'Si el lector QR no funciona correctamente, puedes:<br><br>' +
               '1. Verificar que tu dispositivo tenga permisos de cámara activados.<br>' +
               '2. Intentar en un ambiente con buena iluminación.<br>' +
               '3. Ingresar los datos manualmente.<br><br>' +
               'Para ingresar manualmente, simplemente escribe tu DNI en el campo correspondiente.',
      buttons: ['Entendido']
    });
    await alert.present();
  }
}
