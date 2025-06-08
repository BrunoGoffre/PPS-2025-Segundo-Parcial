import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private loading: HTMLIonLoadingElement | null = null;
  constructor(private loadingController: LoadingController) {}

  async present(message: string = '', duration: number = 0) {
    this.loading = await this.loadingController.create({
      cssClass: 'custom-loader',
      backdropDismiss: false,
      animated: true,
      duration: duration != 0 ? duration : undefined,
      spinner: 'circles', 
      message: message !== '' ? message : undefined
    });
    await this.loading.present();
  }

  StopLoading(){
    this.loadingController.dismiss()
    this.loading = null;
  }
}
