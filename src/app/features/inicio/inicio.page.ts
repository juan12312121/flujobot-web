import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TableroService } from '../../core/services/tablero/tablero.service';
import { SesionService } from '../../core/services/sesion/sesion.service';
import { AvisosService } from '../../core/services/avisos/avisos.service';
import { Resumen } from '../../core/models';
import { DineroPipe } from '../../shared/pipes/dinero.pipe';

@Component({
  selector: 'app-inicio',
  imports: [RouterLink, DatePipe, DineroPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inicio.page.html',
  styleUrl: './inicio.page.css',
})
export class InicioPage implements OnInit {
  private readonly tablero = inject(TableroService);
  private readonly avisos = inject(AvisosService);
  protected readonly sesion = inject(SesionService);
  protected readonly t = this.sesion.terminos;
  protected readonly m = this.sesion.modulos;
  protected readonly resumen = signal<Resumen | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      this.resumen.set(await this.tablero.resumen());
    } catch (e) {
      this.avisos.error(e);
    }
  }
}
