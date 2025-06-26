import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  where,
  query,
  addDoc,
  doc,
  updateDoc,
  getDocs,
  getDoc,
  onSnapshot,
  orderBy,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Pedido } from '../models/pedido';
import { Message } from '../models/message';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class PedidoService {
  constructor(private firestore: Firestore) {}

  getPedidoCliente(idCliente: string): Observable<Pedido[]> {
    return new Observable<Pedido[]>((observer) => {
      const pedidosRef = collection(this.firestore, 'pedidos');
      console.log('ID de cliente recibido en PedidoService:', idCliente);

      const pedidosQuery = query(
        pedidosRef,
        where('idCliente', '==', idCliente)
      );

      const unsubscribe = onSnapshot(
        pedidosQuery,
        (querySnapshot) => {
          console.log(
            'Snapshot recibido, cantidad de documentos:',
            querySnapshot.size
          );
          const pedidos: Pedido[] = [];
          querySnapshot.forEach((doc) => {
            const pedido = { id: doc.id, ...doc.data() } as Pedido;

            if (pedido.estado !== 'finalizado') {
              console.log('Documento encontrado:', doc.id, doc.data());
              pedidos.push(pedido);
            }
          });
          observer.next(pedidos);
        },
        (error) => {
          console.error('Error en la consulta:', error);
          observer.error(error);
        }
      );

      return () => unsubscribe();
    });
  }

  async obtenerPedidoPorId(id: string): Promise<Pedido | null> {
    try {
      const pedidoDocRef = doc(this.firestore, `pedidos/${id}`);
      const pedidoSnapshot = await getDoc(pedidoDocRef);

      if (pedidoSnapshot.exists()) {
        const pedidoData = pedidoSnapshot.data() as Pedido;
        return { id: pedidoSnapshot.id, ...pedidoData };
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  }

  async getPedidoClientePromise(idCliente: string): Promise<Pedido | null> {
    const pedidosRef = collection(this.firestore, 'pedidos');
    const pedidosQuery = query(
      pedidosRef,
      where('idCliente', '==', idCliente),
      where('estado', 'not-in', ['finalizado'])
    );

    const querySnapshot = await getDocs(pedidosQuery);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const pedidoData = doc.data() as Pedido;
      return { id: doc.id, ...pedidoData };
    } else {
      return null;
    }
  }

  actualizarPedido(pedido: Partial<Pedido>): Promise<void> {
    console.log('Pedido recibido para actualizar:', pedido);
    const pedidoDocRef = doc(this.firestore, `pedidos/${pedido.id}`);
    const cleanedPedido = this.removeUndefinedProperties(pedido);
    console.log('Objeto pedido limpio para actualizar:', cleanedPedido);
    return updateDoc(pedidoDocRef, cleanedPedido);
  }

  private removeUndefinedProperties(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.removeUndefinedProperties(item));
    }

    const newObj: { [key: string]: any } = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        if (value !== undefined) {
          newObj[key] = this.removeUndefinedProperties(value);
        }
      }
    }
    return newObj;
  }

  createPedido(pedido: Pedido) {
    const pedidosRef = collection(this.firestore, 'pedidos');
    return addDoc(pedidosRef, pedido);
  }

  obtenerPedidosPorEstado(estado: string): Observable<Pedido[]> {
    const pedidosRef = collection(this.firestore, 'pedidos');
    const pedidosQuery = query(pedidosRef, where('estado', '==', estado));

    return collectionData(pedidosQuery, { idField: 'id' }) as Observable<
      Pedido[]
    >;
  }

  obtenerPedidosPorEstados(estados: string[]): Observable<Pedido[]> {
    const pedidosRef = collection(this.firestore, 'pedidos');
    const pedidosQuery = query(pedidosRef, where('estado', 'in', estados));

    return collectionData(pedidosQuery, { idField: 'id' }) as Observable<
      Pedido[]
    >;
  }

  async obtenerPedidosActivosConMensajes(): Promise<
    {
      pedido: Pedido;
      mensajes: Message[];
      cliente: User;
      estadoConsulta: string;
    }[]
  > {
    const pedidosRef = collection(this.firestore, 'pedidos');
    const mensajesRef = collection(this.firestore, 'mensajes');

    const pedidosQuery = query(pedidosRef, where('estado', '!=', 'finalizado'));
    const pedidosSnapshot = await getDocs(pedidosQuery);

    if (!pedidosSnapshot.empty) {
      const pedidos = pedidosSnapshot.docs
        .map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Pedido)
        )
        .filter((pedido) => pedido.estado !== 'lista-espera');

      if (pedidos.length === 0) {
        return [];
      }

      const mensajesQuery = query(
        mensajesRef,
        where(
          'idPedido',
          'in',
          pedidos.map((p) => p.id)
        ),
        orderBy('fecha', 'desc')
      );
      const mensajesSnapshot = await getDocs(mensajesQuery);

      if (!mensajesSnapshot.empty) {
        const pedidosConMensajes = pedidos
          .map((pedido) => {
            const mensajes = mensajesSnapshot.docs
              .filter(
                (mensajeDoc) => mensajeDoc.data()['idPedido'] === pedido.id
              )
              .map((mensajeDoc) => mensajeDoc.data() as Message);

            if (mensajes.length === 0) {
              return null;
            }

            const ultimoMensaje = mensajes[0];
            const estadoConsulta =
              ultimoMensaje?.usuario.perfil === 'cliente'
                ? 'Sin responder'
                : 'Respondida';

            const clienteMensaje = mensajes.find(
              (mensaje) => mensaje.usuario.perfil === 'cliente'
            );

            const cliente = clienteMensaje ? clienteMensaje.usuario : null;

            return cliente
              ? {
                  pedido,
                  mensajes,
                  cliente,
                  estadoConsulta,
                }
              : null;
          })
          .filter((item) => item !== null);

        return pedidosConMensajes as {
          pedido: Pedido;
          mensajes: Message[];
          cliente: User;
          estadoConsulta: string;
        }[];
      }
    }

    return [];
  }

  async asignarMesa(
    mesaId: string,
    pedidoId: string | undefined
  ): Promise<void> {
    const pedidoRef = doc(this.firestore, `pedidos/${pedidoId}`);
    await updateDoc(pedidoRef, {
      estado: 'mesa-asignada',
      mesaNumero: mesaId,
    });
  }

  updatePedidoEstado(pedidoId: string | undefined, estado: string) {
    const pedidoDoc = doc(this.firestore, `pedidos/${pedidoId}`);
    return updateDoc(pedidoDoc, { estado });
  }

  obtenerProductoPorId(idProducto: string) {
    const productoDoc = doc(this.firestore, `productos/${idProducto}`);
    return getDoc(productoDoc).then((snapshot) => snapshot.data());
  }

  async obtenerPedidosConfirmados(callback: (pedidos: any[]) => void) {
    const pedidosRef = collection(this.firestore, 'pedidos');
    const pedidosQuery = query(pedidosRef, where('estado', '==', 'confirmado'));

    onSnapshot(pedidosQuery, (querySnapshot) => {
      const pedidos: any[] = [];
      querySnapshot.forEach((doc) => {
        pedidos.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      callback(pedidos);
    });
  }

  obtenerProductosPorEncargado(
    pedidoId: string,
    encargado: string,
    callback: (productosFiltrados: any[]) => void
  ) {
    const pedidoRef = doc(this.firestore, `pedidos/${pedidoId}`);

    onSnapshot(pedidoRef, async (pedidoSnapshot) => {
      if (pedidoSnapshot.exists()) {
        const pedidoData = pedidoSnapshot.data();
        const productos = pedidoData['productos'];
        const productosFiltrados: any[] = [];

        for (const producto of productos) {
          const productoId = producto.idProducto;
          const productoRef = doc(this.firestore, `productos/${productoId}`);
          const productoSnapshot = await getDoc(productoRef);

          if (productoSnapshot.exists()) {
            const productoData = productoSnapshot.data();
            if (productoData['encargado'] === encargado) {
              productosFiltrados.push({
                ...producto,
                nombre: productoData['nombre'],
                descripcion: productoData['descripcion'],
                precio: productoData['precio'],
                fotos: productoData['fotos'],
              });
            }
          }
        }
        callback(productosFiltrados);
      } else {
        console.log('El pedido no existe.');
        callback([]);
      }
    });
  }

  async actualizarEstadoProducto(
    pedidoId: string,
    productoId: string,
    nuevoEstado: string
  ) {
    const pedidoRef = doc(this.firestore, `pedidos/${pedidoId}`);
    const pedidoSnapshot = await getDoc(pedidoRef);

    if (pedidoSnapshot.exists()) {
      const pedidoData = pedidoSnapshot.data();
      const productos = pedidoData['productos'];
      const productosActualizados = productos.map((producto: any) => {
        if (producto.idProducto === productoId) {
          return { ...producto, estado: nuevoEstado };
        }
        return producto;
      });
      await updateDoc(pedidoRef, { productos: productosActualizados });
      console.log(
        `Producto ${productoId} actualizado a estado: ${nuevoEstado}`
      );
    } else {
      console.log('El pedido no existe.');
    }
  }

  //   async obtenerEstadoPedidoCliente(idCliente: string): Promise<string | null> {
  async getStatusPedidoCliente(idCliente: string): Promise<string | null> {
    const pedido = await this.getPedidoClientePromise(idCliente);
    return pedido ? pedido.estado : null;
  }
}
