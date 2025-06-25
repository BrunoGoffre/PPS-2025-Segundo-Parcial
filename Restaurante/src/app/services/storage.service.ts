import { Injectable } from '@angular/core';
import {
  Storage,
  ref,
  getDownloadURL,
  uploadBytes,
} from '@angular/fire/storage';
import { Observable, from, of, lastValueFrom } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Photo } from '@capacitor/camera';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  constructor(
    private storage: Storage,
    private authService: AuthService,
    private supabaseService: SupabaseService
  ) {}

  getImageUrl(path: string): Observable<string> {
    const fileRef = ref(this.storage, path);

    return from(getDownloadURL(fileRef)).pipe(
      map((url) => url),
      catchError((error) => {
        console.error('Error al obtener la URL de la imagen:', error);
        return of('');
      })
    );
  }

  uploadImage(path: string, file: Blob): Promise<string> {
    const fileRef = ref(this.storage, path);

    const observable = from(uploadBytes(fileRef, file)).pipe(
      switchMap(() => getDownloadURL(fileRef)),
      map((url) => url),
      catchError((error) => {
        console.error('Error al subir la imagen:', error);
        return of(''); // Retorna una URL vacía en caso de error
      })
    );

    // Convertir el Observable a Promise usando lastValueFrom
    return lastValueFrom(observable);
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  async subirImg(cameraFile: Photo, fotoType: string): Promise<string | null> {
    const fecha = new Date();
    const userEmail = this.authService.userActive?.email;

    if (!userEmail) {
      console.error('No hay usuario autenticado para subir la imagen.');
      return null;
    }

    const path = `fotosEncuestas/${fotoType}-${userEmail}-${this.formatDate(
      fecha
    )}.jpeg`;
    const bucketName = environment.supabase.bucket;

    try {
      // Convertir la cadena base64 de la imagen a un objeto Blob
      const byteCharacters = atob(cameraFile?.base64String || '');
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' }); // Asumiendo tipo JPEG

      // Subir la imagen a Supabase Storage usando el nuevo método uploadFile
      const imageUrl = await this.supabaseService.uploadFile(
        blob,
        path,
        bucketName,
        'image/jpeg' // Establecer el tipo de contenido explícitamente
      );

      if (!imageUrl) {
        console.error('Error al subir la imagen a Supabase.');
        return null;
      }

      console.log('Foto subida a Supabase Storage:', imageUrl);
      return imageUrl;
    } catch (e) {
      console.error('Error al subir la imagen:', e);
      return null;
    }
  }
}
