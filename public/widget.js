/*!
 * FlujoBot — chat web para la página de cualquier negocio.
 *
 *   <script src="https://TU-PANEL/widget.js" data-clave="CLAVE_DEL_BOT" data-api="https://TU-API" async></script>
 *
 * data-modo="pagina" lo muestra a pantalla completa (lo usa el enlace directo /c/CLAVE).
 * Todo vive dentro de un Shadow DOM para que los estilos del sitio no lo afecten.
 */
(function () {
  'use strict';
  var script = document.currentScript;
  if (!script) return;
  var clave = script.getAttribute('data-clave');
  var api = (script.getAttribute('data-api') || '').replace(/\/$/, '');
  var modoPagina = script.getAttribute('data-modo') === 'pagina';
  if (!clave || !api || document.querySelector('[data-flujobot="' + clave + '"]')) return;

  // ───── Almacenamiento seguro (modo privado o bloqueado: sigue funcionando sin guardar) ─────
  function leer(llave, respaldo) {
    try {
      var v = localStorage.getItem('flujobot:' + clave + ':' + llave);
      return v ? JSON.parse(v) : respaldo;
    } catch (e) {
      return respaldo;
    }
  }
  function guardar(llave, valor) {
    try {
      localStorage.setItem('flujobot:' + clave + ':' + llave, JSON.stringify(valor));
    } catch (e) {
      /* sin almacenamiento: la conversación dura lo que dure la página */
    }
  }
  var visitante = leer('visitante', null);
  if (!visitante) {
    visitante = (window.crypto && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2)).replace(/[^\w-]/g, '');
    guardar('visitante', visitante);
  }
  var historial = leer('historial', []);

  // ───── Utilidades ─────
  function escapar(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  /** *negritas*, _cursivas_, ~tachado~ y saltos de línea, como en WhatsApp. */
  function formato(t) {
    return escapar(t)
      .replace(/\*([^*\n]+)\*/g, '<b>$1</b>')
      .replace(/(^|\s)_([^_\n]+)_/g, '$1<i>$2</i>')
      .replace(/~([^~\n]+)~/g, '<s>$1</s>')
      .replace(/\n/g, '<br>');
  }
  function luminancia(hex) {
    var c = [1, 3, 5].map(function (i) {
      var v = parseInt(hex.slice(i, i + 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function esperar(ms) {
    return new Promise(function (listo) {
      setTimeout(listo, ms);
    });
  }
  function pedir(ruta, cuerpo) {
    return fetch(api + '/publico/chat/' + encodeURIComponent(clave) + ruta, {
      method: cuerpo ? 'POST' : 'GET',
      headers: cuerpo ? { 'content-type': 'application/json' } : {},
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    }).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok) throw new Error((j && j.error && j.error.mensaje) || 'Error');
        return j.data;
      });
    });
  }

  var ICONO_CHAT = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H8l-4 4z"/></svg>';
  var ICONO_CERRAR = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var ICONO_ENVIAR = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg>';

  pedir('')
    .then(montar)
    .catch(function (e) {
      console.warn('FlujoBot: el chat no está disponible (' + e.message + ')');
    });

  function montar(config) {
    var color = /^#[0-9a-f]{6}$/i.test(config.empresa.colorPrimario) ? config.empresa.colorPrimario : '#12a150';
    var sobreColor = luminancia(color) > 0.45 ? '#101828' : '#ffffff';

    var anfitrion = document.createElement('div');
    anfitrion.setAttribute('data-flujobot', clave);
    document.body.appendChild(anfitrion);
    var raiz = anfitrion.attachShadow({ mode: 'open' });

    raiz.innerHTML =
      '<style>' +
      ':host{all:initial}' +
      '*{box-sizing:border-box;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif}' +
      '.boton{position:fixed;right:20px;bottom:20px;z-index:2147483000;width:60px;height:60px;border:0;border-radius:50%;background:' + color + ';color:' + sobreColor + ';display:grid;place-items:center;cursor:pointer;box-shadow:0 8px 24px rgba(16,24,40,.25);transition:transform .15s}' +
      '.boton:hover{transform:scale(1.06)}' +
      '.panel{position:fixed;right:20px;bottom:92px;z-index:2147483000;width:370px;height:560px;max-height:calc(100vh - 112px);display:none;flex-direction:column;border-radius:16px;overflow:hidden;background:#fff;box-shadow:0 16px 48px rgba(16,24,40,.28)}' +
      '.panel.abierto{display:flex;animation:entra .2s ease-out}' +
      '.pagina .panel{inset:0;width:auto;height:auto;max-height:none;border-radius:0;display:flex;right:0;bottom:0}' +
      '.pagina .boton,.pagina .cerrar{display:none}' +
      '@keyframes entra{from{opacity:0;transform:translateY(10px)}}' +
      '.cabeza{display:flex;align-items:center;gap:10px;padding:14px 16px;background:' + color + ';color:' + sobreColor + '}' +
      '.logo{width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,.2);display:grid;place-items:center;font-weight:700;overflow:hidden;flex-shrink:0}' +
      '.logo img{width:100%;height:100%;object-fit:contain;background:#fff}' +
      '.titulo{flex:1;min-width:0}.titulo b{display:block;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.titulo small{font-size:12px;opacity:.85}' +
      '.cerrar{border:0;background:none;color:inherit;cursor:pointer;padding:4px;opacity:.85}' +
      '.mensajes{flex:1;overflow-y:auto;padding:16px 12px;background:#efeae2;display:flex;flex-direction:column;gap:6px}' +
      '.m{max-width:85%;padding:8px 11px;border-radius:10px;font-size:14px;line-height:1.4;color:#111;background:#fff;align-self:flex-start;box-shadow:0 1px 1px rgba(0,0,0,.08);overflow-wrap:anywhere;animation:entra .15s ease-out}' +
      '.m.yo{align-self:flex-end;background:#d9fdd3}' +
      '.m img{display:block;max-width:100%;border-radius:6px;margin-bottom:6px}' +
      '.escribiendo{display:flex;gap:4px;padding:11px 13px}.escribiendo i{width:6px;height:6px;border-radius:50%;background:#98a2b3;animation:salto 1s infinite}.escribiendo i:nth-child(2){animation-delay:.15s}.escribiendo i:nth-child(3){animation-delay:.3s}' +
      '@keyframes salto{50%{transform:translateY(-4px)}}' +
      '.sugerencias{display:flex;flex-wrap:wrap;gap:6px;padding:8px 12px 0;background:#f0f2f5}' +
      '.sugerencias:empty{display:none}' +
      '.sugerencias button{max-width:100%;padding:6px 11px;border:1px solid ' + color + ';border-radius:999px;background:#fff;color:#101828;font-size:13px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '.sugerencias button:hover{background:#f6f7f9}' +
      '.pie{display:flex;gap:8px;padding:8px 12px 12px;background:#f0f2f5}' +
      '.pie input{flex:1;min-width:0;height:40px;padding:0 14px;border:1px solid #d0d5dd;border-radius:20px;font-size:14px;outline:none;background:#fff;color:#101828}' +
      '.pie input:focus{border-color:' + color + '}' +
      '.pie button{width:40px;height:40px;border:0;border-radius:50%;background:' + color + ';color:' + sobreColor + ';display:grid;place-items:center;cursor:pointer}' +
      '.pie button:disabled{opacity:.5;cursor:default}' +
      '.marca{padding:0 0 8px;background:#f0f2f5;text-align:center;font-size:11px;color:#98a2b3}' +
      '@media (max-width:480px){.panel{right:0;bottom:0;width:100vw;height:100vh;max-height:none;border-radius:0}}' +
      '</style>' +
      '<div class="contenedor' + (modoPagina ? ' pagina' : '') + '">' +
      '<button class="boton" type="button" aria-label="Abrir chat">' + ICONO_CHAT + '</button>' +
      '<section class="panel" role="dialog" aria-label="Chat">' +
      '<header class="cabeza"><span class="logo"></span><span class="titulo"><b></b><small>Responde al momento</small></span>' +
      '<button class="cerrar" type="button" aria-label="Cerrar">' + ICONO_CERRAR + '</button></header>' +
      '<div class="mensajes" aria-live="polite"></div>' +
      '<div class="sugerencias"></div>' +
      '<form class="pie"><input type="text" placeholder="Escribe un mensaje" aria-label="Mensaje" maxlength="1000"><button type="submit" aria-label="Enviar">' + ICONO_ENVIAR + '</button></form>' +
      '<div class="marca">con FlujoBot</div>' +
      '</section></div>';

    var $ = function (s) {
      return raiz.querySelector(s);
    };
    var panel = $('.panel');
    var lista = $('.mensajes');
    var sugerencias = $('.sugerencias');
    var entrada = $('.pie input');
    var enviarBtn = $('.pie button');
    $('.titulo b').textContent = config.titulo;
    var logo = $('.logo');
    if (config.empresa.logoUrl) logo.innerHTML = '<img alt="" src="' + escapar(config.empresa.logoUrl) + '">';
    else
      logo.textContent = (config.empresa.nombre || config.titulo)
        .split(/\s+/)
        .map(function (p) {
          return p[0] || '';
        })
        .slice(0, 2)
        .join('')
        .toUpperCase();

    function pintarMensaje(m) {
      var d = document.createElement('div');
      d.className = 'm' + (m.de === 'yo' ? ' yo' : '');
      d.innerHTML = (m.url ? '<img alt="" src="' + escapar(m.url) + '">' : '') + formato(m.texto || '');
      lista.appendChild(d);
      lista.scrollTop = lista.scrollHeight;
    }
    function agregar(m) {
      historial.push(m);
      historial = historial.slice(-60);
      guardar('historial', historial);
      pintarMensaje(m);
    }
    function pintarSugerencias(lista_) {
      sugerencias.innerHTML = '';
      (lista_ || []).slice(0, 8).forEach(function (s) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = s.etiqueta;
        b.onclick = function () {
          enviar(s.texto);
        };
        sugerencias.appendChild(b);
      });
    }

    var ocupado = false;
    function enviar(texto) {
      texto = String(texto || '').trim();
      if (!texto || ocupado) return;
      ocupado = true;
      enviarBtn.disabled = true;
      entrada.value = '';
      sugerencias.innerHTML = '';
      agregar({ de: 'yo', texto: texto });
      var escribiendo = document.createElement('div');
      escribiendo.className = 'm escribiendo';
      escribiendo.innerHTML = '<i></i><i></i><i></i>';
      lista.appendChild(escribiendo);
      lista.scrollTop = lista.scrollHeight;

      pedir('/mensajes', { visitante: visitante, texto: texto })
        .then(function (r) {
          escribiendo.remove();
          var cadena = Promise.resolve();
          r.respuestas.forEach(function (resp, i) {
            cadena = cadena.then(function () {
              agregar({ de: 'bot', texto: resp.texto, url: resp.tipo === 'imagen' ? resp.url : undefined });
              return i < r.respuestas.length - 1 ? esperar(450) : null;
            });
          });
          return cadena.then(function () {
            guardar('sugerencias', r.sugerencias);
            pintarSugerencias(r.sugerencias);
          });
        })
        .catch(function () {
          escribiendo.remove();
          pintarMensaje({ de: 'bot', texto: 'No pudimos enviar tu mensaje. Intenta de nuevo en un momento.' });
        })
        .then(function () {
          ocupado = false;
          enviarBtn.disabled = false;
          entrada.focus();
        });
    }

    $('.pie').addEventListener('submit', function (e) {
      e.preventDefault();
      enviar(entrada.value);
    });

    function abrir() {
      panel.classList.add('abierto');
      if (lista.childElementCount === 0) {
        if (historial.length) historial.forEach(pintarMensaje);
        else pintarMensaje({ de: 'bot', texto: config.saludo });
        pintarSugerencias(leer('sugerencias', null) || config.sugerencias);
      }
      setTimeout(function () {
        entrada.focus();
      }, 50);
    }
    $('.boton').onclick = function () {
      if (panel.classList.contains('abierto')) panel.classList.remove('abierto');
      else abrir();
    };
    $('.cerrar').onclick = function () {
      panel.classList.remove('abierto');
    };
    if (modoPagina) abrir();
  }
})();
