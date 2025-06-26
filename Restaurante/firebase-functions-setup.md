# Configurar Firebase Cloud Functions para Push Notifications

## 1. Instalar Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

## 2. Inicializar Functions en tu proyecto
```bash
firebase init functions
# Seleccionar:
# - Use existing project: pps-bonappetit
# - Language: TypeScript
# - ESLint: Yes
# - Install dependencies: Yes
```

## 3. Reemplazar functions/src/index.ts con:
```typescript
import { onCall } from 'firebase-functions/v2/https';
import { getMessaging } from 'firebase-admin/messaging';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp();

export const sendPushNotification = onCall({
  cors: true
}, async (request) => {
  try {
    const { title, body, targetRole, data } = request.data;
    
    console.log('Enviando notificación:', { title, body, targetRole });
    
    // Obtener tokens de Firestore
    const db = getFirestore();
    const tokensSnapshot = await db.collection('user_push_tokens').get();
    
    const tokens: string[] = [];
    tokensSnapshot.forEach(doc => {
      const tokenData = doc.data();
      if (tokenData.token) {
        tokens.push(tokenData.token);
      }
    });
    
    if (tokens.length === 0) {
      return { 
        success: true, 
        message: 'No hay tokens registrados',
        sentCount: 0 
      };
    }
    
    console.log(`Enviando a ${tokens.length} dispositivos`);
    
    // Enviar notificaciones reales
    const messaging = getMessaging();
    const message = {
      notification: {
        title: title,
        body: body
      },
      data: data || {},
      tokens: tokens
    };
    
    const response = await messaging.sendMulticast(message);
    
    console.log('Resultado FCM:', {
      successCount: response.successCount,
      failureCount: response.failureCount
    });
    
    return {
      success: true,
      message: 'Notificaciones enviadas',
      sentCount: response.successCount,
      failedCount: response.failureCount,
      totalTokens: tokens.length
    };
    
  } catch (error) {
    console.error('Error enviando notificaciones:', error);
    throw error;
  }
});
```

## 4. Instalar dependencias adicionales
```bash
cd functions
npm install firebase-admin
```

## 5. Desplegar la función
```bash
firebase deploy --only functions
```

## 6. La URL de tu función será:
```
https://us-central1-pps-bonappetit.cloudfunctions.net/sendPushNotification
```