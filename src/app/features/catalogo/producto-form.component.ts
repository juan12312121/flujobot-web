import { ChangeDetectionStrategy, Component, inject, input, OnInit, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { DatosProducto, Producto } from '../../core/models';
import { AutoEnfocarDirective } from '../../shared/directives/auto-enfocar.directive';
import { IconoComponent } from '../../shared/components/icono/icono.component';

/** Alta/edición de un producto. Presentacional: recibe el producto y emite los datos limpios. */
@Component({
  selector: 'app-producto-form',
  imports: [IconoComponent, ReactiveFormsModule, ModalComponent, AutoEnfocarDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './producto-form.component.html',
  styleUrl: './producto-form.component.css',
})
export class ProductoFormComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  readonly producto = input<Producto | null>(null);
  readonly categorias = input<string[]>([]);
  readonly guardando = input(false);
  readonly termino = input('Producto');
  /** Tipo para altas nuevas (servicio en salones, consultorios...). */
  readonly tipoInicial = input<'producto' | 'servicio'>('producto');
  readonly guardar = output<DatosProducto>();
  readonly cancelar = output<void>();
  protected enviado = false;

  protected readonly form = this.fb.group({
    tipo: ['producto' as 'producto' | 'servicio'],
    nombre: ['', Validators.required],
    precio: [0, [Validators.required, Validators.min(0)]],
    precioDesde: [false],
    duracionMin: [null as number | null],
    categoria: [''],
    descripcion: [''],
    imagenUrl: [''],
    sku: [''],
    orden: [0],
    activo: [true],
  });

  ngOnInit(): void {
    const p = this.producto();
    if (p) this.form.patchValue(p);
    else this.form.patchValue({ tipo: this.tipoInicial(), duracionMin: this.tipoInicial() === 'servicio' ? 30 : null });
  }

  protected enviar(): void {
    this.enviado = true;
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.guardar.emit({ ...v, nombre: v.nombre.trim(), categoria: v.categoria.trim(), precio: Number(v.precio),
      orden: Number(v.orden) || 0,
      duracionMin: v.tipo === 'servicio' && v.duracionMin ? Number(v.duracionMin) : null,
    });
  }
}
