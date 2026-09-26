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
  estado: {
    tipo: 'estado',
    nombre: 'Consultar pedido',
    descripcion: '"¿Cómo va mi pedido?": muestra sus pedidos y citas',
    icono: 'lupa',
    color: '#0e7490',
    grupo: 'Negocio',
    salidas: ['encontrado', 'nada'],
    espera: false,
    datosIniciales: () => ({ texto: 'Esto es lo que encontré:', que: 'ambos' }),
  },
  esperar: {
    tipo: 'esperar',
    nombre: 'Esperar respuesta',
    descripcion: 'Si no contesta en cierto tiempo, sigue por otro camino',
    icono: 'reloj',
    color: '#4f46e5',
    grupo: 'Lógica',
    salidas: ['respondio', 'sin_respuesta'],
    espera: true,
    datosIniciales: () => ({ texto: '¿Te ayudo con algo más?', minutos: 120 }),
  },
  encuesta: {
    tipo: 'encuesta',
    nombre: 'Encuesta',
    descripcion: 'Pide calificar la atención del 1 al 5',
    icono: 'estrella',
    color: '#ca8a04',
    grupo: 'Conversación',
    salidas: ['buena', 'mala'],
    espera: true,
    datosIniciales: () => ({ texto: '¿Cómo calificarías la atención? Responde del *1* (malo) al *5* (excelente).', pedirComentario: false }),
  },
  permiso: {
    tipo: 'permiso',
    nombre: 'Pedir permiso',
    descripcion: 'Pregunta si acepta promociones (para las campañas)',
    icono: 'megafono',
    color: '#be185d',
    grupo: 'Conversación',
    salidas: ['acepto', 'no_acepto'],
    espera: true,
    datosIniciales: () => ({ texto: '¿Te gustaría recibir nuestras promociones y novedades por aquí?' }),
  },
  registro: {
    tipo: 'registro',
    nombre: 'Guardar en módulo',
    descripcion: 'Guarda lo que dio el cliente en uno de tus módulos',
    icono: 'formulario',
    color: '#15803d',
    grupo: 'Negocio',
    salidas: ['siguiente'],
    espera: false,
    datosIniciales: () => ({ moduloId: '', campos: {}, texto: '¡Listo! Quedó registrado con el folio *{{folio}}*.' }),
  },
  consulta: {
    tipo: 'consulta',
    nombre: 'Consultar módulo',
    descripcion: 'Le muestra al cliente sus registros ("¿cómo va mi reparación?")',
    icono: 'lupa',
    color: '#0369a1',
    grupo: 'Negocio',
    salidas: ['encontrado', 'nada'],
    espera: false,
    datosIniciales: () => ({ moduloId: '', texto: 'Esto es lo que encontré:' }),
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
  encontrado: 'Encontró',
  nada: 'No tiene',
  sin_respuesta: 'No respondió',
  buena: 'Buena (4-5)',
  mala: 'Mala (1-3)',
  acepto: 'Aceptó',
  no_acepto: 'No aceptó',
};

/** Salidas de un bloque concreto (las del menú dependen de sus opciones). */
export function puertosDe(nodo: Pick<NodoFlujo, 'tipo' | 'datos'>): Puerto[] {
  if (nodo.tipo === 'menu') return (nodo.datos.opciones ?? []).map((o, i) => ({ id: `opcion:${o.id}`, etiqueta: `${i + 1}. ${o.etiqueta}` }));
  return TIPOS[nodo.tipo].salidas.map((s) => ({ id: s, etiqueta: ETIQUETAS[s] ?? s }));
}

/** 90 → "1 h 30 min"; 2880 → "2 días". */
export function duracion(minutos: number): string {
  if (minutos % 1440 === 0) return `${minutos / 1440} día${minutos === 1440 ? '' : 's'}`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return [h ? `${h} h` : '', m ? `${m} min` : ''].filter(Boolean).join(' ');
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
      return `${d.sinProductos ? 'Solicitud (sin productos)' : 'Con lo que hay en el carrito'}${d.cobrar ? ' · con link de pago' : ''}`;
    case 'estado':
      return d.que === 'pedidos' ? 'Sus últimos pedidos' : d.que === 'citas' ? 'Sus próximas citas' : 'Sus pedidos y citas';
    case 'esperar':
      return `Espera ${duracion(d.minutos ?? 60)} a que conteste`;
    case 'registro':
      return d.moduloId ? `Guarda ${Object.keys(d.campos ?? {}).length} dato(s) en el módulo` : 'Elige el módulo';
    case 'consulta':
      return d.moduloId ? 'Busca los registros de quien escribe' : 'Elige el módulo';
    case 'encuesta':
      return `Calificación 1 a 5${d.pedirComentario ? ' + comentario' : ''}`;
    case 'condicion':
      return `${d.variable ?? '?'} ${d.operador ?? ''} ${d.operador === 'existe' ? '' : (d.valor ?? '')}`;
    case 'webhook':
      return d.url ?? '';
    default:
      return d.texto ?? '';
  }
}
