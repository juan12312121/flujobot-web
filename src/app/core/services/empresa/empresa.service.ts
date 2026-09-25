import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { SesionService } from '../sesion/sesion.service';
import { CambiosEmpresa, Empresa, OpcionGiro } from '../../models';

@Injectable({ providedIn: 'root' })
export class EmpresaService {
  private readonly api = inject(ApiService);
  private readonly sesion = inject(SesionService);

  giros(): Promise<OpcionGiro[]> {
    return this.api.get('/giros');
  }

  obtener(): Promise<Empresa> {
    return this.api.get('/empresa');
  }

  /** Guarda y actualiza la sesión: tema, menú y términos cambian en todo el panel. */
  async actualizar(cambios: CambiosEmpresa): Promise<Empresa> {
    const empresa = await this.api.patch<Empresa>('/empresa', cambios);
    this.sesion.actualizarEmpresa(empresa);
    return empresa;
  }
}
