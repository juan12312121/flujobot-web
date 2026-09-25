/** Forma de todas las respuestas del backend. */
export interface RespuestaApi<T> {
  ok: true;
  data: T;
}

export interface ErrorApi {
  status: number;
  codigo: string;
  mensaje: string;
  detalles: { campo?: string; mensaje?: string; nodoId?: string | null; nivel?: string }[];
}

export type Rol = 'admin' | 'editor';

export interface Usuario {
  id: string;
  empresaId: string;
  nombre: string;
  email: string;
  rol: Rol;
  createdAt?: string;
}

export type Giro = 'tienda' | 'restaurante' | 'belleza' | 'salud' | 'servicios' | 'educacion' | 'inmobiliaria' | 'otro';

/** Palabras del panel que cada empresa puede cambiar ("Servicios", "Pacientes"...). */
export interface Terminos {
  item: string;
  items: string;
  pedido: string;
  pedidos: string;
  cita: string;
  citas: string;
  cliente: string;
  clientes: string;
}

export interface Marca {
  colorPrimario: string;
  colorMenu: string;
  logoUrl: string;
}

export interface Modulos {
  catalogo: boolean;
  pedidos: boolean;
  agenda: boolean;
}

export interface Horario {
  dias: number[];
  apertura: string;
  cierre: string;
  intervaloMin: number;
  capacidad: number;
}

export interface Empresa {
  id: string;
  nombre: string;
  slug: string;
  moneda: string;
  giro: Giro;
  marca: Marca;
  terminos: Terminos;
  modulos: Modulos;
  horario: Horario;
  zonaHoraria: string;
  /** Lo que sabe el bloque "Responder con IA": precios, políticas, preguntas frecuentes... */
  conocimiento: string;
}

export interface CambiosEmpresa {
  nombre?: string;
  giro?: Giro;
  aplicarGiro?: boolean;
  moneda?: string;
  zonaHoraria?: string;
  marca?: Partial<Marca>;
  terminos?: Partial<Terminos>;
  modulos?: Partial<Modulos>;
  horario?: Partial<Horario>;
  conocimiento?: string;
}

export interface OpcionGiro {
  id: Giro;
  nombre: string;
  color: string;
  plantilla: string;
  terminos: Terminos;
  modulos: Modulos;
}

export interface Sesion {
  token: string;
  usuario: Usuario;
  empresa: Empresa;
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'producto' | 'servicio';
  precio: number;
  precioDesde: boolean;
  duracionMin: number | null;
  categoria: string;
  imagenUrl: string;
  sku: string;
  activo: boolean;
  orden: number;
}

export type DatosProducto = Omit<Producto, 'id'>;

// ───────────── Flujos ─────────────

export type TipoNodo =
  | 'inicio'
  | 'mensaje'
  | 'menu'
  | 'pregunta'
  | 'catalogo'
  | 'carrito'
  | 'pedido'
  | 'cita'
  | 'ia'
  | 'condicion'
  | 'webhook'
  | 'humano'
  | 'fin';

export interface OpcionMenu {
  id: string;
  etiqueta: string;
  palabras?: string[];
}

/** Datos de cualquier bloque. Cada tipo usa solo sus campos. */
export interface DatosNodo {
  texto?: string;
  bienvenida?: string;
  palabrasClave?: string[];
  palabrasReinicio?: string[];
  expiraMinutos?: number;
  imagenUrl?: string;
  opciones?: OpcionMenu[];
  error?: string;
  variable?: string;
  validacion?: 'texto' | 'numero' | 'email' | 'telefono';
  categoria?: string;
  pie?: string;
  textoVacio?: string;
  textoAgregado?: string;
  mostrarImagen?: boolean;
  modo?: 'carrito' | 'elegir';
  sinProductos?: boolean;
  diasAdelante?: number;
  duracionMin?: number;
  servicio?: string;
  textoConfirmacion?: string;
  textoSinEspacio?: string;
  /** Menú: si el cliente escribe algo que no es opción, contestar con IA antes de repetir el menú. */
  responderConIA?: boolean;
  textoNoSabe?: string;
  operador?: 'igual' | 'distinto' | 'contiene' | 'mayor' | 'menor' | 'existe';
  valor?: string;
  url?: string;
}

export interface Posicion {
  x: number;
  y: number;
}

export interface NodoFlujo {
  id: string;
  tipo: TipoNodo;
  datos: DatosNodo;
  posicion: Posicion;
}

export interface Conexion {
  id: string;
  origen: string;
  puerto: string;
  destino: string;
  vertices?: Posicion[];
}

export interface Definicion {
  nodos: NodoFlujo[];
  conexiones: Conexion[];
  version?: number;
  fecha?: string;
}

export interface Problema {
  nivel: 'error' | 'aviso';
  nodoId: string | null;
  mensaje: string;
}

export type EstadoWhatsApp = 'desconectado' | 'esperando_qr' | 'conectado';

