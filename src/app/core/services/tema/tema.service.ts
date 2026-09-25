import { DOCUMENT, effect, inject, Injectable, signal } from '@angular/core';
import { SesionService } from '../sesion/sesion.service';
import { Marca } from '../../models';

const PREDETERMINADO: Marca = { colorPrimario: '#12a150', colorMenu: '#0f1b17', logoUrl: '' };

/** Luminancia relativa (WCAG) de un color #RRGGBB. */
function luminancia(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Texto legible encima de un fondo: blanco sobre oscuros, casi negro sobre claros. */
export const textoSobre = (fondo: string) => (luminancia(fondo) > 0.45 ? '#101828' : '#ffffff');

/**
 * Aplica los colores de la empresa como variables CSS en <html>. Todo el panel se pinta
 * con var(--primario) y var(--menu), así que cambiar la marca recolorea todo al instante.
 * `vistaPrevia` permite probar colores en "Mi empresa" antes de guardarlos.
 */
@Injectable({ providedIn: 'root' })
export class TemaService {
  private readonly raiz = inject(DOCUMENT).documentElement;
  private readonly sesion = inject(SesionService);
  readonly vistaPrevia = signal<Partial<Marca> | null>(null);

  constructor() {
    effect(() => this.aplicar({ ...PREDETERMINADO, ...(this.sesion.empresa()?.marca ?? {}), ...(this.vistaPrevia() ?? {}) }));
  }

  private aplicar({ colorPrimario, colorMenu }: Marca): void {
    const oscuro = textoSobre(colorMenu) === '#ffffff';
    const variables: Record<string, string> = {
      '--primario': colorPrimario,
      '--sobre-primario': textoSobre(colorPrimario),
      '--menu': colorMenu,
      '--menu-texto': oscuro ? 'rgb(255 255 255 / 78%)' : 'rgb(16 24 40 / 75%)',
      '--menu-fuerte': oscuro ? '#ffffff' : '#101828',
      '--menu-suave': oscuro ? 'rgb(255 255 255 / 50%)' : 'rgb(16 24 40 / 50%)',
      '--menu-hover': oscuro ? 'rgb(255 255 255 / 7%)' : 'rgb(16 24 40 / 6%)',
      '--menu-borde': oscuro ? 'rgb(255 255 255 / 9%)' : 'rgb(16 24 40 / 10%)',
    };
    for (const [k, v] of Object.entries(variables)) this.raiz.style.setProperty(k, v);
  }
}
