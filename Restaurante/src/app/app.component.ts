import { Component } from '@angular/core';
import { ModalController, Platform } from '@ionic/angular';
import { Router } from '@angular/router';
import { SplashComponent } from './components/splash/splash.component';

import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private modalCtrl: ModalController,
    private router: Router,
  ) {}
  async initializeApp() {
    await StatusBar.setStyle({ style: Style.Default });

    // await SplashScreen.show();
    // await this.delay(1000);
    await SplashScreen.hide();

    await this.presentModal();

    this.router.navigate(['/home']);
    this.platform.ready().then(() => {
      // Este modo es el más compatible con Ionic
      Keyboard.setResizeMode({ mode: KeyboardResize.Ionic });

      // Opcional: cerrar el teclado tocando fuera
      Keyboard.setScroll({ isDisabled: false });
    });
  }

  async presentModal() {
    const modal = await this.modalCtrl.create({
      component: SplashComponent,
      cssClass: 'splash-modal',
      backdropDismiss: false,
      animated: true,
    });
    await modal.present();

    // Espera unos segundos antes de cerrarlo (puedes poner animación también)
    setTimeout(() => modal.dismiss(), 3000);
  }

  delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

