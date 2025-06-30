import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { sendNotificationPush } from './notifications';
import { getTokensPorPerfiles } from './tokens-por-perfil';
import { getFirestore } from 'firebase-admin/firestore';

export const notificarConsultaAmozo = onDocumentCreated('mensajes/{consultaId}', async (event) => {
  try {
    const mensajeData = event.data?.data();
    
    if (!mensajeData) {
      console.log('No hay datos del mensaje');
      return;
    }

    if (mensajeData.usuario && mensajeData.usuario.perfil === 'cliente') {
      const usuarioData = mensajeData.usuario;
      console.log(`Nueva consulta de cliente: ${usuarioData.nombre}`);
      
      // Obtener el número de mesa del pedido
      let mesaNumero = '';
      if (mensajeData.idPedido) {
        try {
          const db = getFirestore();
          const pedidoDoc = await db.collection('pedidos').doc(mensajeData.idPedido).get();
          if (pedidoDoc.exists) {
            const pedidoData = pedidoDoc.data();
            mesaNumero = pedidoData?.mesaNumero || '';
          }
        } catch (error) {
          console.error('Error obteniendo mesa del pedido:', error);
        }
      }
      
      const tokens = await getTokensPorPerfiles(['mozo']);
      
      if (tokens.length > 0) {
        await sendNotificationPush(
          tokens,
          {
            title: 'Nueva Consulta de Cliente',
            body:`Mesa ${mesaNumero} ha enviado una consulta`
          },
          {
            route: `chat/${mensajeData.idPedido}`,
            consultaId: event.params.consultaId,
            clienteNombre: usuarioData.nombre,
            mesaNumero: mesaNumero
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
