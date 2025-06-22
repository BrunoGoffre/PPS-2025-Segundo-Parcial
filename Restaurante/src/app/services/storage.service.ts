import { Injectable } from '@angular/core';
import { Storage, ref, getDownloadURL, uploadBytes } from '@angular/fire/storage';
import { Observable, from, of, lastValueFrom } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  
  constructor(private storage: Storage) { }

  getImageUrl(path: string): Observable<string> {
    const fileRef = ref(this.storage, path);

    return from(getDownloadURL(fileRef)).pipe(
      map(url => url), 
      catchError(error => {
        console.error('Error al obtener la URL de la imagen:', error);
        return of('');
      })
    );
  }

  uploadImage(path: string, file: Blob): Promise<string> {
    const fileRef = ref(this.storage, path);

  const observable = from(uploadBytes(fileRef, file)).pipe(
    switchMap(() => getDownloadURL(fileRef)),
    map(url => url),
    catchError(error => {
      console.error('Error al subir la imagen:', error);
      return of(''); // Retorna una URL vacía en caso de error
    })
  );

  // Convertir el Observable a Promise usando lastValueFrom
  return lastValueFrom(observable);
  }
}
