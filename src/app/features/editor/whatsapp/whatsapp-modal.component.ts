import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { BotsService } from '../../../core/services/bots/bots.service';
import { EstadoWhatsApp, ErrorApi } from '../../../core/models';
import { IconoComponent } from '../../../shared/components/icono/icono.component';

/** Vincular el número de WhatsApp del bot: pide el QR a Evolution y espera a que lo escaneen. */
@Component({
  selector: 'app-whatsapp-modal',
  imports: [IconoComponent, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './whatsapp-modal.component.html',
  styleUrl: './whatsapp-modal.component.css',
})
export class WhatsappModalComponent implements OnInit {
  private readonly bots = inject(BotsService);
  readonly botId = input.required<string>();
  readonly cerrar = output<EstadoWhatsApp>();

  protected readonly qr = signal<string | null>(null);
  protected readonly estado = signal<EstadoWhatsApp>('desconectado');
  protected readonly error = signal<string | null>(null);
  protected readonly noConfigurado = signal(false);
  private sondeo: ReturnType<typeof setInterval> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearInterval(this.sondeo));
  }

  async ngOnInit(): Promise<void> {
    try {
      const r = await this.bots.conectarWhatsApp(this.botId());
      this.estado.set(r.estado);
      this.qr.set(r.qr);
      if (r.estado !== 'conectado') this.sondeo = setInterval(() => void this.revisar(), 3000);
    } catch (e) {
      const err = e as ErrorApi;
      this.noConfigurado.set(err.codigo === 'NO_CONFIGURADO');
      this.error.set(err.mensaje);
    }
  }

  protected async desconectar(): Promise<void> {
    const r = await this.bots.desconectarWhatsApp(this.botId());
    this.estado.set(r.estado);
    this.cerrar.emit(r.estado);
  }

  private async revisar(): Promise<void> {
    const r = await this.bots.estadoWhatsApp(this.botId()).catch(() => null);
    if (r?.estado === 'conectado') {
      this.estado.set('conectado');
      clearInterval(this.sondeo);
    }
  }
}
