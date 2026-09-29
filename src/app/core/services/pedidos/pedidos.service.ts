import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { EstadoPago, EstadoPedido, Pedido } from '../../models';

@Injectable({ providedIn: 'root' })
export class PedidosService {
  private readonly api = inject(ApiService);

  listar(filtro: { estado?: EstadoPedido; pago?: EstadoPago; repartidorId?: string } = {}): Promise<Pedido[]> {
    return this.api.get('/pedidos', { params: filtro });
  }

  /** `avisar`: le manda al cliente el mensaje del nuevo estado por su canal. */
  cambiarEstado(id: string, estado: EstadoPedido, avisar = true): Promise<Pedido> {
    return this.api.patch(`/pedidos/${id}/estado`, { estado, avisar });
  }

  /** usuarioId null = quitar el repartidor. */
  asignarRepartidor(id: string, usuarioId: string | null): Promise<Pedido> {
    return this.api.put(`/pedidos/${id}/repartidor`, { usuarioId });
  }

  marcarPagado(id: string): Promise<Pedido> {
    return this.api.post(`/pedidos/${id}/pagado`);
  }
}
