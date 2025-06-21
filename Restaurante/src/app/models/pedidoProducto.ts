export interface PedidoProducto {
    idProducto: string;
    cantidad: number;
    estado: 'pendiente' | 'preparado' ;
    descripcion?: string;
    nombre?: string; 
    precio?: number; 
  }