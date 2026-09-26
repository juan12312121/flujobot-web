import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { GestionService } from '../../core/services/gestion/gestion.service';
import { AvisosService } from '../../core/services/avisos/avisos.service';
import { Encuesta, ResumenEncuestas } from '../../core/models';
import { IconoComponent } from '../../shared/components/icono/icono.component';
import { CANALES } from '../conversaciones/conversaciones.page';

/** Satisfacción: lo que calificaron los clientes (bloque Encuesta y encuesta al entregar un pedido). */
@Component({
  selector: 'app-encuestas',
  imports: [DatePipe, DecimalPipe, IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './encuestas.page.html',
  styleUrl: './encuestas.page.css',
})
export class EncuestasPage implements OnInit {
  private readonly api = inject(GestionService);
  private readonly avisos = inject(AvisosService);

  protected readonly canales = CANALES;
  protected readonly dias = signal(30);
  protected readonly resumen = signal<ResumenEncuestas | null>(null);
  protected readonly lista = signal<Encuesta[]>([]);
  protected readonly estrellas = [1, 2, 3, 4, 5];
  protected readonly maximo = computed(() => Math.max(1, ...(this.resumen()?.distribucion ?? [])));

  async ngOnInit(): Promise<void> {
    await this.cargar();
  }

  protected cambiarDias(evento: Event): void {
    this.dias.set(Number((evento.target as HTMLSelectElement).value));
    void this.cargar();
  }

  private async cargar(): Promise<void> {
    try {
      const { lista, ...resumen } = await this.api.encuestas(this.dias());
      this.resumen.set(resumen);
      this.lista.set(lista);
    } catch (e) {
      this.avisos.error(e);
    }
  }
}
