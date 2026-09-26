import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { Empresa, EmpresaAdmin } from '../../models';

/** Panel del superadministrador de FlujoBot (todas las empresas). */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly api = inject(ApiService);

  empresas(texto?: string): Promise<EmpresaAdmin[]> {
    return this.api.get('/admin/empresas', { params: { texto } });
  }

  /** Suspender (con motivo) o reactivar. */
  editarEmpresa(id: string, cambios: { activa: boolean; motivo?: string }): Promise<Empresa> {
    return this.api.patch(`/admin/empresas/${id}`, cambios);
  }
}
