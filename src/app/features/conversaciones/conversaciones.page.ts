import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ConversacionesService } from '../../core/services/conversaciones/conversaciones.service';
import { BotsService } from '../../core/services/bots/bots.service';
import { AvisosService } from '../../core/services/avisos/avisos.service';
import { Bot, Conversacion, EstadoConversacion } from '../../core/models';
import { IconoComponent } from '../../shared/components/icono/icono.component';

const ETIQUETAS: Record<EstadoConversacion, string> = { nueva: 'Nueva', activa: 'Con el bot', terminada: 'Terminada', humano: 'Espera asesor' };

/** Bandeja de las conversaciones de WhatsApp (se refresca sola cada 15 s). */
@Component({
  selector: 'app-conversaciones',
  imports: [IconoComponent, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './conversaciones.page.html',
  styleUrl: './conversaciones.page.css',
})
export class ConversacionesPage implements OnInit {
  private readonly api = inject(ConversacionesService);
  private readonly botsApi = inject(BotsService);
  private readonly avisos = inject(AvisosService);

  /** ?bot=<id> desde la tarjeta del bot. */
  readonly bot = input<string>();

  protected readonly etiquetas = ETIQUETAS;
  protected readonly lista = signal<Conversacion[]>([]);
  protected readonly bots = signal<Bot[]>([]);
  protected readonly abierta = signal<Conversacion | null>(null);
  protected readonly botId = signal('');
  protected readonly estado = signal<EstadoConversacion | ''>('');

  constructor() {
    const intervalo = setInterval(() => void this.refrescar(), 15_000);
    inject(DestroyRef).onDestroy(() => clearInterval(intervalo));
  }

  async ngOnInit(): Promise<void> {
    this.botId.set(this.bot() ?? '');
    this.bots.set(await this.botsApi.listar().catch(() => []));
    await this.refrescar();
  }

  protected filtrarBot(id: string): void {
    this.botId.set(id);
    void this.refrescar();
  }

  protected filtrarEstado(estado: EstadoConversacion | ''): void {
    this.estado.set(estado);
    void this.refrescar();
  }

  protected async abrir(id: string): Promise<void> {
    try {
      this.abierta.set(await this.api.obtener(id));
    } catch (e) {
      this.avisos.error(e);
    }
  }

  protected async devolver(c: Conversacion): Promise<void> {
    try {
      await this.api.devolverAlBot(c.id);
      this.avisos.exito('El bot vuelve a atender a este cliente');
      await this.refrescar();
    } catch (e) {
      this.avisos.error(e);
    }
  }

  private async refrescar(): Promise<void> {
    try {
      this.lista.set(await this.api.listar({ botId: this.botId() || undefined, estado: this.estado() || undefined }));
      const abierta = this.abierta();
      if (abierta) this.abierta.set(await this.api.obtener(abierta.id));
    } catch (e) {
      this.avisos.error(e);
    }
  }
}
