import { inject, Injectable, signal } from '@angular/core';
import { ApiService } from '../api/api.service';
import { DatosModulo, Modulo, PlantillaModulo, RegistroModulo } from '../../models';

/**
 * Módulos personalizados de la empresa. `lista` es compartida: el menú lateral, el editor de bots
 * y "Mi empresa" leen la misma y se actualizan juntos.
 */
@Injectable({ providedIn: 'root' })
export class ModulosService {
  private readonly api = inject(ApiService);
  readonly lista = signal<Modulo[]>([]);
  private cargado = false;

  async cargar(forzar = false): Promise<Modulo[]> {
    if (this.cargado && !forzar) return this.lista();
    this.lista.set(await this.api.get<Modulo[]>('/modulos'));
    this.cargado = true;
    return this.lista();
  }

  porClave(clave: string): Modulo | undefined {
    return this.lista().find((m) => m.clave === clave);
  }

  plantillas(): Promise<PlantillaModulo[]> {
    return this.api.get('/modulos/plantillas');
  }

  async crear(datos: Partial<DatosModulo> & { plantilla?: string }): Promise<Modulo> {
    const m = await this.api.post<Modulo>('/modulos', datos);
    this.lista.update((l) => [...l, m]);
    return m;
  }

  async editar(id: string, cambios: Partial<DatosModulo> & { activo?: boolean }): Promise<Modulo> {
    const m = await this.api.patch<Modulo>(`/modulos/${id}`, cambios);
    this.lista.update((l) => l.map((x) => (x.id === id ? { ...m, registros: x.registros } : x)));
    return m;
  }

  async borrar(id: string): Promise<void> {
    await this.api.delete(`/modulos/${id}`);
    this.lista.update((l) => l.filter((x) => x.id !== id));
  }

  registros(moduloId: string, filtro: { texto?: string; campo?: string; valor?: string } = {}): Promise<RegistroModulo[]> {
    return this.api.get(`/modulos/${moduloId}/registros`, { params: filtro });
  }

  crearRegistro(moduloId: string, datos: Record<string, unknown>): Promise<RegistroModulo> {
    return this.api.post(`/modulos/${moduloId}/registros`, { datos });
  }

  /** `avisar`: si cambia un campo marcado para avisar (Estado...), el bot le escribe al cliente. */
  editarRegistro(moduloId: string, registroId: string, datos: Record<string, unknown>, avisar = true): Promise<RegistroModulo> {
    return this.api.patch(`/modulos/${moduloId}/registros/${registroId}`, { datos, avisar });
  }

  borrarRegistro(moduloId: string, registroId: string): Promise<void> {
    return this.api.delete(`/modulos/${moduloId}/registros/${registroId}`);
  }
}
