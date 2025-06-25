import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  where,
  DocumentData,
  doc,
  updateDoc,
  collectionData,
  getDoc,
  getDocs,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MesaService {
  constructor(private firestore: Firestore) {}

  obtenerMesasLibres(): Observable<DocumentData[]> {
    const mesasRef = collection(this.firestore, 'mesas');
    const libresQuery = query(mesasRef, where('estado', '==', 'libre'));
    return collectionData(libresQuery, { idField: 'id' });
  }

  obtenerMesasConClientes(): Observable<DocumentData[]> {
    const mesasRef = collection(this.firestore, 'mesas');
    const ocupadasQuery = query(mesasRef, where('estado', '==', 'ocupada'));
    return collectionData(ocupadasQuery, { idField: 'id' });
  }

  // Obtener todas las mesas en tiempo real
  obtenerMesas(): Observable<DocumentData[]> {
    const mesasRef = collection(this.firestore, 'mesas');
    return collectionData(mesasRef, { idField: 'id' });
  }

  async obtenerEstadoMesa(mesaId: string): Promise<string | undefined> {
    const mesaRef = doc(this.firestore, `mesas/${mesaId}`);
    const mesaSnap = await getDoc(mesaRef);
    return mesaSnap.exists() ? mesaSnap.data()['estado'] : undefined;
  }

  async asignarMesa(
    mesaId: string,
    clienteId: string | undefined
  ): Promise<void> {
    const mesaRef = doc(this.firestore, `mesas/${mesaId}`);
    await updateDoc(mesaRef, {
      estado: 'ocupada',
      idCliente: clienteId,
    });
  }

  async desasignarMesa(mesaId: string): Promise<void> {
    const mesaRef = doc(this.firestore, `mesas/${mesaId}`);
    await updateDoc(mesaRef, {
      estado: 'libre',
      idCliente: '',
    });
  }

  async desasignarPorNumeroMesa(mesaNum: string): Promise<void> {
    const mesaQuery = query(
      collection(this.firestore, 'mesas'),
      where('numero', '==', Number(mesaNum))
    );

    const querySnapshot = await getDocs(mesaQuery);

    if (querySnapshot.empty) {
      throw new Error(`No se encontró una mesa con el número: ${mesaNum}`);
    }

    const mesaDoc = querySnapshot.docs[0];

    const mesaRef = doc(this.firestore, `mesas/${mesaDoc.id}`);
    await updateDoc(mesaRef, {
      estado: 'libre',
      idCliente: '',
    });
  }
}
