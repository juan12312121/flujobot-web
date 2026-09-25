/**
 * Iconos de línea (24×24, trazo redondeado) en un solo `d` de SVG cada uno.
 * Los usa el componente <app-icono> y también el lienzo de JointJS, que no puede usar componentes.
 */
export const ICONOS = {
  // Navegación y acciones
  logo: 'M5 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM19 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM12 15.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM7.5 6h9M6.5 8l4 8M17.5 8l-4 8',
  inicio: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  bot: 'M5 9h14v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2zM12 3v3M9 13h.01M15 13h.01M9 17h6',
  calendario: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  paquete: 'M4 7l8-4 8 4v10l-8 4-8-4zM4 7l8 4 8-4M12 11v10',
  chat: 'M4 5h16v11H8l-4 4z',
  carrito: 'M6 6h15l-2 8H8zM6 6L5 3H2M9 20h.01M18 20h.01',
  equipo: 'M16 19v-1a4 4 0 0 0-8 0v1M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM20 19v-1a3 3 0 0 0-3-3M4 19v-1a3 3 0 0 1 3-3',
  ajustes:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.9-1.2V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  cerrar: 'M6 6l12 12M18 6L6 18',
  regresar: 'M19 12H5M12 19l-7-7 7-7',
  izquierda: 'M15 18l-6-6 6-6',
  derecha: 'M9 18l6-6-6-6',
  arriba: 'M18 15l-6-6-6 6',
  abajo: 'M6 9l6 6 6-6',
  mas: 'M12 5v14M5 12h14',
  menos: 'M5 12h14',
  menu: 'M4 6h16M4 12h16M4 18h16',
  enviar: 'M22 2L11 13M22 2l-7 20-4-9-9-4z',
  check: 'M20 6L9 17l-5-5',
  basura: 'M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14',
  duplicar: 'M9 9h11v11H9zM5 15H4V4h11v1',
  imagen: 'M3 5h18v14H3zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 19',
  subir: 'M12 21V9M7 14l5-5 5 5M5 3h14',
  descargar: 'M12 3v12M7 10l5 5 5-5M5 21h14',
  ajustar: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  telefono:
    'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z',
  alerta: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 8v4M12 16h.01',
  reloj: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2',

  // Tipos de negocio
  tienda: 'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0',
  restaurante: 'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zM21 15v7',
  belleza: 'M6 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM6 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12',
  salud:
    'M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7zM3.2 12H9l1-2 2 4 1-2h6.8',
  servicios: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z',
  educacion: 'M22 10L12 5 2 10l10 5 10-5zM6 12v5c3 3 9 3 12 0v-5',
  inmobiliaria: 'M3 21h18M5 21V7l7-4 7 4v14M9 9h1M14 9h1M9 13h1M14 13h1M9 17h1M14 17h1',
  destellos: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 16l.8 1.7 1.7.8-1.7.8-.8 1.7-.8-1.7-1.7-.8 1.7-.8z',

  // Plantillas y catálogo
  formulario: 'M9 2h6v4H9zM16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M8 12h8M8 16h5',
  vacio: 'M3 3h18v18H3z',

  // Bloques del flujo
  play: 'M6 4l14 8-14 8z',
  mensaje: 'M3 5h18v14H3zM3 5l9 7 9-7',
  lista: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  pregunta: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01',
  rejilla: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  registro: 'M9 2h6v4H9zM16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 14l2 2 4-4',
  ramificacion: 'M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9a9 9 0 0 1-9 9',
  rayo: 'M13 2L3 14h9l-1 8 10-12h-9z',
  asesor: 'M3 18v-6a9 9 0 0 1 18 0v6M21 19a2 2 0 0 1-2 2h-1v-6h3zM3 19a2 2 0 0 0 2 2h1v-6H3z',
  fin: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM9 9h6v6H9z',
} as const;

export type NombreIcono = keyof typeof ICONOS;
