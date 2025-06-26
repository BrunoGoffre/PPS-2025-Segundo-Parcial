import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';
import { Haptics } from '@capacitor/haptics';
import { NgClass } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  informationCircleOutline, 
  checkmarkCircleOutline, 
  clipboardOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-app-alert',
  templateUrl: './app-alert.component.html',
  styleUrls: ['./app-alert.component.scss'],
  imports: [NgIf, NgClass, IonIcon],
  standalone: true,
})
export class AppAlertComponent {
  @Input() message: string = '';
  @Input() alertType: 'default' | 'encuesta'| 'success' = 'default'; 
  show: boolean = false;
  isPlayingSound = false; 

  constructor() {
    // Registrar los iconos que vamos a usar
    addIcons({
      informationCircleOutline,
      checkmarkCircleOutline,
      clipboardOutline
    });
  }

  showAlert(message: string, type: 'default' | 'encuesta' | 'success' = 'default' ) {
    this.message = message;
    this.alertType = type;
    this.show = true;
    this.vibrar();
    this.playSound('1');
  }

  showInfo(message: string, type: 'default' | 'encuesta' | 'success' = 'default' ) {
    this.message = message;
    this.alertType = type;
    this.show = true;
  }

   // sonidos ------------------------------------------------------------
   playSound(sound: string) {
    if (this.isPlayingSound) {
        return;
    }

    const audioFile = this.getAudioFile(sound);
    if (!audioFile) {
        return;
    }

    const audio = new Audio(audioFile);
    this.isPlayingSound = true;
    audio.play().then(() => {
        this.isPlayingSound = false;
    }).catch(() => {
        this.isPlayingSound = false;
    });
    audio.onended = () => {
        this.isPlayingSound = false;
    };
  }

  private sounds: { [key: string]: string } = {
    '1': 'error',
  };

  private getAudioFile(sound: string) {
    const audioFile = this.sounds[sound];
    if (audioFile) {
        return `assets/sounds/${audioFile}.mp3`;
    }

    console.error(`No hay archivo de audio para el sonido: ${sound}, revisar los archivos de la carpeta o el número de sonido seleccionado`);
    return null;
}
// sonidos ------------------------------------------------------------

  private async vibrar() {
    try {
      await Haptics.vibrate({ duration: 500 });
    } catch (error) {
      console.error('Error al vibrar:', error);
    }
  }

  closeAlert() {
    this.show = false;
  }
}
