import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { sendNotificationPush } from './notifications';
import { getTokensPorTipos } from './tokens-por-tipos';

export const notificarPedidosARealizar = onDocumentUpdated('pedidos/{pedidoId}', async (event) => {
  try {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();
    
    if (!beforeData || !afterData) {
      console.log('No hay datos del pedido');
      return;
    }

    if (beforeData.estado !== 'confirmado' && afterData.estado === 'confirmado') {
      console.log(`Pedido confirmado para preparar - Pedido: ${event.params.pedidoId}`);
      
      const tokens = await getTokensPorTipos(['bartender', 'cocinero']);
      
      if (tokens.length > 0) {
        await sendNotificationPush(
          tokens,
          {
            title: 'Nuevo Pedido Confirmado',
            body: `Mesa ${afterData.mesa} - Pedido confirmado para preparar`
          },
          {
            route: '/tareas-sector',
            pedidoId: event.params.pedidoId,
            mesa: afterData.mesa?.toString() || ''
          },
          'pedido_confirmado'
        );
        
        console.log('Notificación enviada a bartenders y cocineros');
      } else {
        console.log('No se encontraron tokens para bartenders/cocineros');
      }
    }
  } catch (error) {
    console.error('Error en notificarPedidosARealizar:', error);
  }
});