import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { sendNotificationPush } from './notifications';
import { getTokensPorPerfiles } from './tokens-por-perfil';

export const notificarClienteYsupervisorNuevoUsuario = onDocumentCreated('usuarios/{userId}', async (event) => {
  try {
    const userData = event.data?.data();
    
    if (!userData) {
      console.log('No hay datos de usuario');
      return;
    }

    if (userData.perfil === 'cliente' && userData.tipo === 'registrado') {
      console.log(`Nuevo cliente registrado: ${userData.nombre}`);
      
      const tokens = await getTokensPorPerfiles(['duenio', 'supervisor']);
      
      if (tokens.length > 0) {
        await sendNotificationPush(
          tokens,
          {
            title: 'Nuevo Cliente Registrado',
            body: `${userData.nombre} se ha registrado como cliente y necesita aprobación`
          },
          {
            route: 'clientes-pendientes',
            userId: event.params.userId
          },
          'cliente_nuevo'
        );
        
      } 
    }
  } catch (error) {
    console.error('Error en notificarClienteYsupervisorNuevoUsuario:', error);
  }
});