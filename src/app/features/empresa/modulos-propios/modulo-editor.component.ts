import { ChangeDetectionStrategy, Component, inject, input, OnInit, output, signal } from '@angular/core';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { IconoComponent } from '../../../shared/components/icono/icono.component';
import { ModulosService } from '../../../core/services/modulos/modulos.service';
import { AvisosService } from '../../../core/services/avisos/avisos.service';
import { CampoModulo, DatosModulo, Modulo, TipoCampo } from '../../../core/models';
import { NombreIcono } from '../../../core/iconos/iconos';

export const TIPOS_CAMPO: { tipo: TipoCampo; nombre: string }[] = [
  { tipo: 'texto', nombre: 'Texto corto' },
  { tipo: 'textoLargo', nombre: 'Texto largo' },
  { tipo: 'numero', nombre: 'Número' },
  { tipo: 'dinero', nombre: 'Dinero' },
  { tipo: 'fecha', nombre: 'Fecha' },
  { tipo: 'opcion', nombre: 'Lista de opciones' },
  { tipo: 'sino', nombre: 'Sí / No' },
  { tipo: 'telefono', nombre: 'Teléfono' },
  { tipo: 'email', nombre: 'Correo' },
  { tipo: 'imagen', nombre: 'Imagen' },
];

const ICONOS_MODULO: NombreIcono[] = [
  'registro', 'formulario', 'servicios', 'paquete', 'carrito', 'tienda', 'calendario', 'tarjeta', 'escudo', 'salud',
  'belleza', 'restaurante', 'educacion', 'inmobiliaria', 'equipo', 'estrella', 'rayo', 'reloj', 'telefono', 'megafono', 'imagen', 'lupa',
];

/** Campo en edición: las opciones se escriben separadas por coma. */
interface CampoEditable extends CampoModulo {
  opcionesTexto: string;
}

let nuevos = 0;

/** Alta o edición de un módulo: nombre, ícono, prefijo de folios y sus campos. */
@Component({
  selector: 'app-modulo-editor',
  imports: [ModalComponent, IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './modulo-editor.component.html',
  styleUrl: './modulo-editor.component.css',
})
export class ModuloEditorComponent implements OnInit {
  private readonly api = inject(ModulosService);
  private readonly avisos = inject(AvisosService);

  /** null = módulo nuevo en blanco. */
  readonly modulo = input<Modulo | null>(null);
  readonly cerrar = output<void>();

  protected readonly tipos = TIPOS_CAMPO;
  protected readonly iconos = ICONOS_MODULO;
  protected readonly datos = signal({ nombre: '', singular: '', icono: 'registro', prefijo: '', descripcion: '' });
  protected readonly campos = signal<CampoEditable[]>([]);
  protected readonly guardando = signal(false);

  ngOnInit(): void {
    const m = this.modulo();
    if (m) {
      this.datos.set({ nombre: m.nombre, singular: m.singular, icono: m.icono, prefijo: m.prefijo, descripcion: m.descripcion });
      this.campos.set(m.campos.map((c) => ({ ...c, opcionesTexto: c.opciones.join(', ') })));
    } else {
      this.campos.set([this.campoNuevo('Nombre', 'texto', true), this.campoNuevo('Teléfono', 'telefono', false)]);
    }
  }

  protected dato(campo: 'nombre' | 'singular' | 'icono' | 'prefijo' | 'descripcion', valor: string): void {
    this.datos.update((d) => ({ ...d, [campo]: valor }));
  }

  protected cambiarCampo(i: number, cambios: Partial<CampoEditable>): void {
    this.campos.update((l) => l.map((c, j) => (j === i ? { ...c, ...cambios } : c)));
  }

  protected agregar(): void {
    this.campos.update((l) => [...l, this.campoNuevo(`Campo ${l.length + 1}`, 'texto', false)]);
  }

  protected quitar(i: number): void {
    this.campos.update((l) => l.filter((_, j) => j !== i));
  }

  protected mover(i: number, delta: number): void {
    this.campos.update((l) => {
      const j = i + delta;
      if (j < 0 || j >= l.length) return l;
      const copia = [...l];
      [copia[i], copia[j]] = [copia[j], copia[i]];
      return copia;
    });
  }

  protected async guardar(): Promise<void> {
    const d = this.datos();
    if (!d.nombre.trim()) {
      this.avisos.error({ mensaje: 'Ponle nombre al módulo' });
      return;
    }
    const campos: CampoModulo[] = this.campos().map(({ opcionesTexto, ...c }) => ({
      ...c,
      // Los campos nuevos no mandan id: el servidor lo arma con el nombre
      id: c.id.startsWith('nuevo_') ? (undefined as unknown as string) : c.id,
      opciones: c.tipo === 'opcion' ? opcionesTexto.split(',').map((o) => o.trim()).filter(Boolean) : [],
      avisar: c.tipo === 'opcion' && c.avisar,
    }));
    const cuerpo: Partial<DatosModulo> = {
      nombre: d.nombre.trim(),
      singular: d.singular.trim() || d.nombre.trim(),
      icono: d.icono,
      descripcion: d.descripcion.trim(),
      campos,
      ...(d.prefijo.trim() ? { prefijo: d.prefijo.trim().toUpperCase() } : {}),
    };
    this.guardando.set(true);
    try {
      const m = this.modulo();
      if (m) await this.api.editar(m.id, cuerpo);
      else await this.api.crear(cuerpo);
      this.avisos.exito(m ? 'Módulo actualizado' : `Listo: "${cuerpo.nombre}" ya está en tu menú`);
      this.cerrar.emit();
    } catch (e) {
      this.avisos.error(e);
    } finally {
      this.guardando.set(false);
    }
  }

  private campoNuevo(nombre: string, tipo: TipoCampo, requerido: boolean): CampoEditable {
    return { id: `nuevo_${nuevos++}`, nombre, tipo, opciones: [], opcionesTexto: '', requerido, enLista: true, avisar: false };
  }
}
