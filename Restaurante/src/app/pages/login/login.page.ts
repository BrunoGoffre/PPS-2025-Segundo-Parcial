import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { environment } from 'src/environments/environment';
import { LoadingController, ToastController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { QuickAccessUser } from 'src/app/interfaces/user.interface';
import { ToolsService } from 'src/app/services/tools.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage implements OnInit {
  checkUsuario: boolean = false;
  checkAdmin: boolean = false;
  checkTester: boolean = false;
  selectedUser: any;
  principal = '../assets/img/alarm.svg';
  rol: string = '';
  pattern = '^[a-zA-Z0-9._%+-ñÑ]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$';
  loginForm: FormGroup = this.initForm();
  dirty: boolean = false;
  quickAccessUsers: QuickAccessUser[] = [
    {
      email: 'alex@sdk.com',
      password: 'hola12345',
      rol: 'admin',
      displayName: 'Alex Test',
    },
    {
      email: 'cliente@test.com',
      password: '123456',
      rol: 'cliente',
      displayName: 'Cliente Test',
    },
    {
      email: 'supervisor@test.com',
      password: '123456',
      rol: 'supervisor',
      displayName: 'Supervisor Test',
    },
    {
      email: 'duenio@test.com',
      password: '12345678',
      rol: 'dueño',
      displayName: 'Dueño Test',
    },
  ];

  constructor(
    // private dataService: DataService,
    private form: FormBuilder,
    private router: Router,
    private location: Location,
    private tools: ToolsService,
    private authService: AuthService
  ) {}

  ngOnInit() {}

  private initForm(): FormGroup {
    return this.form.group({
      email: [
        '',
        [
          Validators.required,
          Validators.pattern(
            '^[a-zA-Z0-9._%+-ñÑ]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
          ),
        ],
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(20),
        ],
      ],
    });
  }

  cargarSesion(event: any, tipo: any) {}

  get loginControls() {
    return this.loginForm.controls;
  }

  async onSubmit() {
    if (this.loginForm.valid) {
      try {
        await this.tools.presentLoader();

        const { email, password } = this.loginForm.value;
        console.log(`[LOGIN-PAGE] Email: ${email}, Password: ${password}`);

        const { success, message, user } = await this.authService.login(
          email,
          password
        );
        console.log(user);
        if (user?.approved == null) {
          this.tools.PresentToast(
            'Su cuenta esta pendiente de aprobación',
            'danger',
            3000
          );
          return;
        } else if (user?.approved == false) {
          this.tools.PresentToast(
            'Su cuenta ha sido rechazada',
            'danger',
            3000
          );
          return;
        }

        if (success) {
          this.router.navigate(['/home']);
        } else {
          this.tools.PresentToast(
            message || 'Error al iniciar sesión',
            'danger',
            3000
          );
        }
      } catch (error) {
        this.tools.PresentToast('Error al iniciar sesión', 'danger', 3000);
      } finally {
        await this.tools.StopLoader();
      }
    } else {
      this.showFormErrors();
    }
  }

  private showFormErrors(): void {
    if (this.loginForm.get('email')?.errors) {
      if (this.loginForm.get('email')?.hasError('required')) {
        this.tools.PresentToast('El email es requerido', 'danger', 3000);
      } else if (
        this.loginForm.get('email')?.hasError('email') ||
        this.loginForm.get('email')?.hasError('pattern')
      ) {
        this.tools.PresentToast(
          'El formato del email no es válido',
          'danger',
          3000
        );
      }
    }

    if (this.loginForm.get('password')?.errors) {
      if (this.loginForm.get('password')?.hasError('required')) {
        this.tools.PresentToast('La contraseña es requerida', 'danger', 3000);
      } else if (this.loginForm.get('password')?.hasError('minlength')) {
        this.tools.PresentToast(
          'La contraseña debe tener al menos 6 caracteres',
          'danger',
          3000
        );
      } else if (this.loginForm.get('password')?.hasError('maxlength')) {
        this.tools.PresentToast(
          'La contraseña no puede tener más de 20 caracteres',
          'danger',
          3000
        );
      }
    }
  }

  onQuickAccess(user: QuickAccessUser) {
    console.log(
      `[LOGIN-PAGE] Email: ${user.email}, Password: ${user.password}`
    );
    this.loginForm.patchValue({
      email: user.email,
      password: user.password,
    });
    console.log('Errores del formulario:', this.loginForm.errors);
    console.log(
      'Errores del control de email:',
      this.loginForm.get('email')?.errors
    );
    console.log(
      'Errores del control de password:',
      this.loginForm.get('password')?.errors
    );
    console.log('formulario valido: ', this.loginForm.valid);
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.invalid && control.dirty && control.touched);
  }

  getErrorMessage(field: string): string {
    const control = this.loginForm.get(field);
    if (control?.errors) {
      if (control.hasError('required')) return 'Este campo es requerido';
      if (control.hasError('email') || control.hasError('pattern'))
        return 'Email inválido';
      if (control.hasError('minlength')) return 'Mínimo 6 caracteres';
      if (control.hasError('maxlength')) return 'Máximo 20 caracteres';
    }
    return '';
  }

  goBack() {
    this.location.back();
  }

  getUserIcon(rol: string): string {
    const icons: { [key: string]: string } = {
      'admin': 'shield-outline',
      'dueño': 'crown-outline',
      'supervisor': 'star-outline',
      'empleado': 'briefcase-outline',
      'cliente': 'person-outline'
    };
    return icons[rol] || 'person-outline';
  }
}
