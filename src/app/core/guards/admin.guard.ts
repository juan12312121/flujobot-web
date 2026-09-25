import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionService } from '../services/sesion/sesion.service';

/** Pantallas solo para el admin de la empresa (equipo). Un editor regresa al inicio. */
export const adminGuard: CanActivateFn = () => inject(SesionService).esAdmin() || inject(Router).createUrlTree(['/inicio']);
