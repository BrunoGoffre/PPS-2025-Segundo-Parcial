import { Injectable } from '@angular/core';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { SupabaseService } from './supabase.service';
import { Profile_Photo } from '../interfaces/profile-image.interface';
import { User } from '@supabase/supabase-js';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { LoadingController, ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class ToolsService {
  constructor(
    private supabase: SupabaseService,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  private loading: HTMLIonLoadingElement | null = null;

  async ReadQr(): Promise<string | null> {
    try {
      const result = await BarcodeScanner.scan();
      return result.barcodes.length > 0 ? result.barcodes[0].rawValue : null;
    } catch (err) {
      return null;
    }
  }

  async VibrateOnError() {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  }

  async sacarFoto(user: User): Promise<File | null> {
    try {
      console.log('[TOOLS] Iniciando captura de foto...');
      
      // Capturar foto desde la cámara
      const imageData = await Camera.getPhoto({
        quality: 80,
        resultType: CameraResultType.Base64,
        correctOrientation: true,
        source: CameraSource.Camera,
        allowEditing: false,
        width: 800,
        height: 800
      });

      if (!imageData.base64String) {
        throw new Error('No se pudo obtener la imagen');
      }

      console.log('[TOOLS] Foto capturada, procesando...');

      // Convertir base64 a File
      const file = await this.base64ToFile(
        imageData.base64String,
        `photo_${Date.now()}.${imageData.format || 'jpg'}`
      );

      console.log('[TOOLS] Foto procesada correctamente:', file.name);
      return file;

    } catch (error) {
      console.error('[TOOLS] Error al tomar foto:', error);
      this.PresentToast('Error al capturar la foto', 'danger');
      return null;
    }
  }

  private async base64ToFile(base64String: string, fileName: string): Promise<File> {
    try {
      // Determinar el tipo MIME basado en la extensión
      const mimeType = fileName.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';
      
      // Convertir base64 a Blob
      const byteCharacters = atob(base64String);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      
      // Crear File desde Blob
      return new File([blob], fileName, { type: mimeType });
    } catch (error) {
      console.error('[TOOLS] Error convirtiendo base64 a File:', error);
      throw new Error('Error procesando la imagen');
    }
  }

  private async convertirArchivoABase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  async presentLoader(message: string = '', duration: number = 0) {
    this.loading = await this.loadingController.create({
      cssClass: 'custom-loader',
      backdropDismiss: false,
      animated: true,
      duration: duration != 0 ? duration : undefined,
      spinner: 'circles',
      message: message !== '' ? message : undefined,
    });
    await this.loading.present();
  }

  StopLoader() {
    this.loadingController.dismiss();
    this.loading = null;
  }

  async PresentToast(message: string = '', type: string, duration: number = 2000) {
    const toast = await this.toastController.create({
      message: message != '' ? message : undefined,
      duration: duration,
      color: type,
    });
    toast.present();
  }

  // Método para verificar que el storage esté configurado
  async verificarStorageConfiguration(): Promise<boolean> {
    try {
      console.log('[TOOLS] Verificando configuración del storage...');
      
      // Intentar listar archivos del bucket para verificar que existe y tenemos permisos
      const { data, error } = await this.supabase.supabase.storage
        .from('profile-photos')
        .list('', {
          limit: 1
        });

      if (error) {
        console.error('[TOOLS] Error verificando storage:', error);
        this.PresentToast('Error: El bucket profile-photos no está configurado', 'danger');
        return false;
      }

      console.log('[TOOLS] Storage configurado correctamente');
      return true;
    } catch (error) {
      console.error('[TOOLS] Error en verificación de storage:', error);
      this.PresentToast('Error de configuración del storage', 'danger');
      return false;
    }
  }
}
