import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { sendNotificationPush } from './notifications';
import { getFirestore } from 'firebase-admin/firestore';
import { getTokensPorPerfiles } from './tokens-por-perfil';

export const notificarConsultaAmozo = onDocumentCreated('mensajes/{consultaId}', async (event) => {
  try {
    const mensajeData = event.data?.data();
    
    if (!mensajeData) {
      console.log('No hay datos del mensaje');
      return;
    }

    const db = getFirestore();
    const usuarioDoc = await db.collection('usuarios').doc(mensajeData.userId).get();
    const usuarioData = usuarioDoc.data();

    if (usuarioData && usuarioData.perfil === 'cliente') {
      console.log(`Nueva consulta de cliente: ${usuarioData.nombre}`);
      
      const tokens = await getTokensPorPerfiles(['mozo']);
      
      if (tokens.length > 0) {
        await sendNotificationPush(
          tokens,
          {
            title: 'Nueva Consulta de Cliente',
            body: `${usuarioData.nombre} ha enviado una consulta`
          },
          {
            route: `chat/${mensajeData.idPedido}`,
            consultaId: event.params.consultaId,
            clienteNombre: usuarioData.nombre
          },
          'consulta_cliente'
        );
        
        console.log('Notificación enviada a mozos');
      } else {
        console.log('No se encontraron tokens para mozos');
      }
    }
  } catch (error) {
    console.error('Error en notificarConsultaAmozo:', error);
  }
});