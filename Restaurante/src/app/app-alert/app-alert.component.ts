import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { NgClass } from '@angular/common';

type Idioma = 'ingles' 
type Numero = '1' 

@Component({
  selector: 'app-custom-alert',
  template: `
    <div *ngIf="show" class="alert-overlay">
      <div class="alert-container" [ngClass]="alertType">
        <div class="alert-content">
          <span style="white-space: pre-wrap;">{{ message }}</span>
          <button [ngClass]="{'success-button': alertType === 'success', 'error-button': alertType !== 'success'}" 
                  (click)="closeAlert()">Aceptar</button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./custom-alert.component.scss'],
  imports: [NgIf, NgClass],
  standalone: true,
})
export class CustomAlertComponent {
  @Input() message: string = '';
  @Input() alertType: 'default' | 'encuesta'| 'success' = 'default'; // Nuevo tipo de alerta
  show: boolean = false;
  isPlaying = false; 
  idiomaActual: Idioma = 'ingles';
  private sonidos: { [key in Idioma]: { [key in Numero]: string } } = {
    'ingles': {
      '1': 'error',
    },
  };

  showAlert(message: string, type: 'default' | 'encuesta' | 'success' = 'default' ) {
    this.message = message;
    this.alertType = type;
    this.show = true;
    this.vibrar();
    this.LeerNumero('1');
  }

  showInfo(message: string, type: 'default' | 'encuesta' | 'success' = 'default' ) {
    this.message = message;
    this.alertType = type;
    this.show = true;
  }

  LeerNumero(Numero: Numero){
    if (this.isPlaying) {
      return;  
    }
    const src = this.getAudioSrc(Numero);  
    if (src) {
      const audio = new Audio(src);
      this.isPlaying = true;  
      audio.play().then(() => {
      }).catch(error => {
        this.isPlaying = false;  
      });
      audio.onended = () => {
        this.isPlaying = false;
      };
    }
  }

  getAudioSrc(Numero: Numero): string {
    if (this.alertType === 'success') {
       return `assets/sounds/conected.mp3`; 
    }
    const sonido = this.sonidos[this.idiomaActual][Numero];
    return sonido ? `assets/sounds/${sonido}.mp3` : '';
 }

  private async vibrar() {
    try {
      await Haptics.vibrate({ duration: 500 });
    } catch (error) {
      console.error('Error al usar Haptics:', error);
    }
  }

  closeAlert() {
    this.show = false;
  }
}
