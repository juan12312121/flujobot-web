import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ModulosService } from '../../../core/services/modulos/modulos.service';
import { AvisosService } from '../../../core/services/avisos/avisos.service';
import { Modulo, PlantillaModulo } from '../../../core/models';
import { ICONOS, NombreIcono } from '../../../core/iconos/iconos';
import { IconoComponent } from '../../../shared/components/icono/icono.component';
import { ModuloEditorComponent } from './modulo-editor.component';

/**
 * Módulos personalizados en "Mi empresa": crear desde plantilla o en blanco, editar campos,
 * ocultar del menú y borrar. Se guardan al momento (no esperan al botón "Guardar cambios").
 */
@Component({
  selector: 'app-modulos-propios',
  imports: [IconoComponent, ModuloEditorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './modulos-propios.component.html',
  styleUrl: './modulos-propios.component.css',
})
export class ModulosPropiosComponent implements OnInit {
  protected readonly api = inject(ModulosService);
  private readonly avisos = inject(AvisosService);

  protected readonly plantillas = signal<PlantillaModulo[]>([]);
  protected readonly eligiendo = signal(false);
  /** Módulo en edición, o 'nuevo' (en blanco). */
  protected readonly editando = signal<Modulo | 'nuevo' | null>(null);
  protected readonly creando = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      const [plantillas] = await Promise.all([this.api.plantillas(), this.api.cargar(true)]);
      this.plantillas.set(plantillas);
    } catch (e) {
      this.avisos.error(e);
    }
  }

  protected icono(nombre: string): NombreIcono {
    return (nombre in ICONOS ? nombre : 'registro') as NombreIcono;
  }

  protected async desdePlantilla(p: PlantillaModulo): Promise<void> {
    this.creando.set(p.id);
    try {
      const m = await this.api.crear({ plantilla: p.id });
      this.eligiendo.set(false);
      this.avisos.exito(`Listo: "${m.nombre}" ya está en tu menú. Ajusta sus campos si quieres.`);
    } catch (e) {
      this.avisos.error(e);
    } finally {
      this.creando.set(null);
    }
  }

  protected enBlanco(): void {
    this.eligiendo.set(false);
    this.editando.set('nuevo');
  }

  protected async alternar(m: Modulo): Promise<void> {
    try {
      await this.api.editar(m.id, { activo: !m.activo });
    } catch (e) {
      this.avisos.error(e);
    }
  }

  protected async borrar(m: Modulo): Promise<void> {
    const cuantos = m.registros ? ` y sus ${m.registros} registro(s)` : '';
    if (!confirm(`¿Borrar el módulo "${m.nombre}"${cuantos}? No se puede deshacer. Los bloques del bot que lo usen dejarán de funcionar.`)) return;
    try {
      await this.api.borrar(m.id);
      this.avisos.exito('Módulo borrado');
    } catch (e) {
      this.avisos.error(e);
    }
  }
}
