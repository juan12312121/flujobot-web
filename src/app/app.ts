import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AvisosComponent } from './shared/components/avisos/avisos.component';
import { TemaService } from './core/services/tema/tema.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AvisosComponent],
  templateUrl: './app.html',
})
export class App {
  /** Se crea al arrancar para pintar el panel con los colores de la empresa. */
  private readonly tema = inject(TemaService);
}
