import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { EmpresaService } from '../../core/services/empresa/empresa.service';
import { TemaService } from '../../core/services/tema/tema.service';
import { AvisosService } from '../../core/services/avisos/avisos.service';
import { GIROS } from '../../core/empresa/giros';
import { ConfigAvisos, Empresa, Giro, Horario, Marca, Modulos, OpcionGiro, Terminos } from '../../core/models';
import { AVISOS_BASE, TEXTOS_AVISO } from '../../core/empresa/avisos';
import { CobrosComponent } from './cobros/cobros.component';
import { AparienciaComponent } from './apariencia/apariencia.component';
import { ModulosPropiosComponent } from './modulos-propios/modulos-propios.component';
import { IconoComponent } from '../../shared/components/icono/icono.component';

type Seccion = 'identidad' | 'apariencia' | 'modulos' | 'horario' | 'conocimiento' | 'avisos' | 'cobros';

const MAX_CONOCIMIENTO = 8000;

/** Guía para llenar la información que usa "Responder con IA". */
const GUIA_CONOCIMIENTO = `Formas de pago: efectivo, tarjeta y transferencia.
Ubicación: Av. Juárez 10, Centro. Hay estacionamiento.
Envíos: a toda la ciudad, gratis en compras mayores a $300.
Política de cancelación: avisar con 24 horas de anticipación.
Preguntas frecuentes:
- ¿Hacen facturas? Sí, pide tu factura el mismo día.`;

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const ZONAS = [
  'America/Mexico_City',
  'America/Monterrey',
  'America/Cancun',
  'America/Chihuahua',
  'America/Hermosillo',
  'America/Mazatlan',
  'America/Tijuana',
  'America/Bogota',
  'America/Lima',
  'America/Guatemala',
  'America/Santiago',
  'America/Argentina/Buenos_Aires',
  'America/New_York',
  'Europe/Madrid',
];
const TERMINOS: { clave: keyof Terminos; etiqueta: string }[] = [
  { clave: 'item', etiqueta: 'Lo que ofreces (singular)' },
  { clave: 'items', etiqueta: 'Lo que ofreces (plural)' },
  { clave: 'pedido', etiqueta: 'Pedido / solicitud (singular)' },
  { clave: 'pedidos', etiqueta: 'Pedido / solicitud (plural)' },
  { clave: 'cita', etiqueta: 'Cita (singular)' },
  { clave: 'citas', etiqueta: 'Cita (plural)' },
  { clave: 'cliente', etiqueta: 'Cliente (singular)' },
  { clave: 'clientes', etiqueta: 'Cliente (plural)' },
];

/**
 * Personalización del espacio de trabajo (solo admin). Trabaja sobre un borrador:
 * los colores se ven en todo el panel mientras se eligen y se guardan con un solo botón.
 */
