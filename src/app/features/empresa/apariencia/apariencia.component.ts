import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FondoMarca, Marca, ModoTema, TemaGuardado, Terminos } from '../../../core/models';
import { CATEGORIAS_FONDO, CategoriaFondo, FONDOS, fondoCss, Tema, TEMAS } from '../../../core/tema/temas';
import { IconoComponent } from '../../../shared/components/icono/icono.component';
import { LogoEmpresaComponent } from '../../../shared/components/logo-empresa/logo-empresa.component';
import { SubirImagenComponent } from '../../../shared/components/subir-imagen/subir-imagen.component';
import { textoSobre } from '../../../core/services/tema/tema.service';

const SIN_FONDO: FondoMarca = { tipo: 'ninguno', valor: '', velo: 70, desenfoque: 0 };
const MAX_TEMAS = 12;
const MAX_FONDOS = 24;

type PestanaFondo = CategoriaFondo | 'mias';

/**
 * Temas y fondo del espacio de trabajo: temas de fábrica, temas propios guardados,
 * modo claro/oscuro, colores, galería de fondos (fotos, degradados, patrones) e imágenes propias.
 * No guarda nada: emite los cambios y "Mi empresa" los aplica al borrador (con vista previa en vivo).
 */
@Component({
  selector: 'app-apariencia',
  imports: [IconoComponent, LogoEmpresaComponent, SubirImagenComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './apariencia.component.html',
  styleUrl: './apariencia.component.css',
})
export class AparienciaComponent {
  readonly marca = input.required<Marca>();
  readonly nombre = input('');
  readonly terminos = input<Terminos | null>(null);
  readonly cambio = output<Partial<Marca>>();

  protected readonly temas = TEMAS;
  protected readonly categorias = CATEGORIAS_FONDO;
  protected readonly pestanaFondo = signal<PestanaFondo>('fotos');

  protected readonly modo = computed<ModoTema>(() => this.marca().modo ?? 'claro');
  protected readonly fondo = computed<FondoMarca>(() => ({ ...SIN_FONDO, ...(this.marca().fondo ?? {}) }));
  protected readonly guardados = computed(() => this.marca().temasGuardados ?? []);
  protected readonly subidos = computed(() => this.marca().fondosSubidos ?? []);
  protected readonly fondosVisibles = computed(() => FONDOS.filter((f) => f.categoria === this.pestanaFondo()));
  protected readonly fondoActualCss = computed(() => fondoCss(this.fondo(), this.modo()));
  protected readonly textoMenu = computed(() => textoSobre(this.marca().colorMenu));

  // ───── Temas ─────

  protected aplicarTema(t: Tema | TemaGuardado): void {
    this.cambio.emit({ tema: t.id, colorPrimario: t.colorPrimario, colorMenu: t.colorMenu, modo: t.modo, fondo: { ...t.fondo } });
  }

  protected miniaturaTema(t: Tema | TemaGuardado): string {
    return fondoCss(t.fondo, t.modo) ?? (t.modo === 'oscuro' ? '#0f1419' : '#f4f5f7');
  }

  protected guardarComoTema(): void {
    if (this.guardados().length >= MAX_TEMAS) {
      alert(`Puedes guardar hasta ${MAX_TEMAS} temas. Borra uno para guardar otro.`);
      return;
    }
    const nombre = prompt('Nombre para tu tema:', 'Mi tema')?.trim();
    if (!nombre) return;
    const m = this.marca();
    const nuevo: TemaGuardado = {
      id: `propio-${Date.now().toString(36)}`,
      nombre: nombre.slice(0, 40),
      colorPrimario: m.colorPrimario,
      colorMenu: m.colorMenu,
      modo: this.modo(),
      fondo: { ...this.fondo() },
    };
    this.cambio.emit({ temasGuardados: [...this.guardados(), nuevo], tema: nuevo.id });
  }

  protected borrarTema(t: TemaGuardado, evento: Event): void {
    evento.stopPropagation();
    if (!confirm(`¿Borrar el tema "${t.nombre}"?`)) return;
    this.cambio.emit({ temasGuardados: this.guardados().filter((x) => x.id !== t.id), ...(this.marca().tema === t.id ? { tema: 'personalizado' } : {}) });
  }

  // ───── Personalizar (cualquier ajuste convierte el tema en "personalizado") ─────

  protected cambiarModo(modo: ModoTema): void {
    this.cambio.emit({ modo, tema: 'personalizado' });
  }

  protected color(campo: 'colorPrimario' | 'colorMenu', evento: Event): void {
    this.cambio.emit({ [campo]: (evento.target as HTMLInputElement).value, tema: 'personalizado' });
  }

  // ───── Fondo ─────

  protected elegirGaleria(id: string, veloSugerido: number): void {
    const f = this.fondo();
    // Al pasar de "sin velo" (degradado/patrón) a una foto, se propone un velo para que se lea
    const velo = f.tipo === 'galeria' && FONDOS.find((x) => x.id === f.valor)?.categoria === 'fotos' ? f.velo : veloSugerido;
    this.cambiarFondo({ tipo: 'galeria', valor: id, velo });
  }

  protected elegirImagen(url: string): void {
    const f = this.fondo();
    this.cambiarFondo({ tipo: 'imagen', valor: url, velo: f.tipo === 'imagen' ? f.velo : 70 });
  }

  protected quitarFondo(): void {
    this.cambiarFondo({ tipo: 'ninguno', valor: '' });
  }

  /** Imagen recién subida: entra a "Mis imágenes" y queda elegida. */
  protected subida(url: string): void {
    if (!url) return;
    const lista = [url, ...this.subidos().filter((u) => u !== url)].slice(0, MAX_FONDOS);
    this.cambio.emit({ fondosSubidos: lista, tema: 'personalizado', fondo: { ...this.fondo(), tipo: 'imagen', valor: url, velo: 70 } });
  }

  protected borrarSubida(url: string, evento: Event): void {
    evento.stopPropagation();
    const f = this.fondo();
    this.cambio.emit({
      fondosSubidos: this.subidos().filter((u) => u !== url),
      ...(f.tipo === 'imagen' && f.valor === url ? { fondo: { ...SIN_FONDO } } : {}),
    });
  }

  protected ajuste(campo: 'velo' | 'desenfoque', evento: Event): void {
    this.cambiarFondo({ [campo]: Number((evento.target as HTMLInputElement).value) });
  }

  protected cssMiniatura(css: (m: ModoTema) => string): string {
    return css(this.modo());
  }

  protected elegido(tipo: FondoMarca['tipo'], valor: string): boolean {
    const f = this.fondo();
    return f.tipo === tipo && f.valor === valor;
  }

  private cambiarFondo(cambios: Partial<FondoMarca>): void {
    this.cambio.emit({ fondo: { ...this.fondo(), ...cambios }, tema: 'personalizado' });
  }
}
