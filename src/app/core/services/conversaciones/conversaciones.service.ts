import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { Canal, Conversacion, EstadoConversacion } from '../../models';

@Injectable({ providedIn: 'root' })
export class ConversacionesService {
  private readonly api = inject(ApiService);

  listar(filtro: { botId?: string; estado?: EstadoConversacion; canal?: Canal } = {}): Promise<Conversacion[]> {
    return this.api.get('/conversaciones', { params: filtro });
  }

  obtener(id: string): Promise<Conversacion> {
    return this.api.get(`/conversaciones/${id}`);
  }

  devolverAlBot(id: string): Promise<Conversacion> {
    return this.api.post(`/conversaciones/${id}/devolver-al-bot`);
  }

  /** Una persona del equipo toma la plática: el bot deja de contestar. */
  tomar(id: string): Promise<Conversacion> {
    return this.api.post(`/conversaciones/${id}/tomar`);
  }

  /** Mensaje del asesor: sale por el canal del cliente. */
  responder(id: string, texto: string, imagenUrl?: string): Promise<{ enviado: boolean; error: string | null; conversacion: Conversacion }> {
    return this.api.post(`/conversaciones/${id}/mensajes`, { texto, imagenUrl });
  }
}
