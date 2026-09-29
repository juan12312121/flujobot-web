import { Rol } from '../models';

/** Copia de domain/permisos/roles.js del backend (allá se hace cumplir; aquí solo arma el menú). */
export const ROLES: { rol: Rol; nombre: string; descripcion: string }[] = [
  { rol: 'admin', nombre: 'Administrador', descripcion: 'Todo: equipo, empresa, bots, cobros y bitácora.' },
  { rol: 'editor', nombre: 'Editor', descripcion: 'Arma bots, catálogo, campañas y atiende pedidos y conversaciones.' },
  { rol: 'cajero', nombre: 'Cajero', descripcion: 'Pedidos, cobros, inventario y conversaciones.' },
  { rol: 'recepcion', nombre: 'Recepción', descripcion: 'Agenda, conversaciones y módulos (órdenes, expedientes...).' },
  { rol: 'repartidor', nombre: 'Repartidor', descripcion: 'Solo ve los pedidos que le asignan y los marca como entregados.' },
];

export type Seccion =
  | 'bots'
  | 'catalogo'
  | 'pedidos'
  | 'agenda'
  | 'conversaciones'
  | 'campanas'
  | 'gestion'
  | 'modulos'
  | 'reportes'
  | 'inventario'
  | 'sucursales';

const PERMISOS: Record<Seccion, Rol[]> = {
  bots: ['editor'],
  catalogo: ['editor', 'cajero'],
  pedidos: ['editor', 'cajero', 'recepcion', 'repartidor'],
  agenda: ['editor', 'recepcion'],
  conversaciones: ['editor', 'cajero', 'recepcion'],
  campanas: ['editor'],
  gestion: ['editor', 'cajero', 'recepcion'],
  modulos: ['editor', 'cajero', 'recepcion'],
  reportes: ['editor', 'cajero'],
  inventario: ['editor', 'cajero'],
  sucursales: ['editor', 'cajero', 'recepcion', 'repartidor'],
};

export const puede = (rol: Rol | undefined, seccion: Seccion) => rol === 'admin' || (rol ? PERMISOS[seccion].includes(rol) : false);

export const nombreRol = (rol: Rol) => ROLES.find((r) => r.rol === rol)?.nombre ?? rol;
