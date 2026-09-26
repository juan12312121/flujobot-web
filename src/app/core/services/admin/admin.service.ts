import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { ClavePlan, Empresa, EmpresaAdmin } from '../../models';

export interface CambiosEmpresaAdmin {
  activa?: boolean;
  motivo?: string;
  plan?: ClavePlan;
  vence?: string;
  sumarDias?: number;
}

/** Panel del superadministrador de FlujoBot (todas las empresas). */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly api = inject(ApiService);

  empresas(texto?: string): Promise<EmpresaAdmin[]> {
    return this.api.get('/admin/empresas', { params: { texto } });
  }

  editarEmpresa(id: string, cambios: CambiosEmpresaAdmin): Promise<Empresa> {
    return this.api.patch(`/admin/empresas/${id}`, cambios);
  }
}
