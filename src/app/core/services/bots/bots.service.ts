import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import {
  Bot,
  BotDetalle,
  ChatWeb,
  ResultadosBot,
  Conexion,
  EstadoWhatsApp,
  NodoFlujo,
  Problema,
  Recuperacion,
  ResultadoPublicar,
  ResultadoSimulacion,
  VersionBot,
} from '../../models';

export type Plantilla = 'tienda' | 'citas' | 'informacion' | 'prospectos' | 'vacio';

@Injectable({ providedIn: 'root' })
export class BotsService {
  private readonly api = inject(ApiService);

  listar(): Promise<Bot[]> {
    return this.api.get('/bots');
  }

  obtener(id: string): Promise<BotDetalle> {
    return this.api.get(`/bots/${id}`);
  }

  crear(datos: { nombre: string; descripcion?: string; plantilla?: Plantilla; flujo?: { nodos: NodoFlujo[]; conexiones: Conexion[] } }): Promise<BotDetalle> {
    return this.api.post('/bots', datos);
  }

  editar(id: string, cambios: { nombre?: string; descripcion?: string }): Promise<Bot> {
    return this.api.patch(`/bots/${id}`, cambios);
  }

  borrar(id: string): Promise<void> {
    return this.api.delete(`/bots/${id}`);
  }

  guardarFlujo(id: string, nodos: NodoFlujo[], conexiones: Conexion[]): Promise<{ version: number; fecha: string; problemas: Problema[] }> {
    return this.api.put(`/bots/${id}/flujo`, { nodos, conexiones });
  }

  publicar(id: string): Promise<ResultadoPublicar> {
    return this.api.post(`/bots/${id}/publicar`);
  }

  workflowN8n(id: string): Promise<unknown> {
    return this.api.get(`/bots/${id}/workflow-n8n`);
  }

  simular(id: string, texto: string): Promise<ResultadoSimulacion> {
    return this.api.post(`/bots/${id}/simulador`, { texto });
  }

  reiniciarSimulador(id: string): Promise<void> {
    return this.api.delete(`/bots/${id}/simulador`);
  }

  conectarWhatsApp(id: string): Promise<{ estado: EstadoWhatsApp; qr: string | null; codigo?: string | null }> {
    return this.api.post(`/bots/${id}/whatsapp/conectar`);
  }

  estadoWhatsApp(id: string): Promise<{ estado: EstadoWhatsApp; configurado: boolean }> {
    return this.api.get(`/bots/${id}/whatsapp`);
  }

  configurarWeb(id: string, cambios: Partial<Omit<ChatWeb, 'clave'>>): Promise<ChatWeb> {
    return this.api.put(`/bots/${id}/web`, cambios);
  }

  resultados(id: string, dias: number): Promise<ResultadosBot> {
    return this.api.get(`/bots/${id}/resultados`, { params: { dias } });
  }

  desconectarWhatsApp(id: string): Promise<{ estado: EstadoWhatsApp }> {
    return this.api.post(`/bots/${id}/whatsapp/desconectar`);
  }

  versiones(id: string): Promise<VersionBot[]> {
    return this.api.get(`/bots/${id}/versiones`);
  }

  /** Regresa el borrador a esa publicación (no publica solo). */
  restaurarVersion(id: string, versionId: string): Promise<{ version: number; restaurada: number }> {
    return this.api.post(`/bots/${id}/versiones/${versionId}/restaurar`);
  }

  conectarTelegram(id: string, token: string): Promise<{ activo: boolean; usuario: string; enlace: string }> {
    return this.api.put(`/bots/${id}/telegram`, { token });
  }

  desconectarTelegram(id: string): Promise<void> {
    return this.api.delete(`/bots/${id}/telegram`);
  }

  conectarMeta(id: string, token: string): Promise<{ activo: boolean; pagina: string; paginaId: string; instagram: boolean }> {
    return this.api.put(`/bots/${id}/meta`, { token });
  }

  desconectarMeta(id: string): Promise<void> {
    return this.api.delete(`/bots/${id}/meta`);
  }

  configurarRecuperacion(id: string, cambios: Partial<Recuperacion>): Promise<Recuperacion> {
    return this.api.put(`/bots/${id}/recuperacion`, cambios);
  }
}
