import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { Campana, ConteoSegmento, Contacto, DatosCampana, TipoSegmento } from '../../models';

/** Campañas: mensajes masivos solo a contactos que aceptaron promociones. */
@Injectable({ providedIn: 'root' })
export class CampanasService {
  private readonly api = inject(ApiService);

  listar(): Promise<Campana[]> {
    return this.api.get('/campanas');
  }

  crear(datos: DatosCampana): Promise<Campana> {
    return this.api.post('/campanas', datos);
  }

  editar(id: string, cambios: Partial<DatosCampana>): Promise<Campana> {
    return this.api.patch(`/campanas/${id}`, cambios);
  }

  borrar(id: string): Promise<void> {
    return this.api.delete(`/campanas/${id}`);
  }

  /** Sin `cuando` se manda ahora (en la siguiente vuelta del programador). */
  programar(id: string, cuando: string | null): Promise<Campana & { destinatariosEstimados: number }> {
    return this.api.post(`/campanas/${id}/programar`, { cuando });
  }

  cancelar(id: string): Promise<Campana> {
    return this.api.post(`/campanas/${id}/cancelar`);
  }

  contar(tipo: TipoSegmento, dias: number): Promise<ConteoSegmento> {
    return this.api.get('/campanas/segmento', { params: { tipo, dias } });
  }

  contactos(permiso?: boolean): Promise<Contacto[]> {
    return this.api.get('/campanas/contactos', { params: { permiso } });
  }
}
