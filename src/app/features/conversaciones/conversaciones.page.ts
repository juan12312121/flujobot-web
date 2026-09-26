import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, input, OnInit, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ConversacionesService } from '../../core/services/conversaciones/conversaciones.service';
import { BotsService } from '../../core/services/bots/bots.service';
import { AvisosService } from '../../core/services/avisos/avisos.service';
import { SesionService } from '../../core/services/sesion/sesion.service';
import { Bot, Canal, Conversacion, EstadoConversacion } from '../../core/models';
import { NombreIcono } from '../../core/iconos/iconos';
import { IconoComponent } from '../../shared/components/icono/icono.component';

const ETIQUETAS: Record<EstadoConversacion, string> = { nueva: 'Nueva', activa: 'Con el bot', terminada: 'Terminada', humano: 'Con una persona' };

export const CANALES: Record<Canal, { nombre: string; icono: NombreIcono }> = {
  whatsapp: { nombre: 'WhatsApp', icono: 'telefono' },
  web: { nombre: 'Chat web', icono: 'chat' },
  telegram: { nombre: 'Telegram', icono: 'enviar' },
  messenger: { nombre: 'Messenger', icono: 'chat' },
  instagram: { nombre: 'Instagram', icono: 'imagen' },
};

/**
 * Bandeja de todas las conversaciones (WhatsApp, chat web, Telegram, Messenger, Instagram).
 * Una persona del equipo puede tomar la plática y contestar desde aquí: sale por el canal del cliente.
 * Se refresca sola cada 10 s.
 */
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
  private readonly caja = viewChild<ElementRef<HTMLDivElement>>('caja');
  protected readonly yo = inject(SesionService).usuario;

  /** ?bot=<id> desde la tarjeta del bot. */
  readonly bot = input<string>();

  protected readonly etiquetas = ETIQUETAS;
  protected readonly canales = CANALES;
  protected readonly lista = signal<Conversacion[]>([]);
  protected readonly bots = signal<Bot[]>([]);
  protected readonly abierta = signal<Conversacion | null>(null);
  protected readonly botId = signal('');
  protected readonly estado = signal<EstadoConversacion | ''>('');
  protected readonly canal = signal<Canal | ''>('');
  protected readonly enviando = signal(false);

  constructor() {
    const intervalo = setInterval(() => void this.refrescar(), 10_000);
    inject(DestroyRef).onDestroy(() => clearInterval(intervalo));
  }

  async ngOnInit(): Promise<void> {
    this.botId.set(this.bot() ?? '');
    this.bots.set(await this.botsApi.listar().catch(() => []));
    await this.refrescar();
  }

  protected nombre(c: Conversacion): string {
    if (c.nombre) return c.nombre;
    if (c.canal === 'web') return 'Visitante web';
    return c.canal === 'whatsapp' ? `+${c.contacto}` : `${CANALES[c.canal]?.nombre ?? c.canal} ${c.contacto.slice(-4)}`;
  }

  protected filtrarBot(id: string): void {
    this.botId.set(id);
    void this.refrescar();
  }

  protected filtrarEstado(estado: EstadoConversacion | ''): void {
    this.estado.set(estado);
    void this.refrescar();
  }

  protected filtrarCanal(canal: Canal | ''): void {
    this.canal.set(canal);
    void this.refrescar();
  }

  protected async abrir(id: string): Promise<void> {
    try {
      this.abierta.set(await this.api.obtener(id));
      this.bajar();
    } catch (e) {
      this.avisos.error(e);
    }
  }

  protected async tomar(c: Conversacion): Promise<void> {
    try {
      this.abierta.set({ ...(await this.api.tomar(c.id)), historial: c.historial });
      this.avisos.exito('Tomaste la conversación: el bot deja de contestarle');
      await this.refrescar();
    } catch (e) {
      this.avisos.error(e);
    }
  }

  protected async enviar(campo: HTMLTextAreaElement): Promise<void> {
    const c = this.abierta();
    const texto = campo.value.trim();
    if (!c || !texto || this.enviando()) return;
    this.enviando.set(true);
    try {
      const r = await this.api.responder(c.id, texto);
      campo.value = '';
      if (!r.enviado) this.avisos.error({ mensaje: `No se pudo entregar: ${r.error}` });
      this.abierta.set(r.conversacion);
      this.bajar();
      await this.refrescar();
    } catch (e) {
      this.avisos.error(e);
    } finally {
      this.enviando.set(false);
    }
  }

  protected teclas(e: KeyboardEvent, campo: HTMLTextAreaElement): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void this.enviar(campo);
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

  private bajar(): void {
    setTimeout(() => {
      const el = this.caja()?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  private async refrescar(): Promise<void> {
    try {
      this.lista.set(await this.api.listar({ botId: this.botId() || undefined, estado: this.estado() || undefined, canal: this.canal() || undefined }));
      const abierta = this.abierta();
      if (abierta) {
        const antes = abierta.historial?.length ?? 0;
        this.abierta.set(await this.api.obtener(abierta.id));
        if ((this.abierta()?.historial?.length ?? 0) > antes) this.bajar();
      }
    } catch (e) {
      this.avisos.error(e);
    }
  }
}
