import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

/** Logo de la empresa; si no tiene (o la imagen falla), sus iniciales sobre el color principal. */
@Component({
  selector: 'app-logo-empresa',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './logo-empresa.component.html',
  styleUrl: './logo-empresa.component.css',
})
export class LogoEmpresaComponent {
  readonly nombre = input('');
  readonly logoUrl = input<string | undefined>('');
  readonly color = input('var(--primario)');
  protected readonly falla = signal(false);
  protected readonly iniciales = computed(() =>
    this.nombre()
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase(),
  );
}
