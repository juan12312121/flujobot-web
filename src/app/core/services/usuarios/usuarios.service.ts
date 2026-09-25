import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { Rol, Usuario } from '../../models';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly api = inject(ApiService);

  listar(): Promise<Usuario[]> {
    return this.api.get('/usuarios');
  }

  crear(datos: { nombre: string; email: string; password: string; rol: Rol }): Promise<Usuario> {
    return this.api.post('/usuarios', datos);
  }

  borrar(id: string): Promise<void> {
    return this.api.delete(`/usuarios/${id}`);
  }
}
