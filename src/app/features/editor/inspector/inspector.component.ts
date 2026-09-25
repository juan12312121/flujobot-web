import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { EditorStore } from '../editor.store';
import { SesionService } from '../../../core/services/sesion/sesion.service';
import { TareaN8nComponent } from '../tarea-n8n/tarea-n8n.component';
import { nuevoId, TIPOS } from '../../../core/flujo/tipos-de-nodo';
import { DatosNodo, OpcionMenu } from '../../../core/models';
import { IconoComponent } from '../../../shared/components/icono/icono.component';
import { SubirImagenComponent } from '../../../shared/components/subir-imagen/subir-imagen.component';

const VARIABLES_BASE = ['nombre', 'telefono', 'empresa', 'opcion', 'producto.nombre', 'producto.precio', 'cantidad', 'total', 'folio', 'cita.fecha', 'cita.hora', 'cita.folio'];

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
