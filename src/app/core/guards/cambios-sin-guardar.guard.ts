import { CanDeactivateFn } from '@angular/router';

/** Páginas que pueden tener trabajo sin guardar (el editor de flujos). */
export interface ConCambiosPendientes {
  hayCambiosSinGuardar(): boolean;
}

/** Pregunta antes de salir si quedó algo sin guardar. */
export const cambiosSinGuardarGuard: CanDeactivateFn<ConCambiosPendientes> = (pagina) =>
  !pagina.hayCambiosSinGuardar() || confirm('Hay cambios sin guardar en el flujo. ¿Salir de todos modos?');
