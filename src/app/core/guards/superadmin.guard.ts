import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionService } from '../services/sesion/sesion.service';

/** Panel de toda la plataforma: solo los correos en SUPERADMINS del servidor (el backend también lo exige). */
export const superadminGuard: CanActivateFn = () => inject(SesionService).esSuperadmin() || inject(Router).createUrlTree(['/inicio']);
