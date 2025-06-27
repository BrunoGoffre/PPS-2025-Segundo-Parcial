import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { sendNotificationPush } from './notifications';
import { getTokensPorPerfiles } from './tokens-por-perfil';

export const notificarPedidosAEntregar = onDocumentUpdated('pedidos/{pedidoId}', async (event) => {
  try {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();
    
    if (!beforeData || !afterData) {
      console.log('No hay datos del pedido');
      return;
    }

    if (beforeData.estado !== 'preparado' && afterData.estado === 'preparado') {
      console.log(`Pedido preparado para entregar - Pedido: ${event.params.pedidoId}`);
      
      const tokens = await getTokensPorPerfiles(['mozo']);
      
      if (tokens.length > 0) {
        await sendNotificationPush(
          tokens,
          {
            title: 'Pedido Listo para Entregar',
            body: `Mesa ${afterData.mesa} - Pedido preparado y listo para entregar`
          },
          {
            route: 'entregar-pedidos',
            pedidoId: event.params.pedidoId,
            mesa: afterData.mesa?.toString() || ''
          },
          'pedido_preparado'
        );
        
        console.log('Notificación enviada a mozos');
      } else {
        console.log('No se encontraron tokens para mozos');
      }
    }
  } catch (error) {
    console.error('Error en notificarPedidosAEntregar:', error);
  }
});