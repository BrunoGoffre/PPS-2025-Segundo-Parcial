import { inject, Injectable } from '@angular/core';
import { User as FirebaseUser } from '@angular/fire/auth';
import { Capacitor } from '@capacitor/core';
import { ActionPerformed, PermissionStatus, PushNotificationSchema, PushNotifications, Token } from '@capacitor/push-notifications';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationsService {
  private firestore:Firestore = inject(Firestore);
  private router:Router = inject(Router);
  private user!: FirebaseUser;
  private enable:boolean = false;
  public originNotification: boolean = false;

  constructor() { }

  init(user:FirebaseUser){
    this.user = user;
    
    if(Capacitor.isNativePlatform()){
      try {
        PushNotifications.requestPermissions().then((result: PermissionStatus) => {
          if (result.receive === 'granted') {
            // Register with Apple / Google to receive push via APNS/FCM
            PushNotifications.register();
          } else {
            // Permiso denegado, pero no hacemos nada crítico
            console.log('Permiso de notificaciones denegado');
          }
        }).catch(error => {
          // Capturar cualquier error en la solicitud de permisos
          console.error('Error al solicitar permisos de notificaciones:', error);
        });
        this.addListeners();
      } catch (error) {
        // Capturar cualquier error no controlado
        console.error('Error al inicializar notificaciones push:', error);
      }
    }
  }

  private addListeners(){
    try {
      // On success, we should be able to receive notifications
      PushNotifications.addListener('registration', (token: Token) => {
        //alert('Push registration success, token: ' + token.value);
        this.saveToken(token.value);
        this.enable = true;
      });

      // Some issue with our setup and push will not work
      PushNotifications.addListener('registrationError', (error: any) => {
        //alert('Error on registration: ' + JSON.stringify(error));
        console.error('Error en el registro de notificaciones push:', error);
      });

      // Show us the notification payload if the app is open on our device
      PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        //alert('Push received: ' + JSON.stringify(notification));
        try {
          const enlace = notification.notification?.data?.enlace;
          if (enlace) {
            this.router.navigateByUrl(enlace);
          }
        } catch (error) {
          console.error('Error al procesar notificación recibida:', error);
        }
      });

      // Method called when tapping on a notification
      PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
        //alert('Push action performed: ' + JSON.stringify(notification));
        try {
          const enlace = notification.notification?.data?.enlace;
          if (enlace) {
            this.originNotification = true;
            this.router.navigateByUrl(enlace);
          }
        } catch (error) {
          console.error('Error al procesar acción de notificación:', error);
        }
      });
    } catch (error) {
      console.error('Error al configurar listeners de notificaciones:', error);
    }
  }

  async saveToken(token:string){
    try {
      const data = {token};
      const docRef = doc(this.firestore, `usuarios/${this.user.uid}`);
      await updateDoc(docRef, data);
    } catch (error) {
      console.error('Error al guardar token:', error);
    }
  }

  async deleteToken(){
    if(this.enable){
      try {
        const data:any = {
          token: null
        }
        const docRef = doc(this.firestore, `usuarios/${this.user.uid}`);
        await updateDoc(docRef, data);
      } catch (error) {
        console.error('Error al eliminar token:', error);
      }
    }
  }
}
