import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { DatosProducto, Producto } from '../../models';

@Injectable({ providedIn: 'root' })
export class ProductosService {
  private readonly api = inject(ApiService);

  listar(filtro: { texto?: string; categoria?: string } = {}): Promise<Producto[]> {
    return this.api.get('/productos', { params: filtro });
  }

  categorias(): Promise<string[]> {
    return this.api.get('/productos/categorias');
  }

  crear(datos: DatosProducto): Promise<Producto> {
    return this.api.post('/productos', datos);
  }

  editar(id: string, cambios: Partial<DatosProducto>): Promise<Producto> {
    return this.api.patch(`/productos/${id}`, cambios);
  }

  borrar(id: string): Promise<void> {
    return this.api.delete(`/productos/${id}`);
  }
}
