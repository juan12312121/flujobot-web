import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';
import { SesionService } from '../../core/services/sesion/sesion.service';
import { ErrorApi } from '../../core/models';
import { IconoComponent } from '../../shared/components/icono/icono.component';

type Modo = 'recuperar' | 'restablecer' | 'verificar';

/**
 * Pantallas de cuenta que se abren desde el login o desde un correo:
 * - /recuperar: pedir el enlace para cambiar la contraseña,
 * - /restablecer?token=…: elegir la nueva contraseña,
 * - /verificar?token=…: confirmar el correo.
 */
@Component({
  selector: 'app-cuenta',
  imports: [RouterLink, IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cuenta.page.html',
  styleUrl: './cuenta.page.css',
})
export class CuentaPage implements OnInit {
  private readonly auth = inject(AuthService);
  protected readonly sesion = inject(SesionService);

  /** Viene de la ruta (data) y de la query (?token=). */
  readonly modo = input.required<Modo>();
  readonly token = input<string>('');

  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly listo = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    if (this.modo() === 'verificar') await this.intentar(async () => (await this.auth.verificar(this.token())).mensaje);
  }

  protected recuperar(email: string): Promise<void> {
    if (!email.trim()) return Promise.resolve(this.error.set('Escribe tu correo'));
    return this.intentar(async () => (await this.auth.recuperar(email.trim())).mensaje);
  }

  protected restablecer(password: string, repetida: string): Promise<void> {
    if (password.length < 8) return Promise.resolve(this.error.set('La contraseña necesita al menos 8 caracteres'));
    if (password !== repetida) return Promise.resolve(this.error.set('Las dos contraseñas no coinciden'));
    return this.intentar(async () => (await this.auth.restablecer(this.token(), password)).mensaje);
  }

  private async intentar(fn: () => Promise<string>): Promise<void> {
    this.enviando.set(true);
    this.error.set(null);
    try {
      this.listo.set(await fn());
      if (this.modo() === 'verificar' && this.sesion.autenticado()) await this.auth.refrescar().catch(() => {});
    } catch (e) {
      this.error.set((e as ErrorApi).mensaje ?? 'Algo salió mal');
    } finally {
      this.enviando.set(false);
    }
  }
}
