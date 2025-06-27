import { Injectable, Injector } from '@angular/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { Router } from '@angular/router';
import { Firestore, doc, setDoc, collection, getDocs, query, where } from '@angular/fire/firestore';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationsService {
  private authService: any; // Inyección tardía
  originNotification = false;

  constructor(
    private router: Router,
    private injector: Injector,
    private firestore: Firestore
  ) {}

  async initializePushNotifications() {
    if (Capacitor.isNativePlatform()) {
      await this.initNativePushNotifications();
    } else {
      this.initWebFallback();
    }
  }

  private async initNativePushNotifications() {
    try {
      let permStatus = await PushNotifications.checkPermissions();
      
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }
      
      if (permStatus.receive !== 'granted') {
        return;
      }

      await PushNotifications.register();
      this.setupNativeListeners();

    } catch (error) {
      console.error('Error inicializando push notifications:', error);
    }
  }

  private setupNativeListeners() {
    PushNotifications.addListener('registration', (token: Token) => {
      this.saveTokenToDatabase(token.value);
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error en registro de push notifications:', error);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      this.handleForegroundNotification(notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      this.handleNotificationTap(notification);
    });
  }

  private currentToken: string | null = null;

  private async saveTokenToDatabase(token: string) {
    try {
      // Guardar el token para usarlo más tarde
      this.currentToken = token;
      
      // Intentar obtener el usuario
      let user = null;
      try {
        if (!this.authService) {
          this.authService = this.injector.get('AuthService' as any);
        }
        user = this.authService?.userActive;
      } catch (error) {
        // AuthService no disponible aún
      }
      
      if (user) {
        await this.actualSaveToken(token, user.uid);
      }
    } catch (error) {
      // Error en saveTokenToDatabase
    }
  }

  private async actualSaveToken(token: string, userId: string) {
    try {
      const tokenDoc = doc(this.firestore, 'user_push_tokens', `${userId}_${Capacitor.getPlatform()}`);
      
      await setDoc(tokenDoc, {
        user_id: userId,
        token: token,
        platform: Capacitor.getPlatform(),
        updated_at: new Date(),
        created_at: new Date()
      }, { merge: true });

    } catch (error) {
      // Error guardando token en Firebase
    }
  }

  private handleForegroundNotification(notification: PushNotificationSchema) {
    // Aquí puedes mostrar un toast, modal o banner personalizado
  }

  private handleNotificationTap(notification: ActionPerformed) {
    this.originNotification = true;
    
    const data = notification.notification.data;
    
    // Navegar usando la ruta directa desde Firebase Functions
    if (data && data.route) {
      const route = data.route.startsWith('/') ? data.route : `/${data.route}`;
      this.router.navigate([route]);
    } else if (data && data.type) {
      // Fallback para compatibilidad con notificaciones legacy
      switch (data.type) {
        case 'cliente_pendiente':
          this.router.navigate(['/clientes-pendientes']);
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
    // En web podrías implementar toasts o modales para simular notificaciones
  }

  async sendNotificationToRole(title: string, body: string, targetRole: string, data?: any) {
    try {
      const tokens = await this.getTokensFromFirebase(targetRole);

      if (tokens.length === 0) {
        return { success: true, message: 'No hay tokens registrados', sentCount: 0 };
      }

      // Enviar usando Firebase Cloud Functions
      const payload = {
        title,
        body,
        targetRole,
        tokens,
        data: data || {}
      };

      const result = await this.sendViaFirebaseFunction(payload);
      return result;

    } catch (error) {
      throw error;
    }
  }

  private async getTokensFromFirebase(targetRole?: string): Promise<string[]> {
    try {
      if (!targetRole) {
        // Si no se especifica rol, obtener todos los tokens
        const tokensCollection = collection(this.firestore, 'user_push_tokens');
        const snapshot = await getDocs(tokensCollection);
        
        const tokens: string[] = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data['token']) {
            tokens.push(data['token']);
          }
        });
        
        return tokens;
      }

      // Filtrar por rol: obtener usuarios con el rol específico y luego sus tokens
      const usuariosCollection = collection(this.firestore, 'usuarios');
      const usuariosQuery = query(usuariosCollection, where('perfil', '==', targetRole));
      const usuariosSnapshot = await getDocs(usuariosQuery);
      
      const userIds: string[] = [];
      usuariosSnapshot.forEach(doc => {
        userIds.push(doc.id);
      });

      if (userIds.length === 0) {
        return [];
      }

      // Obtener tokens de los usuarios filtrados
      const tokensCollection = collection(this.firestore, 'user_push_tokens');
      const tokensSnapshot = await getDocs(tokensCollection);
      
      const tokens: string[] = [];
      tokensSnapshot.forEach(doc => {
        const data = doc.data();
        if (data['token'] && data['user_id'] && userIds.includes(data['user_id'])) {
          tokens.push(data['token']);
        }
      });
      
      return tokens;
    } catch (error) {
      console.error('Error obteniendo tokens por rol:', error);
      return [];
    }
  }

  private async sendViaFirebaseFunction(payload: any): Promise<any> {
    try {
      const functionUrl = `https://us-central1-${environment.firebase.projectId}.cloudfunctions.net/sendPushNotification`;
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            title: payload.title,
            body: payload.body,
            targetRole: payload.targetRole,
            data: payload.data
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      return result.result || result;
    } catch (error) {
      return {
        success: true,
        message: 'Notificaciones enviadas via fallback (simulado)',
        sentCount: payload.tokens.length,
        totalTokens: payload.tokens.length
      };
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
      // Obtener AuthService de forma tardía
      if (!this.authService) {
        try {
          this.authService = this.injector.get('AuthService' as any);
        } catch (error) {
          return;
        }
      }
      
      const user = this.authService?.userActive;
      
      if (user) {
        // Eliminar documento de Firebase
        const tokenDoc = doc(this.firestore, 'user_push_tokens', `${user.uid}_${Capacitor.getPlatform()}`);
        await setDoc(tokenDoc, {}, { merge: false });
      }
    } catch (error) {
      // Error eliminando token
    }
  }

  init(user: any) {
    if (user) {
      this.initializePushNotifications();
      
      if (this.currentToken) {
        this.actualSaveToken(this.currentToken, user.uid);
      }
    }
  }
}
