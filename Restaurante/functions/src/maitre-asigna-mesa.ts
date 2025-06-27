import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { sendNotificationPush } from './notifications';
import { getTokensPorPerfiles } from './tokens-por-perfil';

export const notificarMesaAsignada = onDocumentUpdated('pedidos/{pedidoId}', async (event) => {
  try {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();
    
    if (!beforeData || !afterData) {
      console.log('No hay datos del pedido');
      return;
    }

    // Detectar cuando el estado cambia de 'lista-de-espera' a 'mesa-asignada'
    if (beforeData.estado === 'lista-de-espera' && afterData.estado === 'mesa-asignada') {
      console.log(`Mesa asignada - Pedido: ${event.params.pedidoId}, Mesa: ${afterData.mesaNumero}`);
      
      // Notificar al cliente que su mesa está lista
      const tokens = await getTokensPorPerfiles(['cliente']);
      
      if (tokens.length > 0) {
        await sendNotificationPush(
          tokens,
          {
            title: 'Mesa Asignada',
            body: `Su mesa ${afterData.mesaNumero} está lista. Puede dirigirse al restaurante.`
          },
          {
            route: '/menu-mesa',
            pedidoId: event.params.pedidoId,
            mesa: afterData.mesaNumero?.toString() || ''
          },
          'mesa_asignada'
        );
        
        console.log('Notificación enviada al cliente sobre mesa asignada');
      } else {
        console.log('No se encontraron tokens para clientes');
      }
    }
  } catch (error) {
    console.error('Error en notificarMesaAsignada:', error);
  }
});