import { getFirestore } from 'firebase-admin/firestore';

export const getTokensPorTipos = async (tipos: string[]): Promise<string[]> => {
  const db = getFirestore();
  const tokens: string[] = [];

  try {
    const usuariosSnapshot = await db.collection('usuarios')
      .where('tipo', 'in', tipos)
      .get();

    for (const doc of usuariosSnapshot.docs) {
      const userData = doc.data();
      if (userData.pushToken) {
        tokens.push(userData.pushToken);
      }
    }

    console.log(`Encontrados ${tokens.length} tokens para tipos: ${tipos.join(', ')}`);
    return tokens;
  } catch (error) {
    console.error('Error obteniendo tokens por tipos:', error);
    return [];
  }
};