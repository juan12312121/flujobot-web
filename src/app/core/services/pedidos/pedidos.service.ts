import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { EstadoPedido, Pedido } from '../../models';

@Injectable({ providedIn: 'root' })
export class PedidosService {
  private readonly api = inject(ApiService);

  listar(filtro: { estado?: EstadoPedido } = {}): Promise<Pedido[]> {
    return this.api.get('/pedidos', { params: filtro });
  }

  cambiarEstado(id: string, estado: EstadoPedido): Promise<Pedido> {
    return this.api.patch(`/pedidos/${id}/estado`, { estado });
  }
}
