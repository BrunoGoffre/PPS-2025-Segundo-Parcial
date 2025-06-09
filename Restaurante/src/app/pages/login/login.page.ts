import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { environment } from 'src/environments/environment';
import { LoadingController, ToastController } from '@ionic/angular';
// import { Usuario } from 'src/app/clases/usuario'; <--- Clase para el usuario
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoadingService } from 'src/app/services/loading.service';
//import { DataService } from 'src/app/services/data.service'; <--- Service para el usuario
import { QuickAccessUser } from 'src/app/interfaces/user.interface';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone:false
})
export class LoginPage implements OnInit {

  // usuario: Usuario = new Usuario(); <--- Clase para el usuario
  checkUsuario: boolean = false;
  checkAdmin: boolean = false;
  checkTester: boolean = false;
  selectedUser: any;
  // perfiles = environment.perfiles;
  principal = '../assets/img/alarm.svg';
  rol: string = '';
  // nombre: string;
  pattern = '^([a-zA-Z0-9_-.]+)@([a-zA-Z0-9_-.]+).([a-zA-Z]{2,5})$';
  // mensaje: string;
  loginForm: FormGroup = this.initForm();
  dirty: boolean = false;
  quickAccessUsers: QuickAccessUser[] = [
    {
      email: 'alex@sdk.com',
      password: 'hola12345',
      rol: 'admin',
      displayName: 'Alex Test'
    },
    {
      email: 'cliente@test.com',
      password: '123456',
      rol: 'cliente',
      displayName: 'Cliente Test'
    },
    {
      email: 'supervisor@test.com',
      password: '123456',
      rol: 'supervisor',
      displayName: 'Supervisor Test'
    },
    {
      email: 'dueño@test.com',
      password: '123456',
      rol: 'dueño',
      displayName: 'Dueño Test'
    },
  ];

  constructor(
    public toastController: ToastController,
    // private dataService: DataService,
    private form: FormBuilder,
    private router: Router,
    private loader: LoadingService,
    private authService: AuthService
  ) {
    // this.initForm();
  }

  ngOnInit() {
    
    // this.loader.present();
  }

  private initForm(): FormGroup {
    return this.form.group({
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(20)
      ]]
    });
  }

  cargarSesion(event: any, tipo: any) {
  }

  get loginControls() {
    return this.loginForm.controls;
  }

  async onSubmit() {
    if (this.loginForm.valid) {
      try {
        await this.loader.present();
        
        const { email, password } = this.loginForm.value;
        console.log(`[LOGIN-PAGE] Email: ${email}, Password: ${password}`);
        
        const { success, message } = await this.authService.login(email, password);

        if (success) {
          this.router.navigate(['/home']);
        } else {
          this.showError(message || 'Error al iniciar sesión');
        }
      } catch (error) {
        this.showError('Error al iniciar sesión');
      } finally {
        await this.loader.StopLoading();
      }
    } else {
      this.showFormErrors();
    }
  }

  private showFormErrors(): void {
    if (this.loginForm.get('email')?.errors) {
      if (this.loginForm.get('email')?.hasError('required')) {
        this.showError('El email es requerido');
      } else if (this.loginForm.get('email')?.hasError('email') || 
                 this.loginForm.get('email')?.hasError('pattern')) {
        this.showError('El formato del email no es válido');
      }
    }
    
    if (this.loginForm.get('password')?.errors) {
      if (this.loginForm.get('password')?.hasError('required')) {
        this.showError('La contraseña es requerida');
      } else if (this.loginForm.get('password')?.hasError('minlength')) {
        this.showError('La contraseña debe tener al menos 6 caracteres');
      } else if (this.loginForm.get('password')?.hasError('maxlength')) {
        this.showError('La contraseña no puede tener más de 20 caracteres');
      }
    }
  }

  private async showError(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }

  onQuickAccess(user: QuickAccessUser) {
    console.log(`[LOGIN-PAGE] Email: ${user.email}, Password: ${user.password}`);
    this.loginForm.patchValue({
      email: user.email,
      password: user.password
    });
  }

  goToRegister() {
    this.router.navigate(['/register', 'login']);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(field: string): string {
    const control = this.loginForm.get(field);
    if (control?.errors) {
      if (control.hasError('required')) return 'Este campo es requerido';
      if (control.hasError('email') || control.hasError('pattern')) return 'Email inválido';
      if (control.hasError('minlength')) return 'Mínimo 6 caracteres';
      if (control.hasError('maxlength')) return 'Máximo 20 caracteres';
    }
    return '';
  }
}
