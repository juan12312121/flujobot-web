import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';
import { ErrorApi, Giro } from '../../core/models';
import { GIROS } from '../../core/empresa/giros';
import { IconoComponent } from '../../shared/components/icono/icono.component';

/** Entrar y registrar empresa comparten pantalla; la ruta dice cuál mostrar (data.registro). */
@Component({
  selector: 'app-acceso',
  imports: [IconoComponent, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './acceso.page.html',
  styleUrl: './acceso.page.css',
})
export class AccesoPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  /** Viene de data.registro de la ruta (withComponentInputBinding). */
  readonly registro = input(false);
  readonly volver = input<string>();

  protected readonly giros = GIROS;
  protected readonly giro = signal<Giro>('tienda');
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly titulo = computed(() => (this.registro() ? 'Crea la cuenta de tu empresa' : 'Entra a tu panel'));

  protected readonly form = this.fb.group({
    empresa: [''],
    nombre: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected async enviar(): Promise<void> {
    const v = this.form.getRawValue();
    if (this.registro() && (!v.empresa.trim() || !v.nombre.trim())) {
      this.error.set('Escribe el nombre de la empresa y el tuyo');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Revisa el correo y la contraseña (mínimo 8 caracteres)');
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    try {
      if (this.registro()) await this.auth.registrar({ ...v, giro: this.giro() });
      else await this.auth.entrar(v.email, v.password);
      await this.router.navigateByUrl(this.volver() || (this.registro() ? '/bots' : '/inicio'));
    } catch (e) {
      this.error.set((e as ErrorApi).mensaje);
    } finally {
      this.enviando.set(false);
    }
  }
}
