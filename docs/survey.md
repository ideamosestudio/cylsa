# Encuesta de satisfacción

Frontend en `/encuesta-de-satisfaccion/`, con cuatro pasos y las doce preguntas/campos relevados del sitio original el 21 de octubre de 2026. Acceso desde el footer.

`src/data/survey.json` contiene la definición versionada y nombres propios estables. `src/scripts/survey.ts` administra navegación, validación y estado en memoria. No utiliza Forminator ni sus endpoints, scripts, nonces o identificadores. La referencia original se usa únicamente para reproducir el contenido y el orden.

Es una vista previa: no transmite ni persiste respuestas. El final dice explícitamente que no se enviaron ni se guardaron. No usar esta interfaz para recolectar respuestas reales hasta implementar el servidor.

La siguiente etapa, cuando se reciba el backend existente, será un plugin propio para WordPress con administración de encuestas y respuestas. La definición actual permite separar el renderizado de la persistencia; el contrato definitivo, permisos, validación de servidor y gestión de respuestas se resolverán en esa etapa. No se integra Forminator.

Se mantienen los campos obligatorios señalados por el original: nombre, apellido, email, empresa y satisfacción con el servicio. Las calificaciones usan 1–5; no se interpreta el valor inicial 0 del original como una respuesta. Reclamos puede quedar sin responder. La recomendación tampoco se preselecciona para evitar registrar una opinión que el visitante no eligió.
