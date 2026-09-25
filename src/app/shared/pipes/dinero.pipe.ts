import { inject, Pipe, PipeTransform } from '@angular/core';
import { SesionService } from '../../core/services/sesion/sesion.service';

/** 1234.5 → "$1,234.50" en la moneda de la empresa. */
@Pipe({ name: 'dinero' })
export class DineroPipe implements PipeTransform {
  private readonly moneda = inject(SesionService).empresa()?.moneda ?? 'MXN';

  transform(monto: number | null | undefined): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: this.moneda }).format(monto ?? 0);
  }
}
