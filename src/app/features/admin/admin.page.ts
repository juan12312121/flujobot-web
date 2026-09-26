import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AdminService } from '../../core/services/admin/admin.service';
import { AvisosService } from '../../core/services/avisos/avisos.service';
import { EmpresaAdmin } from '../../core/models';
import { IconoComponent } from '../../shared/components/icono/icono.component';

/** Superadministrador de FlujoBot: todas las empresas; suspender y reactivar. */
@Component({
  selector: 'app-admin',
  imports: [DatePipe, IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin.page.html',
  styleUrl: './admin.page.css',
})
export class AdminPage implements OnInit {
  private readonly api = inject(AdminService);
  private readonly avisos = inject(AvisosService);

  protected readonly empresas = signal<EmpresaAdmin[]>([]);
  protected readonly texto = signal('');
  protected readonly totales = computed(() => {
    const l = this.empresas();
    return { empresas: l.length, activas: l.filter((e) => e.activa).length, bots: l.reduce((s, e) => s + e.bots, 0) };
  });

  async ngOnInit(): Promise<void> {
    await this.cargar();
  }

  protected buscar(evento: Event): void {
    this.texto.set((evento.target as HTMLInputElement).value.trim());
    void this.cargar();
  }

  protected async suspender(e: EmpresaAdmin): Promise<void> {
    const motivo = prompt(`Motivo para suspender "${e.nombre}" (lo verán al intentar entrar):`, '');
    if (motivo === null) return;
    await this.cambiar(e, { activa: false, motivo }, `${e.nombre} suspendida`);
  }

  protected reactivar(e: EmpresaAdmin): Promise<void> {
    return this.cambiar(e, { activa: true }, `${e.nombre} reactivada`);
  }

  private async cambiar(e: EmpresaAdmin, cambios: { activa: boolean; motivo?: string }, mensaje: string): Promise<void> {
    try {
      await this.api.editarEmpresa(e.id, cambios);
      this.avisos.exito(mensaje);
      await this.cargar();
    } catch (err) {
      this.avisos.error(err);
    }
  }

  private async cargar(): Promise<void> {
    try {
      this.empresas.set(await this.api.empresas(this.texto() || undefined));
    } catch (e) {
      this.avisos.error(e);
    }
  }
}
