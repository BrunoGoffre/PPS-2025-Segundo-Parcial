import { initializeApp } from 'firebase-admin/app';

// Importar todas las funciones automáticas
import { notificarClienteYsupervisorNuevoUsuario } from './cliente-nuevo';
import { notificarMaitreListaEspera } from './cliente-en-espera';
import { notificarCuentaPedida } from './cliente-solicita-cuenta';
import { notificarConsultaAmozo } from './consulta-mozo';
import { notificarPedidosAEntregar } from './empleado-deriva-pedido';
import { notificarPedidosARealizar } from './mozo-deriva-pedido';
import { notificarMesaAsignada } from './maitre-asigna-mesa';

initializeApp();

// Exportar todas las funciones automáticas
export { 
  notificarClienteYsupervisorNuevoUsuario,
  notificarMaitreListaEspera,
  notificarCuentaPedida,
  notificarConsultaAmozo,
  notificarPedidosAEntregar,
  notificarPedidosARealizar,
  notificarMesaAsignada
};