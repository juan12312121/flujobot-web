import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CampanasService } from '../../core/services/campanas/campanas.service';
import { BotsService } from '../../core/services/bots/bots.service';
import { AvisosService } from '../../core/services/avisos/avisos.service';
import { Bot, Campana, ConteoSegmento, DatosCampana, EstadoCampana, TipoSegmento } from '../../core/models';
import { IconoComponent } from '../../shared/components/icono/icono.component';
import { SubirImagenComponent } from '../../shared/components/subir-imagen/subir-imagen.component';

const ESTADOS: Record<EstadoCampana, string> = { borrador: 'Borrador', programada: 'Programada', enviando: 'Enviando…', enviada: 'Enviada', cancelada: 'Cancelada' };

const SEGMENTOS: { tipo: TipoSegmento; texto: string; conDias: boolean }[] = [
  { tipo: 'todos', texto: 'Todos los que aceptaron promociones', conDias: false },
  { tipo: 'compraron', texto: 'Compraron en los últimos… días', conDias: true },
  { tipo: 'sin_terminar', texto: 'Dejaron un pedido a medias en los últimos… días', conDias: true },
  { tipo: 'con_cita', texto: 'Tuvieron o tienen cita en los últimos… días', conDias: true },
  { tipo: 'inactivos', texto: 'No escriben desde hace… días', conDias: true },
];

const VACIA = (): DatosCampana => ({ botId: '', nombre: '', texto: 'Hola {{nombre}}, ', imagenUrl: '', segmento: { tipo: 'todos', dias: 30 } });

/**
 * Campañas: un mensaje a muchos contactos a la vez (promociones, avisos). Solo le llega a quien aceptó
 * recibirlas (bloque "Pedir permiso" o escribiendo ALTA), y siempre pueden salirse con BAJA.
 */
@Component({
  selector: 'app-campanas',
  imports: [DatePipe, IconoComponent, SubirImagenComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './campanas.page.html',
  styleUrl: './campanas.page.css',
})
export class CampanasPage implements OnInit {
  private readonly api = inject(CampanasService);
  private readonly botsApi = inject(BotsService);
  private readonly avisos = inject(AvisosService);

  protected readonly estados = ESTADOS;
  protected readonly segmentos = SEGMENTOS;
  protected readonly lista = signal<Campana[]>([]);
  protected readonly bots = signal<Bot[]>([]);
  protected readonly editando = signal<string | null>(null);
  protected readonly form = signal<DatosCampana>(VACIA());
  protected readonly conteo = signal<ConteoSegmento | null>(null);
  protected readonly guardando = signal(false);
  protected readonly programando = signal<string | null>(null);

  constructor() {
    // Mientras se envía una campaña, el avance se actualiza solo
    const intervalo = setInterval(() => {
      if (this.lista().some((c) => c.estado === 'enviando' || c.estado === 'programada')) void this.cargar();
    }, 15_000);
    inject(DestroyRef).onDestroy(() => clearInterval(intervalo));
  }

  async ngOnInit(): Promise<void> {
    const bots = await this.botsApi.listar().catch(() => []);
    this.bots.set(bots);
    this.form.update((f) => ({ ...f, botId: bots.find((b) => b.whatsapp === 'conectado')?.id ?? bots[0]?.id ?? '' }));
    await Promise.all([this.cargar(), this.contar()]);
  }

  protected conDias(): boolean {
    return SEGMENTOS.find((s) => s.tipo === this.form().segmento.tipo)?.conDias ?? false;
  }

  protected cambiar<K extends keyof DatosCampana>(campo: K, valor: DatosCampana[K]): void {
    this.form.update((f) => ({ ...f, [campo]: valor }));
  }

  protected cambiarSegmento(cambios: Partial<DatosCampana['segmento']>): void {
    this.form.update((f) => ({ ...f, segmento: { ...f.segmento, ...cambios } }));
    void this.contar();
  }

  protected nueva(): void {
    this.editando.set(null);
    this.form.set({ ...VACIA(), botId: this.form().botId });
    void this.contar();
  }

  protected editar(c: Campana): void {
    this.editando.set(c.id);
    this.form.set({ botId: c.botId, nombre: c.nombre, texto: c.texto, imagenUrl: c.imagenUrl, segmento: { ...c.segmento } });
    void this.contar();
  }

  protected async guardar(): Promise<void> {
    const f = this.form();
    if (!f.botId || !f.nombre.trim() || !f.texto.trim()) {
      this.avisos.error({ mensaje: 'Elige el bot y escribe el nombre y el mensaje' });
      return;
    }
    this.guardando.set(true);
    try {
      const id = this.editando();
      const c = id ? await this.api.editar(id, f) : await this.api.crear(f);
      this.editando.set(c.id);
      this.avisos.exito('Campaña guardada. Cuando esté lista, envíala o prográmala.');
      await this.cargar();
    } catch (e) {
      this.avisos.error(e);
    } finally {
      this.guardando.set(false);
    }
  }

  protected async programar(c: Campana, cuando: string): Promise<void> {
    const fecha = cuando ? new Date(cuando) : null;
    const texto = fecha ? `¿Programar "${c.nombre}" para el ${fecha.toLocaleString('es-MX')}?` : `¿Enviar "${c.nombre}" ahora?`;
    if (!confirm(texto)) return;
    this.programando.set(c.id);
    try {
      const r = await this.api.programar(c.id, fecha ? fecha.toISOString() : null);
      this.avisos.exito(`${fecha ? 'Programada' : 'Enviando'}: le llegará a ${r.destinatariosEstimados} contacto(s)`);
      await this.cargar();
    } catch (e) {
      this.avisos.error(e);
    } finally {
      this.programando.set(null);
    }
  }

  protected async cancelar(c: Campana): Promise<void> {
    try {
      await this.api.cancelar(c.id);
      await this.cargar();
    } catch (e) {
      this.avisos.error(e);
    }
  }

  protected async borrar(c: Campana): Promise<void> {
    if (!confirm(`¿Borrar la campaña "${c.nombre}"?`)) return;
    try {
      await this.api.borrar(c.id);
      if (this.editando() === c.id) this.nueva();
      await this.cargar();
    } catch (e) {
      this.avisos.error(e);
    }
  }

  protected avance(c: Campana): number {
    const t = c.totales.destinatarios;
    return t ? Math.round(((c.totales.enviados + c.totales.fallidos) / t) * 100) : 0;
  }

  private async contar(): Promise<void> {
    const s = this.form().segmento;
    try {
      this.conteo.set(await this.api.contar(s.tipo, s.dias));
    } catch {
      this.conteo.set(null);
    }
  }

  private async cargar(): Promise<void> {
    try {
      this.lista.set(await this.api.listar());
    } catch (e) {
      this.avisos.error(e);
    }
  }
}
