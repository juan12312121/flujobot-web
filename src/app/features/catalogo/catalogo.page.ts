import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ProductosService } from '../../core/services/productos/productos.service';
import { AvisosService } from '../../core/services/avisos/avisos.service';
import { DatosProducto, Producto } from '../../core/models';
import { DineroPipe } from '../../shared/pipes/dinero.pipe';
import { ProductoFormComponent } from './producto-form.component';
import { SesionService } from '../../core/services/sesion/sesion.service';

@Component({
  selector: 'app-catalogo',
  imports: [DineroPipe, ProductoFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './catalogo.page.html',
  styleUrl: './catalogo.page.css',
})
export class CatalogoPage implements OnInit {
  private readonly api = inject(ProductosService);
  private readonly avisos = inject(AvisosService);
  protected readonly t = inject(SesionService).terminos;
  /** Si la empresa llama "Servicios" (o cursos, consultas) a lo que ofrece, las altas nuevas son servicios. */
  protected readonly tipoInicial = computed(() => (/servicio|curso|consulta/i.test(this.t().items) ? 'servicio' : 'producto'));

  protected readonly productos = signal<Producto[]>([]);
  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly texto = signal('');
  protected readonly categoria = signal('');
  protected readonly editando = signal<Producto | 'nuevo' | null>(null);

  protected readonly categorias = computed(() => [...new Set(this.productos().map((p) => p.categoria).filter(Boolean))].sort());
  protected readonly visibles = computed(() => {
    const t = this.texto().trim().toLowerCase();
    return this.productos().filter((p) => (!t || p.nombre.toLowerCase().includes(t)) && (!this.categoria() || p.categoria === this.categoria()));
  });

  async ngOnInit(): Promise<void> {
    try {
      this.productos.set(await this.api.listar());
    } catch (e) {
      this.avisos.error(e);
    } finally {
      this.cargando.set(false);
    }
  }

  protected async guardar(datos: DatosProducto): Promise<void> {
    const actual = this.editando();
    this.guardando.set(true);
    try {
      if (actual && actual !== 'nuevo') {
        const editado = await this.api.editar(actual.id, datos);
        this.productos.update((l) => l.map((p) => (p.id === editado.id ? editado : p)));
      } else {
        const nuevo = await this.api.crear(datos);
        this.productos.update((l) => [...l, nuevo]);
      }
      this.editando.set(null);
      this.avisos.exito(`${this.t().item} guardado`);
    } catch (e) {
      this.avisos.error(e);
    } finally {
      this.guardando.set(false);
    }
  }

  protected async alternar(p: Producto): Promise<void> {
    try {
      const editado = await this.api.editar(p.id, { activo: !p.activo });
      this.productos.update((l) => l.map((x) => (x.id === editado.id ? editado : x)));
    } catch (e) {
      this.avisos.error(e);
    }
  }

  protected async borrar(p: Producto): Promise<void> {
    if (!confirm(`¿Borrar "${p.nombre}"?`)) return;
    try {
      await this.api.borrar(p.id);
      this.productos.update((l) => l.filter((x) => x.id !== p.id));
    } catch (e) {
      this.avisos.error(e);
    }
  }
}
