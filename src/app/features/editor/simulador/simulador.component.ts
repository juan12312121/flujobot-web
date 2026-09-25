import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { EditorStore, MS_POR_PASO, Velocidad } from '../editor.store';
import { BotsService } from '../../../core/services/bots/bots.service';
import { AvisosService } from '../../../core/services/avisos/avisos.service';
import { ItemCarrito, PasoRecorrido, ResultadoSimulacion, RespuestaBot, Sugerencia } from '../../../core/models';
import { TIPOS } from '../../../core/flujo/tipos-de-nodo';
import { DineroPipe } from '../../../shared/pipes/dinero.pipe';
import { IconoComponent } from '../../../shared/components/icono/icono.component';

interface Burbuja {
  de: 'yo' | 'bot' | 'sistema';
  texto: string;
  url?: string;
}

/** Cuántos mensajes manda como máximo la demostración automática. */
const MAX_MENSAJES_DEMO = 14;

/** Formato de WhatsApp (*negritas*, _cursivas_, ~tachado~) a HTML seguro. */
function formatoWhatsApp(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*([^*\n]+)\*/g, '<b>$1</b>')
    .replace(/(^|\s)_([^_\n]+)_/g, '$1<i>$2</i>')
    .replace(/~([^~\n]+)~/g, '<s>$1</s>')
    .replace(/\n/g, '<br>');
}

const esperar = (ms: number) => new Promise<void>((listo) => setTimeout(listo, ms));

/**
 * Simulador del editor: corre el BORRADOR en el servidor (el mismo motor que WhatsApp) y
 * reproduce el recorrido paso a paso. Mientras tanto el lienzo ilumina cada bloque, anima la
 * flecha que toma y el narrador explica qué pasa, para que cualquiera entienda su flujo.
 */
