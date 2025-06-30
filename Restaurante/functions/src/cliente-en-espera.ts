import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { sendNotificationPush } from './notifications';
import { getTokensPorPerfiles } from './tokens-por-perfil';

export const notificarMaitreListaEspera = onDocumentCreated('pedidos/{pedidoId}', async (event) => {
    try {
      const pedidoData = event.data?.data();

      if (!pedidoData) {
        console.log('No hay datos del pedido');
        return;
      }
      const tokens = await getTokensPorPerfiles(['maitre']);
      if (tokens.length > 0) {
        await sendNotificationPush(
          tokens,
          {
            title: 'Cliente en Lista de Espera',
            body: `Un cliente está esperando mesa - Mesa ${pedidoData.mesaNumero || 'sin asignar'}`,
          },
          {
            route: 'lista-espera',
            pedidoId: event.params.pedidoId,
          },
          'lista_espera'
        );

      } else {
        console.log('No se encontraron tokens para maitre/mozos');
      }
    } catch (error) {
      console.error('Error en notificarMaitreListaEspera:', error);
    }
  }
);
