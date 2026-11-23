// Ideas de los chicos: van a un Formulario de Google del profe (privado). Mientras "form" sea null,
// el botón de ideas no aparece.
// form: el código del link del formulario, entre /forms/d/e/ y /viewform
// campos: el número "entry.XXXX" de cada pregunta (respuesta corta), en el orden Tipo, Clase, Idea.
window.RINCON = window.RINCON || {
  form: null,
  campos: { tipo: '', clase: '', idea: '' },
};
