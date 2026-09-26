import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { GestionService } from '../../core/services/gestion/gestion.service';
import { AvisosService } from '../../core/services/avisos/avisos.service';
import { SesionService } from '../../core/services/sesion/sesion.service';
import { ClavePlan, EstadoPlan, LimitesPlan } from '../../core/models';
import { IconoComponent } from '../../shared/components/icono/icono.component';

const CANALES: Record<string, string> = { whatsapp: 'WhatsApp', web: 'Chat web', telegram: 'Telegram', messenger: 'Messenger', instagram: 'Instagram' };

/** Mi plan: consumo del mes contra los límites, días que quedan y cambio/pago de plan. */
@Component({
  selector: 'app-plan',
  imports: [DatePipe, DecimalPipe, IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './plan.page.html',
  styleUrl: './plan.page.css',
})
export class PlanPage implements OnInit {
  private readonly api = inject(GestionService);
  private readonly avisos = inject(AvisosService);
  protected readonly sesion = inject(SesionService);

  protected readonly plan = signal<EstadoPlan | null>(null);
  protected readonly pagando = signal<ClavePlan | null>(null);
  protected readonly canales = CANALES;
  protected readonly medidores: { clave: keyof LimitesPlan; texto: string }[] = [
    { clave: 'conversaciones', texto: 'Conversaciones nuevas' },
    { clave: 'ia', texto: 'Respuestas con IA' },
    { clave: 'campanas', texto: 'Mensajes de campaña' },
    { clave: 'bots', texto: 'Bots' },
  ];

  async ngOnInit(): Promise<void> {
    try {
      this.plan.set(await this.api.plan());
    } catch (e) {
      this.avisos.error(e);
    }
  }

  protected nombresCanales(lista: string[]): string {
    return lista.map((c) => CANALES[c] ?? c).join(', ');
  }

  protected porcentaje(uso: number, limite: number): number {
    return limite ? Math.min(100, Math.round((uso / limite) * 100)) : 0;
  }

  protected async pagar(clave: ClavePlan): Promise<void> {
    this.pagando.set(clave);
    try {
      const { url } = await this.api.pagarPlan(clave);
      window.location.href = url;
    } catch (e) {
      this.avisos.error(e);
      this.pagando.set(null);
    }
  }
}
