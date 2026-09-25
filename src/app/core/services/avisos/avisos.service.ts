import { Injectable, signal } from '@angular/core';
import { ErrorApi } from '../../models';

export interface Aviso {
  id: number;
  tipo: 'exito' | 'error' | 'info';
  texto: string;
}

/** Toasts globales. Cualquier store o página avisa aquí y el shell los pinta. */
@Injectable({ providedIn: 'root' })
export class AvisosService {
  private siguiente = 1;
  readonly lista = signal<Aviso[]>([]);

  exito(texto: string): void {
    this.mostrar('exito', texto);
  }

  info(texto: string): void {
    this.mostrar('info', texto);
  }

  /** Acepta un ErrorApi del interceptor o cualquier otra cosa. */
  error(e: unknown, respaldo = 'Algo salió mal'): void {
    this.mostrar('error', (e as Partial<ErrorApi>)?.mensaje ?? respaldo);
  }

  quitar(id: number): void {
    this.lista.update((l) => l.filter((a) => a.id !== id));
  }

  private mostrar(tipo: Aviso['tipo'], texto: string): void {
    const id = this.siguiente++;
    this.lista.update((l) => [...l.slice(-3), { id, tipo, texto }]);
    setTimeout(() => this.quitar(id), tipo === 'error' ? 6000 : 3500);
  }
}
