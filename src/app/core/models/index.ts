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
  /** Administrador de toda la plataforma FlujoBot (correos en SUPERADMINS del servidor). */
  esSuperadmin?: boolean;
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

export type ModoTema = 'claro' | 'oscuro';

/** Fondo del espacio de trabajo: uno de la galería (id), una imagen subida (URL) o nada. */
export interface FondoMarca {
  tipo: 'ninguno' | 'galeria' | 'imagen';
  valor: string;
  /** 0-95: qué tanto se tapa la imagen con el color de fondo para que se lea el contenido. */
  velo: number;
  desenfoque: number;
}

/** Tema que armó la empresa y guardó para reusarlo. */
export interface TemaGuardado {
  id: string;
  nombre: string;
  colorPrimario: string;
  colorMenu: string;
  modo: ModoTema;
  fondo: FondoMarca;
}

export interface Marca {
  colorPrimario: string;
  colorMenu: string;
  logoUrl: string;
  tema?: string;
  modo?: ModoTema;
  fondo?: FondoMarca;
  temasGuardados?: TemaGuardado[];
  fondosSubidos?: string[];
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
  avisos: ConfigAvisos;
  activa?: boolean;
}

/** Qué le avisa el bot al cliente por su cuenta y con qué textos. */
export interface ConfigAvisos {
  pedidos: boolean;
  citas: boolean;
  recordatorioDia: boolean;
  recordatorioHora: boolean;
  encuestaAlEntregar: boolean;
  textos: Record<string, string>;
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
  avisos?: Partial<ConfigAvisos>;
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
  | 'estado'
  | 'esperar'
  | 'encuesta'
  | 'permiso'
  | 'registro'
  | 'consulta'
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
  /** Pedido: manda link de pago (Mercado Pago o Stripe). */
  cobrar?: boolean;
  /** Consultar: qué mostrar. */
  que?: 'ambos' | 'pedidos' | 'citas';
  textoNada?: string;
  /** Esperar: minutos antes de seguir por "No respondió". */
  minutos?: number;
  /** Encuesta. */
  pedirComentario?: boolean;
  textoComentario?: string;
  textoBuena?: string;
  textoMala?: string;
  /** Pedir permiso. */
  textoSi?: string;
  textoNo?: string;
  /** Guardar en módulo / Consultar módulo. */
  moduloId?: string;
  /** Guardar en módulo: id del campo → texto con variables ("{{vehiculo}}"). */
  campos?: Record<string, string>;
  /** Consultar módulo: campos que se le muestran al cliente (vacío = los de la lista). */
  mostrar?: string[];
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
  telegram?: { activo: boolean; usuario: string };
  meta?: { activo: boolean; paginaId: string; instagram: boolean };
  recuperacion?: Recuperacion;
  createdAt: string;
  updatedAt: string;
}

/** Carrito abandonado: a las `horas` sin respuesta se le escribe al cliente una vez. */
export interface Recuperacion {
  activo: boolean;
  horas: number;
  texto: string;
}

/** Cada publicación guardada de un bot. */
export interface VersionBot {
  id: string;
  version: number;
  publicadaPor: string;
  createdAt: string;
  activa: boolean;
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
  de: 'contacto' | 'bot' | 'asesor' | 'sistema';
  autor?: string;
  texto: string;
  url?: string;
  fecha: string;
}

export type Canal = 'whatsapp' | 'web' | 'telegram' | 'messenger' | 'instagram';

export interface Conversacion {
  id: string;
  botId: string;
  canal: Canal;
  atendidaPor?: string;
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

export type EstadoPedido = 'nuevo' | 'confirmado' | 'preparando' | 'enviado' | 'listo' | 'entregado' | 'cancelado';
export type EstadoPago = 'sin_cobro' | 'pendiente' | 'pagado' | 'fallido';

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
  canal: Canal;
  pago?: { estado: EstadoPago; proveedor: string; url: string; pagadoEn: string | null };
  recuperado?: boolean;
  createdAt: string;
  /** Solo al cambiar el estado: si se le avisó al cliente. */
  aviso?: { enviado: boolean; error?: string };
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
  recordatorios?: string[] | { dia: string | null; hora: string | null };
  aviso?: { enviado: boolean; error?: string };
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
  satisfaccion: ResumenEncuestas | null;
  carritosRecuperados: number;
}

