import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuariosService } from '../../core/services/usuarios/usuarios.service';
import { AvisosService } from '../../core/services/avisos/avisos.service';
import { SesionService } from '../../core/services/sesion/sesion.service';
import { Rol, Usuario } from '../../core/models';

/** Usuarios de la empresa (solo admin). Los editores arman flujos y catálogo; no borran bots ni usuarios. */
@Component({
  selector: 'app-equipo',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './equipo.page.html',
  styleUrl: './equipo.page.css',
})
export class EquipoPage implements OnInit {
  private readonly api = inject(UsuariosService);
  private readonly avisos = inject(AvisosService);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly sesion = inject(SesionService);
  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly guardando = signal(false);

  protected readonly form = this.fb.group({
    nombre: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rol: ['editor' as Rol],
  });

  async ngOnInit(): Promise<void> {
    this.usuarios.set(await this.api.listar().catch((e) => (this.avisos.error(e), [])));
  }

  protected async crear(): Promise<void> {
    this.guardando.set(true);
    try {
      const u = await this.api.crear(this.form.getRawValue());
      this.usuarios.update((l) => [...l, u]);
      this.form.reset({ rol: 'editor' });
      this.avisos.exito(`${u.nombre} ya puede entrar`);
    } catch (e) {
      this.avisos.error(e);
    } finally {
      this.guardando.set(false);
    }
  }

  protected async borrar(u: Usuario): Promise<void> {
    if (!confirm(`¿Quitar el acceso de ${u.nombre}?`)) return;
    try {
      await this.api.borrar(u.id);
      this.usuarios.update((l) => l.filter((x) => x.id !== u.id));
    } catch (e) {
      this.avisos.error(e);
    }
  }
}
