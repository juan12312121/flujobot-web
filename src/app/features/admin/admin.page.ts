import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { AdminService, CambiosEmpresaAdmin } from '../../core/services/admin/admin.service';
import { AvisosService } from '../../core/services/avisos/avisos.service';
import { ClavePlan, EmpresaAdmin } from '../../core/models';
import { IconoComponent } from '../../shared/components/icono/icono.component';

/** Superadministrador de FlujoBot: todas las empresas, su plan y consumo; suspender, reactivar y cambiar plan. */
@Component({
  selector: 'app-admin',
  imports: [DatePipe, DecimalPipe, IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin.page.html',
  styleUrl: './admin.page.css',
})
export class AdminPage implements OnInit {
  private readonly api = inject(AdminService);
  private readonly avisos = inject(AvisosService);

  protected readonly empresas = signal<EmpresaAdmin[]>([]);
  protected readonly texto = signal('');
  protected readonly planes: { clave: ClavePlan; nombre: string }[] = [
    { clave: 'prueba', nombre: 'Prueba' },
    { clave: 'basico', nombre: 'Básico' },
    { clave: 'pro', nombre: 'Pro' },
  ];
  protected readonly totales = computed(() => {
    const l = this.empresas();
    return {
      empresas: l.length,
      activas: l.filter((e) => e.activa && e.vigente).length,
      pago: l.filter((e) => e.plan !== 'prueba' && e.vigente).length,
      conversaciones: l.reduce((s, e) => s + e.uso.conversaciones, 0),
    };
  });

  async ngOnInit(): Promise<void> {
    await this.cargar();
  }

  protected buscar(evento: Event): void {
    this.texto.set((evento.target as HTMLInputElement).value.trim());
    void this.cargar();
  }

  protected porcentaje(uso: number, limite: number): number {
    return limite ? Math.min(100, Math.round((uso / limite) * 100)) : 0;
  }

  protected async suspender(e: EmpresaAdmin): Promise<void> {
    const motivo = prompt(`Motivo para suspender "${e.nombre}" (lo verán al intentar entrar):`, 'Falta de pago');
    if (motivo === null) return;
    await this.cambiar(e, { activa: false, motivo }, `${e.nombre} suspendida`);
  }

  protected reactivar(e: EmpresaAdmin): Promise<void> {
    return this.cambiar(e, { activa: true }, `${e.nombre} reactivada`);
  }

  protected cambiarPlan(e: EmpresaAdmin, plan: ClavePlan): Promise<void> {
    return this.cambiar(e, { plan }, `Plan de ${e.nombre} cambiado`);
  }

  protected sumarDias(e: EmpresaAdmin, dias: number): Promise<void> {
    return this.cambiar(e, { sumarDias: dias }, `Se sumaron ${dias} días a ${e.nombre}`);
  }

  private async cambiar(e: EmpresaAdmin, cambios: CambiosEmpresaAdmin, mensaje: string): Promise<void> {
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
