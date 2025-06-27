import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { sendNotificationPush } from './notifications';
import { getTokensPorTipos } from './tokens-por-tipos';

export const notificarMaitreListaEspera = onDocumentCreated('pedidos/{pedidoId}', async (event) => {
  try {
    const pedidoData = event.data?.data();
    
    if (!pedidoData) {
      console.log('No hay datos del pedido');
      return;
    }

    // Notificar cuando se crea cualquier pedido nuevo
    console.log(`Nuevo pedido creado - Pedido: ${event.params.pedidoId}`);
    
    const tokens = await getTokensPorTipos(['maitre', 'mozo']);
    
    if (tokens.length > 0) {
      await sendNotificationPush(
        tokens,
        {
          title: 'Cliente en Lista de Espera',
          body: `Un cliente está esperando mesa - Mesa ${pedidoData.mesa || 'sin asignar'}`
        },
        {
          route: '/lista-espera',
          pedidoId: event.params.pedidoId
        },
        'lista_espera'
      );
      
      console.log('Notificación enviada al maitre y mozos');
    } else {
      console.log('No se encontraron tokens para maitre/mozos');
    }
  } catch (error) {
    console.error('Error en notificarMaitreListaEspera:', error);
  }
});