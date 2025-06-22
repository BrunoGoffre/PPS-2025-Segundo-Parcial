import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { logOutOutline } from 'ionicons/icons';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-logout-button',
  templateUrl: './logout-button.component.html',
  styleUrl: './logout-button.component.scss',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LogoutButtonComponent  {
  isPlaying = false; 
  private sounds: { [key: string]: string } = {
    '1': 'disconected',
  };

  constructor(private router: Router, public auth:AuthService) {
    addIcons({
      'log-out-outline': logOutOutline,
    });
  }

  playSound(sound: string) {
    if (this.isPlaying) {
      return;  // Si ya está reproduciendo, no hacer nada
    }

    const audioFile = this.getAudioFile(sound); 
    if (audioFile) {
      const audio = new Audio(audioFile);

      this.isPlaying = true;  // Marcar como en reproducción

      audio.play().then(() => {
      }).catch(error => {
        this.isPlaying = false;  // En caso de error, permitir la siguiente reproducción
      });

      audio.onended = () => {
        this.isPlaying = false;
      };
    }
  }

  getAudioFile(sound: string): string {
    const audioFile = this.sounds[sound];
    if (!audioFile) {
      console.error(`Sonido no encontrado para el Numero ${sound}`);
      return '';
    }
    return `assets/sounds/${audioFile}.mp3`;
  }

  logout():void{
    this.auth.logout();
    this.playSound('1');
    this.router.navigate(['/login']);
  }

}
