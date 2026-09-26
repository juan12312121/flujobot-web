import { ConfigAvisos } from '../models';

/** Lo mismo que trae el servidor de fábrica (domain/avisos/textos.js): se muestra como ejemplo en cada campo. */
export const TEXTOS_AVISO: { clave: string; etiqueta: string; texto: string }[] = [
  { clave: 'pedido.confirmado', etiqueta: 'Pedido confirmado', texto: 'Hola {{nombre}}, tu {{pedido}} *{{folio}}* fue confirmado. ¡Gracias!' },
  { clave: 'pedido.preparando', etiqueta: 'En preparación', texto: 'Hola {{nombre}}, ya estamos preparando tu {{pedido}} *{{folio}}*.' },
  { clave: 'pedido.enviado', etiqueta: 'En camino', texto: 'Hola {{nombre}}, tu {{pedido}} *{{folio}}* va en camino.' },
  { clave: 'pedido.listo', etiqueta: 'Listo para recoger', texto: 'Hola {{nombre}}, tu {{pedido}} *{{folio}}* está listo para recoger.' },
  { clave: 'pedido.entregado', etiqueta: 'Entregado', texto: 'Hola {{nombre}}, tu {{pedido}} *{{folio}}* fue entregado. ¡Gracias por tu compra!' },
  { clave: 'pedido.cancelado', etiqueta: 'Cancelado', texto: 'Hola {{nombre}}, tu {{pedido}} *{{folio}}* fue cancelado. Si tienes dudas, escríbenos.' },
  { clave: 'pedido.pagado', etiqueta: 'Pago recibido', texto: '¡Recibimos tu pago de {{total}}! Tu {{pedido}} *{{folio}}* quedó pagado.' },
  { clave: 'cita.confirmada', etiqueta: 'Cita confirmada', texto: 'Hola {{nombre}}, tu {{cita}} del *{{fecha}}* a las *{{hora}}* quedó confirmada.' },
  { clave: 'cita.cancelada', etiqueta: 'Cita cancelada', texto: 'Hola {{nombre}}, tu {{cita}} del *{{fecha}}* a las *{{hora}}* fue cancelada. Si quieres otra fecha, escríbenos.' },
  {
    clave: 'recordatorio.dia',
    etiqueta: 'Recordatorio un día antes',
    texto: 'Hola {{nombre}}, te recordamos tu {{cita}} {{servicio}} *mañana {{fecha}}* a las *{{hora}}*.\n\nResponde *1* para confirmar o *2* para cancelar.',
  },
  {
    clave: 'recordatorio.hora',
    etiqueta: 'Recordatorio una hora antes',
    texto: 'Hola {{nombre}}, tu {{cita}} {{servicio}} es *hoy a las {{hora}}* (en una hora).\n\nResponde *1* para confirmar o *2* para cancelar.',
  },
  { clave: 'encuesta.pedido', etiqueta: 'Encuesta al entregar', texto: '¿Cómo calificarías tu {{pedido}} *{{folio}}*? Responde con un número del *1* (malo) al *5* (excelente).' },
];

export const AVISOS_BASE: ConfigAvisos = {
  pedidos: true,
  citas: true,
  recordatorioDia: true,
  recordatorioHora: true,
  encuestaAlEntregar: false,
  textos: {},
};
