import { CampoModulo } from '../../core/models';

const FECHA = new Intl.DateTimeFormat('es-MX', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' });
const DINERO = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

/** Cómo se ve el valor de un campo en la tabla ("$1,200.00", "Sí", "12 mar 2026"...). */
export function valorLegible(campo: CampoModulo, valor: unknown): string {
  if (valor === null || valor === undefined || valor === '') return '—';
  switch (campo.tipo) {
    case 'sino':
      return valor ? 'Sí' : 'No';
    case 'dinero':
      return DINERO.format(Number(valor));
    case 'numero':
      return Number(valor).toLocaleString('es-MX');
    case 'fecha':
      return FECHA.format(new Date(`${valor}T12:00:00Z`));
    default:
      return String(valor);
  }
}
