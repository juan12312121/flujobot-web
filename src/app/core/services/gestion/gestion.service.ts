import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { Actividad, Encuesta, EstadoCobros, ProveedorPago, ResumenEncuestas } from '../../models';

/** Encuestas, bitácora y cobros de la empresa. */
@Injectable({ providedIn: 'root' })
export class GestionService {
  private readonly api = inject(ApiService);

  encuestas(dias = 30): Promise<ResumenEncuestas & { lista: Encuesta[] }> {
    return this.api.get('/gestion/encuestas', { params: { dias } });
  }

  actividad(filtro: { entidad?: string; usuario?: string } = {}): Promise<Actividad[]> {
    return this.api.get('/gestion/actividad', { params: filtro });
  }

  cobros(): Promise<EstadoCobros> {
    return this.api.get('/gestion/cobros');
  }

  configurarCobros(datos: { proveedor: ProveedorPago; llave?: string; secretoWebhook?: string }): Promise<EstadoCobros> {
    return this.api.put('/gestion/cobros', datos);
  }
}
