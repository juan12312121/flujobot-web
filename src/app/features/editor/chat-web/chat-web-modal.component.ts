import { ChangeDetectionStrategy, Component, computed, DOCUMENT, inject, input, OnInit, output, signal } from '@angular/core';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { IconoComponent } from '../../../shared/components/icono/icono.component';
import { BotsService } from '../../../core/services/bots/bots.service';
import { AvisosService } from '../../../core/services/avisos/avisos.service';
import { API_URL } from '../../../core/config/api-url.token';
import { ChatWeb } from '../../../core/models';

/**
 * Chat web del bot: prenderlo, darle título y saludo, y copiar el código para la página
 * del negocio o el enlace directo (Instagram, Facebook, tarjetas).
 */
@Component({
  selector: 'app-chat-web-modal',
  imports: [ModalComponent, IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chat-web-modal.component.html',
  styleUrl: './chat-web-modal.component.css',
})
export class ChatWebModalComponent implements OnInit {
  private readonly bots = inject(BotsService);
  private readonly avisos = inject(AvisosService);
  private readonly origen = inject(DOCUMENT).location.origin;
  private readonly api = inject(API_URL);

  readonly botId = input.required<string>();
  /** El chat usa la versión PUBLICADA del flujo. */
  readonly publicado = input(false);
  readonly cerrar = output<void>();

  protected readonly web = signal<ChatWeb | null>(null);
  protected readonly guardando = signal(false);
  protected readonly codigo = computed(() => {
    const w = this.web();
    return w ? `<script src="${this.origen}/widget.js" data-clave="${w.clave}" data-api="${this.api}" async></script>` : '';
  });
  protected readonly enlace = computed(() => (this.web() ? `${this.origen}/c/${this.web()!.clave}` : ''));

  async ngOnInit(): Promise<void> {
    // Sin cambios: solo asegura que exista la clave y trae la configuración actual
    try {
      this.web.set(await this.bots.configurarWeb(this.botId(), {}));
    } catch (e) {
      this.avisos.error(e);
    }
  }

  protected async guardar(cambios: Partial<Omit<ChatWeb, 'clave'>>): Promise<void> {
    this.guardando.set(true);
    try {
      this.web.set(await this.bots.configurarWeb(this.botId(), cambios));
    } catch (e) {
      this.avisos.error(e);
    } finally {
      this.guardando.set(false);
    }
  }

  protected alternar(evento: Event): void {
    void this.guardar({ activo: (evento.target as HTMLInputElement).checked });
  }

  protected texto(campo: 'titulo' | 'saludo', evento: Event): void {
    void this.guardar({ [campo]: (evento.target as HTMLInputElement).value });
  }

  protected async copiar(texto: string, que: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(texto);
      this.avisos.exito(`${que} copiado`);
    } catch {
      this.avisos.info('Selecciona el texto y cópialo con Ctrl+C');
    }
  }
}
