# CYL Neumáticos

Sitio estático de Astro para `https://ideamosestudio.github.io/cylsa/`.

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
- `src/scripts/forms.ts`: consultas por WhatsApp y postulaciones por mailto. No hay backend, envío automático de correos, almacenamiento de datos ni carga de CV al sitio.

Los formularios preparan un mensaje para que el visitante lo envíe en la aplicación de destino. La portada ya no transmite datos personales como parámetros GET al formulario de cotización. Sin JavaScript se muestran enlaces de contacto alternativos.

## Rendimiento

236 imágenes se convierten a WebP con variantes de ancho, dimensiones intrínsecas y carga diferida salvo recursos prioritarios. Las fuentes se sirven localmente. El HTML y los botones están disponibles antes de WebGL; no hay pantalla que bloquee la página mientras carga el modelo. No se carga 3D en móvil, movimiento reducido o ahorro de datos. La escena secundaria deja de renderizar al estabilizarse el cursor y ambas respetan la visibilidad de la pestaña.

Comparación de archivos fuente y derivados (no equivale a bytes transferidos en una visita): imágenes 53.207.199 → 7.896.366 bytes sumando la variante mayor por original; rueda principal 6.260.444 → 514.756 bytes. Para evaluar Core Web Vitals reales hay que medir la publicación y, cuando haya tráfico suficiente, datos de campo; una prueba local no demuestra el rendimiento público.

## SEO e IA

Cada página tiene título, descripción, canónica, metadatos sociales y JSON-LD. Las sucursales usan direcciones y horarios publicados. Las fichas Product no declaran ofertas, stock ni valoraciones sin evidencia. Esto no garantiza resultados enriquecidos.

El sitemap incluye las 75 páginas indexables y excluye 404. `llms.txt` es un complemento legible y enlazado desde el HTML; no es un estándar obligatorio para buscadores ni garantiza inclusión o citas de asistentes. El contenido principal ya se entrega en HTML sin depender de WebGL.

**Subruta de GitHub Pages:** un `robots.txt` sólo gobierna el rastreo si se sirve en la raíz del origen, `https://ideamosestudio.github.io/robots.txt`. La copia en `/cylsa/robots.txt` documenta la política, pero no controla a los robots. Para control efectivo se necesita acceso al repositorio raíz del propietario o un dominio propio. Las canónicas, meta robots, enlaces y sitemap sí están disponibles dentro de esta publicación. Registrar el sitemap en Search Console requiere acceso a la propiedad verificada.

## Seguridad y mantenimiento

El build inserta una CSP con hashes para scripts inline, sin `unsafe-inline` ni `unsafe-eval` para JavaScript. Permite WebAssembly para Meshopt y estilos inline para animaciones; bloquea objetos, frames, cambios de base URL y envíos nativos de formularios. Recursos y conexiones quedan limitados al propio origen. Los enlaces externos son explícitos y los mensajes se codifican para URL.

GitHub Pages no permite configurar encabezados HTTP arbitrarios: CSP meta no admite `frame-ancestors`, HSTS ni Permissions-Policy. No se agregan archivos `_headers` o `.htaccess` que Pages ignoraría. Para aplicar esas defensas hace falta un hosting o proxy con control de encabezados. El CSP de producción se valida con `pnpm preview`; el servidor de desarrollo no lo inserta.

CI valida dependencias, build, enlaces, imágenes, SEO, JSON-LD y CSP antes de publicar. Actions están fijadas por SHA, con permisos de publicación limitados al job de deploy. Los PR sólo validan. Dependabot propone actualizaciones semanales de paquetes y Actions, sin auto-merge. `pnpm audit` sólo detecta vulnerabilidades conocidas por el registro consultado; ningún resultado garantiza ausencia total de fallos.

## Publicación

Los pushes a `main` despliegan después de los checks. Trabajar los cambios en una rama y revisar antes de integrarlos. La configuración de protección de ramas, permisos de colaboradores y secret scanning depende de los administradores de GitHub y no puede validarse sólo leyendo este repositorio.
