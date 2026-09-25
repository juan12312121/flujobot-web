import { computed, inject, Injectable, signal } from '@angular/core';
import { AlmacenamientoService } from '../almacenamiento/almacenamiento.service';
import { Empresa, Modulos, Sesion, Terminos } from '../../models';

const CLAVE = 'flujobot.sesion';

const TERMINOS_BASE: Terminos = {
  item: 'Producto',
  items: 'Productos',
  pedido: 'Pedido',
  pedidos: 'Pedidos',
  cita: 'Cita',
  citas: 'Citas',
  cliente: 'Cliente',
  clientes: 'Clientes',
};
const MODULOS_BASE: Modulos = { catalogo: true, pedidos: true, agenda: false };

/**
 * Estado de la sesión en signals. Es la fuente de verdad de "quién soy y de qué empresa";
 * guards, interceptores, el tema y los componentes la leen de aquí.
 */
@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly almacenamiento = inject(AlmacenamientoService);
  private readonly sesion = signal<Sesion | null>(this.almacenamiento.leer<Sesion>(CLAVE));

  readonly token = computed(() => this.sesion()?.token ?? null);
  readonly usuario = computed(() => this.sesion()?.usuario ?? null);
  readonly empresa = computed(() => this.sesion()?.empresa ?? null);
  readonly autenticado = computed(() => this.token() !== null);
  readonly esAdmin = computed(() => this.usuario()?.rol === 'admin');
  /** Palabras del panel según la empresa ("Servicios", "Pacientes"...). */
  readonly terminos = computed<Terminos>(() => ({ ...TERMINOS_BASE, ...(this.empresa()?.terminos ?? {}) }));
  readonly modulos = computed<Modulos>(() => ({ ...MODULOS_BASE, ...(this.empresa()?.modulos ?? {}) }));

  iniciar(sesion: Sesion): void {
    this.sesion.set(sesion);
    this.almacenamiento.guardar(CLAVE, sesion);
  }

  /** Tras personalizar la empresa: el tema, el menú y los textos se actualizan solos. */
  actualizarEmpresa(empresa: Empresa): void {
    const actual = this.sesion();
    if (actual) this.iniciar({ ...actual, empresa });
  }

  cerrar(): void {
    this.sesion.set(null);
    this.almacenamiento.borrar(CLAVE);
  }
}