@Component({
  selector: 'app-empresa',
  imports: [IconoComponent, CobrosComponent, AparienciaComponent, ModulosPropiosComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './empresa.page.html',
  styleUrl: './empresa.page.css',
})
export class EmpresaPage implements OnInit {
  private readonly api = inject(EmpresaService);
  private readonly tema = inject(TemaService);
  private readonly avisos = inject(AvisosService);

  protected readonly giros = GIROS;
  protected readonly dias = DIAS;
  protected readonly zonas = ZONAS;
  protected readonly listaTerminos = TERMINOS;
  protected readonly maxConocimiento = MAX_CONOCIMIENTO;
  protected readonly guiaConocimiento = GUIA_CONOCIMIENTO;
  protected readonly textosAviso = TEXTOS_AVISO;

  protected readonly seccion = signal<Seccion>('identidad');
  protected readonly original = signal<Empresa | null>(null);
  protected readonly borrador = signal<Empresa | null>(null);
  protected readonly opcionesGiro = signal<OpcionGiro[]>([]);
  protected readonly guardando = signal(false);

  protected readonly hayCambios = computed(() => JSON.stringify(this.original()) !== JSON.stringify(this.borrador()));
  protected readonly giroCambiado = computed(() => this.original()?.giro !== this.borrador()?.giro);

  constructor() {
    // Si sale sin guardar, el panel vuelve a sus colores guardados
    inject(DestroyRef).onDestroy(() => this.tema.vistaPrevia.set(null));
  }

  async ngOnInit(): Promise<void> {
    try {
      const [crudo, giros] = await Promise.all([this.api.obtener(), this.api.giros().catch(() => [])]);
      // Empresas creadas antes de los avisos no traen la sección: se completa con los valores de fábrica
      const empresa = { ...crudo, avisos: { ...AVISOS_BASE, ...(crudo.avisos ?? {}), textos: { ...(crudo.avisos?.textos ?? {}) } } };
      this.original.set(empresa);
      this.borrador.set(structuredClone(empresa));
      this.opcionesGiro.set(giros);
    } catch (e) {
      this.avisos.error(e);
    }
  }

  // ───── Edición del borrador ─────

  protected conocimiento(evento: Event): void {
    const valor = (evento.target as HTMLTextAreaElement).value.slice(0, MAX_CONOCIMIENTO);
    this.borrador.update((b) => (b ? { ...b, conocimiento: valor } : b));
  }

  protected usarGuia(): void {
    this.borrador.update((b) => (b && !b.conocimiento?.trim() ? { ...b, conocimiento: GUIA_CONOCIMIENTO } : b));
  }

  protected campo(campo: 'nombre' | 'moneda' | 'zonaHoraria', evento: Event): void {
    const valor = (evento.target as HTMLInputElement).value;
    this.borrador.update((b) => (b ? { ...b, [campo]: campo === 'moneda' ? valor.toUpperCase() : valor } : b));
  }

  /** Cambiar de giro propone sus términos y módulos (se pueden ajustar antes de guardar). */
  protected elegirGiro(giro: Giro): void {
    const base = this.opcionesGiro().find((g) => g.id === giro);
    this.borrador.update((b) => (b ? { ...b, giro, ...(base ? { terminos: { ...base.terminos }, modulos: { ...base.modulos } } : {}) } : b));
  }

  protected marca(cambios: Partial<Marca>): void {
    this.borrador.update((b) => (b ? { ...b, marca: { ...b.marca, ...cambios } } : b));
    const { colorPrimario, colorMenu, modo, fondo } = this.borrador()!.marca;
    this.tema.vistaPrevia.set({ colorPrimario, colorMenu, modo, fondo });
  }

  protected modulo(clave: keyof Modulos, evento: Event): void {
    const activo = (evento.target as HTMLInputElement).checked;
    this.borrador.update((b) => (b ? { ...b, modulos: { ...b.modulos, [clave]: activo } } : b));
  }

  protected termino(clave: keyof Terminos, evento: Event): void {
    const valor = (evento.target as HTMLInputElement).value;
    this.borrador.update((b) => (b ? { ...b, terminos: { ...b.terminos, [clave]: valor } } : b));
  }

  protected alternarDia(dia: number): void {
    this.borrador.update((b) => {
      if (!b) return b;
      const dias = b.horario.dias.includes(dia) ? b.horario.dias.filter((d) => d !== dia) : [...b.horario.dias, dia].sort();
      return { ...b, horario: { ...b.horario, dias } };
    });
  }

  protected horario(campo: keyof Horario, evento: Event): void {
    const crudo = (evento.target as HTMLInputElement).value;
    const valor = campo === 'apertura' || campo === 'cierre' ? crudo : Number(crudo);
    this.borrador.update((b) => (b ? { ...b, horario: { ...b.horario, [campo]: valor } } : b));
  }

  protected aviso(clave: Exclude<keyof ConfigAvisos, 'textos'>, evento: Event): void {
    const activo = (evento.target as HTMLInputElement).checked;
    this.borrador.update((b) => (b ? { ...b, avisos: { ...b.avisos, [clave]: activo } } : b));
  }

  protected textoAviso(clave: string, evento: Event): void {
    const valor = (evento.target as HTMLTextAreaElement).value;
    this.borrador.update((b) => (b ? { ...b, avisos: { ...b.avisos, textos: { ...b.avisos.textos, [clave]: valor } } } : b));
  }

  // ───── Guardar / descartar ─────

  protected descartar(): void {
    this.borrador.set(structuredClone(this.original()));
    this.tema.vistaPrevia.set(null);
  }

  protected async guardar(): Promise<void> {
    const b = this.borrador();
    if (!b) return;
    if (Object.values(b.terminos).some((t) => !t.trim())) {
      this.avisos.error(null, 'Ninguna palabra puede quedar vacía');
      this.seccion.set('modulos');
      return;
    }
    this.guardando.set(true);
    try {
      const guardada = await this.api.actualizar({
        nombre: b.nombre.trim(),
        giro: b.giro,
        moneda: b.moneda,
        zonaHoraria: b.zonaHoraria,
        marca: b.marca,
        terminos: b.terminos,
        modulos: b.modulos,
        horario: b.horario,
        conocimiento: b.conocimiento ?? '',
        avisos: b.avisos,
      });
      this.original.set(guardada);
      this.borrador.set(structuredClone(guardada));
      this.tema.vistaPrevia.set(null);
      this.avisos.exito('Cambios guardados');
    } catch (e) {
      this.avisos.error(e);
    } finally {
      this.guardando.set(false);
    }
  }
}
