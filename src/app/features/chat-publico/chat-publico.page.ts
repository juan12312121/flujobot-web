import { ChangeDetectionStrategy, Component, DOCUMENT, inject, input, OnDestroy, OnInit } from '@angular/core';
import { API_URL } from '../../core/config/api-url.token';

/**
 * Enlace directo al chat de un negocio (/c/CLAVE): para ponerlo en Instagram, Facebook o una tarjeta.
 * Carga el mismo globito del chat web, pero a pantalla completa.
 */
@Component({
  selector: 'app-chat-publico',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chat-publico.page.html',
  styleUrl: './chat-publico.page.css',
})
export class ChatPublicoPage implements OnInit, OnDestroy {
  private readonly documento = inject(DOCUMENT);
  private readonly api = inject(API_URL);
  readonly clave = input.required<string>();
  private script?: HTMLScriptElement;

  ngOnInit(): void {
    this.script = Object.assign(this.documento.createElement('script'), { src: '/widget.js', async: true });
    this.script.dataset['clave'] = this.clave();
    this.script.dataset['api'] = this.api;
    this.script.dataset['modo'] = 'pagina';
    this.documento.body.appendChild(this.script);
  }

  ngOnDestroy(): void {
    this.script?.remove();
    this.documento.querySelector(`[data-flujobot="${this.clave()}"]`)?.remove();
  }
}
