import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, KeyValuePipe } from '@angular/common';
import { PedidosService } from '../../core/services/pedidos/pedidos.service';
import { AvisosService } from '../../core/services/avisos/avisos.service';
import { EstadoPago, EstadoPedido, Pedido, Usuario } from '../../core/models';
import { UsuariosService } from '../../core/services/usuarios/usuarios.service';
import { DineroPipe } from '../../shared/pipes/dinero.pipe';
import { SesionService } from '../../core/services/sesion/sesion.service';
import { IconoComponent } from '../../shared/components/icono/icono.component';

/** Cómo se le dice al cliente cada estado (lo mismo que recibe en su aviso). */
export const ESTADOS_PEDIDO: { valor: EstadoPedido; texto: string }[] = [
  { valor: 'nuevo', texto: 'Recibido' },
  { valor: 'confirmado', texto: 'Confirmado' },
  { valor: 'preparando', texto: 'En preparación' },
  { valor: 'enviado', texto: 'En camino' },
  { valor: 'listo', texto: 'Listo para recoger' },
  { valor: 'entregado', texto: 'Entregado' },
  { valor: 'cancelado', texto: 'Cancelado' },
];

const PAGOS: Record<EstadoPago, string> = { sin_cobro: '', pendiente: 'Pago pendiente', pagado: 'Pagado', fallido: 'Pago rechazado' };
const CANALES: Record<string, string> = { whatsapp: 'WhatsApp', web: 'Chat web', telegram: 'Telegram', messenger: 'Messenger', instagram: 'Instagram' };

/** Variables internas del bot que no le interesan a quien atiende el pedido. */
const OCULTAS = new Set(['producto', 'cantidad', 'total', 'folio', 'opcion', 'empresa', 'telefono', 'nombre', 'cita', 'linkPago', 'ultimoPedido']);

@Component({
  selector: 'app-pedidos',
  imports: [DatePipe, KeyValuePipe, DineroPipe, IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pedidos.page.html',
  styleUrl: './pedidos.page.css',
})
export class PedidosPage implements OnInit {
  private readonly api = inject(PedidosService);
  private readonly avisos = inject(AvisosService);
  private readonly usuariosApi = inject(UsuariosService);
  private readonly sesion = inject(SesionService);
  protected readonly t = this.sesion.terminos;
  /** El repartidor ve solo sus entregas, en tarjetas grandes para el celular. */
  protected readonly esRepartidor = this.sesion.rol() === 'repartidor';
  protected readonly estados = this.esRepartidor ? ESTADOS_PEDIDO.filter((e) => ['enviado', 'entregado'].includes(e.valor)) : ESTADOS_PEDIDO;
  protected readonly repartidores = signal<Usuario[]>([]);
  protected readonly pagos = PAGOS;
  protected readonly canales = CANALES;
  protected readonly pedidos = signal<Pedido[]>([]);
  protected readonly filtro = signal<EstadoPedido | ''>('');
  protected readonly filtroPago = signal<EstadoPago | ''>('');
  protected readonly abierto = signal<string | null>(null);
  /** Avisarle al cliente cuando cambia el estado (se puede apagar para cambios internos). */
  protected readonly avisar = signal(true);

  async ngOnInit(): Promise<void> {
    if (!this.esRepartidor) {
      this.usuariosApi
        .listar()
        .then((l) => this.repartidores.set(l.filter((u) => u.rol === 'repartidor')))
        .catch(() => {});
    }
    await this.cargar();
  }

  protected textoEstado(estado: EstadoPedido): string {
    return ESTADOS_PEDIDO.find((e) => e.valor === estado)?.texto ?? estado;
  }

  protected async asignar(p: Pedido, usuarioId: string): Promise<void> {
    try {
      const editado = await this.api.asignarRepartidor(p.id, usuarioId || null);
      this.pedidos.update((l) => l.map((x) => (x.id === editado.id ? editado : x)));
      this.avisos.exito(usuarioId ? `${p.folio} asignado a ${editado.repartidorNombre}` : `${p.folio} sin repartidor`);
    } catch (e) {
      this.avisos.error(e);
    }
  }

  /** Dirección para abrir en el mapa (el bot la guarda en "direccion" si la pregunta). */
  protected direccion(p: Pedido): string {
    const d = p.datos?.['direccion'];
    return typeof d === 'string' ? d : '';
  }

  protected mapa(p: Pedido): string {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(this.direccion(p))}`;
  }

  protected datos(p: Pedido): Record<string, unknown> {
    return Object.fromEntries(Object.entries(p.datos ?? {}).filter(([k, v]) => !k.startsWith('_') && !OCULTAS.has(k) && typeof v !== 'object'));
  }

  protected contacto(p: Pedido): string {
    if (p.canal === 'web') return 'Chat web';
    return p.canal === 'whatsapp' || !p.canal ? `+${p.contacto}` : this.canales[p.canal] ?? p.canal;
  }

  protected filtrar(estado: EstadoPedido | ''): void {
    this.filtro.set(estado);
    void this.cargar();
  }

  protected filtrarPago(pago: EstadoPago | ''): void {
    this.filtroPago.set(pago);
    void this.cargar();
  }

  protected async cambiar(p: Pedido, estado: EstadoPedido): Promise<void> {
    try {
      const editado = await this.api.cambiarEstado(p.id, estado, this.avisar());
      this.pedidos.update((l) => l.map((x) => (x.id === editado.id ? editado : x)));
      if (editado.aviso?.enviado) this.avisos.exito(`Se le avisó al ${this.t().cliente.toLowerCase()}`);
      else if (editado.aviso?.error) this.avisos.info(`Estado guardado, pero no se pudo avisar: ${editado.aviso.error}`);
    } catch (e) {
      this.avisos.error(e);
    }
  }

  protected async marcarPagado(p: Pedido): Promise<void> {
    try {
      const editado = await this.api.marcarPagado(p.id);
      this.pedidos.update((l) => l.map((x) => (x.id === editado.id ? editado : x)));
      this.avisos.exito(`${p.folio} marcado como pagado`);
    } catch (e) {
      this.avisos.error(e);
    }
  }

  private async cargar(): Promise<void> {
    try {
      this.pedidos.set(await this.api.listar({ estado: this.filtro() || undefined, pago: this.filtroPago() || undefined }));
    } catch (e) {
      this.avisos.error(e);
    }
  }
}
