import { afterNextRender, Directive, ElementRef, inject } from '@angular/core';

/** Enfoca el campo al aparecer (el atributo autofocus no funciona en contenido que crea Angular, como un modal). */
@Directive({ selector: '[appAutoEnfocar]' })
export class AutoEnfocarDirective {
  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    afterNextRender(() => el.focus());
  }
}
