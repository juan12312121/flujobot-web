import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CitasService } from '../../core/services/citas/citas.service';
import { ProductosService } from '../../core/services/productos/productos.service';
import { SesionService } from '../../core/services/sesion/sesion.service';
import { AvisosService } from '../../core/services/avisos/avisos.service';
import { Cita, EstadoCita } from '../../core/models';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { AutoEnfocarDirective } from '../../shared/directives/auto-enfocar.directive';
import { IconoComponent } from '../../shared/components/icono/icono.component';

const ESTADOS: { valor: EstadoCita; texto: string }[] = [
  { valor: 'pendiente', texto: 'Pendiente' },
  { valor: 'confirmada', texto: 'Confirmada' },
  { valor: 'atendida', texto: 'Atendida' },
  { valor: 'no_asistio', texto: 'No asistió' },
  { valor: 'cancelada', texto: 'Cancelada' },
];
const DIAS_VISTA = 7;

interface Dia {
  fecha: string;
  titulo: string;
  citas: Cita[];
}

/** Agenda de la empresa por semana, en su zona horaria. Las citas llegan del bot o se capturan a mano. */
@Component({
  selector: 'app-agenda',
  imports: [IconoComponent, ReactiveFormsModule, ModalComponent, AutoEnfocarDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './agenda.page.html',
  styleUrl: './agenda.page.css',
})
export class AgendaPage implements OnInit {
  private readonly api = inject(CitasService);
  private readonly productos = inject(ProductosService);
  private readonly avisos = inject(AvisosService);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly sesion = inject(SesionService);

  protected readonly estados = ESTADOS;
  protected readonly zona = computed(() => this.sesion.empresa()?.zonaHoraria ?? 'America/Mexico_City');
  protected readonly desde = signal(this.hoy());
  protected readonly citas = signal<Cita[]>([]);
  protected readonly cargando = signal(true);
  protected readonly creando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly servicios = signal<string[]>([]);
  protected readonly ocultarCanceladas = signal(true);

  protected readonly dias = computed<Dia[]>(() => {
    const porDia = new Map<string, Cita[]>();
    for (const c of this.citas()) {
      if (this.ocultarCanceladas() && c.estado === 'cancelada') continue;
      const f = this.fechaLocal(c.inicio);
      porDia.set(f, [...(porDia.get(f) ?? []), c]);
    }
    return Array.from({ length: DIAS_VISTA }, (_, i) => {
      const fecha = this.sumarDias(this.desde(), i);
      return { fecha, titulo: this.tituloDia(fecha), citas: porDia.get(fecha) ?? [] };
    });
  });
  protected readonly total = computed(() => this.dias().reduce((s, d) => s + d.citas.length, 0));

  protected readonly form = this.fb.group({
    nombreContacto: ['', Validators.required],
    contacto: [''],
    fecha: [this.hoy(), Validators.required],
    hora: ['10:00', Validators.required],
    duracionMin: [this.sesion.empresa()?.horario?.intervaloMin ?? 30],
    servicio: [''],
    notas: [''],
  });

  async ngOnInit(): Promise<void> {
    this.productos
      .listar()
      .then((l) => this.servicios.set(l.map((p) => p.nombre)))
      .catch(() => {});
    await this.cargar();
  }

  protected async mover(dias: number): Promise<void> {
    this.desde.set(dias === 0 ? this.hoy() : this.sumarDias(this.desde(), dias));
    await this.cargar();
  }

  protected hora(iso: string): string {
    return new Intl.DateTimeFormat('es-MX', { timeZone: this.zona(), hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso));
  }

  protected async cambiarEstado(c: Cita, estado: EstadoCita): Promise<void> {
    try {
      const editada = await this.api.actualizar(c.id, { estado });
      this.citas.update((l) => l.map((x) => (x.id === editada.id ? editada : x)));
    } catch (e) {
      this.avisos.error(e);
    }
  }

  protected abrirNueva(fecha = this.desde()): void {
    this.form.reset({ fecha, hora: '10:00', duracionMin: this.sesion.empresa()?.horario?.intervaloMin ?? 30 });
    this.creando.set(true);
  }

  protected async crear(): Promise<void> {
    if (this.form.invalid) return;
    this.guardando.set(true);
    try {
      const v = this.form.getRawValue();
      await this.api.crear({ ...v, duracionMin: Number(v.duracionMin) || undefined });
      this.creando.set(false);
      this.avisos.exito(`${this.sesion.terminos().cita} agendada`);
      await this.cargar();
    } catch (e) {
      this.avisos.error(e);
    } finally {
      this.guardando.set(false);
    }
  }

  private async cargar(): Promise<void> {
    this.cargando.set(true);
    try {
      this.citas.set(await this.api.listar({ desde: this.desde(), hasta: this.sumarDias(this.desde(), DIAS_VISTA - 1) }));
    } catch (e) {
      this.avisos.error(e);
    } finally {
      this.cargando.set(false);
    }
  }

  // ───── Fechas en la zona de la empresa ─────

  private hoy(): string {
    return this.fechaLocal(new Date().toISOString());
  }

  private fechaLocal(iso: string): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: this.zona?.() ?? 'America/Mexico_City' }).format(new Date(iso));
  }

  private sumarDias(fecha: string, n: number): string {
    return new Date(Date.parse(`${fecha}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
  }

  private tituloDia(fecha: string): string {
    const texto = new Intl.DateTimeFormat('es-MX', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'short' }).format(new Date(`${fecha}T12:00:00Z`));
    return fecha === this.hoy() ? `Hoy · ${texto}` : texto;
  }
}
