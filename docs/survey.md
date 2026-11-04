# Encuesta de satisfacción

Frontend en `/encuesta-de-satisfaccion/`, con cuatro pasos y las doce preguntas/campos relevados del sitio original el 21 de octubre de 2026. Acceso desde el footer.

`src/data/survey.json` contiene la definición versionada y nombres propios estables. `src/scripts/survey.ts` administra navegación, validación y estado en memoria. No utiliza Forminator ni sus endpoints, scripts, nonces o identificadores. La referencia original se usa únicamente para reproducir el contenido y el orden.

En GitHub Pages es una vista previa: no transmite ni persiste respuestas. En WordPress, el módulo propio reemplaza ese controlador con el formulario real.

En producción se requiere HTTPS. El módulo `cyl-encuestas.php` valida los datos, evita duplicados al reintentar y confirma el envío después de guardarlo. Los administradores consultan el listado y los detalles en **Encuestas CYL** dentro del escritorio. La recepción por correo del formulario de contacto es independiente de estas encuestas.

Se mantienen los campos obligatorios señalados por el original: nombre, apellido, email, empresa y satisfacción con el servicio. Las calificaciones usan 1–5; no se interpreta el valor inicial 0 del original como una respuesta. Reclamos puede quedar sin responder. La recomendación tampoco se preselecciona para evitar registrar una opinión que el visitante no eligió.
