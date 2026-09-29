import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SesionService } from '../../core/services/sesion/sesion.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { Modulos } from '../../core/models';
import { ModulosService } from '../../core/services/modulos/modulos.service';
import { ICONOS } from '../../core/iconos/iconos';
import { puede, Seccion, nombreRol } from '../../core/permisos/permisos';
import { AvisosService } from '../../core/services/avisos/avisos.service';
import { NombreIcono } from '../../core/iconos/iconos';
import { LogoEmpresaComponent } from '../../shared/components/logo-empresa/logo-empresa.component';
import { IconoComponent } from '../../shared/components/icono/icono.component';

interface Enlace {
  ruta: string;
  texto: string;
  icono: NombreIcono;
  modulo?: keyof Modulos;
  soloAdmin?: boolean;
  soloSuperadmin?: boolean;
  seccion?: Seccion;
}


/** Marco de las pantallas privadas: menú lateral con los colores, logo, palabras y módulos de la empresa. */
@Component({
  selector: 'app-shell',
  imports: [IconoComponent, RouterOutlet, RouterLink, RouterLinkActive, LogoEmpresaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly sesion = inject(SesionService);
  protected readonly menuAbierto = signal(false);
  private readonly modulosPropios = inject(ModulosService);

  protected readonly enlaces = computed(() => {
    const t = this.sesion.terminos();
    const todos: Enlace[] = [
      { ruta: '/inicio', texto: 'Inicio', icono: 'inicio', seccion: 'gestion' },
      { ruta: '/bots', texto: 'Bots', icono: 'bot', seccion: 'bots' },
      { ruta: '/agenda', texto: t.citas, icono: 'calendario', modulo: 'agenda', seccion: 'agenda' },
      { ruta: '/catalogo', texto: t.items, icono: 'paquete', modulo: 'catalogo', seccion: 'catalogo' },
      { ruta: '/pedidos', texto: this.sesion.rol() === 'repartidor' ? 'Mis entregas' : t.pedidos, icono: 'carrito', modulo: 'pedidos', seccion: 'pedidos' },
      // Módulos que armó la empresa (órdenes de servicio, inventario...)
      ...this.modulosPropios
        .lista()
        .filter((m) => m.activo)
        .map((m): Enlace => ({ ruta: `/m/${m.clave}`, texto: m.nombre, icono: (m.icono in ICONOS ? m.icono : 'registro') as NombreIcono, seccion: 'modulos' })),
      { ruta: '/conversaciones', texto: 'Conversaciones', icono: 'chat', seccion: 'conversaciones' },
      { ruta: '/campanas', texto: 'Campañas', icono: 'megafono', seccion: 'campanas' },
      { ruta: '/encuestas', texto: 'Encuestas', icono: 'estrella', seccion: 'gestion' },
      { ruta: '/equipo', texto: 'Equipo', icono: 'equipo', soloAdmin: true },
      { ruta: '/actividad', texto: 'Actividad', icono: 'historial', soloAdmin: true },
      { ruta: '/empresa', texto: 'Mi empresa', icono: 'ajustes', soloAdmin: true },
      { ruta: '/admin', texto: 'Administración', icono: 'escudo', soloSuperadmin: true },
    ];
    const modulos = this.sesion.modulos();
    return todos.filter(
      (e) =>
        (!e.soloAdmin || this.sesion.esAdmin()) &&
        (!e.soloSuperadmin || this.sesion.esSuperadmin()) &&
        (!e.modulo || modulos[e.modulo]) &&
        (!e.seccion || puede(this.sesion.rol(), e.seccion)),
    );
  });

  protected readonly iniciales = computed(() =>
    (this.sesion.usuario()?.nombre ?? '?')
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase(),
  );

  constructor() {
    // La personalización y los permisos pudieron cambiar en otra sesión: traer lo vigente
    this.auth.refrescar().catch(() => {});
    if (puede(this.sesion.rol(), 'modulos')) this.modulosPropios.cargar().catch(() => {});
  }

  protected readonly nombreRol = nombreRol;
  private readonly avisos = inject(AvisosService);
  protected readonly reenviado = signal(false);

  protected async reenviar(): Promise<void> {
    try {
      this.avisos.exito((await this.auth.reenviarVerificacion()).mensaje);
      this.reenviado.set(true);
    } catch (e) {
      this.avisos.error(e);
    }
  }

  protected salir(): void {
    this.auth.salir();
    void this.router.navigate(['/entrar']);
  }
}
