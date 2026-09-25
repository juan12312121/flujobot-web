import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AvisosService } from '../../../core/services/avisos/avisos.service';
import { IconoComponent } from '../icono/icono.component';

/** Toasts en la esquina inferior derecha. */
@Component({
  selector: 'app-avisos',
  imports: [IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './avisos.component.html',
  styleUrl: './avisos.component.css',
})
export class AvisosComponent {
  protected readonly avisos = inject(AvisosService);
}
