import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { sendNotificationPush } from './notifications';
import { getTokensPorPerfiles } from './tokens-por-perfil';

export const notificarPedidosARealizar = onDocumentUpdated('pedidos/{pedidoId}', async (event) => {
  try {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();
    
    if (!beforeData || !afterData) {
      console.log('No hay datos del pedido');
      return;
    }

    if (beforeData.estado !== 'confirmado' && afterData.estado === 'confirmado') {
      
      const tokens = await getTokensPorPerfiles(['bartender', 'cocinero']);
      
      if (tokens.length > 0) {
        await sendNotificationPush(
          tokens,
          {
            title: 'Nuevo Pedido Confirmado',
            body: `Mesa ${afterData.mesaNumero} - Pedido confirmado para preparar`
          },
          {
            route: 'tareas-sector',
            pedidoId: event.params.pedidoId,
            mesa: afterData.mesaNumero?.toString() || ''
          },
          'pedido_confirmado'
        );
      } else {
        console.log('No se encontraron tokens para bartenders/cocineros');
      }
    }
  } catch (error) {
    console.error('Error en notificarPedidosARealizar:', error);
  }
});