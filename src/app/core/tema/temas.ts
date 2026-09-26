import { FondoMarca, ModoTema } from '../models';

/** Un tema = colores + modo claro/oscuro + fondo. Los de fábrica se aplican con un clic. */
export interface Tema {
  id: string;
  nombre: string;
  colorPrimario: string;
  colorMenu: string;
  modo: ModoTema;
  fondo: FondoMarca;
}

export type CategoriaFondo = 'fotos' | 'degradados' | 'patrones';

/** Fondo de la galería. `css` recibe el modo para que los patrones se vean en claro y en oscuro. */
export interface FondoGaleria {
  id: string;
  nombre: string;
  categoria: CategoriaFondo;
  css: (modo: ModoTema) => string;
  /** Miniatura para la galería (las fotos usan una versión chica). */
  miniatura: (modo: ModoTema) => string;
  veloSugerido: number;
}

const SIN_FONDO: FondoMarca = { tipo: 'ninguno', valor: '', velo: 70, desenfoque: 0 };
const galeria = (valor: string, velo = 70, desenfoque = 0): FondoMarca => ({ tipo: 'galeria', valor, velo, desenfoque });

// ───── Fotos (Picsum / Unsplash, uso libre) ─────

const FOTOS: [string, string, string][] = [
  ['16', 'Mar tranquilo', 'foto-mar'],
  ['10', 'Lago y bosque', 'foto-lago'],
  ['1018', 'Colinas verdes', 'foto-colinas'],
  ['1015', 'Fiordo', 'foto-fiordo'],
  ['29', 'Montañas', 'foto-montanas'],
  ['1036', 'Nieve', 'foto-nieve'],
  ['1044', 'Bosque con niebla', 'foto-niebla'],
  ['110', 'Atardecer en el campo', 'foto-atardecer'],
  ['1056', 'Nubes', 'foto-nubes'],
  ['1019', 'Tormenta', 'foto-tormenta'],
  ['43', 'Ciudad de noche', 'foto-ciudad-noche'],
  ['1067', 'Ciudad al atardecer', 'foto-ciudad'],
  ['119', 'Escritorio', 'foto-escritorio'],
];

const foto = (id: string, ancho: number, alto: number) => `url("https://picsum.photos/id/${id}/${ancho}/${alto}")`;

// ───── Degradados: usan el color principal, así combinan con cualquier tema ─────

const DEGRADADOS: { id: string; nombre: string; css: (m: ModoTema) => string }[] = [
  {
    id: 'degradado-aurora',
    nombre: 'Aurora',
    css: (m) =>
      `radial-gradient(circle at 12% 18%, color-mix(in srgb, var(--primario) ${m === 'oscuro' ? 35 : 28}%, transparent) 0, transparent 42%),` +
      `radial-gradient(circle at 88% 12%, color-mix(in srgb, #8b5cf6 ${m === 'oscuro' ? 30 : 22}%, transparent) 0, transparent 40%),` +
      `radial-gradient(circle at 70% 88%, color-mix(in srgb, #06b6d4 ${m === 'oscuro' ? 28 : 20}%, transparent) 0, transparent 45%)`,
  },
  {
    id: 'degradado-suave',
    nombre: 'Suave',
    css: (m) => `linear-gradient(135deg, color-mix(in srgb, var(--primario) ${m === 'oscuro' ? 22 : 14}%, transparent), transparent 60%)`,
  },
  {
    id: 'degradado-cielo',
    nombre: 'Cielo',
    css: (m) => (m === 'oscuro' ? 'linear-gradient(180deg, #0c1a33 0%, #0f1419 70%)' : 'linear-gradient(180deg, #dbeafe 0%, #f4f5f7 65%)'),
  },
  {
    id: 'degradado-durazno',
    nombre: 'Durazno',
    css: (m) => (m === 'oscuro' ? 'linear-gradient(135deg, #2a1712 0%, #0f1419 70%)' : 'linear-gradient(135deg, #ffe4d6 0%, #fdf2f8 45%, #f4f5f7 80%)'),
  },
  {
    id: 'degradado-menta',
    nombre: 'Menta',
    css: (m) => (m === 'oscuro' ? 'linear-gradient(135deg, #0d2a22 0%, #0f1419 70%)' : 'linear-gradient(135deg, #d1fae5 0%, #ecfeff 50%, #f4f5f7 85%)'),
  },
];

// ───── Patrones (SVG en la misma página, sin descargas) ─────

const svg = (contenido: string, tam: number, modo: ModoTema) => {
  const trazo = modo === 'oscuro' ? 'rgba(255,255,255,0.07)' : 'rgba(16,24,40,0.08)';
  const cuerpo = contenido.replaceAll('TRAZO', trazo);
  return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${tam}' height='${tam}'>${cuerpo}</svg>`)}")`;
};