export interface Bot {
  id: string;
  nombre: string;
  descripcion: string;
  instancia: string;
  telefono: string;
  whatsapp: EstadoWhatsApp;
  publicado: { version: number; fecha: string } | null;
  cambiosSinPublicar: boolean;
  n8nWorkflowId: string | null;
  webhookUrl: string | null;
  web?: ChatWeb;
  createdAt: string;
  updatedAt: string;
}

/** El globito de chat que el negocio pega en su página. */
export interface ChatWeb {
  activo: boolean;
  clave: string;
  titulo: string;
  saludo: string;
}

/** "Ver resultados": conversaciones por bloque y flecha ("origen|puerto") en los últimos días. */
export interface ResultadosBot {
  dias: number;
  desde: string;
  conversaciones: number;
  nodos: Record<string, number>;
  flechas: Record<string, number>;
  abandonos: Record<string, number>;
  enCurso: Record<string, number>;
  abandonoMinutos: number;
}

export interface BotDetalle extends Omit<Bot, 'publicado'> {
  publicado: { version: number; fecha: string } | null;
  borrador: Definicion;
  problemas: Problema[];
}

export interface ResultadoPublicar {
  bot: Bot;
  modo: 'n8n' | 'manual';
  webhookUrl: string | null;
  avisos: string[];
  problemas: Problema[];
}

export interface RespuestaBot {
  tipo: 'texto' | 'imagen';
  texto: string;
  url?: string;
  /** Índice del paso del recorrido que produjo este mensaje. */
  paso?: number;
}

/** Un paso de la simulación: qué bloque actuó, por qué salida siguió y qué pasó, en lenguaje sencillo. */
export interface PasoRecorrido {
  nodoId: string;
  tipo: TipoNodo;
  puerto: string | null;
  texto: string;
  espera?: boolean;
  error?: boolean;
}

/** Flujo que propone el asistente de IA (todavía no guardado). */
export interface PropuestaFlujo {
  resumen: string;
  supuestos: string[];
  nodos: NodoFlujo[];
  conexiones: Conexion[];
  problemas: Problema[];
  modelo: string;
}

export type AccionTarea =
  | { tipo: 'correo'; para: string; asunto: string; mensaje: string }
  | { tipo: 'hoja'; documento: string; hoja: string; columnas: Record<string, string> }
  | { tipo: 'http'; metodo: 'GET' | 'POST'; url: string; cuerpo: Record<string, string> };

/** Tarea de n8n que propone el asistente (todavía no creada). */
export interface PropuestaTarea {
  nombre: string;
  resumen: string;
  respuesta: string;
  faltantes: string[];
  acciones: AccionTarea[];
  modelo: string;
}

export interface TareaPublicada {
  modo: 'n8n' | 'manual';
  workflowId: string | null;
  url: string;
  activo: boolean;
  pendientes: string[];
  avisos: string[];
  workflow: unknown;
}

export interface Sugerencia {
  texto: string;
  etiqueta: string;
}

export interface ItemCarrito {
  productoId: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

export interface ResultadoSimulacion {
  respuestas: RespuestaBot[];
  recorrido: PasoRecorrido[];
  sugerencias: Sugerencia[];
  estado: EstadoConversacion;
  nodoActual: string | null;
  variables: Record<string, unknown>;
  carrito: ItemCarrito[];
}

// ───────────── Operación ─────────────

export type EstadoConversacion = 'nueva' | 'activa' | 'terminada' | 'humano';

export interface MensajeHistorial {
  de: 'contacto' | 'bot';
  texto: string;
  url?: string;
  fecha: string;
}

export interface Conversacion {
  id: string;
  botId: string;
  canal: 'whatsapp' | 'web';
  contacto: string;
  nombre: string;
  estado: EstadoConversacion;
  carrito: ItemCarrito[];
  actualizadoEn: string;
  ultimoMensaje?: MensajeHistorial | null;
  mensajes?: number;
  historial?: MensajeHistorial[];
  variables?: Record<string, unknown>;
}

export type EstadoPedido = 'nuevo' | 'confirmado' | 'enviado' | 'entregado' | 'cancelado';

export interface Pedido {
  id: string;
  botId: string;
  folio: string;
  contacto: string;
  nombreContacto: string;
  items: ItemCarrito[];
  total: number;
  datos: Record<string, unknown>;
  estado: EstadoPedido;
  createdAt: string;
}

export type EstadoCita = 'pendiente' | 'confirmada' | 'atendida' | 'cancelada' | 'no_asistio';

export interface Cita {
  id: string;
  folio: string;
  botId: string | null;
  canal: string;
  contacto: string;
  nombreContacto: string;
  servicio: string;
  inicio: string;
  fin: string;
  estado: EstadoCita;
  notas: string;
  datos: Record<string, unknown>;
}

export interface NuevaCita {
  fecha: string;
  hora: string;
  duracionMin?: number;
  nombreContacto: string;
  contacto?: string;
  servicio?: string;
  notas?: string;
}

export interface Resumen {
  bots: number;
  productos: number;
  pedidosPendientes: number;
  conversacionesHoy: number;
  esperandoAsesor: number;
  ventasMes: { total: number; pedidos: number };
  ultimosPedidos: Pedido[];
  citasHoy: number;
  proximasCitas: Cita[];
}
