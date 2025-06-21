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
      PushNotifications.requestPermissions().then((result: PermissionStatus) => {
        if (result.receive === 'granted') {
          // Register with Apple / Google to receive push via APNS/FCM
          PushNotifications.register();
        } else {
          // Show some error
        }
      });
      this.addListeners();
    }
  }

  private addListeners(){
    // On success, we should be able to receive notifications
    PushNotifications.addListener('registration', (token: Token) => {
      //alert('Push registration success, token: ' + token.value);
      this.saveToken(token.value);
      this.enable = true;
    });

    // Some issue with our setup and push will not work
    PushNotifications.addListener('registrationError', (error: any) => {
      //alert('Error on registration: ' + JSON.stringify(error));
    });

    // Show us the notification payload if the app is open on our device
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      //alert('Push received: ' + JSON.stringify(notification));
      const enlace = notification.notification.data.enlace;
      if (enlace) {
        this.router.navigateByUrl(enlace);
      }
    });

    // Method called when tapping on a notification
    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      //alert('Push action performed: ' + JSON.stringify(notification));
      const enlace = notification.notification.data.enlace;
      if (enlace) {
        this.originNotification = true;
        this.router.navigateByUrl(enlace);
      }
    });
  }

  async saveToken(token:string){
    const data = {token};
    const docRef = doc(this.firestore, `usuarios/${this.user.uid}`);
    await updateDoc(docRef, data);
  }

  async deleteToken(){
    if(this.enable){
      const data:any = {
        token: null
      }
      const docRef = doc(this.firestore, `usuarios/${this.user.uid}`);
      await updateDoc(docRef, data);
    }
  }
}
