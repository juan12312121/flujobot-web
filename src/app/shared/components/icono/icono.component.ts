import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ICONOS, NombreIcono } from '../../../core/iconos/iconos';

/**
 * Icono SVG de línea que toma el color del texto (currentColor).
 *
 *   <app-icono nombre="calendario" />
 *   <app-icono nombre="basura" [tam]="16" />
 */
@Component({
  selector: 'app-icono',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  templateUrl: './icono.component.html',
  styleUrl: './icono.component.css',
})
export class IconoComponent {
  readonly nombre = input.required<NombreIcono>();
  readonly tam = input(18);
  readonly grosor = input(1.9);
  protected readonly trazo = computed(() => ICONOS[this.nombre()]);
}
