import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { BotsService } from '../../core/services/bots/bots.service';
import { ProductosService } from '../../core/services/productos/productos.service';
import { AvisosService } from '../../core/services/avisos/avisos.service';
import { nuevoId, puertosDe, TIPOS } from '../../core/flujo/tipos-de-nodo';
import { BotDetalle, Conexion, DatosNodo, ErrorApi, NodoFlujo, PasoRecorrido, Posicion, Problema, ResultadoPublicar, ResultadosBot, TipoNodo } from '../../core/models';

export type EstadoGuardado = 'guardado' | 'pendiente' | 'guardando' | 'error';
export type Velocidad = 'lento' | 'normal' | 'rapido' | 'instantaneo';

/** Milisegundos que dura cada paso de la animación. */
export const MS_POR_PASO: Record<Velocidad, number> = { lento: 1800, normal: 1000, rapido: 450, instantaneo: 0 };

const AUTOGUARDADO_MS = 1500;

/**
 * Estado del editor de un bot (uno por página). Es la fuente de verdad del flujo:
 * el lienzo de JointJS lo dibuja y le avisa de lo que hace la persona (mover, conectar, borrar),
 * el inspector edita los datos del bloque seleccionado. Guarda solo, con un pequeño retraso.
 */
@Injectable()
export class EditorStore {
  private readonly botsApi = inject(BotsService);
  private readonly productosApi = inject(ProductosService);
  private readonly avisos = inject(AvisosService);
  private temporizador: ReturnType<typeof setTimeout> | undefined;

  readonly bot = signal<BotDetalle | null>(null);
  readonly nodos = signal<NodoFlujo[]>([]);
  readonly conexiones = signal<Conexion[]>([]);
  readonly problemas = signal<Problema[]>([]);
  readonly seleccionadoId = signal<string | null>(null);
  readonly estadoGuardado = signal<EstadoGuardado>('guardado');
  readonly publicando = signal(false);
  readonly categorias = signal<string[]>([]);
  /** Bloque donde quedó esperando la conversación del simulador (se resalta en el lienzo). */
  readonly nodoSimulado = signal<string | null>(null);

  // ───── Simulación animada ─────
  /** Paso que se está animando ahora: el lienzo ilumina su bloque y la flecha que toma. */
  readonly pasoActivo = signal<PasoRecorrido | null>(null);
  /** Bloques y flechas (origen|puerto) por donde ya pasó la conversación de prueba. */
  readonly visitados = signal<{ nodos: string[]; flechas: string[] }>({ nodos: [], flechas: [] });
  readonly velocidad = signal<Velocidad>('normal');
  /** Flujo antes del último cambio del asistente de IA (para "Deshacer"). */
  readonly antesDelAsistente = signal<{ nodos: NodoFlujo[]; conexiones: Conexion[] } | null>(null);

  // ───── Resultados sobre el lienzo ─────
  /** Conversaciones reales por bloque y flecha; null = el lienzo se ve normal. */
  readonly resultados = signal<ResultadosBot | null>(null);
  readonly diasResultados = signal(30);
  readonly cargandoResultados = signal(false);

