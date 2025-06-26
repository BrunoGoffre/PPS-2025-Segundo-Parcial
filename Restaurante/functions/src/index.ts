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
    
    console.log('Enviando notificación:', { title, body, targetRole, data });
    
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
    
    // Enviar notificaciones individuales con icono personalizado
    const messaging = getMessaging();
    let successCount = 0;
    let failureCount = 0;
    
    for (const token of tokens) {
      try {
        const message = {
          notification: {
            title: title,
            body: body
          },
          data: data || {},
          android: {
            notification: {
              icon: 'ic_notification',
              color: '#3880ff',
              sound: 'default',
              priority: 'high' as const,
              channelId: 'restaurante_notifications'
            }
          },
          token: token
        };
        
        await messaging.send(message);
        successCount++;
        console.log(`✅ Enviado a token: ${token.substring(0, 20)}...`);
      } catch (error) {
        failureCount++;
        console.error(`❌ Error enviando a token ${token.substring(0, 20)}...:`, error);
      }
    }
    
    console.log(`Resultado final: ${successCount} exitosas, ${failureCount} fallidas`);
    
    return {
      success: true,
      message: 'Notificaciones enviadas',
      sentCount: successCount,
      failedCount: failureCount,
      totalTokens: tokens.length
    };
    
  } catch (error) {
    console.error('Error enviando notificaciones:', error);
    throw error;
  }
});