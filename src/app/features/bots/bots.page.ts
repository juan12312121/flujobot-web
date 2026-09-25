import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { BotsService, Plantilla } from '../../core/services/bots/bots.service';
import { AvisosService } from '../../core/services/avisos/avisos.service';
import { SesionService } from '../../core/services/sesion/sesion.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { AutoEnfocarDirective } from '../../shared/directives/auto-enfocar.directive';
import { Bot, PropuestaFlujo } from '../../core/models';
import { GIROS, PLANTILLAS } from '../../core/empresa/giros';
import { AsistenteModalComponent } from '../asistente/asistente-modal.component';
import { IconoComponent } from '../../shared/components/icono/icono.component';

@Component({
  selector: 'app-bots',
  imports: [AsistenteModalComponent, IconoComponent, RouterLink, DatePipe, ModalComponent, AutoEnfocarDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bots.page.html',
  styleUrl: './bots.page.css',
})
export class BotsPage implements OnInit {
  private readonly api = inject(BotsService);
  private readonly avisos = inject(AvisosService);
  private readonly router = inject(Router);
  protected readonly sesion = inject(SesionService);

  protected readonly bots = signal<Bot[]>([]);
  protected readonly cargando = signal(true);
  protected readonly creando = signal(false);
  protected readonly plantillas = PLANTILLAS;
  protected readonly nuevo = signal({ nombre: '', plantilla: 'tienda' as Plantilla });
  /** La plantilla que conviene al giro de la empresa. */
  private readonly recomendada = (): Plantilla => GIROS.find((g) => g.id === this.sesion.empresa()?.giro)?.plantilla ?? 'informacion';
  protected readonly guardando = signal(false);
  protected readonly conAsistente = signal(false);

  async ngOnInit(): Promise<void> {
    try {
      this.bots.set(await this.api.listar());
    } catch (e) {
      this.avisos.error(e);
    } finally {
      this.cargando.set(false);
    }
  }

  protected abrirCrear(): void {
    this.nuevo.set({ nombre: '', plantilla: this.recomendada() });
    this.creando.set(true);
  }

  protected nombre(evento: Event): void {
    this.nuevo.update((n) => ({ ...n, nombre: (evento.target as HTMLInputElement).value }));
  }

  protected plantilla(p: Plantilla): void {
    this.nuevo.update((n) => ({ ...n, plantilla: p }));
  }

  protected esRecomendada(p: Plantilla): boolean {
    return p === this.recomendada();
  }

  protected async crear(): Promise<void> {
    const { nombre, plantilla } = this.nuevo();
    if (!nombre.trim()) return;
    this.guardando.set(true);
    try {
      const bot = await this.api.crear({ nombre: nombre.trim(), plantilla });
      await this.router.navigate(['/bots', bot.id, 'editor']);
    } catch (e) {
      this.avisos.error(e);
    } finally {
      this.guardando.set(false);
    }
  }

  /** El asistente propuso un flujo y la persona lo aceptó: se crea el bot con él. */
  protected async crearConAsistente({ propuesta, nombre }: { propuesta: PropuestaFlujo; nombre: string }): Promise<void> {
    try {
      const bot = await this.api.crear({ nombre, flujo: { nodos: propuesta.nodos, conexiones: propuesta.conexiones } });
      await this.router.navigate(['/bots', bot.id, 'editor']);
    } catch (e) {
      this.avisos.error(e);
      this.conAsistente.set(false);
    }
  }

  protected async borrar(bot: Bot): Promise<void> {
    if (!confirm(`¿Borrar el bot "${bot.nombre}"? Se borra su flujo, su workflow de n8n y sus conversaciones. Los pedidos se conservan.`)) return;
    try {
      await this.api.borrar(bot.id);
      this.bots.update((l) => l.filter((b) => b.id !== bot.id));
      this.avisos.exito('Bot borrado');
    } catch (e) {
      this.avisos.error(e);
    }
  }
}
