// Ideas de los chicos: le pasa las respuestas a gastonbieito.github.io/ideas/
// Va DENTRO del formulario: abrir el formulario para editar, menú ⋮ > Apps Script, pegar todo esto.
// Cambiá el usuario y la contraseña de abajo (quedan solo en tu cuenta de Google).
// Después: Implementar > Nueva implementación > Aplicación web
//   Ejecutar como: Yo · Quién tiene acceso: Cualquier usuario > Implementar, y copiar la URL que termina en /exec.
// Si cambiás algo acá: Implementar > Gestionar implementaciones > lápiz > Versión: nueva > Implementar.

var USUARIO = 'gaston';
var CLAVE = 'CAMBIAME';

// Estados que guarda el profe: '' (nueva), 'proceso', 'hecha', 'papelera'.
var ESTADOS = { '': 1, proceso: 1, hecha: 1, papelera: 1 };

function doPost(e) {
  var d = {};
  try { d = JSON.parse(e.postData.contents); } catch (x) { }
  if (d.usuario !== USUARIO || d.clave !== CLAVE || CLAVE === 'CAMBIAME') {
    Utilities.sleep(1500);
    return salida({ ok: false });
  }
  var form = FormApp.getActiveForm(), props = PropertiesService.getScriptProperties();
  if (d.accion === 'estado' && d.id && ESTADOS[d.estado || '']) {
    if (d.estado) props.setProperty('e_' + d.id, d.estado); else props.deleteProperty('e_' + d.id);
  }
  if (d.accion === 'complejo' && d.id) {
    if (d.valor) props.setProperty('c_' + d.id, '1'); else props.deleteProperty('c_' + d.id);
  }
  if (d.accion === 'borrar' && d.id) borrar(form, props, d.id);
  if (d.accion === 'vaciar') {
    var todo = props.getProperties();
    Object.keys(todo).forEach(function (k) { if (k.indexOf('e_') === 0 && todo[k] === 'papelera') borrar(form, props, k.slice(2)); });
  }
  var est = props.getProperties();
  var ideas = form.getResponses().map(function (r) {
    var o = { id: r.getId(), fecha: r.getTimestamp().toISOString(), estado: est['e_' + r.getId()] || '', complejo: !!est['c_' + r.getId()], r: {} };
    r.getItemResponses().forEach(function (ir) { o.r[ir.getItem().getTitle()] = String(ir.getResponse()); });
    return o;
  });
  return salida({ ok: true, ideas: ideas });
}

function borrar(form, props, id) {
  try { form.deleteResponse(id); } catch (x) { }
  props.deleteProperty('e_' + id);
  props.deleteProperty('c_' + id);
}

function salida(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
