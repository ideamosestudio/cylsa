# CYL Neumáticos

Fuente compartida de la web de CYL: **WordPress en www.cylneumaticos.com.ar** y demo estática en GitHub Pages. La publicación en Towebs se describe en [wordpress/README.md](wordpress/README.md).

## Desarrollo y validación

Node.js 24 LTS y pnpm 11.25.0 (declarado en `packageManager`).

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm build
pnpm check
pnpm check:security
pnpm preview
```

`build` prepara imágenes responsive y el modelo 3D, compila Astro y añade CSP y sitemap. No publicar la salida de `astro build` directamente: omitiría las comprobaciones y el procesamiento final. Los originales se conservan en `public`; `public/optimized` y `src/generated` son derivados ignorados por Git y reproducibles en CI. Los nombres de los recursos optimizados incluyen hash de contenido.

## Arquitectura

- `site.config.mjs`: origen y subruta de publicación. Actualizar ambos al migrar a dominio propio.
- `src/pages/index.astro`, `HeroSport.astro`, `src/scripts/home.ts`: portada y carga progresiva de WebGL.
- `src/three/PremiumWheelScene.ts`: rueda principal. El modelo conserva la geometría y utiliza compresión Meshopt.
- `src/components/BrandWheelScene.astro`: segunda escena, descargada sólo al acercarse a la sección en escritorio.
- `src/data/*-products.ts`: catálogo. No inventar stock, precios, reseñas o compatibilidades.
- `SeoHead.astro`: metadatos, canónicas y JSON-LD. `llms.txt.ts` genera un índice textual a partir del catálogo.
- `src/scripts/contact.ts` y `wordpress/mu-plugins/cyl-contacto.php`: contacto directo a hola@cylneumaticos.com.ar desde ambas versiones. El destinatario se fija en el servidor. No se guarda una copia de la consulta en la base.
- `src/scripts/forms.ts`: cotización por WhatsApp y postulaciones por correo. Las respuestas de la encuesta se guardan exclusivamente en WordPress.

Los formularios de contacto envían por POST a WordPress; no incluyen datos personales en la URL. WordPress valida origen, token, longitud y formato, limita la frecuencia y llama al correo del hosting. La aceptación por el servidor de correo no confirma la entrega en la casilla final.

## Rendimiento

Las imágenes tienen variantes responsive, dimensiones intrínsecas y carga diferida salvo recursos prioritarios. La portada ofrece AVIF con respaldo WebP. Las fuentes WOFF2 se sirven localmente y la precarga usa la misma URL que el CSS. El contenido se entrega en HTML antes de cargar WebGL. La escena principal no se inicia en móviles, con movimiento reducido o ahorro de datos.

El generador informa pesos por compilación. Para evaluar la velocidad real, medir el dominio publicado y distinguir Lighthouse de los datos de campo. Conservar las fuentes originales para mantenimiento: solo los WOFF2 se usan en la interfaz.

## SEO e IA

Cada página tiene título, descripción, canónica, metadatos sociales y JSON-LD. Las sucursales usan direcciones y horarios publicados. Las fichas Product no declaran ofertas, stock ni valoraciones sin evidencia. Esto no garantiza resultados enriquecidos.

El sitemap nativo de WordPress es la referencia del sitio público. Las dos versiones señalan canónicas bajo el dominio de CYL. `llms.txt` enlaza el catálogo, el contacto y la encuesta pública; no expone respuestas. Es un complemento, no una garantía de inclusión o citas.

**Subruta de GitHub Pages:** un `robots.txt` sólo gobierna el rastreo si se sirve en la raíz del origen, `https://ideamosestudio.github.io/robots.txt`. La copia en `/cylsa/robots.txt` documenta la política, pero no controla a los robots. Para control efectivo se necesita acceso al repositorio raíz del propietario o un dominio propio. Las canónicas, meta robots, enlaces y sitemap sí están disponibles dentro de esta publicación. Registrar el sitemap en Search Console requiere acceso a la propiedad verificada.

## Seguridad y mantenimiento

El build inserta una CSP con hashes para scripts inline, sin `unsafe-inline` ni `unsafe-eval` para JavaScript. Permite WebAssembly para Meshopt y estilos inline para animaciones; bloquea objetos, frames, cambios de base URL y envíos nativos de formularios. Recursos y conexiones quedan limitados al propio origen. Los enlaces externos son explícitos y los mensajes se codifican para URL.

GitHub Pages no permite configurar encabezados HTTP arbitrarios: CSP meta no admite `frame-ancestors`, HSTS ni Permissions-Policy. No se agregan archivos `_headers` o `.htaccess` que Pages ignoraría. Para aplicar esas defensas hace falta un hosting o proxy con control de encabezados. El CSP de producción se valida con `pnpm preview`; el servidor de desarrollo no lo inserta.

CI valida dependencias, build, enlaces, imágenes, SEO, JSON-LD y CSP antes de publicar. Actions están fijadas por SHA, con permisos de publicación limitados al job de deploy. Los PR sólo validan. Dependabot propone actualizaciones semanales de paquetes y Actions, sin auto-merge. `pnpm audit` sólo detecta vulnerabilidades conocidas por el registro consultado; ningún resultado garantiza ausencia total de fallos.

## Publicación

Los pushes a `main` despliegan después de los checks. Trabajar los cambios en una rama y revisar antes de integrarlos. La configuración de protección de ramas, permisos de colaboradores y secret scanning depende de los administradores de GitHub y no puede validarse sólo leyendo este repositorio.
