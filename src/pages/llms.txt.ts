import { siteUrl, site } from '../../site.config.mjs';
import { automovilProducts } from '../data/automovil-products';
import { camionetaProducts } from '../data/camioneta-products';
import { transporteProducts } from '../data/transporte-products';
import { agroVialProducts } from '../data/agro-vial-products';

export function GET() {
  const groups = [
    ['Automóvil', 'automovil', automovilProducts], ['Camioneta', 'camioneta', camionetaProducts],
    ['Transporte', 'transporte', transporteProducts], ['Agro / Vial', 'agro-vial', agroVialProducts],
  ] as const;
  const text = `# ${site.name}\n\n> ${site.description}\n\n` +
    `CYL S.A. es una empresa de neumáticos con atención en Neuquén y Añelo, Argentina. El sitio es un catálogo informativo; no es una tienda con pago en línea. Los precios y el stock se confirman con el equipo comercial.\n\n` +
    `## Empresa y contacto\n\n` +
    `- [Inicio](${siteUrl}): líneas de neumáticos, marcas y asesoramiento.\n` +
    `- [Quiénes somos](${siteUrl}quienes-somos/): información institucional.\n` +
    `- [Contacto y sucursales](${siteUrl}contacto/): direcciones, teléfonos y horarios de atención.\n` +
    `- [Cotización](${siteUrl}cotizacion/): formulario que prepara una consulta por WhatsApp a la sucursal elegida.\n` +
    `- [Política de calidad](${siteUrl}nuestra-politica/): sistema basado en ISO 9001:2015; la página no afirma una certificación vigente.\n` +
    `- [Trabajá con nosotros](${siteUrl}forma-parte-de-nuestro-equipo/): preparación de un correo a Recursos Humanos; el CV se adjunta en la aplicación de correo.\n\n` +
    groups.map(([label, slug, products]) => `## ${label}\n\n- [Ver línea](${siteUrl}${slug}/)\n` + products.map(p => `- [${p.title}](${siteUrl}${p.slug}/): ${p.description}`).join('\n')).join('\n\n') +
    `\n\n## Alcance de la información\n\nLas fichas describen productos y medidas del catálogo. La compatibilidad, disponibilidad, precios y condiciones deben consultarse con CYL. No se publican valoraciones de clientes ni existencias en tiempo real.\n\n- [Mapa del sitio](${siteUrl}sitemap.xml)\n`;
  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
