import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { GRUPOS, TIPOS } from '../../../core/flujo/tipos-de-nodo';
import { TipoNodo } from '../../../core/models';
import { IconoComponent } from '../../../shared/components/icono/icono.component';

/** Bloques que se arrastran al lienzo (o se agregan con clic). Presentacional: solo emite el tipo. */
@Component({
  selector: 'app-paleta',
  imports: [IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './paleta.component.html',
  styleUrl: './paleta.component.css',
})
export class PaletaComponent {
  readonly hayInicio = input(false);
  readonly agregar = output<TipoNodo>();

  protected readonly grupos = GRUPOS;
  protected tiposDe(grupo: string) {
    return Object.values(TIPOS).filter((t) => t.grupo === grupo);
  }

  protected alArrastrar(evento: DragEvent, tipo: TipoNodo): void {
    evento.dataTransfer?.setData('application/x-flujobot-tipo', tipo);
    if (evento.dataTransfer) evento.dataTransfer.effectAllowed = 'copy';
  }
}
