import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { EstadoPago, EstadoPedido, Pedido } from '../../models';

@Injectable({ providedIn: 'root' })
export class PedidosService {
  private readonly api = inject(ApiService);

  listar(filtro: { estado?: EstadoPedido; pago?: EstadoPago } = {}): Promise<Pedido[]> {
    return this.api.get('/pedidos', { params: filtro });
  }

  /** `avisar`: le manda al cliente el mensaje del nuevo estado por su canal. */
  cambiarEstado(id: string, estado: EstadoPedido, avisar = true): Promise<Pedido> {
    return this.api.patch(`/pedidos/${id}/estado`, { estado, avisar });
  }

  marcarPagado(id: string): Promise<Pedido> {
    return this.api.post(`/pedidos/${id}/pagado`);
  }
}
