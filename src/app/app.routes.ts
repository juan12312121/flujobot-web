import { Routes } from '@angular/router';
import { sesionGuard } from './core/guards/sesion.guard';
import { invitadoGuard } from './core/guards/invitado.guard';
import { adminGuard } from './core/guards/admin.guard';
import { superadminGuard } from './core/guards/superadmin.guard';
import { idValidoGuard } from './core/guards/id-valido.guard';
import { cambiosSinGuardarGuard } from './core/guards/cambios-sin-guardar.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'inicio' },
  { path: 'entrar', canActivate: [invitadoGuard], loadComponent: () => import('./features/acceso/acceso.page').then((m) => m.AccesoPage) },
  // Enlace directo al chat de un negocio (público, sin sesión)
  { path: 'c/:clave', title: 'Chat', loadComponent: () => import('./features/chat-publico/chat-publico.page').then((m) => m.ChatPublicoPage) },
  { path: 'registro', canActivate: [invitadoGuard], loadComponent: () => import('./features/acceso/acceso.page').then((m) => m.AccesoPage), data: { registro: true } },
  {
    // El editor ocupa toda la pantalla: va fuera del shell con menú lateral
    path: 'bots/:botId/editor',
    title: 'Editor · FlujoBot',
    canActivate: [sesionGuard, idValidoGuard('botId', '/bots')],
    canDeactivate: [cambiosSinGuardarGuard],
    loadComponent: () => import('./features/editor/editor.page').then((m) => m.EditorPage),
  },
  {
    path: '',
    canActivate: [sesionGuard],
    loadComponent: () => import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: 'inicio', title: 'Inicio · FlujoBot', loadComponent: () => import('./features/inicio/inicio.page').then((m) => m.InicioPage) },
      { path: 'bots', title: 'Bots · FlujoBot', loadComponent: () => import('./features/bots/bots.page').then((m) => m.BotsPage) },
      { path: 'agenda', title: 'Agenda · FlujoBot', loadComponent: () => import('./features/agenda/agenda.page').then((m) => m.AgendaPage) },
      { path: 'catalogo', title: 'Catálogo · FlujoBot', loadComponent: () => import('./features/catalogo/catalogo.page').then((m) => m.CatalogoPage) },
      { path: 'conversaciones', title: 'Conversaciones · FlujoBot', loadComponent: () => import('./features/conversaciones/conversaciones.page').then((m) => m.ConversacionesPage) },
      { path: 'pedidos', title: 'Pedidos · FlujoBot', loadComponent: () => import('./features/pedidos/pedidos.page').then((m) => m.PedidosPage) },
      { path: 'empresa', title: 'Mi empresa · FlujoBot', canActivate: [adminGuard], loadComponent: () => import('./features/empresa/empresa.page').then((m) => m.EmpresaPage) },
      { path: 'equipo', title: 'Equipo · FlujoBot', canActivate: [adminGuard], loadComponent: () => import('./features/equipo/equipo.page').then((m) => m.EquipoPage) },
      { path: 'm/:clave', title: 'Módulo · FlujoBot', loadComponent: () => import('./features/modulo/modulo.page').then((m) => m.ModuloPage) },
      { path: 'campanas', title: 'Campañas · FlujoBot', loadComponent: () => import('./features/campanas/campanas.page').then((m) => m.CampanasPage) },
      { path: 'encuestas', title: 'Encuestas · FlujoBot', loadComponent: () => import('./features/encuestas/encuestas.page').then((m) => m.EncuestasPage) },
      { path: 'actividad', title: 'Actividad · FlujoBot', canActivate: [adminGuard], loadComponent: () => import('./features/actividad/actividad.page').then((m) => m.ActividadPage) },
      { path: 'admin', title: 'Administración · FlujoBot', canActivate: [superadminGuard], loadComponent: () => import('./features/admin/admin.page').then((m) => m.AdminPage) },
    ],
  },
  { path: '**', redirectTo: 'inicio' },
];
