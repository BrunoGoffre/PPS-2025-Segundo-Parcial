import { Component, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonItem,
  IonInput,
  IonCardHeader,
  IonCardTitle,
  IonSpinner,
  IonIcon,
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { AppAlertComponent } from '../app-alert/app-alert.component';
import { UsersService } from '../services/users.service';
import { addIcons } from 'ionicons';
import {
  eyeOutline,
  eyeOffOutline,
  peopleOutline,
  personOutline,
  restaurantOutline,
  beerOutline,
  personCircleOutline,
  homeOutline,
  briefcaseOutline,
  shieldOutline,
} from 'ionicons/icons';

interface AccesoDirecto {
  tipo: string;
  nombre: string;
  icono: string;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonSpinner,
    IonIcon,
    AppAlertComponent,
    ReactiveFormsModule,
    CommonModule,
    FormsModule,
    IonInput,
    IonItem,
    IonCardContent,
    IonCard,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCardHeader,
    IonCardTitle,
  ],
})
export class LoginPage {
  emailControl = new FormControl('', [Validators.required, Validators.email]);
  passwordControl = new FormControl('', [
    Validators.required,
    Validators.minLength(6),
  ]);
  selected: string | null = null;
  loading: boolean = false;
  mostrarAccesosDirectos: boolean = false;
  mostrarPassword: boolean = false;
  isPlayingSound: boolean = false;

  accesosDirectos: AccesoDirecto[] = [
    { tipo: 'duenio', nombre: 'Dueño', icono: 'briefcase' },
    { tipo: 'supervisor', nombre: 'Supervisor', icono: 'shield' },
    { tipo: 'maitre', nombre: 'Maître', icono: 'people' },
    { tipo: 'cocinero', nombre: 'Cocinero', icono: 'restaurant' },
    { tipo: 'mozo', nombre: 'Mozo', icono: 'person' },
    { tipo: 'bartender', nombre: 'Bartender', icono: 'beer' },
    { tipo: 'cliente', nombre: 'Cliente', icono: 'person-circle' },
    { tipo: 'clienteanonimo', nombre: 'Anónimo', icono: 'home' },
  ];

  @ViewChild(AppAlertComponent) appAlert!: AppAlertComponent;

  constructor(
    private router: Router,
    private authService: AuthService,
    private usuariosService: UsersService
  ) {
    addIcons({
      eyeOutline,
      eyeOffOutline,
      peopleOutline,
      personOutline,
      restaurantOutline,
      beerOutline,
      personCircleOutline,
      homeOutline,
      briefcaseOutline,
      shieldOutline,
    });
  }

  toggleAccesosDirectos() {
    this.mostrarAccesosDirectos = !this.mostrarAccesosDirectos;
  }

  toggleMostrarPassword() {
    this.mostrarPassword = !this.mostrarPassword;
  }

  establecerCredenciales(tipoUsuario: string) {
    let email = '';
    if (tipoUsuario === 'clienteanonimo') {
      email = 'anon_993815@anon.com';
      // email = `${tipoUsuario}@anonimo.com`;
    } else {
      email = `${tipoUsuario}@bonappetit.com`;
    }
    const password = '123456';
    this.emailControl.setValue(email);
    this.passwordControl.setValue(password);
  }

  clearCredentials() {
    this.emailControl.setValue('');
    this.passwordControl.setValue('');
  }

  logAccount(tipoUsuario: string) {
    this.selected = tipoUsuario;
    this.establecerCredenciales(tipoUsuario);
  }

  irRegistro() {
    this.router.navigate(['/register']);
  }

  async onSubmit() {
    if (!this.emailControl.valid) {
      this.appAlert.showAlert('Por favor, ingresa un correo válido.');
      return;
    }
    if (!this.passwordControl.valid) {
      this.appAlert.showAlert(
        'La contraseña debe tener al menos 6 caracteres.'
      );
      return;
    }
    this.loading = true;

    try {
      const result = await this.authService.login({
        email: this.emailControl.value!,
        password: this.passwordControl.value!,
      });

      if (result && result.user) {
        console.log('[LoginPage] Usuario logueado:', result.user);
        if (this.emailControl.value == 'duenio@bonappetit.com') {
          this.loading = false;
          // this.router.navigate(['/clientes-pendientes']);
          this.router.navigate(['/home']);
          this.playSound('1');
          this.clearCredentials();
        } else {
          const res = await this.usuariosService.checkUserApprovalStatus(
            this.emailControl.value!
          );
          if (res == '') {
            this.loading = false;
            this.router.navigate(['/home']);
            this.playSound('1');
            this.clearCredentials();
          } else {
            this.loading = false;
            this.appAlert.showAlert(res!);
          }
        }
      } else {
        this.loading = false;
        this.appAlert.showAlert('Usuario o contraseña incorrectos.');
      }
    } catch (error: any) {
      this.loading = false;
      this.appAlert.showAlert(
        error.message || 'Usuario o contraseña incorrectos.'
      );
    }
  }

  playSound(sound: string) {
    if (this.isPlayingSound) {
      return;
    }

    const audioFile = this.getAudioFile(sound);
    if (audioFile) {
      const audio = new Audio(audioFile);

      this.isPlayingSound = true;

      audio
        .play()
        .then(() => {})
        .catch((error) => {
          this.isPlayingSound = false;
        });
      audio.onended = () => {
        this.isPlayingSound = false;
      };
    }
  }

  private sounds: { [key: string]: string } = {
    '1': 'conected',
  };

  private getAudioFile(sound: string): string {
    const audioFile = this.sounds[sound];
    if (!audioFile) {
      return '';
    }
    return `assets/sounds/${audioFile}.mp3`;
  }
}
