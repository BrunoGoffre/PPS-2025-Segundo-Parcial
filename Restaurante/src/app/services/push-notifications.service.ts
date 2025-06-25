import { Injectable } from '@angular/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { Router } from '@angular/router';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationsService {
  private supabase: SupabaseClient;
  originNotification = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.key
    );
  }

  async initializePushNotifications() {
    console.log('Inicializando Push Notifications...');
    
    if (Capacitor.isNativePlatform()) {
      await this.initNativePushNotifications();
    } else {
      console.log('Push notifications no disponibles en web - usando fallback');
      this.initWebFallback();
    }
  }

  private async initNativePushNotifications() {
    try {
      console.log('Configurando notificaciones nativas...');
      
      // Verificar y solicitar permisos
      let permStatus = await PushNotifications.checkPermissions();
      
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }
      
      if (permStatus.receive !== 'granted') {
        console.warn('Permisos de push notifications denegados');
        return;
      }

      console.log('Permisos concedidos, registrando device...');
      
      // Registrar para push notifications
      await PushNotifications.register();

      // Configurar listeners
      this.setupNativeListeners();

    } catch (error) {
      console.error('Error inicializando push notifications:', error);
    }
  }

  private setupNativeListeners() {
    // Token recibido exitosamente
    PushNotifications.addListener('registration', (token: Token) => {
      console.log('Token FCM recibido:', token.value);
      this.saveTokenToDatabase(token.value);
    });

    // Error en el registro
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error en registro de push notifications:', error);
    });

    // Notificación recibida en primer plano
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Notificación recibida en primer plano:', notification);
      this.handleForegroundNotification(notification);
    });

    // Usuario tocó la notificación
    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      console.log('Usuario abrió notificación:', notification);
      this.handleNotificationTap(notification);
    });
  }

  private async saveTokenToDatabase(token: string) {
    try {
      const user = this.authService.userActive;
      
      if (user) {
        console.log('Guardando token para usuario:', user.id);
        
        const { error } = await this.supabase
          .from('user_push_tokens')
          .upsert({
            user_id: user.id,
            token: token,
            platform: Capacitor.getPlatform(),
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.error('Error guardando token:', error);
        } else {
          console.log('Token guardado exitosamente');
        }
      } else {
        console.log('No hay usuario autenticado, token no guardado');
      }
    } catch (error) {
      console.error('Error en saveTokenToDatabase:', error);
    }
  }

  private handleForegroundNotification(notification: PushNotificationSchema) {
    // Mostrar notificación personalizada cuando la app está abierta
    console.log('Mostrando notificación en primer plano:', notification.title);
    
    // Aquí puedes mostrar un toast, modal o banner personalizado
    // Ejemplo: this.presentToast(notification.title, notification.body);
  }

  private handleNotificationTap(notification: ActionPerformed) {
    console.log('Procesando tap en notificación...');
    
    this.originNotification = true;
    
    const data = notification.notification.data;
    
    // Navegar según el tipo de notificación
    if (data && data.type) {
      switch (data.type) {
        case 'cliente_pendiente':
          this.router.navigate(['/clientes/pendientes']);
          break;
        case 'nueva_reserva':
          this.router.navigate(['/reservas']);
          break;
        case 'pedido_listo':
          this.router.navigate(['/pedidos']);
          break;
        default:
          this.router.navigate(['/home']);
          break;
      }
    } else {
      this.router.navigate(['/home']);
    }
  }

  private initWebFallback() {
    console.log('Inicializando fallback para web...');
    // En web podrías implementar toasts o modales para simular notificaciones
  }

  // Método principal para enviar notificaciones
  async sendNotificationToRole(title: string, body: string, targetRole: string, data?: any) {
    try {
      console.log(`Enviando notificación a rol: ${targetRole}`);
      
      const payload = {
        title,
        body,
        targetRole,
        data: data || {}
      };

      const { data: result, error } = await this.supabase.functions
        .invoke('send-push-notification', {
          body: payload
        });

      if (error) {
        console.error('Error en Edge Function:', error);
        throw error;
      }

      console.log('Notificación enviada exitosamente:', result);
      return result;

    } catch (error) {
      console.error('Error enviando notificación:', error);
      throw error;
    }
  }

  // Métodos de conveniencia para casos específicos
  async notifyClientePendiente(clienteNombre: string) {
    return this.sendNotificationToRole(
      'Cliente Pendiente',
      `${clienteNombre} está esperando aprobación`,
      'dueño',
      { 
        type: 'cliente_pendiente',
        cliente: clienteNombre
      }
    );
  }

  async notifyNewReservation(clienteNombre: string, fecha: string) {
    return this.sendNotificationToRole(
      'Nueva Reserva',
      `${clienteNombre} reservó para ${fecha}`,
      'empleado',
      { 
        type: 'nueva_reserva',
        cliente: clienteNombre,
        fecha
      }
    );
  }

  async notifyOrderReady(mesa: string) {
    return this.sendNotificationToRole(
      'Pedido Listo',
      `El pedido de la mesa ${mesa} está listo`,
      'empleado',
      { 
        type: 'pedido_listo',
        mesa
      }
    );
  }

  // Método para limpiar tokens (logout)
  async clearUserToken() {
    try {
      const user = this.authService.userActive;
      
      if (user) {
        await this.supabase
          .from('user_push_tokens')
          .delete()
          .eq('user_id', user.id);
        
        console.log('Token de usuario eliminado');
      }
    } catch (error) {
      console.error('Error eliminando token:', error);
    }
  }
}
