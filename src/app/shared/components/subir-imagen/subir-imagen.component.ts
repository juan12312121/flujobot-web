import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { ArchivosService, UsoImagen } from '../../../core/services/archivos/archivos.service';
import { AvisosService } from '../../../core/services/avisos/avisos.service';
import { IconoComponent } from '../icono/icono.component';

/** Campo de imagen: subir desde la computadora (o arrastrar), ver la miniatura, quitarla o pegar una URL. */
@Component({
  selector: 'app-subir-imagen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconoComponent],
  templateUrl: './subir-imagen.component.html',
  styleUrl: './subir-imagen.component.css',
})
export class SubirImagenComponent {
  private readonly archivos = inject(ArchivosService);
  private readonly avisos = inject(AvisosService);

  readonly url = input<string | undefined>('');
  readonly uso = input.required<UsoImagen>();
  readonly cambio = output<string>();

  protected readonly subiendo = signal(false);
  protected readonly encima = signal(false);
  protected readonly verUrl = signal(false);

  protected elegir(evento: Event): void {
    const campo = evento.target as HTMLInputElement;
    const archivo = campo.files?.[0];
    campo.value = '';
    if (archivo) void this.subir(archivo);
  }

  protected soltar(evento: DragEvent): void {
    evento.preventDefault();
    this.encima.set(false);
    const archivo = evento.dataTransfer?.files?.[0];
    if (archivo) void this.subir(archivo);
  }

  protected arrastrando(evento: DragEvent, encima: boolean): void {
    evento.preventDefault();
    this.encima.set(encima);
  }

  protected pegarUrl(evento: Event): void {
    this.cambio.emit((evento.target as HTMLInputElement).value.trim());
  }

  private async subir(archivo: File): Promise<void> {
    const motivo = this.archivos.problema(archivo);
    if (motivo) return this.avisos.error({ mensaje: motivo });
    this.subiendo.set(true);
    try {
      this.cambio.emit(await this.archivos.subir(archivo, this.uso()));
      this.avisos.exito('Imagen subida');
    } catch (e) {
      this.avisos.error(e, 'No se pudo subir la imagen');
    } finally {
      this.subiendo.set(false);
    }
  }
}
