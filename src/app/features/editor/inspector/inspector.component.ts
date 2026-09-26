import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ModulosService } from '../../../core/services/modulos/modulos.service';
import { EditorStore } from '../editor.store';
import { SesionService } from '../../../core/services/sesion/sesion.service';
import { TareaN8nComponent } from '../tarea-n8n/tarea-n8n.component';
import { nuevoId, TIPOS } from '../../../core/flujo/tipos-de-nodo';
import { DatosNodo, OpcionMenu } from '../../../core/models';
import { IconoComponent } from '../../../shared/components/icono/icono.component';
import { SubirImagenComponent } from '../../../shared/components/subir-imagen/subir-imagen.component';

const VARIABLES_BASE = [
  'nombre',
  'telefono',
  'empresa',
  'opcion',
  'producto.nombre',
  'producto.precio',
  'cantidad',
  'total',
  'folio',
  'linkPago',
  'cita.fecha',
  'cita.hora',
  'cita.folio',
  'respuesta',
  'calificacion',
];

/** Formulario del bloque seleccionado. Cada cambio va directo al store (y de ahí al autoguardado). */
@Component({
  selector: 'app-inspector',
  imports: [TareaN8nComponent, IconoComponent, SubirImagenComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inspector.component.html',
  styleUrl: './inspector.component.css',
})
export class InspectorComponent {
  protected readonly store = inject(EditorStore);
  protected readonly nodo = this.store.seleccionado;
  protected readonly terminos = inject(SesionService).terminos;
  protected readonly tipo = computed(() => (this.nodo() ? TIPOS[this.nodo()!.tipo] : null));
  protected readonly problemas = computed(() => this.store.problemas().filter((p) => p.nodoId === this.nodo()?.id));
  private readonly modulosApi = inject(ModulosService);
  protected readonly modulos = this.modulosApi.lista;
  protected readonly ejemploVariable = 'Ej. {{vehiculo}}';
  protected readonly moduloDelBloque = computed(() => this.modulos().find((m) => m.id === this.nodo()?.datos.moduloId) ?? null);

  constructor() {
    this.modulosApi.cargar().catch(() => {});
  }

  /** Variables que se pueden usar con {{ }}: las del sistema + las que guardan las preguntas del flujo. */
  protected readonly variables = computed(() => {
    const propias = this.store
      .nodos()
      .filter((n) => n.tipo === 'pregunta' && n.datos.variable)
      .map((n) => n.datos.variable!);
    return [...new Set([...VARIABLES_BASE, ...propias])];
  });

  protected cambiar(campo: keyof DatosNodo, valor: unknown): void {
    const n = this.nodo();
    if (n) this.store.actualizarDatos(n.id, { [campo]: valor });
  }

  protected texto(campo: keyof DatosNodo, evento: Event): void {
    this.cambiar(campo, (evento.target as HTMLInputElement).value);
  }

  protected numero(campo: keyof DatosNodo, evento: Event): void {
    const v = Number((evento.target as HTMLInputElement).value);
    this.cambiar(campo, Number.isFinite(v) && v > 0 ? v : undefined);
  }

  protected lista(campo: keyof DatosNodo, evento: Event): void {
    const valores = (evento.target as HTMLInputElement).value
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    this.cambiar(campo, valores);
  }

  protected casilla(campo: keyof DatosNodo, evento: Event): void {
    this.cambiar(campo, (evento.target as HTMLInputElement).checked);
  }

  // ───── Guardar en módulo / Consultar módulo ─────

  protected campoRegistro(campoId: string, evento: Event): void {
    const valor = (evento.target as HTMLInputElement).value.trim();
    const { [campoId]: _, ...resto } = this.nodo()?.datos.campos ?? {};
    this.cambiar('campos', valor ? { ...resto, [campoId]: valor } : resto);
  }

  /** Sin selección propia se muestran los campos "en tabla" del módulo. */
  protected mostrarCampo(campoId: string, enLista: boolean): boolean {
    const lista = this.nodo()?.datos.mostrar;
    return lista?.length ? lista.includes(campoId) : enLista;
  }

  protected alternarMostrar(campoId: string, evento: Event): void {
    const m = this.moduloDelBloque();
    if (!m) return;
    const actual = m.campos.filter((c) => this.mostrarCampo(c.id, c.enLista)).map((c) => c.id);
    const activo = (evento.target as HTMLInputElement).checked;
    this.cambiar('mostrar', activo ? [...new Set([...actual, campoId])] : actual.filter((id) => id !== campoId));
  }

  // ───── Esperar: se guarda en minutos, se edita en minutos / horas / días ─────

  protected esperaUnidad(): string {
    const m = this.nodo()?.datos.minutos ?? 60;
    return m % 1440 === 0 ? '1440' : m % 60 === 0 ? '60' : '1';
  }

  protected esperaValor(): number {
    return (this.nodo()?.datos.minutos ?? 60) / Number(this.esperaUnidad());
  }

  protected cambiarEspera(valor: number | string, unidad: string): void {
    const minutos = Math.round(Number(valor) * Number(unidad));
    if (Number.isFinite(minutos) && minutos >= 1) this.cambiar('minutos', Math.min(minutos, 7 * 1440));
  }

  // ───── Opciones del menú ─────

  protected opciones(): OpcionMenu[] {
    return this.nodo()?.datos.opciones ?? [];
  }

  protected editarOpcion(indice: number, evento: Event): void {
    const etiqueta = (evento.target as HTMLInputElement).value;
    this.cambiar('opciones', this.opciones().map((o, i) => (i === indice ? { ...o, etiqueta } : o)));
  }

  protected agregarOpcion(): void {
    this.cambiar('opciones', [...this.opciones(), { id: nuevoId('op'), etiqueta: `Opción ${this.opciones().length + 1}` }]);
  }

  protected quitarOpcion(indice: number): void {
    this.cambiar('opciones', this.opciones().filter((_, i) => i !== indice));
  }

  protected moverOpcion(indice: number, delta: number): void {
    const l = [...this.opciones()];
    const destino = indice + delta;
    if (destino < 0 || destino >= l.length) return;
    [l[indice], l[destino]] = [l[destino], l[indice]];
    this.cambiar('opciones', l);
  }

  protected borrar(): void {
    const n = this.nodo();
    if (n && confirm(`¿Borrar el bloque "${TIPOS[n.tipo].nombre}"?`)) this.store.borrarNodo(n.id);
  }
}
