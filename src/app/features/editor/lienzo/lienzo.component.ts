import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, effect, ElementRef, inject, untracked, viewChild } from '@angular/core';
import { dia, linkTools } from '@joint/core';
import { EditorStore } from '../editor.store';
import { crearFlecha, crearNodo, NAMESPACE, pintarNodo, pintarResultado, pintarResultadoFlecha, ANCHO } from './forma-nodo';
import { TipoNodo } from '../../../core/models';
import { TIPOS } from '../../../core/flujo/tipos-de-nodo';
import { IconoComponent } from '../../../shared/components/icono/icono.component';

const ZOOM_MIN = 0.3;
const ZOOM_MAX = 1.8;

/** Grupo de puerto ('in' | 'out') del iman sobre el que se suelta o arrastra una flecha. */
const grupoDe = (iman: SVGElement | null | undefined) => iman?.closest('[port-group]')?.getAttribute('port-group') ?? null;

/**
 * Lienzo de JointJS. Dibuja lo que hay en el EditorStore y le reporta lo que hace la persona:
 * soltar un bloque de la paleta, moverlo, conectar/desconectar flechas, seleccionar.
 * No guarda estado propio del flujo: si el store cambia, el lienzo se re-sincroniza.
 */
@Component({
  selector: 'app-lienzo',
  imports: [IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(dragover)': 'alArrastrarEncima($event)', '(drop)': 'alSoltar($event)' },
  templateUrl: './lienzo.component.html',
  styleUrl: './lienzo.component.css',
})
export class LienzoComponent {
  private readonly store = inject(EditorStore);
  /** Paso que narra el cartel inferior mientras se anima la simulación. */
  protected readonly paso = this.store.pasoActivo;
  protected readonly tipos = TIPOS;
  protected readonly resultados = this.store.resultados;
  private readonly contenedor = viewChild.required<ElementRef<HTMLDivElement>>('papel');
  private readonly graph = new dia.Graph({}, { cellNamespace: NAMESPACE });
  private paper?: dia.Paper;
  /** true mientras el lienzo se ajusta al store: sus propios cambios no se reportan de vuelta. */
  private sincronizando = false;

  constructor() {
    afterNextRender(() => {
      this.crearPapel();
      this.sincronizar();
      this.ajustar();
    });

    effect(() => {
      this.store.nodos();
      this.store.conexiones();
      this.store.problemasPorNodo();
      this.store.seleccionadoId();
      this.store.nodoSimulado();
      this.store.pasoActivo();
      this.store.visitados();
      this.store.resultados();
      untracked(() => this.sincronizar());
    });

    // Durante la simulación, el lienzo sigue al bloque que está actuando
    effect(() => {
      const paso = this.store.pasoActivo();
      if (paso) untracked(() => this.seguir(paso.nodoId));
    });

    inject(DestroyRef).onDestroy(() => {
      this.paper?.remove();
      this.graph.clear();
    });
  }

  // ───── API para la página ─────

  ajustar(): void {
    if (!this.paper || this.graph.getElements().length === 0) return;
    this.paper.transformToFitContent({ padding: 60, maxScale: 1, minScale: ZOOM_MIN, verticalAlign: 'middle', horizontalAlign: 'middle' });
  }

  zoom(factor: number, punto?: { x: number; y: number }): void {
    if (!this.paper) return;
    const { sx } = this.paper.scale();
    const nuevo = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, sx * factor));
    const { width, height } = this.contenedor().nativeElement.getBoundingClientRect();
    // Mantener fijo el punto bajo el cursor (o el centro de la pantalla)
    const local = punto ?? this.paper.clientToLocalPoint(this.contenedor().nativeElement.getBoundingClientRect().left + width / 2, this.contenedor().nativeElement.getBoundingClientRect().top + height / 2);
    const { tx, ty } = this.paper.translate();
    this.paper.scale(nuevo, nuevo);
    this.paper.translate(tx + local.x * (sx - nuevo), ty + local.y * (sx - nuevo));
  }

  /** Centro visible del lienzo en coordenadas del flujo (para agregar bloques con clic). */
  centroVisible(): { x: number; y: number } {
    const r = this.contenedor().nativeElement.getBoundingClientRect();
    const p = this.paper?.clientToLocalPoint(r.left + r.width / 2, r.top + r.height / 2) ?? { x: 200, y: 200 };
    return { x: p.x - ANCHO / 2 + (Math.random() * 40 - 20), y: p.y - 40 + (Math.random() * 40 - 20) };
  }

  // ───── Soltar bloques de la paleta ─────

  protected alArrastrarEncima(evento: DragEvent): void {
    if (evento.dataTransfer?.types.includes('application/x-flujobot-tipo')) {
      evento.preventDefault();
      evento.dataTransfer.dropEffect = 'copy';
    }
  }

  protected alSoltar(evento: DragEvent): void {
    const tipo = evento.dataTransfer?.getData('application/x-flujobot-tipo') as TipoNodo | undefined;
    if (!tipo || !TIPOS[tipo] || !this.paper) return;
    evento.preventDefault();
    const p = this.paper.clientToLocalPoint(evento.clientX, evento.clientY);
    this.store.agregarNodo(tipo, { x: p.x - ANCHO / 2, y: p.y - 20 });
  }

  // ───── JointJS ─────

  private crearPapel(): void {
    const paper = new dia.Paper({
      el: this.contenedor().nativeElement,
      model: this.graph,
      cellViewNamespace: NAMESPACE,
      width: '100%',
      height: '100%',
      gridSize: 10,
      drawGrid: { name: 'dot', args: { color: '#cfd4dc', thickness: 1.2 } },
      background: { color: '#f7f8fa' },
      defaultLink: () => crearFlecha(),
      defaultConnector: { name: 'curve' },
      linkPinning: false,
      snapLinks: { radius: 28 },
      markAvailable: true,
      interactive: { linkMove: false, labelMove: false },
      validateMagnet: (_vista, iman) => grupoDe(iman) === 'out',
      validateConnection: (vistaOrigen, imanOrigen, vistaDestino, imanDestino) =>
        vistaOrigen !== vistaDestino && grupoDe(imanOrigen) === 'out' && grupoDe(imanDestino) === 'in',
    });
    this.paper = paper;

    paper.on('element:pointerclick', (vista: dia.ElementView) => this.store.seleccionar(String(vista.model.id)));
    paper.on('blank:pointerclick', () => this.store.seleccionar(null));
    paper.on('element:pointerup', (vista: dia.ElementView) => {
      const { x, y } = vista.model.position();
      this.store.moverNodo(String(vista.model.id), { x, y });
    });

    // Flecha nueva: la persona soltó el extremo sobre una entrada válida
    paper.on('link:connect', (vista: dia.LinkView) => {
      const link = vista.model;
      const origen = link.source();
      const destino = link.target();
      if (!origen.id || !origen.port || !destino.id) return;
      // Una salida → un destino: quitar flechas previas de esa misma salida
      for (const otro of this.graph.getConnectedLinks(link.getSourceElement()!, { outbound: true })) {
        if (otro !== link && otro.source().port === origen.port) otro.remove();
      }
      this.store.conectar({ id: String(link.id), origen: String(origen.id), puerto: String(origen.port), destino: String(destino.id) });
    });

    // Flecha borrada (con la herramienta ×): avisar al store
    this.graph.on('remove', (celda: dia.Cell) => {
      if (!this.sincronizando && celda.isLink()) this.store.desconectar(String(celda.id));
    });

    paper.on('link:mouseenter', (vista: dia.LinkView) => {
      vista.addTools(new dia.ToolsView({ tools: [new linkTools.Remove({ distance: '50%', offset: 0 })] }));
    });
    paper.on('link:mouseleave', (vista: dia.LinkView) => vista.removeTools());

    // Zoom con la rueda y paneo arrastrando el fondo
    const rueda = (evento: dia.Event, x: number, y: number, delta: number) => {
      evento.preventDefault();
      this.zoom(delta > 0 ? 1.1 : 1 / 1.1, { x, y });
    };
    paper.on('blank:mousewheel', rueda);
    paper.on('cell:mousewheel', (_vista: dia.CellView, evento: dia.Event, x: number, y: number, delta: number) => rueda(evento, x, y, delta));
    paper.on('blank:pointerdown', (evento: dia.Event) => this.panear(evento));
  }

  private panear(evento: dia.Event): void {
    const paper = this.paper!;
    const inicio = { x: evento.clientX ?? 0, y: evento.clientY ?? 0, ...paper.translate() };
    const mover = (e: PointerEvent) => paper.translate(inicio.tx + e.clientX - inicio.x, inicio.ty + e.clientY - inicio.y);
    const soltar = () => {
      document.removeEventListener('pointermove', mover);
      document.removeEventListener('pointerup', soltar);
    };
    document.addEventListener('pointermove', mover);
    document.addEventListener('pointerup', soltar);
  }

  /** Ajusta el grafo de JointJS a lo que dice el store (sin reportar esos cambios de vuelta). */
  private sincronizar(): void {
    if (!this.paper) return;
    const nodos = this.store.nodos();
    const conexiones = this.store.conexiones();
    const problemas = this.store.problemasPorNodo();
    const seleccionado = this.store.seleccionadoId();
    const simulado = this.store.nodoSimulado();
    const activo = this.store.pasoActivo();
    const visitados = this.store.visitados();

    this.sincronizando = true;
    try {
      // 1. Flechas que ya no existen (antes de tocar puertos)
      const idsConexion = new Set(conexiones.map((c) => c.id));
      for (const link of this.graph.getLinks()) if (!idsConexion.has(String(link.id)) && link.target().id) link.remove();

      // 2. Bloques: crear, actualizar, borrar
      const sobrantes = new Map(this.graph.getElements().map((e) => [String(e.id), e]));
      for (const nodo of nodos) {
        const el = sobrantes.get(nodo.id);
        if (el) {
          pintarNodo(el, nodo);
          sobrantes.delete(nodo.id);
        } else {
          this.graph.addCell(crearNodo(nodo));
        }
      }
      for (const el of sobrantes.values()) el.remove();

      // 3. Flechas nuevas (p. ej. al cargar)
      for (const c of conexiones) {
        const origen = this.graph.getCell(c.origen) as dia.Element | undefined;
        if (this.graph.getCell(c.id) || !origen?.hasPort(c.puerto) || !this.graph.getCell(c.destino)) continue;
        this.graph.addCell(crearFlecha(c));
      }

      // 4. Resaltados de bloques: seleccionado, errores y la simulación (activo, visitado, esperando)
      const primario = getComputedStyle(document.documentElement).getPropertyValue('--primario').trim() || '#12a150';
      const tinte = aclarar(primario, 0.1);
      const visitadosNodos = new Set(visitados.nodos);
      for (const el of this.graph.getElements()) {
        const id = String(el.id);
        const problema = problemas.get(id);
        const esActivo = activo?.nodoId === id;
        const borde = esActivo
          ? activo.error ? '#d92d20' : primario
          : id === seleccionado ? primario
          : problema === 'error' ? '#d92d20'
          : problema === 'aviso' ? '#f79009'
          : visitadosNodos.has(id) ? primario
          : '#d0d5dd';
        el.attr('cuerpo', {
          stroke: borde,
          strokeWidth: esActivo ? 3.5 : id === seleccionado || problema ? 2.5 : visitadosNodos.has(id) ? 2 : 1.5,
          fill: esActivo || id === simulado ? tinte : '#fff',
          strokeDasharray: id === simulado && !esActivo ? '6 3' : null,
        });
        this.paper.findViewByModel(el)?.el.classList.toggle('bloque-activo', esActivo);
      }

      // 5. Flechas: la que se está tomando se anima; las ya recorridas quedan del color de la empresa
      const visitadasFlechas = new Set(visitados.flechas);
      const flechaActiva = activo?.puerto ? `${activo.nodoId}|${activo.puerto}` : null;
      for (const link of this.graph.getLinks()) {
        const { id: origen, port } = link.source();
        const clave = `${origen}|${port}`;
        const esActiva = clave === flechaActiva;
        const recorrida = visitadasFlechas.has(clave);
        link.attr('line', {
          stroke: esActiva || recorrida ? primario : '#98a2b3',
          strokeWidth: esActiva ? 3.5 : recorrida ? 2.5 : 2,
        });
        this.paper.findViewByModel(link)?.el.classList.toggle('flecha-activa', esActiva);
      }

      // 6. "Ver resultados": números sobre bloques y flechas (encima de todo lo anterior)
      const r = this.store.resultados();
      const maximo = r ? Math.max(1, ...Object.values(r.flechas)) : 0;
      for (const el of this.graph.getElements()) {
        const id = String(el.id);
        pintarResultado(el, r ? { llegaron: r.nodos[id] ?? 0, abandonos: r.abandonos[id] ?? 0, enCurso: r.enCurso[id] ?? 0 } : null);
      }
      for (const link of this.graph.getLinks()) {
        const { id: origen, port } = link.source();
        pintarResultadoFlecha(link, r ? (r.flechas[`${origen}|${port}`] ?? 0) : null, maximo, primario);
      }
    } finally {
      this.sincronizando = false;
    }
  }

  /** Si el bloque que se está animando quedó fuera de la vista, mueve el lienzo suavemente hacia él. */
  private seguir(nodoId: string): void {
    const vista = this.paper?.findViewByModel(nodoId);
    if (!vista || !this.paper) return;
    const marco = this.contenedor().nativeElement.getBoundingClientRect();
    const caja = vista.el.getBoundingClientRect();
    const margen = 40;
    const visible =
      caja.left >= marco.left + margen && caja.right <= marco.right - margen && caja.top >= marco.top + margen && caja.bottom <= marco.bottom - margen;
    if (visible) return;

    const dx = marco.left + marco.width / 2 - (caja.left + caja.width / 2);
    const dy = marco.top + marco.height / 2 - (caja.top + caja.height / 2);
    const { tx, ty } = this.paper.translate();
    const inicio = performance.now();
    const duracion = 350;
    const mover = (ahora: number) => {
      const t = Math.min(1, (ahora - inicio) / duracion);
      const suave = 1 - (1 - t) ** 3;
      this.paper?.translate(tx + dx * suave, ty + dy * suave);
      if (t < 1) requestAnimationFrame(mover);
    };
    requestAnimationFrame(mover);
  }
}

/** Mezcla un color #RRGGBB con blanco (cantidad = proporción del color). */
function aclarar(hex: string, cantidad: number): string {
  const canal = (i: number) => Math.round(parseInt(hex.slice(i, i + 2), 16) * cantidad + 255 * (1 - cantidad));
  return /^#[0-9a-f]{6}$/i.test(hex) ? `rgb(${canal(1)}, ${canal(3)}, ${canal(5)})` : '#f0fdf4';
}
