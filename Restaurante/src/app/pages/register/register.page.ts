import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RegisterSource, User as LocalUser } from 'src/app/interfaces/user.interface';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { ToolsService } from 'src/app/services/tools.service';
import {
  AlertController,
  LoadingController,
  ToastController,
} from '@ionic/angular';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false,
})
export class RegisterPage implements OnInit, OnDestroy {
  registerForm!: FormGroup;
  registerSource: RegisterSource = 'login';
  esAnonimo: boolean = false;
  selectedPhoto: File | null = null;
  photoPreviewUrl: string | null = null;
  currentUser: LocalUser | null = null;
  perfilSeleccionado: 'dueño' | 'supervisor' | null = null;

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
      foto: ['', Validators.required],
    });

    // Agregamos campos adicionales según el source
    if (this.registerSource === 'login' && !this.esAnonimo) {
      this.registerForm.addControl(
        'apellido',
        this.formBuilder.control('', Validators.required)
      );
      this.registerForm.addControl(
        'dni',
        this.formBuilder.control('', Validators.required)
      );
      this.registerForm.addControl('cuil', this.formBuilder.control(''));
    }

    // Campos específicos para alta de administradores
    if (this.isAltaAdmin) {
      this.registerForm.addControl(
        'apellido',
        this.formBuilder.control('', Validators.required)
      );
      this.registerForm.addControl(
        'dni',
        this.formBuilder.control('', [Validators.required, Validators.pattern(/^\d{7,8}$/)])
      );
      this.registerForm.addControl(
        'cuil',
        this.formBuilder.control('', [Validators.required, Validators.pattern(/^\d{2}-\d{7,8}-\d{1}$/)])
      );
      this.registerForm.addControl(
        'perfil',
        this.formBuilder.control('supervisor', Validators.required)
      );
    }

    // Campo para asignación de roles por dueños/supervisores
    if (this.canAssignRoles) {
      this.registerForm.addControl(
        'rolAsignado',
        this.formBuilder.control('cliente', Validators.required)
      );
    }
  }

  async ngOnInit() {
    // Obtener el usuario actual
    const authUser = this.authService.currentUserValue;
    if (authUser) {
      this.currentUser = authUser as unknown as LocalUser;
    }
    
    this.route.params.subscribe((params) => {
      if (params['source']) {
        this.registerSource = params['source'] as RegisterSource;
        
        // Verificar permisos para alta de administradores
        if (this.registerSource === 'admin' && !this.canAccessAdminRegister) {
          this.toolsService.PresentToast(
            'No tiene permisos para registrar administradores', 
            'danger', 
            3000
          );
          this.router.navigate(['/home']);
          return;
        }
        
        // Reinicializar el formulario con los nuevos parámetros
        this.initForm();
      } else {
        // Si no hay source, inicializar formulario por defecto
        this.initForm();
      }
    });
  }

  ngOnDestroy() {
    // Limpiar la URL de previsualización para evitar memory leaks
    if (this.photoPreviewUrl) {
      URL.revokeObjectURL(this.photoPreviewUrl);
    }
  }

  async onSubmit() {
    debugger;
    if (this.registerForm.valid) {
      const loading = await this.loadingController.create({
        message: 'Registrando...',
      });
      await loading.present();

      try {
        const formData = this.registerForm.value;
        const fullName = this.esAnonimo
          ? formData.nombre
          : `${formData.nombre} ${formData.apellido || ''}`;

        // Determinar el rol según el origen y asignación
        let rol: 'cliente' | 'supervisor' | 'dueño' | 'empleado' | 'anonimo' =
          'cliente';
        
        if (this.registerSource === 'supervisor') {
          rol = 'supervisor';
        } else if (this.registerSource === 'owner') {
          rol = 'dueño';
        } else if (this.registerSource === 'admin') {
          rol = formData.perfil as 'supervisor' | 'dueño';
        } else if (this.esAnonimo) {
          rol = 'anonimo';
        } else if (this.canAssignRoles && formData.rolAsignado) {
          // Si un dueño/supervisor está asignando un rol específico
          rol = formData.rolAsignado as 'cliente' | 'supervisor' | 'dueño' | 'empleado';
        }

        // Datos adicionales según el tipo de usuario
        const userData: {
          apellido?: string;
          dni?: string;
          cuil?: string;
          photoFile?: File;
          approved?: boolean;
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

        // Agregar datos específicos para administradores
        if (this.registerSource === 'admin') {
          userData.apellido = formData.apellido;
          userData.dni = formData.dni;
          userData.cuil = formData.cuil;
          userData.approved = true; // Los administradores se aprueban automáticamente
        }

        // Auto-aprobar usuarios creados por dueños/supervisores (excepto clientes)
        if (this.canAssignRoles && rol !== 'cliente') {
          userData.approved = true;
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
          let mensaje = 'Registro exitoso';
          
          if (this.registerSource === 'admin') {
            mensaje = `${rol === 'dueño' ? 'Dueño' : 'Supervisor'} registrado exitosamente`;
          } else if (this.canAssignRoles) {
            const rolNames = {
              'cliente': 'Cliente',
              'empleado': 'Empleado', 
              'supervisor': 'Supervisor',
              'dueño': 'Dueño'
            };
            mensaje = `${rolNames[rol as keyof typeof rolNames]} registrado exitosamente`;
          }
          
          const toast = await this.toastController.create({
            message: mensaje,
            duration: 2000,
            color: 'success',
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
      buttons: ['OK'],
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
      this.registerForm.addControl(
        'apellido',
        this.formBuilder.control('', Validators.required)
      );
      this.registerForm.addControl(
        'dni',
        this.formBuilder.control('', Validators.required)
      );
      this.registerForm.addControl('cuil', this.formBuilder.control(''));
    }

    // Limpiar foto cuando cambie el modo
    this.clearPhoto();
  }

  private clearPhoto() {
    if (this.photoPreviewUrl) {
      URL.revokeObjectURL(this.photoPreviewUrl);
    }
    this.photoPreviewUrl = null;
    this.selectedPhoto = null;
    this.registerForm.patchValue({ foto: '' });
  }

  async leerQR() {
    let loading: HTMLIonLoadingElement | null = null;

    try {
      // Mostrar instrucciones al usuario
      const infoToast = await this.toastController.create({
        message: 'Apunta la cámara al código QR del reverso de tu DNI argentino',
        duration: 4000,
        position: 'bottom',
        color: 'primary'
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
          this.mostrarError(
            'La cámara está tardando demasiado en iniciar. Por favor, ingrese los datos manualmente.'
          );
        }
      }, 20000); // 20 segundos de timeout

      console.log('[REGISTER-PAGE] Iniciando lectura de QR');
      const qrData = await this.toolsService.ReadQr();
      console.log('[REGISTER-PAGE] Datos del QR recibidos:', qrData);
      
      // Para testing/desarrollo: descomentar la siguiente línea para simular un DNI
      // const qrData = '00432121939@PEREZ@JUAN CARLOS@M@37171743@B@25/11/1992@13/04/2016@239';

      // Limpiar el timeout ya que la operación terminó
      clearTimeout(timeoutId);

      // Asegurarse de cerrar el loading
      if (loading && loading.isConnected) {
        await loading.dismiss();
        loading = null;
      }

      if (qrData) {
        console.log('[REGISTER-PAGE] Procesando datos del QR DNI argentino:', qrData);

        // Procesar formato de DNI argentino
        if (await this.procesarQRDNIArgentino(qrData)) {
          this.toolsService.PresentToast(
            'Datos del DNI cargados correctamente',
            'success',
            2000
          );
        } else if (qrData.includes('@')) {
          // Posible formato de correo electrónico
          this.registerForm.patchValue({
            email: qrData.trim(),
          });

          const toast = await this.toastController.create({
            message: 'Email cargado desde QR',
            duration: 2000,
            color: 'success',
          });
          toast.present();
        } else if (/^\d+$/.test(qrData)) {
          // Solo números, probablemente un DNI
          this.registerForm.patchValue({
            dni: qrData.trim(),
          });

          const toast = await this.toastController.create({
            message: 'DNI cargado desde QR',
            duration: 2000,
            color: 'success',
          });
          toast.present();
        } else {
          // Formato no reconocido como DNI argentino
          console.log('[REGISTER-PAGE] Formato QR no reconocido como DNI argentino');
          
          const alert = await this.alertController.create({
            header: 'QR no reconocido',
            message: 
              'El código QR escaneado no parece ser de un DNI argentino.<br><br>' +
              '<strong>Verifica que estés escaneando:</strong><br>' +
              '• El <strong>reverso</strong> del DNI (no el frente)<br>' +
              '• Un DNI argentino actualizado<br><br>' +
              '¿Quieres intentar nuevamente o ingresar los datos manualmente?',
            buttons: [
              {
                text: 'Ingresar manualmente',
                role: 'cancel',
              },
              {
                text: 'Intentar de nuevo',
                handler: () => {
                  this.leerQR();
                },
              },
            ],
          });
          await alert.present();
        }
      } else {
        console.log('[REGISTER-PAGE] No se obtuvieron datos del QR');
        const toast = await this.toastController.create({
          message: 'No se pudo leer el código QR',
          duration: 2000,
          color: 'warning',
        });
        toast.present();
      }
    } catch (error) {
      console.log('[REGISTER-PAGE] Error al leer el código QR:', error);

      // Cerrar el loading si estuviera abierto
      if (loading && loading.isConnected) {
        await loading.dismiss();
      }

      await this.toolsService.VibrateOnError();

      // Mensaje más específico según el error
      if (error instanceof Error && error.message.includes('Timeout')) {
        this.mostrarError(
          'El proceso de escaneo tomó demasiado tiempo. Por favor, ingrese los datos manualmente.'
        );
      } else {
        this.mostrarError(
          'Error al leer el código QR. Por favor, ingrese los datos manualmente.'
        );
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

  get isAltaAdmin() {
    return this.registerSource === 'admin' && this.currentUser && 
           (this.currentUser.rol === 'dueño' || this.currentUser.rol === 'supervisor');
  }

  get canAccessAdminRegister() {
    return this.currentUser && (this.currentUser.rol === 'dueño' || this.currentUser.rol === 'supervisor');
  }

  get canAssignRoles() {
    return this.currentUser && 
           (this.currentUser.rol === 'dueño' || this.currentUser.rol === 'supervisor') &&
           !this.isAltaAdmin &&
           !this.isSourceLogin;
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
    if (control?.hasError('pattern')) {
      if (field === 'dni') {
        return 'El DNI debe tener 7 u 8 dígitos';
      }
      if (field === 'cuil') {
        return 'El CUIL debe tener el formato XX-XXXXXXXX-X';
      }
    }
    if (field === 'rolAsignado' && control?.hasError('required')) {
      return 'Debe seleccionar un rol';
    }
    return '';
  }

  async sacarFoto() {
    try {
      console.log('[REGISTER] Iniciando captura de foto...');
      
      // Verificar configuración del storage primero
      const storageOk = await this.toolsService.verificarStorageConfiguration();
      if (!storageOk) {
        console.error('[REGISTER] Storage no configurado correctamente');
        return;
      }
      
      // Mostrar loading
      await this.toolsService.presentLoader('Abriendo cámara...');
      
      // Crear un objeto temporal para el usuario (ya que el servicio lo requiere)
      const tempUser = {
        id: 'temp-' + Date.now(),
        email: 'temp@temp.com'
      };
      
      const photoFile = await this.toolsService.sacarFoto(tempUser as any);
      
      // Cerrar loading
      await this.toolsService.StopLoader();
      
      if (photoFile) {
        console.log('[REGISTER] Foto capturada:', {
          name: photoFile.name,
          size: photoFile.size,
          type: photoFile.type
        });
        
        // Verificar que el archivo sea válido
        if (photoFile.size === 0) {
          this.toolsService.PresentToast(
            'La imagen está vacía. Intente nuevamente.',
            'warning',
            3000
          );
          return;
        }
        
        // Guardar el archivo para usarlo en el registro
        this.selectedPhoto = photoFile;
        
        // Limpiar URL anterior si existe
        if (this.photoPreviewUrl) {
          URL.revokeObjectURL(this.photoPreviewUrl);
        }
        
        // Generar nueva URL de previsualización
        this.photoPreviewUrl = URL.createObjectURL(photoFile);
        
        // Marcar el campo como válido
        this.registerForm.patchValue({ foto: 'valid' });
        
        this.toolsService.PresentToast(
          'Foto capturada correctamente',
          'success',
          2000
        );
      } else {
        console.log('[REGISTER] No se capturó foto');
        this.toolsService.PresentToast(
          'No se pudo capturar la foto',
          'warning',
          2000
        );
      }
    } catch (error) {
      console.error('[REGISTER] Error al tomar foto:', error);
      
      // Asegurar que se cierre el loading
      await this.toolsService.StopLoader();
      
      this.toolsService.PresentToast(
        'Error al tomar la foto: ' + (error as Error).message,
        'danger',
        3000
      );
    }
  }

  isFieldInvalid(field: string): boolean {
    const control = this.registerForm.get(field);
    return (control?.invalid && (control?.dirty || control?.touched)) || false;
  }

  async procesarQRDNIArgentino(qrData: string): Promise<boolean> {
    try {
      console.log('[REGISTER-PAGE] Analizando QR de DNI argentino:', qrData);
      
      // Formato DNI argentino: "00432121939@STOCKI@LADISLAO ALEX@M@37171743@B@25/11/1992@13/04/2016@239"
      // Los campos están separados por '@'
      if (!qrData.includes('@')) {
        console.log('[REGISTER-PAGE] No es formato DNI argentino - falta separador @');
        return false;
      }

      const datos = qrData.split('@');
      console.log('[REGISTER-PAGE] Datos separados:', datos);

      // Verificar que tenga la cantidad mínima de campos esperados
      if (datos.length < 9) {
        console.log('[REGISTER-PAGE] Formato DNI incompleto - campos insuficientes:', datos.length);
        return false;
      }

      // Extraer información según formato DNI argentino:
      // [0]: Número de trámite  
      // [1]: Apellido
      // [2]: Nombre(s)
      // [3]: Sexo (M/F)
      // [4]: DNI
      // [5]: Ejemplar (A/B/C)
      // [6]: Fecha nacimiento
      // [7]: Fecha vencimiento
      // [8]: Código para CUIL

      const apellido = datos[1]?.trim();
      const nombre = datos[2]?.trim();
      const dni = datos[4]?.trim();
      const codigoCUIL = datos[8]?.trim();

      // Validar DNI
      if (!dni || !/^\d{7,8}$/.test(dni)) {
        console.log('[REGISTER-PAGE] DNI inválido:', dni);
        return false;
      }

      // Calcular CUIL: código + DNI + dígito verificador
      let cuil = '';
      if (codigoCUIL && codigoCUIL.length >= 3) {
        const prefijo = codigoCUIL.slice(0, 2);
        const sufijo = codigoCUIL.slice(2);
        cuil = `${prefijo}-${dni}-${sufijo}`;
      }

      console.log('[REGISTER-PAGE] Datos extraídos:', {
        apellido,
        nombre,
        dni,
        cuil
      });

      // Actualizar formulario
      const updates: any = {};
      if (apellido) updates.apellido = apellido;
      if (nombre) updates.nombre = nombre;
      if (dni) updates.dni = dni;
      if (cuil) updates.cuil = cuil;

      this.registerForm.patchValue(updates);
      
      console.log('[REGISTER-PAGE] Formulario actualizado con datos de QR');
      return true;

    } catch (error) {
      console.error('[REGISTER-PAGE] Error procesando QR DNI:', error);
      return false;
    }
  }

  async mostrarAyudaQR() {
    const alert = await this.alertController.create({
      header: 'Ayuda con el escáner QR',
      message:
        '<strong>Para escanear tu DNI argentino:</strong><br><br>' +
        '1. <strong>Usa el reverso del DNI</strong> donde está el código QR<br>' +
        '2. <strong>Buena iluminación</strong> es importante<br>' +
        '3. <strong>Mantén el DNI firme</strong> hasta que se escanee<br>' +
        '4. <strong>Permisos de cámara</strong> deben estar activados<br><br>' +
        'Si no funciona, puedes <strong>ingresar los datos manualmente</strong>.',
      buttons: ['Entendido'],
    });
    await alert.present();
  }
}
