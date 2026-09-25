import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { Cita, EstadoCita, NuevaCita } from '../../models';

@Injectable({ providedIn: 'root' })
export class CitasService {
  private readonly api = inject(ApiService);

  /** desde/hasta: 'AAAA-MM-DD' en la zona horaria de la empresa. */
  listar(filtro: { desde?: string; hasta?: string; estado?: EstadoCita } = {}): Promise<Cita[]> {
    return this.api.get('/citas', { params: filtro });
  }

  crear(datos: NuevaCita): Promise<Cita> {
    return this.api.post('/citas', datos);
  }

  actualizar(id: string, cambios: { estado?: EstadoCita; notas?: string }): Promise<Cita> {
    return this.api.patch(`/citas/${id}`, cambios);
  }
}
