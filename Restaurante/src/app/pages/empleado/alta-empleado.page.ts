import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { ToolsService } from 'src/app/services/tools.service';
import {
  AlertController,
  LoadingController,
  ToastController,
} from '@ionic/angular';

@Component({
  selector: 'app-alta-empleado',
  templateUrl: './alta-empleado.page.html',
  styleUrls: ['./alta-empleado.page.scss'],
  standalone: false,
})
export class AltaEmpleadoPage implements OnInit {
  employeeForm!: FormGroup;
  selectedPhoto: File | null = null;
  employeeRoles: { value: string; label: string }[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private toolsService: ToolsService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.initForm();
    this.loadEmployeeRoles();
  }

  initForm() {
    this.employeeForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      dni: ['', [Validators.required, Validators.pattern('^[0-9]{7,8}$')]],
      cuil: ['', [Validators.required]],
      rol: ['empleadoCocinero', Validators.required],
      foto: [''],
    });
  }

  loadEmployeeRoles() {
    this.employeeRoles = [
      { value: 'empleadoCocinero', label: 'Cocinero' },
      { value: 'empleadoMozo', label: 'Mozo' },
      { value: 'empleadoBartender', label: 'Bartender' },
      { value: 'empleadoMaître', label: 'Maître' },
      { value: 'supervisor', label: 'Supervisor' },
    ];
  }

  async onSubmit() {
    if (this.employeeForm.valid) {
      const loading = await this.loadingController.create({
        message: 'Dando de alta empleado...',
      });
      await loading.present();

      try {
        const formData = this.employeeForm.value;
        const fullName = `${formData.nombre} ${formData.apellido}`;
        const email = formData.email;
        const password = formData.dni;

        const userData: {
          apellido?: string;
          dni?: string;
          cuil?: string;
          photoFile?: File;
          approved?: boolean;
        } = {
          apellido: formData.apellido,
          dni: formData.dni,
          cuil: formData.cuil,
          approved: true,
        };

        if (this.selectedPhoto) {
          userData.photoFile = this.selectedPhoto;
        }

        const result = await this.authService.register(
          email,
          password,
          fullName,
          false,
          formData.rol,
          userData
        );

        if (result.success) {
          await loading.dismiss();
          const alert = await this.alertController.create({
            header: 'Alta Exitosa',
            message: `El empleado ha sido registrado.<br><br><strong>Email:</strong> ${email}<br><strong>Contraseña:</strong> ${password}<br><br>Por favor, guarde estas credenciales.`,
            buttons: [
              {
                text: 'OK',
                handler: () => {
                  this.router.navigate(['/home']);
                },
              },
            ],
          });
          await alert.present();
        } else {
          this.mostrarError(result.message || 'Error en el alta.');
        }
      } catch (error: any) {
        this.mostrarError(error.message || 'Error en el alta.');
      } finally {
        if (loading.isConnected) {
          await loading.dismiss();
        }
      }
    }
  }

  async leerQR() {
    let loading: HTMLIonLoadingElement | null = null;
    try {
      loading = await this.loadingController.create({
        message: 'Preparando cámara...',
      });
      await loading.present();

      const qrData = await this.toolsService.ReadQr();

      await loading.dismiss();

      if (qrData && qrData.includes('@')) {
        const datos = qrData.split('@');
        if (datos.length >= 8) {
          const apellido = datos[1].trim();
          const nombre = datos[2].trim();
          const dni = datos[4].trim();
          const cuilPrefix = datos[8].slice(0, 2);
          const cuilSuffix = datos[8].slice(2);
          const cuil = `${cuilPrefix}-${dni}-${cuilSuffix}`;

          this.employeeForm.patchValue({
            apellido: apellido,
            nombre: nombre,
            dni: dni,
            cuil: cuil,
          });

          const toast = await this.toastController.create({
            message: 'Datos del DNI cargados correctamente',
            duration: 2000,
            color: 'success',
          });
          toast.present();
        } else {
          this.mostrarError('Formato de QR no reconocido');
        }
      } else if (qrData) {
        this.mostrarError(
          'Formato de QR no reconocido. Por favor, ingrese los datos manualmente.'
        );
      }
    } catch (error) {
      if (loading && loading.isConnected) {
        await loading.dismiss();
      }
      this.mostrarError(
        'Error al leer el código QR. Por favor, ingrese los datos manualmente.'
      );
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedPhoto = file;
    }
  }

  getErrorMessage(field: string): string {
    const control = this.employeeForm.get(field);
    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }
    if (control?.hasError('pattern')) {
      if (field === 'dni') return 'DNI inválido.';
    }
    if (control?.hasError('email')) {
      if (field === 'email') return 'Email inválido.';
    }
    return '';
  }

  isFieldInvalid(field: string): boolean {
    const control = this.employeeForm.get(field);
    return (control?.invalid && (control?.dirty || control?.touched)) || false;
  }

  async mostrarError(mensaje: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      message: mensaje,
      buttons: ['OK'],
    });
    await alert.present();
  }

  async mostrarAyudaQR() {
    const alert = await this.alertController.create({
      header: 'Ayuda con el lector QR',
      message: `Si el lector QR no funciona, puede ingresar los datos manualmente.`,
      buttons: ['Entendido'],
    });
    await alert.present();
  }
}
