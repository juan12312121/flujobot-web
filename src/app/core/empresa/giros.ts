import { Giro } from '../models';
import { Plantilla } from '../services/bots/bots.service';
import { NombreIcono } from '../iconos/iconos';

export interface InfoGiro {
  id: Giro;
  nombre: string;
  icono: NombreIcono;
  ejemplo: string;
  plantilla: Plantilla;
}

/** Tipos de negocio para elegir al registrarse (los valores de arranque viven en el backend). */
export const GIROS: InfoGiro[] = [
  { id: 'tienda', nombre: 'Tienda / comercio', icono: 'tienda', ejemplo: 'Pedidos y catálogo', plantilla: 'tienda' },
  { id: 'restaurante', nombre: 'Restaurante', icono: 'restaurante', ejemplo: 'Órdenes y reservaciones', plantilla: 'tienda' },
  { id: 'belleza', nombre: 'Salón o barbería', icono: 'belleza', ejemplo: 'Citas por servicio', plantilla: 'citas' },
  { id: 'salud', nombre: 'Consultorio', icono: 'salud', ejemplo: 'Consultas y pacientes', plantilla: 'citas' },
  { id: 'servicios', nombre: 'Servicios / taller', icono: 'servicios', ejemplo: 'Solicitudes y citas', plantilla: 'citas' },
  { id: 'educacion', nombre: 'Escuela / cursos', icono: 'educacion', ejemplo: 'Inscripciones', plantilla: 'prospectos' },
  { id: 'inmobiliaria', nombre: 'Inmobiliaria', icono: 'inmobiliaria', ejemplo: 'Prospectos y visitas', plantilla: 'prospectos' },
  { id: 'otro', nombre: 'Otro', icono: 'destellos', ejemplo: 'Información y atención', plantilla: 'informacion' },
];

export const PLANTILLAS: { id: Plantilla; icono: NombreIcono; nombre: string; descripcion: string }[] = [
  { id: 'tienda', icono: 'carrito', nombre: 'Pedidos', descripcion: 'Menú → catálogo → carrito → datos de entrega → pedido.' },
  { id: 'citas', icono: 'calendario', nombre: 'Citas', descripcion: 'Elegir servicio → nombre → día y hora libres.' },
  { id: 'prospectos', icono: 'formulario', nombre: 'Prospectos', descripcion: 'Opciones → nombre, correo y comentario → solicitud.' },
  { id: 'informacion', icono: 'chat', nombre: 'Información', descripcion: 'Horarios, ubicación, preguntas frecuentes y asesor.' },
  { id: 'vacio', icono: 'vacio', nombre: 'En blanco', descripcion: 'Solo el bloque de Inicio; armas todo tú.' },
];

/** Paletas sugeridas en "Mi empresa". */
export const PALETAS = [
  { nombre: 'Verde', primario: '#12a150', menu: '#0f1b17' },
  { nombre: 'Azul', primario: '#2563eb', menu: '#0f172a' },
  { nombre: 'Violeta', primario: '#7c3aed', menu: '#1e1033' },
  { nombre: 'Rosa', primario: '#db2777', menu: '#2a0f1e' },
  { nombre: 'Naranja', primario: '#ea580c', menu: '#1f130b' },
  { nombre: 'Turquesa', primario: '#0891b2', menu: '#0b1d24' },
  { nombre: 'Café', primario: '#b45309', menu: '#231a12' },
  { nombre: 'Claro', primario: '#2563eb', menu: '#ffffff' },
];
