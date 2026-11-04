# CYL en WordPress

El sitio de Astro también se compila como un tema clásico de WordPress. Se conservan el catálogo, diseño, imágenes optimizadas y animaciones. Las páginas se crean como páginas nativas; su contenido principal se guarda en un bloque HTML. No incluye un editor visual tipo Divi. Para conservar la composición, modificar el diseño en Astro y recompilar; no cambiar los slugs importados sin actualizar enlaces y metadatos.

## Compilar en PowerShell

```powershell
$env:DEPLOY_TARGET='hosting'
pnpm run build
pnpm run check
node scripts/build-wordpress.mjs
```

El paquete generado queda en `wordpress/build/cyl-neumaticos`. Instalarlo en `wp-content/themes/cyl-neumaticos`, copiar los recursos de `wordpress/build/root` a la raíz pública y activar el tema. En Apariencia → Preparar sitio CYL, ejecutar la importación con una cuenta administradora. El importador tiene control de permisos y nonce; conserva las páginas ya existentes. Los cambios de diseño en páginas importadas requieren actualizar su contenido de forma explícita, no se sobrescriben al repetir la importación.

La distribución espera WordPress en la raíz del dominio y el directorio de contenido predeterminado. El modelo 3D se sirve en `/optimized/`; CSS, JS, imágenes y fuentes están dentro del tema. Los fragmentos del tema vienen exclusivamente de la compilación local. No se interpretan rutas arbitrarias ni código recibido del visitante.

`hosting.htaccess` incorpora HTTPS, bloqueo de archivos sensibles, compresión y caché de recursos, más las reglas de WordPress. HSTS no se activa hasta resolver la renovación de certificados con el proveedor. La CSP de la interfaz se calcula sobre el HTML final para admitir scripts propios de WordPress sin `unsafe-inline` para JavaScript. Integraciones futuras pueden necesitar revisar esta política.

## Funcionalidad

- Catálogo informativo, sin precios ni stock en tiempo real.
- Contacto y cotización preparan mensajes de WhatsApp; empleos prepara un correo.
- La demo de Pages mantiene la encuesta en vista previa. En WordPress, instalar el contenido de `wordpress/build/mu-plugins` en `wp-content/mu-plugins`. El módulo propio guarda los envíos HTTPS en la base local y agrega **Encuestas CYL** para administradores. No se utiliza Forminator.
- Publicar también `wordpress/build/root/_astro`: las hojas de estilo compiladas buscan allí las fuentes originales.

## Cambios en ambos sitios

Editar el diseño compartido en Astro. Compilar por separado para la raíz del dominio de CYL y para la base de Pages. Publicar en da6 únicamente los archivos afectados; cuando cambie el contenido principal, actualizar las páginas nativas correspondientes conservando ediciones hechas en WordPress. Publicar el código fuente en GitHub, verificar el workflow de Pages y probar ambas URLs. El push a GitHub no despliega WordPress. No subir accesos, respaldos ni respuestas al repositorio.
- SEO conserva los metadatos del diseño y usa el sitemap nativo de WordPress.

## Migración del 22/10/2026

Destino: da6.toservers.com, 200.80.43.216. WordPress limpio con una base independiente. El original quedó fuera de la carpeta pública y se descargaron respaldo de archivos y exportación SQL. Credenciales y respaldos se guardan solo en `.qa`, excluido de Git.

El dominio público aún apuntaba al servidor anterior al realizar la instalación. La delegación DNS y renovación automática SSL requieren coordinación con la titular y Towebs. No se modificaron DNS ni registros de correo.
