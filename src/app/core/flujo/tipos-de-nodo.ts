import { DatosNodo, NodoFlujo, TipoNodo } from '../models';
import { NombreIcono } from '../iconos/iconos';

export interface DefinicionTipo {
  tipo: TipoNodo;
  nombre: string;
  descripcion: string;
  /** Icono del encabezado del bloque (lienzo, paleta e inspector). */
  icono: NombreIcono;
  color: string;
  grupo: 'Conversación' | 'Negocio' | 'Lógica';
  /** Puertos fijos de salida; el menú los calcula por opción. */
  salidas: string[];
  espera: boolean;
  datosIniciales: () => DatosNodo;
}

let consecutivo = 0;
/** Id corto y legible para bloques y opciones. */
export const nuevoId = (prefijo: string) => `${prefijo}_${Date.now().toString(36)}${(consecutivo++).toString(36)}`;

/** Catálogo visual de bloques. Las reglas viven en el backend (domain/flujo/tiposDeNodo.js). */
export const TIPOS: Record<TipoNodo, DefinicionTipo> = {
  inicio: {
    tipo: 'inicio',
    nombre: 'Inicio',
    descripcion: 'Arranca el bot (con cualquier mensaje o con palabras clave)',
    icono: 'play',
    color: '#16a34a',
    grupo: 'Conversación',
    salidas: ['siguiente'],
    espera: false,
    datosIniciales: () => ({ palabrasClave: [], palabrasReinicio: ['reiniciar'] }),
  },
  mensaje: {
    tipo: 'mensaje',
    nombre: 'Mensaje',
    descripcion: 'Envía un texto (y opcionalmente una imagen)',
    icono: 'mensaje',
    color: '#2563eb',
    grupo: 'Conversación',
    salidas: ['siguiente'],
    espera: false,
    datosIniciales: () => ({ texto: 'Escribe aquí tu mensaje' }),
  },
  menu: {
    tipo: 'menu',
    nombre: 'Menú',
    descripcion: 'Opciones numeradas; cada una lleva a otro camino',
    icono: 'lista',
    color: '#7c3aed',
    grupo: 'Conversación',
    salidas: [],
    espera: true,
    datosIniciales: () => ({
      texto: '¿Qué te gustaría hacer?',
      opciones: [
        { id: nuevoId('op'), etiqueta: 'Opción 1' },
        { id: nuevoId('op'), etiqueta: 'Opción 2' },
      ],
    }),
  },
  pregunta: {
    tipo: 'pregunta',
    nombre: 'Pregunta',
    descripcion: 'Pide un dato y lo guarda en una variable',
    icono: 'pregunta',
    color: '#0891b2',
    grupo: 'Conversación',
    salidas: ['siguiente'],
    espera: true,
    datosIniciales: () => ({ texto: '¿Cuál es tu nombre?', variable: 'nombre', validacion: 'texto' }),
  },
  catalogo: {
    tipo: 'catalogo',
    nombre: 'Catálogo',
    descripcion: 'Muestra productos o servicios: carrito o elegir uno',
    icono: 'rejilla',
    color: '#ea580c',
    grupo: 'Negocio',
    salidas: ['agregado', 'listo'],
    espera: true,
    datosIniciales: () => ({ texto: '*Nuestros productos:*', mostrarImagen: true }),
  },
  carrito: {
    tipo: 'carrito',
    nombre: 'Carrito',
    descripcion: 'Muestra el resumen y total del pedido',
    icono: 'carrito',
    color: '#d97706',
    grupo: 'Negocio',
    salidas: ['siguiente', 'vacio'],
    espera: false,
    datosIniciales: () => ({ texto: '*Tu pedido:*' }),
  },
  pedido: {
    tipo: 'pedido',
    nombre: 'Registrar pedido',
    descripcion: 'Guarda un pedido, solicitud o prospecto con folio',
    icono: 'registro',
    color: '#b45309',
    grupo: 'Negocio',
    salidas: ['siguiente'],
    espera: false,
    datosIniciales: () => ({ texto: '¡Listo! Tu pedido *{{folio}}* por {{total}} quedó registrado.' }),
  },
  cita: {
    tipo: 'cita',
    nombre: 'Agendar cita',
    descripcion: 'Ofrece días y horarios libres y aparta la cita',
    icono: 'calendario',
    color: '#0d9488',
    grupo: 'Negocio',
    salidas: ['agendada', 'sin_espacio'],
    espera: true,
    datosIniciales: () => ({ texto: '¿Qué día te acomoda?', diasAdelante: 14 }),
  },
  ia: {
    tipo: 'ia',
    nombre: 'Responder con IA',
    descripcion: 'Contesta preguntas libres con la información del negocio',
    icono: 'destellos',
    color: '#9333ea',
    grupo: 'Conversación',
    salidas: ['respondio', 'no_sabe'],
    espera: true,
    datosIniciales: () => ({ texto: '¿Qué te gustaría saber? Escríbeme tu pregunta.' }),
  },
  condicion: {
    tipo: 'condicion',
    nombre: 'Condición',
    descripcion: 'Sigue un camino u otro según una variable',
    icono: 'ramificacion',
    color: '#475569',
    grupo: 'Lógica',
    salidas: ['si', 'no'],
    espera: false,
    datosIniciales: () => ({ variable: 'opcion', operador: 'igual', valor: '' }),
  },
  webhook: {
    tipo: 'webhook',
    nombre: 'Tarea en n8n',
    descripcion: 'Llama un webhook de n8n (citas, estatus, CRM...)',
    icono: 'rayo',
    color: '#db2777',
    grupo: 'Lógica',
    salidas: ['ok', 'error'],
    espera: false,
    datosIniciales: () => ({ url: 'https://' }),
  },
  humano: {
    tipo: 'humano',
    nombre: 'Asesor',
    descripcion: 'Pasa la conversación a una persona',
    icono: 'asesor',
    color: '#64748b',
    grupo: 'Lógica',
    salidas: [],
    espera: false,
    datosIniciales: () => ({ texto: 'Te comunico con un asesor, en un momento te atiende.' }),
  },
  fin: {
    tipo: 'fin',
    nombre: 'Fin',
    descripcion: 'Termina la conversación',
    icono: 'fin',
    color: '#dc2626',
    grupo: 'Lógica',
    salidas: [],
    espera: false,
    datosIniciales: () => ({ texto: '' }),
  },
};

