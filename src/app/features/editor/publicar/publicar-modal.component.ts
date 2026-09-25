import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ResultadoPublicar } from '../../../core/models';
import { IconoComponent } from '../../../shared/components/icono/icono.component';

/** Resultado de publicar: en n8n (automático) o el JSON para importarlo a mano. Presentacional. */
@Component({
  selector: 'app-publicar-modal',
  imports: [IconoComponent, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './publicar-modal.component.html',
  styleUrl: './publicar-modal.component.css',
})
export class PublicarModalComponent {
  readonly resultado = input.required<ResultadoPublicar>();
  readonly cerrar = output<void>();
  readonly descargar = output<void>();
}
