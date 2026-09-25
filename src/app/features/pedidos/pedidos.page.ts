import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, KeyValuePipe } from '@angular/common';
import { PedidosService } from '../../core/services/pedidos/pedidos.service';
import { AvisosService } from '../../core/services/avisos/avisos.service';
import { EstadoPedido, Pedido } from '../../core/models';
import { DineroPipe } from '../../shared/pipes/dinero.pipe';
import { SesionService } from '../../core/services/sesion/sesion.service';

const ESTADOS: EstadoPedido[] = ['nuevo', 'confirmado', 'enviado', 'entregado', 'cancelado'];
/** Variables internas del bot que no le interesan a quien atiende el pedido. */
const OCULTAS = new Set(['producto', 'cantidad', 'total', 'folio', 'opcion', 'empresa', 'telefono', 'nombre', 'cita']);

@Component({
  selector: 'app-pedidos',
  imports: [DatePipe, KeyValuePipe, DineroPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pedidos.page.html',
  styleUrl: './pedidos.page.css',
})
export class PedidosPage implements OnInit {
  private readonly api = inject(PedidosService);
  private readonly avisos = inject(AvisosService);
  protected readonly t = inject(SesionService).terminos;
  protected readonly estados = ESTADOS;
  protected readonly pedidos = signal<Pedido[]>([]);
  protected readonly filtro = signal<EstadoPedido | ''>('');
  protected readonly abierto = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await this.cargar();
  }

  protected datos(p: Pedido): Record<string, unknown> {
    return Object.fromEntries(Object.entries(p.datos ?? {}).filter(([k, v]) => !k.startsWith('_') && !OCULTAS.has(k) && typeof v !== 'object'));
  }

  protected filtrar(estado: EstadoPedido | ''): void {
    this.filtro.set(estado);
    void this.cargar();
  }

  protected async cambiar(p: Pedido, estado: EstadoPedido): Promise<void> {
    try {
      const editado = await this.api.cambiarEstado(p.id, estado);
      this.pedidos.update((l) => l.map((x) => (x.id === editado.id ? editado : x)));
    } catch (e) {
      this.avisos.error(e);
    }
  }

  private async cargar(): Promise<void> {
    try {
      this.pedidos.set(await this.api.listar({ estado: this.filtro() || undefined }));
    } catch (e) {
      this.avisos.error(e);
    }
  }
}
