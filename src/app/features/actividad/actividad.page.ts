import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { GestionService } from '../../core/services/gestion/gestion.service';
import { AvisosService } from '../../core/services/avisos/avisos.service';
import { Actividad } from '../../core/models';

/** Nombre en español de cada acción de la bitácora. */
const ACCIONES: Record<string, string> = {
  'bot.crear': 'Creó un bot',
  'bot.borrar': 'Borró un bot',
  'bot.publicar': 'Publicó un bot',
  'bot.restaurar': 'Restauró una versión',
  'bot.recuperacion': 'Cambió el carrito abandonado',
  'canal.telegram': 'Conectó Telegram',
  'canal.telegram.quitar': 'Desconectó Telegram',
  'canal.meta': 'Conectó Messenger/Instagram',
  'canal.meta.quitar': 'Desconectó Messenger/Instagram',
  'pedido.estado': 'Cambió el estado de un pedido',
  'pedido.pagado': 'Marcó un pedido como pagado',
  'cita.crear': 'Agendó una cita a mano',
  'cita.estado': 'Cambió el estado de una cita',
  'conversacion.tomar': 'Tomó una conversación',
  'conversacion.responder': 'Contestó como asesor',
  'conversacion.devolver': 'Devolvió una conversación al bot',
  'campana.crear': 'Creó una campaña',
  'campana.programar': 'Programó una campaña',
  'campana.cancelar': 'Canceló una campaña',
  'empresa.editar': 'Cambió la configuración de la empresa',
  'empresa.cobros': 'Cambió los cobros en línea',
  'plan.pagar': 'Inició el pago del plan',
  'admin.empresa': 'El administrador de FlujoBot cambió la cuenta',
};

const ENTIDADES: Record<string, string> = { bot: 'Bots', pedido: 'Pedidos', cita: 'Citas', conversacion: 'Conversaciones', campana: 'Campañas', empresa: 'Empresa' };

/** Bitácora (solo administradores): quién cambió el flujo, quién atendió qué plática, quién movió un pedido. */
@Component({
  selector: 'app-actividad',
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './actividad.page.html',
  styleUrl: './actividad.page.css',
})
export class ActividadPage implements OnInit {
  private readonly api = inject(GestionService);
  private readonly avisos = inject(AvisosService);

  protected readonly acciones = ACCIONES;
  protected readonly entidades = Object.entries(ENTIDADES);
  protected readonly lista = signal<Actividad[]>([]);
  protected readonly entidad = signal('');
  protected readonly usuario = signal('');
  /** Personas vistas sin filtro de persona (para que el filtro no se quede con una sola opción). */
  protected readonly usuarios = signal<string[]>([]);

  async ngOnInit(): Promise<void> {
    await this.cargar();
  }

  protected filtrar(campo: 'entidad' | 'usuario', valor: string): void {
    this[campo].set(valor);
    void this.cargar();
  }

  private async cargar(): Promise<void> {
    try {
      const lista = await this.api.actividad({ entidad: this.entidad() || undefined, usuario: this.usuario() || undefined });
      this.lista.set(lista);
      if (!this.usuario()) this.usuarios.set([...new Set(lista.map((a) => a.usuario))].sort());
    } catch (e) {
      this.avisos.error(e);
    }
  }
}
