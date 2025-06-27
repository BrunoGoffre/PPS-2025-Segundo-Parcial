import { getMessaging } from 'firebase-admin/messaging';

export const sendNotificationPush = async (
  tokens: string[],
  message: { title: string; body: string },
  data?: { [key: string]: string },
  tag?: string
) => {
  if (tokens.length === 0) {
    console.log('No hay tokens para enviar notificaciones');
    return;
  }

  const messaging = getMessaging();
  let successCount = 0;
  let failureCount = 0;

  for (const token of tokens) {
    try {
      const notification = {
        notification: {
          title: message.title,
          body: message.body
        },
        data: data || {},
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#3880ff',
            sound: 'default',
            priority: 'high' as const,
            channelId: 'restaurante_notifications',
            tag: tag
          }
        },
        token: token
      };

      await messaging.send(notification);
      successCount++;
      console.log(`✅ Notificación enviada a token: ${token.substring(0, 20)}...`);
    } catch (error) {
      failureCount++;
      console.error(`❌ Error enviando a token ${token.substring(0, 20)}...:`, error);
    }
  }

  console.log(`Resultado: ${successCount} exitosas, ${failureCount} fallidas`);
  return { successCount, failureCount };
};