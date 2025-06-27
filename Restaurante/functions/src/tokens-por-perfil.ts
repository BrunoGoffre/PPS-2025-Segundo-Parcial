import { getFirestore } from 'firebase-admin/firestore';

export const getTokensPorPerfiles = async (perfiles: string[]): Promise<string[]> => {
  const db = getFirestore();
  const tokens: string[] = [];

  try {
    // 1. Obtener usuarios con los perfiles especificados
    const usuariosSnapshot = await db.collection('usuarios')
      .where('perfil', 'in', perfiles)
      .get();

    const userIds: string[] = [];
    usuariosSnapshot.forEach(doc => {
      userIds.push(doc.id);
    });

    if (userIds.length === 0) {
      console.log(`No se encontraron usuarios con perfiles: ${perfiles.join(', ')}`);
      return [];
    }

    // 2. Obtener tokens de la colección user_push_tokens para esos usuarios
    const tokensSnapshot = await db.collection('user_push_tokens').get();
    
    tokensSnapshot.forEach(doc => {
      const tokenData = doc.data();
      if (tokenData.token && tokenData.user_id && userIds.includes(tokenData.user_id)) {
        tokens.push(tokenData.token);
      }
    });

    console.log(`Encontrados ${tokens.length} tokens para perfiles: ${perfiles.join(', ')}`);
    return tokens;
  } catch (error) {
    console.error('Error obteniendo tokens por perfiles:', error);
    return [];
  }
};