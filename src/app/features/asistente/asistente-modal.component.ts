import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, output, signal } from '@angular/core';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { IconoComponent } from '../../shared/components/icono/icono.component';
import { AutoEnfocarDirective } from '../../shared/directives/auto-enfocar.directive';
import { AsistenteService } from '../../core/services/asistente/asistente.service';
import { SesionService } from '../../core/services/sesion/sesion.service';
import { TIPOS } from '../../core/flujo/tipos-de-nodo';
import { Conexion, ErrorApi, Giro, NodoFlujo, PropuestaFlujo, TipoNodo } from '../../core/models';

type Etapa = 'escribir' | 'pensando' | 'propuesta';

/** Ejemplos para no empezar con la hoja en blanco, según el tipo de negocio. */
const EJEMPLOS_CREAR: Record<Giro, string[]> = {
  tienda: ['Que vean mi catálogo, armen su pedido, me den su dirección y teléfono, y al final les confirme el pedido con un folio.'],
  restaurante: [
    'Pedidos a domicilio: que elijan del menú, den su dirección y teléfono. Si piden más de $300 el envío es gratis.',
    'Reservaciones: que elijan día y hora, cuántas personas son y a nombre de quién.',
  ],
  belleza: ['Que agenden cita eligiendo el servicio, puedan ver precios y ubicación, y si quieren hablar conmigo que los pase.'],
  salud: ['Que los pacientes agenden consulta, vean horarios y costos, y que las urgencias pasen directo con el doctor.'],
  servicios: ['Que pidan cotización contando qué necesitan, dejen nombre y teléfono, o agenden una visita a domicilio.'],
  educacion: ['Que los papás vean colegiaturas, horarios y requisitos, y dejen nombre, edad del niño y correo para que les llamemos.'],
  inmobiliaria: ['Que vean las propiedades disponibles, elijan una y dejen sus datos para agendar una visita.'],
  otro: ['Que contesten preguntas frecuentes de horarios, ubicación y precios, y que pasen con una persona si lo piden.'],
};

const EJEMPLOS_MODIFICAR = [
  'Pide también el correo antes de registrar',
  'Haz el saludo más formal',
  'Si no hay horarios, que pase con una persona',
  'Agrega una opción para ver la ubicación',
];

const MENSAJES_ESPERA = ['Leyendo lo que escribiste…', 'Eligiendo los bloques…', 'Escribiendo los mensajes del bot…', 'Conectando las flechas…', 'Revisando que no falte nada…'];

/**
 * Asistente de IA: la persona describe con sus palabras y recibe un flujo armado.
 * modo "crear": pide también el nombre del bot. modo "modificar": parte del flujo actual.
 * Nunca aplica nada solo: muestra la propuesta explicada y la persona decide.
 */
@Component({
  selector: 'app-asistente-modal',
  imports: [ModalComponent, IconoComponent, AutoEnfocarDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './asistente-modal.component.html',
  styleUrl: './asistente-modal.component.css',
})
export class AsistenteModalComponent {
  private readonly asistente = inject(AsistenteService);
  private readonly sesion = inject(SesionService);

  readonly modo = input<'crear' | 'modificar'>('crear');
  /** false cuando el bot ya existe (lienzo vacío en el editor): no se pide nombre. */
  readonly pedirNombre = input(true);
  readonly base = input<{ nodos: NodoFlujo[]; conexiones: Conexion[] } | null>(null);
  readonly aplicar = output<{ propuesta: PropuestaFlujo; nombre: string }>();
  readonly cerrar = output<void>();

  protected readonly etapa = signal<Etapa>('escribir');
  protected readonly descripcion = signal('');
  protected readonly nombre = signal('');
  protected readonly propuesta = signal<PropuestaFlujo | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly mensajeEspera = signal(MENSAJES_ESPERA[0]);
  protected readonly aplicando = signal(false);

  protected readonly ejemplos = computed(() =>
    this.modo() === 'crear' ? EJEMPLOS_CREAR[this.sesion.empresa()?.giro ?? 'otro'] ?? EJEMPLOS_CREAR.otro : EJEMPLOS_MODIFICAR,
  );
  protected readonly titulo = computed(() => (this.modo() === 'crear' ? 'Crear bot con el asistente' : 'Pedir cambios al asistente'));
  protected readonly puedeGenerar = computed(() => this.descripcion().trim().length >= 10 && (!this.necesitaNombre() || this.nombre().trim().length > 0));
  protected readonly necesitaNombre = computed(() => this.modo() === 'crear' && this.pedirNombre());

  /** "Menú ×2, Pregunta ×3…" para que se entienda qué armó sin leer el lienzo. */
  protected readonly bloques = computed(() => {
    const cuenta = new Map<TipoNodo, number>();
    for (const n of this.propuesta()?.nodos ?? []) cuenta.set(n.tipo, (cuenta.get(n.tipo) ?? 0) + 1);
    return [...cuenta].map(([tipo, veces]) => ({ ...TIPOS[tipo], veces }));
  });
  protected readonly avisos = computed(() => (this.propuesta()?.problemas ?? []).filter((p) => p.nivel === 'aviso'));
  protected readonly errores = computed(() => (this.propuesta()?.problemas ?? []).filter((p) => p.nivel === 'error'));

  private rotacion: ReturnType<typeof setInterval> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearInterval(this.rotacion));
  }

  protected escribir(campo: 'descripcion' | 'nombre', evento: Event): void {
    this[campo].set((evento.target as HTMLInputElement).value);
  }

  protected usarEjemplo(texto: string): void {
    this.descripcion.set(texto);
  }

  protected async generar(): Promise<void> {
    if (!this.puedeGenerar()) return;
    this.error.set(null);
    this.etapa.set('pensando');
    let i = 0;
    this.mensajeEspera.set(MENSAJES_ESPERA[0]);
    this.rotacion = setInterval(() => this.mensajeEspera.set(MENSAJES_ESPERA[++i % MENSAJES_ESPERA.length]), 3500);
    try {
      const base = this.modo() === 'modificar' ? (this.base() ?? undefined) : undefined;
      this.propuesta.set(await this.asistente.generar(this.descripcion().trim(), base));
      this.etapa.set('propuesta');
    } catch (e) {
      this.error.set((e as ErrorApi).mensaje ?? 'No se pudo generar el flujo');
      this.etapa.set('escribir');
    } finally {
      clearInterval(this.rotacion);
    }
  }

  protected otraVez(): void {
    this.etapa.set('escribir');
  }

  protected confirmar(): void {
    const propuesta = this.propuesta();
    if (!propuesta) return;
    this.aplicando.set(true);
    this.aplicar.emit({ propuesta, nombre: this.nombre().trim() });
  }
}
