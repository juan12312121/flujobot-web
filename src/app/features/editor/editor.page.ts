import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { EditorStore } from './editor.store';
import { LienzoComponent } from './lienzo/lienzo.component';
import { PaletaComponent } from './paleta/paleta.component';
import { InspectorComponent } from './inspector/inspector.component';
import { SimuladorComponent } from './simulador/simulador.component';
import { WhatsappModalComponent } from './whatsapp/whatsapp-modal.component';
import { PublicarModalComponent } from './publicar/publicar-modal.component';
import { AsistenteModalComponent } from '../asistente/asistente-modal.component';
import { ChatWebModalComponent } from './chat-web/chat-web-modal.component';
import { CanalesModalComponent, CambiosCanales } from './canales/canales-modal.component';
import { VersionesModalComponent } from './versiones/versiones-modal.component';
import { BotsService } from '../../core/services/bots/bots.service';
import { AvisosService } from '../../core/services/avisos/avisos.service';
import { ConCambiosPendientes } from '../../core/guards/cambios-sin-guardar.guard';
import { EstadoWhatsApp, PropuestaFlujo, ResultadoPublicar, TipoNodo } from '../../core/models';
import { IconoComponent } from '../../shared/components/icono/icono.component';

type Pestana = 'bloque' | 'probar' | 'revision';

@Component({
  selector: 'app-editor',
  imports: [IconoComponent, RouterLink, LienzoComponent, PaletaComponent, InspectorComponent, SimuladorComponent, WhatsappModalComponent, PublicarModalComponent, AsistenteModalComponent, ChatWebModalComponent, CanalesModalComponent, VersionesModalComponent],
  providers: [EditorStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'atajos($event)', '(window:beforeunload)': 'antesDeSalir($event)' },
  templateUrl: './editor.page.html',
  styleUrl: './editor.page.css',
})
export class EditorPage implements OnInit, ConCambiosPendientes {
  protected readonly store = inject(EditorStore);
  private readonly bots = inject(BotsService);
  private readonly avisos = inject(AvisosService);
  private readonly router = inject(Router);
  private readonly lienzo = viewChild(LienzoComponent);

  readonly botId = input.required<string>();

  protected readonly cargando = signal(true);
  protected readonly pestana = signal<Pestana>('bloque');
  protected readonly verWhatsapp = signal(false);
  protected readonly verAsistente = signal(false);
  protected readonly verChatWeb = signal(false);
  protected readonly verCanales = signal(false);
  protected readonly verVersiones = signal(false);
  /** Lienzo casi vacío (solo Inicio): se invita a describir el bot con el asistente. */
  protected readonly lienzoVacio = computed(() => !this.cargando() && this.store.nodos().length <= 1);
  protected readonly publicado = signal<ResultadoPublicar | null>(null);
  protected readonly textoGuardado = computed(
    () => ({ guardado: 'Guardado', pendiente: 'Cambios sin guardar…', guardando: 'Guardando…', error: 'Error al guardar' })[this.store.estadoGuardado()],
  );
  protected readonly avisosRevision = computed(() => this.store.problemas().filter((p) => p.nivel === 'aviso'));

  async ngOnInit(): Promise<void> {
    try {
      await this.store.cargar(this.botId());
    } catch (e) {
      this.avisos.error(e, 'No se pudo abrir el bot');
      void this.router.navigate(['/bots']);
    } finally {
      this.cargando.set(false);
    }
  }

  hayCambiosSinGuardar(): boolean {
    return this.store.estadoGuardado() !== 'guardado';
  }

  protected agregarDesdePaleta(tipo: TipoNodo): void {
    this.store.agregarNodo(tipo, this.lienzo()?.centroVisible() ?? { x: 200, y: 200 });
    this.pestana.set('bloque');
  }

  protected irAProblema(nodoId: string | null): void {
    if (!nodoId) return;
    this.store.seleccionar(nodoId);
    this.pestana.set('bloque');
  }

  protected async publicar(): Promise<void> {
    const r = await this.store.publicar();
    if (r) this.publicado.set(r);
    else if (this.store.errores().length) this.pestana.set('revision');
  }

  protected alternarResultados(): void {
    if (this.store.resultados()) this.store.ocultarResultados();
    else void this.store.verResultados();
  }

  protected cambiarDias(evento: Event): void {
    void this.store.verResultados(Number((evento.target as HTMLSelectElement).value));
  }

  protected aplicarAsistente({ propuesta }: { propuesta: PropuestaFlujo }): void {
    this.store.reemplazarFlujo(propuesta.nodos, propuesta.conexiones);
    this.verAsistente.set(false);
    this.avisos.exito('Listo: el asistente armó el flujo. Pruébalo con "Probar".');
    setTimeout(() => this.lienzo()?.ajustar(), 50);
  }

  protected async descargarWorkflow(): Promise<void> {
    const bot = this.store.bot();
    if (!bot) return;
    try {
      const json = await this.bots.workflowN8n(bot.id);
      const url = URL.createObjectURL(new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' }));
      const a = Object.assign(document.createElement('a'), { href: url, download: `flujobot-${bot.instancia}.json` });
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      this.avisos.error(e);
    }
  }

  protected alCerrarCanales(cambios: CambiosCanales): void {
    this.verCanales.set(false);
    this.store.bot.update((b) => (b ? { ...b, ...cambios } : b));
  }

  /** El borrador ya es la versión restaurada en el servidor: se vuelve a cargar el lienzo. */
  protected async alRestaurar(version: number): Promise<void> {
    this.verVersiones.set(false);
    try {
      await this.store.cargar(this.botId());
      this.avisos.exito(`El borrador volvió a la versión ${version}. Pruébalo y publica cuando quieras.`);
      setTimeout(() => this.lienzo()?.ajustar(), 50);
    } catch (e) {
      this.avisos.error(e);
    }
  }

  protected alCerrarWhatsapp(estado: EstadoWhatsApp): void {
    this.verWhatsapp.set(false);
    this.store.bot.update((b) => (b ? { ...b, whatsapp: estado } : b));
  }

  protected atajos(e: KeyboardEvent): void {
    const escribiendo = (e.target as HTMLElement)?.closest('input, textarea, select, [contenteditable]');
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      void this.store.guardar();
      return;
    }
    if (escribiendo) return;
    const id = this.store.seleccionadoId();
    if (id && (e.key === 'Delete' || e.key === 'Backspace')) {
      e.preventDefault();
      this.store.borrarNodo(id);
    }
    if (id && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      this.store.duplicarNodo(id);
    }
  }

  protected antesDeSalir(e: BeforeUnloadEvent): void {
    if (this.hayCambiosSinGuardar()) e.preventDefault();
  }
}
