import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { sendNotificationPush } from './notifications';
import { getTokensPorPerfiles } from './tokens-por-perfil';

export const notificarCuentaPedida = onDocumentUpdated('pedidos/{pedidoId}', async (event) => {
  try {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();
    
    if (!beforeData || !afterData) {
      console.log('No hay datos del pedido');
      return;
    }

    if (beforeData.estado !== 'cuenta-pedida' && afterData.estado === 'cuenta-pedida') {
      console.log(`Cliente solicita cuenta - Pedido: ${event.params.pedidoId}`);
      
      const tokens = await getTokensPorPerfiles(['mozo']);
      
      if (tokens.length > 0) {
        await sendNotificationPush(
          tokens,
          {
            title: 'Cliente Solicita Cuenta',
            body: `Mesa ${afterData.mesaNumero} ha solicitado la cuenta`
          },
          {
            route: 'entregar-cuenta',
            pedidoId: event.params.pedidoId,
            mesa: afterData.mesaNumero?.toString() || ''
          },
          'cuenta_pedida'
        );
        
        console.log('Notificación enviada a mozos');
      } else {
        console.log('No se encontraron tokens para mozos');
      }
    }
  } catch (error) {
    console.error('Error en notificarCuentaPedida:', error);
  }
});