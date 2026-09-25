import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';

export type UsoImagen = 'productos' | 'logo' | 'mensajes';

interface FirmaSubida {
  url: string;
  campos: Record<string, string | number>;
}

const MAX_BYTES = 5 * 1024 * 1024;
const TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Imágenes en Cloudinary: la API firma y el navegador sube directo
 * (el archivo no pasa por nuestro servidor y el secreto nunca llega aquí).
 */
@Injectable({ providedIn: 'root' })
export class ArchivosService {
  private readonly api = inject(ApiService);

  /** Revisa tipo y peso antes de gastar la subida; devuelve el motivo o null. */
  problema(archivo: File): string | null {
    if (!TIPOS.includes(archivo.type)) return 'Usa una imagen JPG, PNG, WEBP o GIF';
    if (archivo.size > MAX_BYTES) return 'La imagen pesa más de 5 MB';
    return null;
  }

  /** Sube la imagen y devuelve su URL pública (https). */
  async subir(archivo: File, uso: UsoImagen): Promise<string> {
    const motivo = this.problema(archivo);
    if (motivo) throw { mensaje: motivo };
    const firma = await this.api.post<FirmaSubida>('/archivos/firma', { uso });
    const datos = new FormData();
    for (const [clave, valor] of Object.entries(firma.campos)) datos.append(clave, String(valor));
    datos.append('file', archivo);
    const r = await fetch(firma.url, { method: 'POST', body: datos });
    const cuerpo = await r.json().catch(() => ({}));
    if (!r.ok || !cuerpo.secure_url) throw { mensaje: cuerpo.error?.message ?? 'Cloudinary no aceptó la imagen' };
    return cuerpo.secure_url as string;
  }
}
