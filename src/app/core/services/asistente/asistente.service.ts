import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { Conexion, NodoFlujo, PropuestaFlujo, PropuestaTarea, TareaPublicada } from '../../models';

/** Asistente de IA: convierte lo que la persona describe en un flujo de bloques. */
@Injectable({ providedIn: 'root' })
export class AsistenteService {
  private readonly api = inject(ApiService);

  /** Sin `base` arma un flujo nuevo; con `base` modifica ese flujo según la descripción. */
  generar(descripcion: string, base?: { nodos: NodoFlujo[]; conexiones: Conexion[] }): Promise<PropuestaFlujo> {
    return this.api.post('/asistente/flujos', { descripcion, base });
  }

  /** "Avísame por correo cuando entre un pedido" → acciones de n8n propuestas. */
  tarea(descripcion: string, base?: { nodos: NodoFlujo[]; conexiones: Conexion[] }): Promise<PropuestaTarea> {
    return this.api.post('/asistente/tareas', { descripcion, base });
  }

  /** Crea en n8n la tarea aceptada; devuelve la URL para el bloque "Tarea en n8n". */
  publicarTarea(propuesta: PropuestaTarea): Promise<TareaPublicada> {
    return this.api.post('/asistente/tareas/publicar', { propuesta: { nombre: propuesta.nombre, respuesta: propuesta.respuesta, acciones: propuesta.acciones } });
  }
}
