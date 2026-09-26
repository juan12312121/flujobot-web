import { ChangeDetectionStrategy, Component, inject, input, OnInit, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { IconoComponent } from '../../../shared/components/icono/icono.component';
import { BotsService } from '../../../core/services/bots/bots.service';
import { AvisosService } from '../../../core/services/avisos/avisos.service';
import { VersionBot } from '../../../core/models';

/**
 * Cada vez que se publica queda una versión guardada. Restaurar regresa el BORRADOR a esa versión:
 * se revisa (y se prueba) en el editor y se publica cuando se quiera.
 */
@Component({
  selector: 'app-versiones-modal',
  imports: [ModalComponent, IconoComponent, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './versiones-modal.component.html',
  styleUrl: './versiones-modal.component.css',
})
export class VersionesModalComponent implements OnInit {
  private readonly bots = inject(BotsService);
  private readonly avisos = inject(AvisosService);

  readonly botId = input.required<string>();
  readonly cerrar = output<void>();
  /** Se restauró una versión: el editor recarga el borrador. */
  readonly restaurada = output<number>();

  protected readonly lista = signal<VersionBot[] | null>(null);
  protected readonly restaurando = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      this.lista.set(await this.bots.versiones(this.botId()));
    } catch (e) {
      this.avisos.error(e);
      this.lista.set([]);
    }
  }

  protected async restaurar(v: VersionBot): Promise<void> {
    if (!confirm(`¿Regresar el borrador a la versión ${v.version}? Lo que tienes sin publicar se reemplaza (la versión publicada no cambia hasta que publiques).`)) return;
    this.restaurando.set(v.id);
    try {
      await this.bots.restaurarVersion(this.botId(), v.id);
      this.restaurada.emit(v.version);
    } catch (e) {
      this.avisos.error(e);
    } finally {
      this.restaurando.set(null);
    }
  }
}
