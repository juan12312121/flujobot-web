import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { Resumen } from '../../models';

@Injectable({ providedIn: 'root' })
export class TableroService {
  private readonly api = inject(ApiService);

  resumen(): Promise<Resumen> {
    return this.api.get('/tablero/resumen');
  }
}
