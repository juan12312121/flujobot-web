import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionService } from '../services/sesion/sesion.service';
import { puede, Seccion } from '../permisos/permisos';

/** Pantalla solo para los roles con esa sección; los demás van a su pantalla de inicio. */
export const permisoGuard =
  (seccion: Seccion): CanActivateFn =>
  () => {
    const sesion = inject(SesionService);
    if (puede(sesion.usuario()?.rol, seccion)) return true;
    return inject(Router).createUrlTree([sesion.usuario()?.rol === 'repartidor' ? '/pedidos' : '/inicio']);
  };
