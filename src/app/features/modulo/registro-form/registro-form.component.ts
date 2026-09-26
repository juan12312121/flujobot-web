import { ChangeDetectionStrategy, Component, inject, input, OnInit, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { IconoComponent } from '../../../shared/components/icono/icono.component';
import { SubirImagenComponent } from '../../../shared/components/subir-imagen/subir-imagen.component';
import { ModulosService } from '../../../core/services/modulos/modulos.service';
import { AvisosService } from '../../../core/services/avisos/avisos.service';
import { CampoModulo, ErrorApi, Modulo, RegistroModulo } from '../../../core/models';

/** Alta o edición de un registro: el formulario se arma solo con los campos del módulo. */
@Component({
  selector: 'app-registro-form',
  imports: [ModalComponent, IconoComponent, SubirImagenComponent, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './registro-form.component.html',
  styleUrl: './registro-form.component.css',
})
export class RegistroFormComponent implements OnInit {
  private readonly api = inject(ModulosService);
  private readonly avisos = inject(AvisosService);

  readonly modulo = input.required<Modulo>();
  /** null = registro nuevo. */
  readonly registro = input<RegistroModulo | null>(null);
  readonly guardado = output<RegistroModulo>();
  readonly borrado = output<void>();
  readonly cerrar = output<void>();

  protected readonly datos = signal<Record<string, unknown>>({});
  protected readonly errores = signal<Record<string, string>>({});
  protected readonly guardando = signal(false);
  /** Avisar al cliente si cambia un campo con aviso (Estado...). */
  protected readonly avisar = signal(true);

  ngOnInit(): void {
    const r = this.registro();
    const inicial: Record<string, unknown> = {};
    for (const c of this.modulo().campos) inicial[c.id] = r?.datos?.[c.id] ?? (c.tipo === 'sino' ? false : '');
    this.datos.set(inicial);
  }

  protected valor(c: CampoModulo): string {
    const v = this.datos()[c.id];
    return v === null || v === undefined ? '' : String(v);
  }

  protected cambiar(c: CampoModulo, valor: unknown): void {
    this.datos.update((d) => ({ ...d, [c.id]: valor }));
    if (this.errores()[c.id]) this.errores.update(({ [c.id]: _, ...resto }) => resto);
  }

  protected hayAvisos(): boolean {
    return this.modulo().campos.some((c) => c.avisar);
  }

  protected async guardar(): Promise<void> {
    const m = this.modulo();
    const faltan = m.campos.filter((c) => c.requerido && c.tipo !== 'sino' && !String(this.datos()[c.id] ?? '').trim());
    if (faltan.length) {
      this.errores.set(Object.fromEntries(faltan.map((c) => [c.id, 'Obligatorio'])));
      return;
    }
    this.guardando.set(true);
    try {
      const r = this.registro();
      const guardado = r ? await this.api.editarRegistro(m.id, r.id, this.datos(), this.avisar()) : await this.api.crearRegistro(m.id, this.datos());
      this.guardado.emit(guardado);
    } catch (e) {
      const err = e as Partial<ErrorApi>;
      const porCampo = Object.fromEntries((err.detalles ?? []).filter((d) => d.campo).map((d) => [d.campo!, d.mensaje ?? 'Revisa este dato']));
      this.errores.set(porCampo);
      this.avisos.error(e);
    } finally {
      this.guardando.set(false);
    }
  }

  protected async borrar(): Promise<void> {
    const r = this.registro();
    if (!r || !confirm(`¿Borrar ${this.modulo().singular.toLowerCase()} ${r.folio}? No se puede deshacer.`)) return;
    try {
      await this.api.borrarRegistro(this.modulo().id, r.id);
      this.borrado.emit();
    } catch (e) {
      this.avisos.error(e);
    }
  }
}