const PATRONES: { id: string; nombre: string; css: (m: ModoTema) => string }[] = [
  { id: 'patron-puntos', nombre: 'Puntos', css: (m) => svg(`<circle cx='2' cy='2' r='1.4' fill='TRAZO'/>`, 18, m) },
  { id: 'patron-cuadricula', nombre: 'Cuadrícula', css: (m) => svg(`<path d='M24 0H0V24' fill='none' stroke='TRAZO' stroke-width='1'/>`, 24, m) },
  { id: 'patron-diagonal', nombre: 'Diagonales', css: (m) => svg(`<path d='M0 16L16 0' stroke='TRAZO' stroke-width='1.2'/>`, 16, m) },
  {
    id: 'patron-ondas',
    nombre: 'Ondas',
    css: (m) => svg(`<path d='M0 20 Q10 10 20 20 T40 20' fill='none' stroke='TRAZO' stroke-width='1.3'/>`, 40, m),
  },
  {
    id: 'patron-hexagonos',
    nombre: 'Hexágonos',
    css: (m) => svg(`<path d='M14 0l14 8v16l-14 8L0 24V8z' fill='none' stroke='TRAZO' stroke-width='1'/>`, 28, m),
  },
];

export const FONDOS: FondoGaleria[] = [
  ...FOTOS.map(([picsum, nombre, id]) => ({
    id,
    nombre,
    categoria: 'fotos' as const,
    css: () => `${foto(picsum, 1920, 1080)} center / cover no-repeat`,
    miniatura: () => `${foto(picsum, 320, 180)} center / cover no-repeat`,
    veloSugerido: 70,
  })),
  ...DEGRADADOS.map((d) => ({ ...d, categoria: 'degradados' as const, miniatura: d.css, veloSugerido: 0 })),
  ...PATRONES.map((p) => ({ ...p, categoria: 'patrones' as const, css: (m: ModoTema) => `${p.css(m)} repeat`, miniatura: (m: ModoTema) => `${p.css(m)} repeat`, veloSugerido: 0 })),
];

export const CATEGORIAS_FONDO: { id: CategoriaFondo; nombre: string }[] = [
  { id: 'fotos', nombre: 'Fotos' },
  { id: 'degradados', nombre: 'Degradados' },
  { id: 'patrones', nombre: 'Patrones' },
];

/** El `background` CSS de un fondo guardado, o null si no tiene. */
export function fondoCss(fondo: FondoMarca | undefined, modo: ModoTema): string | null {
  if (!fondo || fondo.tipo === 'ninguno' || !fondo.valor) return null;
  if (fondo.tipo === 'imagen') return `url("${fondo.valor.replaceAll('"', '%22')}") center / cover no-repeat`;
  return FONDOS.find((f) => f.id === fondo.valor)?.css(modo) ?? null;
}

export const TEMAS: Tema[] = [
  { id: 'clasico', nombre: 'Clásico', colorPrimario: '#12a150', colorMenu: '#0f1b17', modo: 'claro', fondo: SIN_FONDO },
  { id: 'oceano', nombre: 'Océano', colorPrimario: '#0891b2', colorMenu: '#0b1d24', modo: 'claro', fondo: galeria('foto-mar', 72) },
  { id: 'bosque', nombre: 'Bosque', colorPrimario: '#16a34a', colorMenu: '#10241a', modo: 'claro', fondo: galeria('foto-colinas', 72) },
  { id: 'atardecer', nombre: 'Atardecer', colorPrimario: '#ea580c', colorMenu: '#1f130b', modo: 'claro', fondo: galeria('foto-atardecer', 75) },
  { id: 'lavanda', nombre: 'Lavanda', colorPrimario: '#7c3aed', colorMenu: '#1e1033', modo: 'claro', fondo: galeria('degradado-aurora', 0) },
  { id: 'rosa', nombre: 'Rosa', colorPrimario: '#db2777', colorMenu: '#2a0f1e', modo: 'claro', fondo: galeria('degradado-durazno', 0) },
  { id: 'menta', nombre: 'Menta', colorPrimario: '#0d9488', colorMenu: '#0b2420', modo: 'claro', fondo: galeria('degradado-menta', 0) },
  { id: 'minimal', nombre: 'Minimalista', colorPrimario: '#2563eb', colorMenu: '#ffffff', modo: 'claro', fondo: galeria('patron-puntos', 0) },
  { id: 'cafe', nombre: 'Café', colorPrimario: '#b45309', colorMenu: '#231a12', modo: 'claro', fondo: galeria('patron-diagonal', 0) },
  { id: 'medianoche', nombre: 'Medianoche', colorPrimario: '#818cf8', colorMenu: '#0b0f1a', modo: 'oscuro', fondo: galeria('foto-ciudad-noche', 78) },
  { id: 'oscuro', nombre: 'Oscuro', colorPrimario: '#22c55e', colorMenu: '#0d1117', modo: 'oscuro', fondo: SIN_FONDO },
  { id: 'tormenta', nombre: 'Tormenta', colorPrimario: '#38bdf8', colorMenu: '#0b1320', modo: 'oscuro', fondo: galeria('foto-tormenta', 70) },
  { id: 'grafito', nombre: 'Grafito', colorPrimario: '#f59e0b', colorMenu: '#111827', modo: 'oscuro', fondo: galeria('patron-hexagonos', 0) },
];

export const TEMA_BASE = TEMAS[0];
