// Rincón de reseñas e ideas: las respuestas van a un Formulario de Google del profe (privadas).
// Mientras "form" sea null, el rincón no se muestra.
// form: el código que aparece en el link del formulario, entre /forms/d/e/ y /viewform
// campos: el número "entry.XXXX" de cada pregunta (todas de respuesta corta).
window.RINCON = window.RINCON || {
  form: null,
  campos: { tipo: '', juego: '', estrellas: '', clase: '', mensaje: '' },
};