@Component({
  selector: 'app-simulador',
  imports: [IconoComponent, JsonPipe, DineroPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './simulador.component.html',
  styleUrl: './simulador.component.css',
})
export class SimuladorComponent {
  protected readonly store = inject(EditorStore);
  private readonly bots = inject(BotsService);
  private readonly avisos = inject(AvisosService);
  private readonly lista = viewChild<ElementRef<HTMLElement>>('lista');
  private readonly listaPasos = viewChild<ElementRef<HTMLElement>>('listaPasos');

  protected readonly tipos = TIPOS;
  protected readonly formato = formatoWhatsApp;
  protected readonly velocidades: { valor: Velocidad; texto: string }[] = [
    { valor: 'lento', texto: 'Lento' },
    { valor: 'normal', texto: 'Normal' },
    { valor: 'rapido', texto: 'Rápido' },
    { valor: 'instantaneo', texto: 'Sin animación' },
  ];

  protected readonly burbujas = signal<Burbuja[]>([]);
  protected readonly pasos = signal<PasoRecorrido[]>([]);
  protected readonly sugerencias = signal<Sugerencia[]>([]);
  protected readonly ocupado = signal(false);
  protected readonly escribiendo = signal(false);
  protected readonly enDemo = signal(false);
  protected readonly variables = signal<Record<string, unknown>>({});
  protected readonly carrito = signal<ItemCarrito[]>([]);
  protected readonly estado = signal<string>('nueva');
  protected readonly borrador = signal('');
  private detenerDemo = false;
  private destruido = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.destruido = true;
      this.store.limpiarSimulacion();
    });
    this.sugerencias.set(this.sugerenciasIniciales());
  }

  // ───── Conversación ─────

  protected async enviar(texto = this.borrador()): Promise<ResultadoSimulacion | null> {
    const bot = this.store.bot();
    texto = texto.trim();
    if (!bot || !texto || this.ocupado()) return null;
    this.borrador.set('');
    this.ocupado.set(true);
    // Una conversación nueva empieza con el lienzo limpio (sin el camino de la anterior)
    if (this.estado() !== 'activa') this.store.visitados.set({ nodos: [], flechas: [] });
    this.agregar({ de: 'yo', texto });
    try {
      await this.store.guardar();
      const r = await this.bots.simular(bot.id, texto);
      await this.reproducir(r);
      this.variables.set(Object.fromEntries(Object.entries(r.variables ?? {}).filter(([k]) => !k.startsWith('_'))));
      this.carrito.set(r.carrito ?? []);
      this.estado.set(r.estado);
      this.sugerencias.set(r.sugerencias?.length ? r.sugerencias : this.sugerenciasIniciales());
      this.store.nodoSimulado.set(r.nodoActual);
      return r;
    } catch (e) {
      this.avisos.error(e);
      this.agregar({ de: 'sistema', texto: 'No se pudo simular el mensaje.' });
      return null;
    } finally {
      this.ocupado.set(false);
    }
  }

  /**
   * Muestra el recorrido paso a paso: ilumina el bloque en el lienzo, narra lo que pasó
   * y suelta en el chat los mensajes que produjo ese paso.
   */
  private async reproducir(r: ResultadoSimulacion): Promise<void> {
    const ms = MS_POR_PASO[this.store.velocidad()];
    const recorrido = r.recorrido ?? [];
    if (recorrido.length === 0 && r.respuestas.length === 0) this.agregar({ de: 'sistema', texto: this.silencio(r.estado) });

    for (const [i, paso] of recorrido.entries()) {
      if (this.destruido) return;
      this.store.pasoActivo.set(paso);
      this.store.marcarVisita(paso);
      this.pasos.update((l) => [...l, paso]);
      this.desplazar(this.listaPasos());

      const mensajes = r.respuestas.filter((m) => (m.paso ?? recorrido.length - 1) === i);
      if (mensajes.length && ms) {
        this.escribiendo.set(true);
        await esperar(ms * 0.45);
        this.escribiendo.set(false);
      }
      for (const m of mensajes) this.agregar(this.aBurbuja(m));
      if (paso.error && !mensajes.length) this.agregar({ de: 'sistema', texto: paso.texto });
      if (ms) await esperar(mensajes.length ? ms * 0.55 : ms);
    }
    // El narrador se queda mostrando el último paso un momento
    if (ms) await esperar(Math.min(ms, 900));
    this.store.pasoActivo.set(null);
  }

  protected async reiniciar(): Promise<void> {
    const bot = this.store.bot();
    if (!bot) return;
    this.detenerDemo = true;
    await this.bots.reiniciarSimulador(bot.id).catch((e) => this.avisos.error(e));
    this.burbujas.set([]);
    this.pasos.set([]);
    this.variables.set({});
    this.carrito.set([]);
    this.estado.set('nueva');
    this.sugerencias.set(this.sugerenciasIniciales());
    this.store.limpiarSimulacion();
  }

  /**
   * Demostración automática: el "cliente" contesta solo con las sugerencias hasta que la
   * conversación termina. Si vuelve a un mismo bloque, elige otra opción para no dar vueltas.
   */
  protected async demostrar(): Promise<void> {
    if (this.enDemo()) {
      this.detenerDemo = true;
      return;
    }
    await this.reiniciar();
    this.detenerDemo = false;
    this.enDemo.set(true);
    const vecesPorBloque = new Map<string, number>();
    try {
      for (let i = 0; i < MAX_MENSAJES_DEMO && !this.detenerDemo && !this.destruido; i++) {
        const nodo = this.store.nodoSimulado() ?? 'inicio';
        const veces = vecesPorBloque.get(nodo) ?? 0;
        vecesPorBloque.set(nodo, veces + 1);
        const opciones = this.sugerencias();
        const eleccion = opciones[veces % Math.max(opciones.length, 1)];
        if (!eleccion) break;
        const r = await this.enviar(eleccion.texto);
        if (!r || r.estado === 'terminada' || r.estado === 'humano') break;
        await esperar(MS_POR_PASO[this.store.velocidad()] * 0.6);
      }
    } finally {
      this.enDemo.set(false);
    }
  }

  protected irAPaso(paso: PasoRecorrido): void {
    this.store.seleccionar(paso.nodoId);
  }

  protected alTeclear(evento: KeyboardEvent): void {
    if (evento.key === 'Enter' && !evento.shiftKey) {
      evento.preventDefault();
      void this.enviar();
    }
  }

  protected escribir(evento: Event): void {
    this.borrador.set((evento.target as HTMLTextAreaElement).value);
  }

  protected cambiarVelocidad(evento: Event): void {
    this.store.velocidad.set((evento.target as HTMLSelectElement).value as Velocidad);
  }

  // ───── Apoyo ─────

  private sugerenciasIniciales(): Sugerencia[] {
    const inicio = this.store.nodos().find((n) => n.tipo === 'inicio');
    const palabra = inicio?.datos.palabrasClave?.[0] ?? 'hola';
    return [{ texto: palabra, etiqueta: `Escribir "${palabra}"` }];
  }

  private silencio(estado: string): string {
    if (estado === 'humano') return 'El bot no contesta: la conversación está con una persona. Reinicia para volver a probar.';
    return 'El bot no contestó.';
  }

  private aBurbuja(r: RespuestaBot): Burbuja {
    return { de: 'bot', texto: r.texto ?? '', url: r.tipo === 'imagen' ? r.url : undefined };
  }

  private agregar(b: Burbuja): void {
    this.burbujas.update((l) => [...l, b]);
    this.desplazar(this.lista());
  }

  private desplazar(ref: ElementRef<HTMLElement> | undefined): void {
    queueMicrotask(() => setTimeout(() => ref?.nativeElement.scrollTo({ top: 1e6, behavior: 'smooth' })));
  }
}
