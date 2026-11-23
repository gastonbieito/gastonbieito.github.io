// Script para ver las respuestas de "Ideas de los chicos" en gastonbieito.github.io/ideas/
// Va DENTRO del formulario: abrir el formulario para editar, menú ⋮ > Apps Script, pegar todo esto.
// Cambiá el usuario y la contraseña de abajo (quedan guardados solo en tu cuenta de Google).
// Después: Implementar > Nueva implementación > Aplicación web
//   Ejecutar como: Yo · Quién tiene acceso: Cualquier usuario > Implementar, y copiar la URL que termina en /exec.

var USUARIO = 'gaston';
var CLAVE = 'CAMBIAME';

function doPost(e) {
  var d = {};
  try { d = JSON.parse(e.postData.contents); } catch (x) { }
  if (d.usuario !== USUARIO || d.clave !== CLAVE || CLAVE === 'CAMBIAME') {
    Utilities.sleep(1500);
    return salida({ ok: false });
  }
  var ideas = FormApp.getActiveForm().getResponses().map(function (r) {
    var o = { fecha: r.getTimestamp().toISOString(), r: {} };
    r.getItemResponses().forEach(function (ir) { o.r[ir.getItem().getTitle()] = String(ir.getResponse()); });
    return o;
  });
  return salida({ ok: true, ideas: ideas });
}

function salida(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
