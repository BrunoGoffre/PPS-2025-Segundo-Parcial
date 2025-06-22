import { NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { DynamicSplashComponent } from './dynamic-splash/dynamic-splash.component';
import { Router } from '@angular/router';
import { SplashScreen } from '@capacitor/splash-screen';
import { addIcons } from 'ionicons';
import { logOutOutline, arrowBackOutline, starOutline, star } from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';
import { Platform } from '@ionic/angular';
import { PushNotifications } from '@capacitor/push-notifications';
import { PushNotificationsService } from './services/push-notifications.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [IonApp, IonRouterOutlet, DynamicSplashComponent, NgIf],
})
export class AppComponent implements OnInit {
  showLoading = true;
  userIsLoggedIn = false;

  constructor(
    private router: Router,
    private pushNotificationsService: PushNotificationsService,
    private authService: AuthService,
    private platform: Platform
  ) {}

  ngOnInit() {
    addIcons({
      logOutOutline,
      arrowBackOutline,
      starOutline,
      star,
    });

    this.platform.ready().then(() => {
      try {
        this.initNotifications();
      } catch (error) {
        console.error('Error al inicializar notificaciones:', error);
      }
    });
    
    setTimeout(() => {
      SplashScreen.hide();
      setTimeout(() => {
        this.showLoading = false;

        try {
          if (!this.pushNotificationsService.originNotification) {
            if (this.authService.userActive != null) {
              this.router.navigate(['/home']);
            } else {
              this.router.navigate(['/login']);
            }
          }
        } catch (error) {
          console.error('Error en la navegación inicial:', error);
          // Si hay un error, intentamos navegar a la página de login como fallback
          this.router.navigate(['/login']).catch(err => {
            console.error('Error en navegación de fallback:', err);
          });
        }
      }, 2000);
    }, 2000);
  }

  private async initNotifications() {
    if (Capacitor.getPlatform() === 'android') {
      try {
        await PushNotifications.createChannel({
          id: 'notifications_alfa', // ID de canal para referenciar
          name: 'Notifications', // Nombre del canal
          description: 'Notifications for Alfa', // Descripcion del canal
          importance: 2, // importancia de la notificacion: ALTA
          visibility: 1, // visibilidad de la notificacion: PUBLICA
        });
      } catch (error) {
        console.error('Error al crear canal de notificaciones:', error);
        // No lanzamos el error para que la aplicación pueda continuar
      }
    }
  }
}