export const GRUPOS = ['Conversación', 'Negocio', 'Lógica'] as const;

export interface Puerto {
  id: string;
  etiqueta: string;
}

const ETIQUETAS: Record<string, string> = {
  siguiente: 'Siguiente',
  agregado: 'Agregó / eligió',
  agendada: 'Agendó',
  sin_espacio: 'Sin horario / no quiso',
  respondio: 'Respondió',
  no_sabe: 'No supo',
  listo: 'Terminó',
  vacio: 'Carrito vacío',
  si: 'Sí',
  no: 'No',
  ok: 'Éxito',
  error: 'Falló',
};

/** Salidas de un bloque concreto (las del menú dependen de sus opciones). */
export function puertosDe(nodo: Pick<NodoFlujo, 'tipo' | 'datos'>): Puerto[] {
  if (nodo.tipo === 'menu') return (nodo.datos.opciones ?? []).map((o, i) => ({ id: `opcion:${o.id}`, etiqueta: `${i + 1}. ${o.etiqueta}` }));
  return TIPOS[nodo.tipo].salidas.map((s) => ({ id: s, etiqueta: ETIQUETAS[s] ?? s }));
}

/** Texto corto que se ve dentro del bloque en el lienzo. */
export function resumenNodo(nodo: NodoFlujo): string {
  const d = nodo.datos;
  switch (nodo.tipo) {
    case 'inicio':
      return d.palabrasClave?.length ? `Si escriben: ${d.palabrasClave.join(', ')}` : 'Con cualquier mensaje';
    case 'pregunta':
      return `${d.texto ?? ''} → {{${d.variable ?? '?'}}}`;
    case 'catalogo':
      return `${d.modo === 'elegir' ? 'Elegir uno' : 'Carrito'} · ${d.categoria || 'todas las categorías'}`;
    case 'cita':
      return d.servicio ? `${d.servicio} · próximos ${d.diasAdelante ?? 14} días` : `Próximos ${d.diasAdelante ?? 14} días`;
    case 'ia':
      return 'Pregunta libre → responde con la información de "Mi empresa"';
    case 'pedido':
      return d.sinProductos ? 'Solicitud (sin productos)' : 'Con lo que hay en el carrito';
    case 'condicion':
      return `${d.variable ?? '?'} ${d.operador ?? ''} ${d.operador === 'existe' ? '' : (d.valor ?? '')}`;
    case 'webhook':
      return d.url ?? '';
    default:
      return d.texto ?? '';
  }
}
