import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconoComponent } from '../icono/icono.component';

/**
 * Modal reutilizable. El contenido va proyectado; el pie con [pie].
 *
 *   <app-modal titulo="Nuevo producto" (cerrar)="...">
 *     ...formulario...
 *     <div pie>...botones...</div>
 *   </app-modal>
 */
@Component({
  selector: 'app-modal',
  imports: [IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'cerrar.emit()' },
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css',
})
export class ModalComponent {
  readonly titulo = input.required<string>();
  readonly ancho = input(480);
  readonly cerrar = output<void>();
}
