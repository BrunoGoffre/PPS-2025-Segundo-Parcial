import { getFirestore } from 'firebase-admin/firestore';

export const getTokensPorTipos = async (tipos: string[]): Promise<string[]> => {
  const db = getFirestore();
  const tokens: string[] = [];

  try {
    // 1. Obtener usuarios con los tipos especificados
    const usuariosSnapshot = await db.collection('usuarios')
      .where('tipo', 'in', tipos)
      .get();

    const userIds: string[] = [];
    usuariosSnapshot.forEach(doc => {
      userIds.push(doc.id);
    });

    if (userIds.length === 0) {
      console.log(`No se encontraron usuarios con tipos: ${tipos.join(', ')}`);
      return [];
    }

    // 2. Obtener tokens de la colección user_push_tokens para esos usuarios
    const tokensSnapshot = await db.collection('user_push_tokens').get();
    
    tokensSnapshot.forEach(doc => {
      const tokenData = doc.data();
      if (tokenData.token && tokenData.user_id && userIds.find(x => x == tokenData.user_id) != undefined) {
        tokens.push(tokenData.token);
      }
    });

    console.log(`Encontrados ${tokens.length} tokens para tipos: ${tipos.join(', ')}`);
    return tokens;
  } catch (error) {
    console.error('Error obteniendo tokens por tipos:', error);
    return [];
  }
};