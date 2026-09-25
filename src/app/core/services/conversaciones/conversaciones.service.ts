import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { Conversacion, EstadoConversacion } from '../../models';

@Injectable({ providedIn: 'root' })
export class ConversacionesService {
  private readonly api = inject(ApiService);

  listar(filtro: { botId?: string; estado?: EstadoConversacion } = {}): Promise<Conversacion[]> {
    return this.api.get('/conversaciones', { params: filtro });
  }

  obtener(id: string): Promise<Conversacion> {
    return this.api.get(`/conversaciones/${id}`);
  }

  devolverAlBot(id: string): Promise<Conversacion> {
    return this.api.post(`/conversaciones/${id}/devolver-al-bot`);
  }
}
