import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { Actividad, ClavePlan, Encuesta, EstadoCobros, EstadoPlan, ProveedorPago, ResumenEncuestas } from '../../models';

/** Encuestas, bitácora, plan de FlujoBot y cobros de la empresa. */
@Injectable({ providedIn: 'root' })
export class GestionService {
  private readonly api = inject(ApiService);

  encuestas(dias = 30): Promise<ResumenEncuestas & { lista: Encuesta[] }> {
    return this.api.get('/gestion/encuestas', { params: { dias } });
  }

  actividad(filtro: { entidad?: string; usuario?: string } = {}): Promise<Actividad[]> {
    return this.api.get('/gestion/actividad', { params: filtro });
  }

  plan(): Promise<EstadoPlan> {
    return this.api.get('/gestion/plan');
  }

  pagarPlan(plan: ClavePlan): Promise<{ url: string }> {
    return this.api.post('/gestion/plan/pagar', { plan });
  }

  cobros(): Promise<EstadoCobros> {
    return this.api.get('/gestion/cobros');
  }

  configurarCobros(datos: { proveedor: ProveedorPago; llave?: string; secretoWebhook?: string }): Promise<EstadoCobros> {
    return this.api.put('/gestion/cobros', datos);
  }
}
