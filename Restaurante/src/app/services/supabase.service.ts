import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.key
    );
  }

  /**
   * Sube un avatar al storage de Supabase y devuelve la URL pública
   * @param file Archivo de imagen a subir
   * @param userId ID del usuario para nombrar el archivo
   * @returns URL pública de la imagen o null si hay error
   */
  async uploadAvatar(file: File, userId: string): Promise<string | null> {
    try {
      // Generar un nombre único para el archivo basado en el userId
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;

      // Subir el archivo al bucket 'avatars'
      const { data, error } = await this.supabase.storage
        .from(environment.supabase.bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.error('Error al subir imagen a Supabase:', error);
        return null;
      }

      // Obtener la URL pública del archivo
      const { data: urlData } = this.supabase.storage
        .from(environment.supabase.bucket)
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error en uploadAvatar:', error);
      return null;
    }
  }

  /**
   * Elimina un avatar del storage de Supabase
   * @param url URL pública de la imagen a eliminar
   * @returns true si se eliminó correctamente, false en caso contrario
   */
  async deleteAvatar(url: string): Promise<boolean> {
    try {
      // Extraer el nombre del archivo de la URL
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1];

      const { error } = await this.supabase.storage
        .from(environment.supabase.bucket)
        .remove([fileName]);

      if (error) {
        console.error('Error al eliminar imagen de Supabase:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error en deleteAvatar:', error);
      return false;
    }
  }

  /**
   * Sube un archivo genérico al storage de Supabase y devuelve la URL pública
   * @param file Archivo a subir (Blob)
   * @param path Ruta del archivo dentro del bucket
   * @param bucketName Nombre del bucket de Supabase
   * @returns URL pública del archivo o null si hay error
   */
  async uploadFile(
    file: Blob,
    path: string,
    bucketName: string,
    contentType: string = 'application/octet-stream'
  ): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .upload(path, file, {
          contentType: contentType,
          upsert: true,
        });

      if (error) {
        console.error('Error al subir archivo a Supabase:', error);
        return null;
      }

      const { data: urlData } = this.supabase.storage
        .from(bucketName)
        .getPublicUrl(path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error en uploadFile:', error);
      return null;
    }
  }
}
