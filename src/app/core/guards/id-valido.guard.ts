import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

const OBJECT_ID = /^[0-9a-f]{24}$/i;

/** Una URL con un id que no puede existir en Mongo regresa a la lista en vez de mostrar un error. */
export const idValidoGuard =
  (parametro: string, regreso: string): CanActivateFn =>
  (ruta) =>
    OBJECT_ID.test(ruta.paramMap.get(parametro) ?? '') || inject(Router).createUrlTree([regreso]);
