import { dia, shapes, util } from '@joint/core';
import { NodoFlujo, Conexion } from '../../../core/models';
import { puertosDe, resumenNodo, TIPOS } from '../../../core/flujo/tipos-de-nodo';
import { ICONOS } from '../../../core/iconos/iconos';

/** Medidas del bloque en el lienzo. */
export const ANCHO = 240;
const ALTO_ENCABEZADO = 32;
const ALTO_RESUMEN = 40;
const ALTO_SALIDA = 26;
const FUENTE = 'Inter, system-ui, sans-serif';

/**
 * Bloque del flujo: encabezado de color con el tipo, un resumen de lo que hace
 * y una fila por cada salida (a la derecha) donde se arrastran las flechas.
 */
export const FormaNodo = dia.Element.define(
  'flujobot.Nodo',
  {
    size: { width: ANCHO, height: 90 },
    attrs: {
      cuerpo: { width: 'calc(w)', height: 'calc(h)', rx: 10, ry: 10, fill: '#fff', stroke: '#d0d5dd', strokeWidth: 1.5 },
      encabezado: { width: 'calc(w)', height: ALTO_ENCABEZADO, rx: 10, ry: 10 },
      tapa: { y: ALTO_ENCABEZADO - 10, width: 'calc(w)', height: 10 },
      // Icono de 24×24 escalado a 15 px y centrado en el encabezado
      icono: { transform: 'translate(11, 8.5) scale(0.625)', fill: 'none', stroke: '#fff', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' },
      titulo: { x: 34, y: ALTO_ENCABEZADO / 2, textVerticalAnchor: 'middle', fill: '#fff', fontSize: 12.5, fontWeight: 600, fontFamily: FUENTE },
      espera: { x: 'calc(w-12)', y: ALTO_ENCABEZADO / 2, textAnchor: 'end', textVerticalAnchor: 'middle', fill: 'rgba(255,255,255,.85)', fontSize: 10.5, fontFamily: FUENTE },
      // Resultados: cuántas conversaciones llegaron (arriba) y cuántas se fueron aquí (abajo)
      insignia: { display: 'none', x: 'calc(w-8)', y: -13, height: 24, rx: 12, ry: 12, fill: '#101828' },
      cuenta: { display: 'none', x: 'calc(w-8)', y: -1, textAnchor: 'end', textVerticalAnchor: 'middle', fill: '#fff', fontSize: 12, fontWeight: 700, fontFamily: FUENTE },
      alerta: { display: 'none', x: 0, y: 'calc(h+8)', height: 24, rx: 12, ry: 12, fill: '#fdecea', stroke: '#d92d20' },
      abandono: { display: 'none', x: 12, y: 'calc(h+20)', textVerticalAnchor: 'middle', fill: '#b42318', fontSize: 12, fontWeight: 600, fontFamily: FUENTE },
      resumen: {
        x: 12,
        y: ALTO_ENCABEZADO + 10,
        fill: '#344054',
        fontSize: 12,
        fontFamily: FUENTE,
        textVerticalAnchor: 'top',
        textWrap: { width: ANCHO - 24, maxLineCount: 2, ellipsis: true },
      },
    },
    ports: {
      groups: {
        in: {
          position: { name: 'absolute', args: { x: 0, y: ALTO_ENCABEZADO / 2 } },
          markup: util.svg`<circle @selector="punto"/>`,
          attrs: { punto: { r: 7, magnet: 'passive', fill: '#fff', stroke: '#98a2b3', strokeWidth: 2, cursor: 'crosshair' } },
        },
        out: {
          position: { name: 'absolute' },
          markup: util.svg`<circle @selector="punto"/>`,
          attrs: { punto: { r: 7, magnet: true, fill: '#fff', strokeWidth: 2.5, cursor: 'crosshair' } },
          label: {
            position: { name: 'left', args: { x: -14 } },
            markup: util.svg`<text @selector="etiqueta"/>`,
          },
        },
      },
    },
  },
  {
    markup: util.svg`
      <rect @selector="cuerpo"/>
      <rect @selector="encabezado"/>
      <rect @selector="tapa"/>
      <path @selector="icono"/>
      <text @selector="titulo"/>
      <text @selector="espera"/>
      <text @selector="resumen"/>
      <rect @selector="insignia"/>
      <text @selector="cuenta"/>
      <rect @selector="alerta"/>
      <text @selector="abandono"/>
    `,
  },
);

export const NAMESPACE = { ...shapes, flujobot: { Nodo: FormaNodo } };

/** Aplica los datos del nodo al elemento de JointJS (crea, mueve y quita puertos según las salidas). */
export function pintarNodo(el: dia.Element, nodo: NodoFlujo): void {
  const tipo = TIPOS[nodo.tipo];
  const salidas = puertosDe(nodo);
  const alto = ALTO_ENCABEZADO + ALTO_RESUMEN + Math.max(salidas.length, 0) * ALTO_SALIDA + (salidas.length ? 6 : 0);
  el.resize(ANCHO, Math.max(alto, 76));
  el.attr({
    encabezado: { fill: tipo.color },
    tapa: { fill: tipo.color },
    icono: { d: ICONOS[tipo.icono] },
    titulo: { text: tipo.nombre },
    espera: { text: tipo.espera ? 'espera respuesta' : '' },
    resumen: { text: resumenNodo(nodo) || ' ' },
  });

  // Entrada: todos menos Inicio
  const tieneEntrada = el.hasPort('entrada');
  if (nodo.tipo !== 'inicio' && !tieneEntrada) el.addPort({ id: 'entrada', group: 'in' });
  if (nodo.tipo === 'inicio' && tieneEntrada) el.removePort('entrada');

  // Salidas: actualizar las que siguen, quitar las que ya no, agregar las nuevas
  const deseadas = new Map(salidas.map((s, i) => [s.id, { etiqueta: s.etiqueta, y: ALTO_ENCABEZADO + ALTO_RESUMEN + i * ALTO_SALIDA + ALTO_SALIDA / 2 }]));
  for (const p of el.getGroupPorts('out')) if (!deseadas.has(p.id as string)) el.removePort(p.id as string);
  for (const [id, { etiqueta, y }] of deseadas) {
    const attrs = {
      punto: { stroke: tipo.color },
      etiqueta: { text: etiqueta, fill: '#475467', fontSize: 11.5, fontFamily: FUENTE, textAnchor: 'end', textVerticalAnchor: 'middle' },
    };
    if (el.hasPort(id)) {
      el.portProp(id, 'args', { x: ANCHO, y });
      el.portProp(id, 'attrs', attrs);
    } else {
      el.addPort({ id, group: 'out', args: { x: ANCHO, y }, attrs });
    }
  }
}

export function crearNodo(nodo: NodoFlujo): dia.Element {
  const el = new FormaNodo({ id: nodo.id, position: { ...nodo.posicion } });
  pintarNodo(el, nodo);
  return el;
}

export function crearFlecha(conexion?: Conexion): dia.Link {
  const link = new shapes.standard.Link({
    ...(conexion
      ? { id: conexion.id, source: { id: conexion.origen, port: conexion.puerto }, target: { id: conexion.destino, port: 'entrada' } }
      : {}),
    attrs: {
      line: { stroke: '#98a2b3', strokeWidth: 2, targetMarker: { type: 'path', d: 'M 9 -5 0 0 9 5 z' } },
      wrapper: { strokeWidth: 14 },
    },
  });
  return link;
}

const anchoTexto = (t: string) => Math.round(t.length * 7 + 20);

/** Muestra (o esconde con null) las insignias de "Ver resultados" en un bloque. */
export function pintarResultado(el: dia.Element, dato: { llegaron: number; abandonos: number; enCurso: number } | null): void {
  if (!dato) {
    el.attr({ insignia: { display: 'none' }, cuenta: { display: 'none' }, alerta: { display: 'none' }, abandono: { display: 'none' }, cuerpo: { opacity: 1 } });
    return;
  }
  const cuenta = `${dato.llegaron} ${dato.llegaron === 1 ? 'conversación' : 'conversaciones'}`;
  const ancho = anchoTexto(cuenta);
  const abandono = dato.abandonos ? `${dato.abandonos} se ${dato.abandonos === 1 ? 'fue' : 'fueron'} aquí` : '';
  el.attr({
    insignia: { display: null, width: ancho, x: `calc(w-${ancho + 8})` },
    cuenta: { display: null, text: cuenta, x: 'calc(w-18)' },
    alerta: { display: abandono ? null : 'none', width: anchoTexto(abandono) },
    abandono: { display: abandono ? null : 'none', text: abandono },
    cuerpo: { opacity: dato.llegaron ? 1 : 0.45 },
  });
}

/** Etiqueta con el número de conversaciones que tomaron la flecha; grosor proporcional. */
export function pintarResultadoFlecha(link: dia.Link, cuantas: number | null, maximo: number, color: string): void {
  if (cuantas === null) {
    link.labels([]);
    return;
  }
  link.attr('line/strokeWidth', 1.5 + (maximo ? (cuantas / maximo) * 7 : 0));
  link.attr('line/stroke', cuantas ? color : '#d0d5dd');
  link.labels(
    cuantas
      ? [{ position: 0.5, attrs: { text: { text: String(cuantas), fill: '#101828', fontSize: 12, fontWeight: 700, fontFamily: FUENTE }, rect: { fill: '#fff', stroke: color, strokeWidth: 1.5, rx: 8, ry: 8 } } }]
      : [],
  );
}
