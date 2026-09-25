import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { AsistenteService } from '../../../core/services/asistente/asistente.service';
import { AvisosService } from '../../../core/services/avisos/avisos.service';
import { EditorStore } from '../editor.store';
import { AccionTarea, ErrorApi, PropuestaTarea, TareaPublicada } from '../../../core/models';
import { NombreIcono } from '../../../core/iconos/iconos';
import { IconoComponent } from '../../../shared/components/icono/icono.component';

type Etapa = 'inicio' | 'escribir' | 'pensando' | 'propuesta' | 'publicando' | 'lista';

const EJEMPLOS = [
  'Mándame un correo a ventas@minegocio.com con los datos del pedido',
  'Guarda cada cita en mi hoja de Google Sheets con fecha, nombre y teléfono',
  'Avisa a mi sistema de inventario con el folio y los productos',
];

/**
 * Dentro del bloque "Tarea en n8n": la persona describe la tarea ("avísame por correo…"),
 * el asistente propone acciones, y al aceptarlas se crea el workflow en n8n y su URL queda en el bloque.
 */
@Component({
  selector: 'app-tarea-n8n',
  imports: [IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tarea-n8n.component.html',
  styleUrl: './tarea-n8n.component.css',
})
export class TareaN8nComponent {
  private readonly asistente = inject(AsistenteService);
  private readonly avisos = inject(AvisosService);
  private readonly store = inject(EditorStore);

  /** URL del webhook de la tarea creada (para ponerla en el bloque). */
  readonly usarUrl = output<string>();

  protected readonly ejemplos = EJEMPLOS;
  protected readonly etapa = signal<Etapa>('inicio');
  protected readonly descripcion = signal('');
  protected readonly propuesta = signal<PropuestaTarea | null>(null);
  protected readonly publicada = signal<TareaPublicada | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly puedeGenerar = computed(() => this.descripcion().trim().length >= 10);

  protected escribir(evento: Event): void {
    this.descripcion.set((evento.target as HTMLTextAreaElement).value);
  }

  protected async generar(): Promise<void> {
    if (!this.puedeGenerar()) return;
    this.error.set(null);
    this.etapa.set('pensando');
    try {
      this.propuesta.set(await this.asistente.tarea(this.descripcion().trim(), { nodos: this.store.nodos(), conexiones: this.store.conexiones() }));
      this.etapa.set('propuesta');
    } catch (e) {
      this.error.set((e as ErrorApi).mensaje ?? 'No se pudo armar la tarea');
      this.etapa.set('escribir');
    }
  }

  protected async crear(): Promise<void> {
    const propuesta = this.propuesta();
    if (!propuesta) return;
    this.etapa.set('publicando');
    try {
      const r = await this.asistente.publicarTarea(propuesta);
      this.publicada.set(r);
      this.usarUrl.emit(r.url);
      this.etapa.set('lista');
      this.avisos.exito(r.modo === 'n8n' ? 'Tarea creada en n8n y conectada al bloque' : 'Tarea lista: descárgala e impórtala en tu n8n');
    } catch (e) {
      this.avisos.error(e, 'No se pudo crear la tarea en n8n');
      this.etapa.set('propuesta');
    }
  }

  protected descargar(): void {
    const r = this.publicada();
    if (!r) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(r.workflow, null, 2)], { type: 'application/json' }));
    Object.assign(document.createElement('a'), { href: url, download: 'tarea-n8n.json' }).click();
    URL.revokeObjectURL(url);
  }

  protected reiniciar(): void {
    this.propuesta.set(null);
    this.publicada.set(null);
    this.etapa.set('escribir');
  }

  /** Cómo se lee cada acción para alguien sin experiencia. */
  protected describir(a: AccionTarea): { icono: NombreIcono; titulo: string; detalle: string } {
    switch (a.tipo) {
      case 'correo':
        return { icono: 'mensaje', titulo: `Mandar un correo${a.para ? ` a ${a.para}` : ''}`, detalle: a.asunto };
      case 'hoja':
        return { icono: 'rejilla', titulo: 'Agregar una fila en Google Sheets', detalle: `Columnas: ${Object.keys(a.columnas).join(', ')}` };
      case 'http':
        return { icono: 'rayo', titulo: 'Avisar a otro sistema', detalle: a.url || 'falta la dirección del sistema' };
    }
  }
}
