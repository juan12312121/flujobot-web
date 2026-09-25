import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SesionService } from '../../core/services/sesion/sesion.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { EmpresaService } from '../../core/services/empresa/empresa.service';
import { Modulos } from '../../core/models';
import { NombreIcono } from '../../core/iconos/iconos';
import { LogoEmpresaComponent } from '../../shared/components/logo-empresa/logo-empresa.component';
import { IconoComponent } from '../../shared/components/icono/icono.component';

interface Enlace {
  ruta: string;
  texto: string;
  icono: NombreIcono;
  modulo?: keyof Modulos;
  soloAdmin?: boolean;
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

  protected readonly enlaces = computed(() => {
    const t = this.sesion.terminos();
    const todos: Enlace[] = [
      { ruta: '/inicio', texto: 'Inicio', icono: 'inicio' },
      { ruta: '/bots', texto: 'Bots', icono: 'bot' },
      { ruta: '/agenda', texto: t.citas, icono: 'calendario', modulo: 'agenda' },
      { ruta: '/catalogo', texto: t.items, icono: 'paquete', modulo: 'catalogo' },
      { ruta: '/pedidos', texto: t.pedidos, icono: 'carrito', modulo: 'pedidos' },
      { ruta: '/conversaciones', texto: 'Conversaciones', icono: 'chat' },
      { ruta: '/equipo', texto: 'Equipo', icono: 'equipo', soloAdmin: true },
      { ruta: '/empresa', texto: 'Mi empresa', icono: 'ajustes', soloAdmin: true },
    ];
    const modulos = this.sesion.modulos();
    return todos.filter((e) => (!e.soloAdmin || this.sesion.esAdmin()) && (!e.modulo || modulos[e.modulo]));
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
    // La personalización pudo cambiar en otra sesión (otro admin, otro equipo): traer la vigente
    inject(EmpresaService)
      .obtener()
      .then((empresa) => this.sesion.actualizarEmpresa(empresa))
      .catch(() => {});
  }

  protected salir(): void {
    this.auth.salir();
    void this.router.navigate(['/entrar']);
  }
}
