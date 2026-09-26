import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ModulosService } from '../../core/services/modulos/modulos.service';
import { AvisosService } from '../../core/services/avisos/avisos.service';
import { SesionService } from '../../core/services/sesion/sesion.service';
import { CampoModulo, Modulo, RegistroModulo } from '../../core/models';
import { ICONOS, NombreIcono } from '../../core/iconos/iconos';
import { IconoComponent } from '../../shared/components/icono/icono.component';
import { RegistroFormComponent } from './registro-form/registro-form.component';
import { valorLegible } from './valores';

const CANALES: Record<string, string> = { panel: 'Panel', whatsapp: 'WhatsApp', web: 'Chat web', telegram: 'Telegram', messenger: 'Messenger', instagram: 'Instagram' };

/**
 * Pantalla de un módulo personalizado (/m/:clave): tabla de registros con búsqueda, filtro por
 * un campo de opciones (p. ej. Estado) y alta/edición con un formulario armado a partir de los campos.
 */
@Component({
  selector: 'app-modulo',
  imports: [DatePipe, IconoComponent, RegistroFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './modulo.page.html',
  styleUrl: './modulo.page.css',
})
export class ModuloPage {
  private readonly api = inject(ModulosService);
  private readonly avisos = inject(AvisosService);
  protected readonly esAdmin = inject(SesionService).esAdmin;

  readonly clave = input.required<string>();

  protected readonly canales = CANALES;
  protected readonly cargando = signal(true);
  protected readonly modulo = computed<Modulo | null>(() => this.api.lista().find((m) => m.clave === this.clave()) ?? null);
  protected readonly icono = computed<NombreIcono>(() => {
    const i = this.modulo()?.icono ?? 'registro';
    return (i in ICONOS ? i : 'registro') as NombreIcono;
  });
  protected readonly columnas = computed(() => (this.modulo()?.campos ?? []).filter((c) => c.enLista));
  /** Primer campo de opciones: se ofrece como filtro (Estado, Plan...). */
  protected readonly campoFiltro = computed(() => this.modulo()?.campos.find((c) => c.tipo === 'opcion') ?? null);
  protected readonly registros = signal<RegistroModulo[]>([]);
  protected readonly texto = signal('');
  protected readonly valorFiltro = signal('');
  /** null = cerrado; 'nuevo' = alta; registro = edición. */
  protected readonly editando = signal<RegistroModulo | 'nuevo' | null>(null);

  constructor() {
    // Al entrar (o cambiar de módulo desde el menú) se cargan sus registros
    effect(() => {
      const clave = this.clave();
      untracked(() => void this.abrir(clave));
    });
  }

  protected valor(c: CampoModulo, r: RegistroModulo): string {
    return valorLegible(c, r.datos?.[c.id]);
  }

  protected buscar(evento: Event): void {
    this.texto.set((evento.target as HTMLInputElement).value.trim());
    void this.cargar();
  }

  protected filtrar(evento: Event): void {
    this.valorFiltro.set((evento.target as HTMLSelectElement).value);
    void this.cargar();
  }

  protected async guardado(r: RegistroModulo): Promise<void> {
    const nuevo = this.editando() === 'nuevo';
    this.editando.set(null);
    if (nuevo) this.avisos.exito(`${this.modulo()?.singular} ${r.folio} guardado`);
    else if (r.aviso?.enviado) this.avisos.exito('Guardado. Se le avisó al cliente del cambio.');
    else this.avisos.exito('Cambios guardados');
    await this.cargar();
    this.api.lista.update((l) => l.map((m) => (m.id === r.moduloId && nuevo ? { ...m, registros: (m.registros ?? 0) + 1 } : m)));
  }

  protected async borrado(): Promise<void> {
    this.editando.set(null);
    await this.cargar();
  }

  private async abrir(clave: string): Promise<void> {
    this.cargando.set(true);
    this.texto.set('');
    this.valorFiltro.set('');
    try {
      if (!this.api.porClave(clave)) await this.api.cargar(true);
      await this.cargar();
    } catch (e) {
      this.avisos.error(e);
    } finally {
      this.cargando.set(false);
    }
  }

  private async cargar(): Promise<void> {
    const m = this.modulo();
    if (!m) return;
    const f = this.campoFiltro();
    try {
      this.registros.set(
        await this.api.registros(m.id, { texto: this.texto() || undefined, campo: f && this.valorFiltro() ? f.id : undefined, valor: this.valorFiltro() || undefined }),
      );
    } catch (e) {
      this.avisos.error(e);
    }
  }
}
