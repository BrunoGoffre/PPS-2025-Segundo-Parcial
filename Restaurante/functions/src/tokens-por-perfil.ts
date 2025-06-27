import { getFirestore } from 'firebase-admin/firestore';

export const getTokensPorPerfiles = async (perfiles: string[]): Promise<string[]> => {
  const db = getFirestore();
  const tokens: string[] = [];

  try {
    const usuariosSnapshot = await db.collection('usuarios')
      .where('perfil', 'in', perfiles)
      .get();

    for (const doc of usuariosSnapshot.docs) {
      const userData = doc.data();
      if (userData.pushToken) {
        tokens.push(userData.pushToken);
      }
    }

    console.log(`Encontrados ${tokens.length} tokens para perfiles: ${perfiles.join(', ')}`);
    return tokens;
  } catch (error) {
    console.error('Error obteniendo tokens por perfiles:', error);
    return [];
  }
};