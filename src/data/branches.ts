import { siteUrl } from '../../site.config.mjs';
export const branchSchema = [
  { name: 'Perticone', address: 'Eugenio Perticone 1203', city: 'Neuquén', phone: '+542995470052' },
  { name: 'Pin Oeste', address: 'Ingeniero Huergo 2554', city: 'Neuquén', phone: '+542995470059' },
  { name: 'Añelo', address: 'Lote 11 – Frac. C, Manzana 35', city: 'Añelo', phone: '+542995483985' },
].map((branch, i) => ({
  '@type': 'AutoPartsStore', '@id': `${siteUrl}contacto/#sucursal-${i + 1}`,
  name: `CYL Neumáticos — ${branch.name}`, url: `${siteUrl}contacto/`, telephone: branch.phone,
  parentOrganization: { '@id': `${siteUrl}#organization` },
  address: { '@type': 'PostalAddress', streetAddress: branch.address, addressLocality: branch.city, addressRegion: 'Neuquén', addressCountry: 'AR' },
  openingHoursSpecification: [
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday'], opens: '08:30', closes: '17:30' },
    { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Saturday', opens: '08:30', closes: '13:00' },
  ],
}));
