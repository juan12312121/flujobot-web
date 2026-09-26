import { ChangeDetectionStrategy, Component, inject, input, OnInit, output, signal } from '@angular/core';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { IconoComponent } from '../../../shared/components/icono/icono.component';
import { BotsService } from '../../../core/services/bots/bots.service';
import { AvisosService } from '../../../core/services/avisos/avisos.service';
import { Bot, Recuperacion } from '../../../core/models';

type Pestana = 'telegram' | 'meta' | 'carrito';

/** Lo que cambió en el bot, para que el editor lo refleje sin recargar. */
export type CambiosCanales = Pick<Bot, 'telegram' | 'meta' | 'recuperacion'>;

/**
 * Más canales para el mismo bot (Telegram, Messenger, Instagram) y el recordatorio de carrito abandonado.
 * Todos usan la versión PUBLICADA del flujo, igual que WhatsApp.
 */
@Component({
  selector: 'app-canales-modal',
  imports: [ModalComponent, IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './canales-modal.component.html',
  styleUrl: './canales-modal.component.css',
})
export class CanalesModalComponent implements OnInit {
  private readonly bots = inject(BotsService);
  private readonly avisos = inject(AvisosService);

  readonly bot = input.required<Bot>();
  readonly cerrar = output<CambiosCanales>();

  protected readonly pestana = signal<Pestana>('telegram');
  protected readonly ocupado = signal(false);
  protected readonly telegram = signal({ activo: false, usuario: '' });
  protected readonly meta = signal({ activo: false, paginaId: '', instagram: false });
  protected readonly recuperacion = signal<Recuperacion>({ activo: false, horas: 2, texto: '' });

  ngOnInit(): void {
    const b = this.bot();
    if (b.telegram) this.telegram.set(b.telegram);
    if (b.meta) this.meta.set(b.meta);
    if (b.recuperacion) this.recuperacion.set(b.recuperacion);
  }

  protected salir(): void {
    this.cerrar.emit({ telegram: this.telegram(), meta: this.meta(), recuperacion: this.recuperacion() });
  }

  protected async conectarTelegram(token: string): Promise<void> {
    if (!token.trim()) return;
    await this.trabajar(async () => {
      const r = await this.bots.conectarTelegram(this.bot().id, token.trim());
      this.telegram.set({ activo: true, usuario: r.usuario });
      this.avisos.exito(`Listo: tu bot ya contesta en Telegram como @${r.usuario}`);
    });
  }

  protected async quitarTelegram(): Promise<void> {
    if (!confirm('¿Desconectar Telegram? El bot deja de contestar ahí.')) return;
    await this.trabajar(async () => {
      await this.bots.desconectarTelegram(this.bot().id);
      this.telegram.set({ activo: false, usuario: '' });
    });
  }

  protected async conectarMeta(token: string): Promise<void> {
    if (!token.trim()) return;
    await this.trabajar(async () => {
      const r = await this.bots.conectarMeta(this.bot().id, token.trim());
      this.meta.set({ activo: true, paginaId: r.paginaId, instagram: r.instagram });
      this.avisos.exito(`Conectado a la página "${r.pagina}"${r.instagram ? ' y a su Instagram' : ''}`);
    });
  }

  protected async quitarMeta(): Promise<void> {
    if (!confirm('¿Desconectar Messenger e Instagram?')) return;
    await this.trabajar(async () => {
      await this.bots.desconectarMeta(this.bot().id);
      this.meta.set({ activo: false, paginaId: '', instagram: false });
    });
  }

  protected async guardarRecuperacion(cambios: Partial<Recuperacion>): Promise<void> {
    await this.trabajar(async () => {
      this.recuperacion.set(await this.bots.configurarRecuperacion(this.bot().id, cambios));
    });
  }

  protected horas(evento: Event): void {
    const h = Math.round(Number((evento.target as HTMLInputElement).value));
    if (h >= 1 && h <= 48) void this.guardarRecuperacion({ horas: h });
  }

  private async trabajar(fn: () => Promise<void>): Promise<void> {
    this.ocupado.set(true);
    try {
      await fn();
    } catch (e) {
      this.avisos.error(e);
    } finally {
      this.ocupado.set(false);
    }
  }
}
