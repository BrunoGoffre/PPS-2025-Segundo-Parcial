import { PedidoProducto } from './pedidoProducto';

export interface Pedido {
  id?: string;
  idCliente: string;
  idMozo?: string;
  mesaNumero: string;
  estado: string;
  productos?: PedidoProducto[];
  descuento?: number;
  montoDescuento?: number;
  propina?: number;
  montoFinal: number;
  encuestaCompletada: boolean;
  tiempoEstimado?: number;
}