// ───────────── Crecimiento ─────────────

export interface ResumenEncuestas {
  promedio: number | null;
  total: number;
  buenas: number;
  distribucion: number[];
}

export interface Encuesta {
  id: string;
  canal: Canal;
  contacto: string;
  nombre: string;
  calificacion: number;
  comentario: string;
  origen: 'flujo' | 'pedido';
  folio: string;
  createdAt: string;
}

export type TipoSegmento = 'todos' | 'compraron' | 'sin_terminar' | 'con_cita' | 'inactivos';
export type EstadoCampana = 'borrador' | 'programada' | 'enviando' | 'enviada' | 'cancelada';

export interface Campana {
  id: string;
  botId: string;
  nombre: string;
  texto: string;
  imagenUrl: string;
  segmento: { tipo: TipoSegmento; dias: number };
  estado: EstadoCampana;
  programadaPara: string | null;
  totales: { destinatarios: number; enviados: number; fallidos: number };
  creadaPor: string;
  terminadaEn: string | null;
  createdAt: string;
}

export interface DatosCampana {
  botId: string;
  nombre: string;
  texto: string;
  imagenUrl: string;
  segmento: { tipo: TipoSegmento; dias: number };
}

export interface ConteoSegmento {
  destinatarios: number;
  contactos: number;
  conPermiso: number;
  segmentos: Record<TipoSegmento, string>;
  canales: string[];
}

export interface Contacto {
  id: string;
  canal: Canal;
  contacto: string;
  nombre: string;
  aceptaPromos: boolean;
  ultimoMensaje: string;
  ultimaCompra: string | null;
  compras: number;
}

export interface Actividad {
  id: string;
  usuario: string;
  accion: string;
  entidad: string;
  entidadId: string;
  detalle: string;
  fecha: string;
}

// ───────────── Módulos personalizados ─────────────

export type TipoCampo = 'texto' | 'textoLargo' | 'numero' | 'dinero' | 'fecha' | 'opcion' | 'sino' | 'telefono' | 'email' | 'imagen';

export interface CampoModulo {
  id: string;
  nombre: string;
  tipo: TipoCampo;
  opciones: string[];
  requerido: boolean;
  /** Se ve como columna en la tabla (y en lo que el bot le muestra al cliente). */
  enLista: boolean;
  /** Solo en "opcion": al cambiarlo se le avisa al cliente. */
  avisar: boolean;
}

export interface Modulo {
  id: string;
  nombre: string;
  singular: string;
  clave: string;
  icono: string;
  descripcion: string;
  prefijo: string;
  campos: CampoModulo[];
  orden: number;
  activo: boolean;
  registros?: number;
}

export interface PlantillaModulo {
  id: string;
  nombre: string;
  singular: string;
  icono: string;
  prefijo: string;
  descripcion: string;
  campos: CampoModulo[];
}

export interface RegistroModulo {
  id: string;
  moduloId: string;
  folio: string;
  datos: Record<string, unknown>;
  canal: string;
  contacto: string;
  nombreContacto: string;
  creadoPor: string;
  createdAt: string;
  updatedAt: string;
  aviso?: { enviado: boolean; error?: string; motivo?: string };
}

export type DatosModulo = Pick<Modulo, 'nombre' | 'singular' | 'icono' | 'descripcion' | 'prefijo' | 'campos'>;

export type ProveedorPago = 'ninguno' | 'mercadopago' | 'stripe';

export interface EstadoCobros {
  proveedor: ProveedorPago;
  configurado: boolean;
  urlAviso: string;
  pideSecretoWebhook: boolean;
  secretoWebhook: boolean;
}

export interface EmpresaAdmin {
  id: string;
  nombre: string;
  giro: Giro;
  activa: boolean;
  suspendidaMotivo: string;
  bots: number;
  creada: string;
}