  readonly seleccionado = computed(() => this.nodos().find((n) => n.id === this.seleccionadoId()) ?? null);
  readonly errores = computed(() => this.problemas().filter((p) => p.nivel === 'error'));
  readonly problemasPorNodo = computed(() => {
    const mapa = new Map<string, 'error' | 'aviso'>();
    for (const p of this.problemas()) {
      if (!p.nodoId) continue;
      if (p.nivel === 'error' || !mapa.has(p.nodoId)) mapa.set(p.nodoId, p.nivel);
    }
    return mapa;
  });
  readonly hayInicio = computed(() => this.nodos().some((n) => n.tipo === 'inicio'));

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.temporizador));
  }

  async cargar(botId: string): Promise<void> {
    const [bot, categorias] = await Promise.all([this.botsApi.obtener(botId), this.productosApi.categorias().catch(() => [])]);
    this.bot.set(bot);
    this.nodos.set(bot.borrador.nodos ?? []);
    this.conexiones.set(bot.borrador.conexiones ?? []);
    this.problemas.set(bot.problemas);
    this.categorias.set(categorias);
    this.estadoGuardado.set('guardado');
  }

  // ───── Bloques ─────

  agregarNodo(tipo: TipoNodo, posicion: Posicion): void {
    if (tipo === 'inicio' && this.hayInicio()) {
      this.avisos.info('El flujo ya tiene un bloque de Inicio');
      return;
    }
    const nodo: NodoFlujo = { id: nuevoId(tipo), tipo, datos: TIPOS[tipo].datosIniciales(), posicion: redondear(posicion) };
    this.nodos.update((l) => [...l, nodo]);
    this.seleccionadoId.set(nodo.id);
    this.cambio();
  }

  actualizarDatos(id: string, cambios: Partial<DatosNodo>): void {
    let puertosVigentes: Set<string> | null = null;
    this.nodos.update((l) =>
      l.map((n) => {
        if (n.id !== id) return n;
        const nuevo = { ...n, datos: { ...n.datos, ...cambios } };
        if (n.tipo === 'menu') puertosVigentes = new Set(puertosDe(nuevo).map((p) => p.id));
        return nuevo;
      }),
    );
    // Opción del menú borrada → su flecha también
    const vigentes = puertosVigentes as Set<string> | null;
    if (vigentes) this.conexiones.update((l) => l.filter((c) => c.origen !== id || vigentes.has(c.puerto)));
    this.cambio();
  }

  moverNodo(id: string, posicion: Posicion): void {
    const p = redondear(posicion);
    const actual = this.nodos().find((n) => n.id === id);
    if (!actual || (actual.posicion.x === p.x && actual.posicion.y === p.y)) return;
    this.nodos.update((l) => l.map((n) => (n.id === id ? { ...n, posicion: p } : n)));
    this.cambio();
  }

  borrarNodo(id: string): void {
    this.nodos.update((l) => l.filter((n) => n.id !== id));
    this.conexiones.update((l) => l.filter((c) => c.origen !== id && c.destino !== id));
    if (this.seleccionadoId() === id) this.seleccionadoId.set(null);
    this.cambio();
  }

  duplicarNodo(id: string): void {
    const n = this.nodos().find((x) => x.id === id);
    if (!n || n.tipo === 'inicio') return;
    const datos = structuredClone(n.datos);
    if (datos.opciones) datos.opciones = datos.opciones.map((o) => ({ ...o, id: nuevoId('op') }));
    const copia: NodoFlujo = { id: nuevoId(n.tipo), tipo: n.tipo, datos, posicion: { x: n.posicion.x + 40, y: n.posicion.y + 40 } };
    this.nodos.update((l) => [...l, copia]);
    this.seleccionadoId.set(copia.id);
    this.cambio();
  }

  async verResultados(dias = this.diasResultados()): Promise<void> {
    const bot = this.bot();
    if (!bot) return;
    this.diasResultados.set(dias);
    this.cargandoResultados.set(true);
    try {
      this.resultados.set(await this.botsApi.resultados(bot.id, dias));
    } catch (e) {
      this.avisos.error(e, 'No se pudieron cargar los resultados');
    } finally {
      this.cargandoResultados.set(false);
    }
  }

  ocultarResultados(): void {
    this.resultados.set(null);
  }

  /** Deja marcado en el lienzo el camino de la conversación de prueba. */
  marcarVisita(paso: PasoRecorrido): void {
    const flecha = paso.puerto ? `${paso.nodoId}|${paso.puerto}` : null;
    this.visitados.update(({ nodos, flechas }) => ({
      nodos: nodos.includes(paso.nodoId) ? nodos : [...nodos, paso.nodoId],
      flechas: flecha && !flechas.includes(flecha) ? [...flechas, flecha] : flechas,
    }));
  }

  limpiarSimulacion(): void {
    this.pasoActivo.set(null);
    this.nodoSimulado.set(null);
    this.visitados.set({ nodos: [], flechas: [] });
  }

  seleccionar(id: string | null): void {
    this.seleccionadoId.set(id);
  }

  /** Pone en el lienzo el flujo que propuso el asistente; guarda el anterior para poder deshacer. */
  reemplazarFlujo(nodos: NodoFlujo[], conexiones: Conexion[]): void {
    this.antesDelAsistente.set({ nodos: this.nodos(), conexiones: this.conexiones() });
    this.nodos.set(nodos);
    this.conexiones.set(conexiones);
    this.seleccionadoId.set(null);
    this.limpiarSimulacion();
    this.cambio();
  }

  deshacerAsistente(): void {
    const antes = this.antesDelAsistente();
    if (!antes) return;
    this.nodos.set(antes.nodos);
    this.conexiones.set(antes.conexiones);
    this.antesDelAsistente.set(null);
    this.seleccionadoId.set(null);
    this.cambio();
  }

  // ───── Flechas ─────

  /** Una salida lleva a un solo bloque: conectar de nuevo reemplaza la flecha anterior. */
  conectar(conexion: Conexion): void {
    this.conexiones.update((l) => [
      ...l.filter((c) => c.id !== conexion.id && !(c.origen === conexion.origen && c.puerto === conexion.puerto)),
      conexion,
    ]);
    this.cambio();
  }

  desconectar(id: string): void {
    if (!this.conexiones().some((c) => c.id === id)) return;
    this.conexiones.update((l) => l.filter((c) => c.id !== id));
    this.cambio();
  }

  // ───── Guardar y publicar ─────

  async guardar(): Promise<void> {
    clearTimeout(this.temporizador);
    const bot = this.bot();
    if (!bot || this.estadoGuardado() === 'guardado') return;
    this.estadoGuardado.set('guardando');
    try {
      const r = await this.botsApi.guardarFlujo(bot.id, this.nodos(), this.conexiones());
      this.problemas.set(r.problemas);
      this.bot.update((b) => (b ? { ...b, cambiosSinPublicar: true } : b));
      // Si hubo cambios mientras se guardaba, queda pendiente otra vuelta
      if (this.estadoGuardado() === 'guardando') this.estadoGuardado.set('guardado');
    } catch (e) {
      this.estadoGuardado.set('error');
      this.avisos.error(e, 'No se pudo guardar el flujo');
    }
  }

  async publicar(): Promise<ResultadoPublicar | null> {
    const bot = this.bot();
    if (!bot) return null;
    await this.guardar();
    if (this.estadoGuardado() === 'error') return null;
    this.publicando.set(true);
    try {
      const r = await this.botsApi.publicar(bot.id);
      this.bot.update((b) => (b ? { ...b, ...r.bot, borrador: b.borrador, problemas: r.problemas } : b));
      this.problemas.set(r.problemas);
      return r;
    } catch (e) {
      const error = e as ErrorApi;
      if (error.codigo === 'FLUJO_CON_ERRORES') this.problemas.set(error.detalles as Problema[]);
      this.avisos.error(e, 'No se pudo publicar');
      return null;
    } finally {
      this.publicando.set(false);
    }
  }

  private cambio(): void {
    this.estadoGuardado.set('pendiente');
    clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => void this.guardar(), AUTOGUARDADO_MS);
  }
}

const redondear = (p: Posicion): Posicion => ({ x: Math.round(p.x / 10) * 10, y: Math.round(p.y / 10) * 10 });
