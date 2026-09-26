import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { SesionService } from '../sesion/sesion.service';
import { Empresa, Giro, Sesion, Usuario } from '../../models';

export interface DatosRegistro {
  empresa: string;
  nombre: string;
  email: string;
  password: string;
  giro: Giro;
}

/** Entrar, registrar empresa y salir. Deja la sesión en SesionService. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly sesion = inject(SesionService);

  async entrar(email: string, password: string): Promise<void> {
    this.sesion.iniciar(await this.api.post<Sesion>('/auth/login', { email, password }));
  }

  async registrar(datos: DatosRegistro): Promise<void> {
    this.sesion.iniciar(await this.api.post<Sesion>('/auth/registro', datos));
  }

  /** Datos frescos de quien entró y de su empresa (permisos, personalización, suspensión). */
  async refrescar(): Promise<void> {
    const { usuario, empresa } = await this.api.get<{ usuario: Usuario; empresa: Empresa }>('/auth/perfil');
    this.sesion.actualizarUsuario(usuario);
    this.sesion.actualizarEmpresa(empresa);
  }

  salir(): void {
    this.sesion.cerrar();
  }
}
