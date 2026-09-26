import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { GestionService } from '../../../core/services/gestion/gestion.service';
import { AvisosService } from '../../../core/services/avisos/avisos.service';
import { EstadoCobros, ProveedorPago } from '../../../core/models';
import { IconoComponent } from '../../../shared/components/icono/icono.component';

/**
 * Cobro dentro de la plática: la empresa conecta SU cuenta de Mercado Pago o Stripe y el bloque
 * "Registrar pedido" (con "Cobrar en línea") manda el link de pago. Se guarda al momento, aparte del resto de Mi empresa.
 */
@Component({
  selector: 'app-cobros',
  imports: [IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cobros.component.html',
  styleUrl: './cobros.component.css',
})
export class CobrosComponent implements OnInit {
  private readonly api = inject(GestionService);
  private readonly avisos = inject(AvisosService);

  protected readonly estado = signal<EstadoCobros | null>(null);
  protected readonly proveedor = signal<ProveedorPago>('ninguno');
  protected readonly guardando = signal(false);

  async ngOnInit(): Promise<void> {
    try {
      const e = await this.api.cobros();
      this.estado.set(e);
      this.proveedor.set(e.proveedor);
    } catch (err) {
      this.avisos.error(err);
    }
  }

  protected async guardar(llave: string, secretoWebhook: string): Promise<void> {
    this.guardando.set(true);
    try {
      const e = await this.api.configurarCobros({ proveedor: this.proveedor(), llave: llave.trim() || undefined, secretoWebhook: secretoWebhook.trim() || undefined });
      this.estado.set(e);
      this.avisos.exito(e.proveedor === 'ninguno' ? 'Cobros en línea apagados' : 'Cuenta de cobro guardada');
    } catch (err) {
      this.avisos.error(err);
    } finally {
      this.guardando.set(false);
    }
  }

  protected async copiar(texto: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(texto);
      this.avisos.exito('Copiado');
    } catch {
      this.avisos.info('Selecciona el texto y cópialo con Ctrl+C');
    }
  }
}
