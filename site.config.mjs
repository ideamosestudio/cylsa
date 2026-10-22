export const site = {
  origin: process.env.DEPLOY_TARGET === 'hosting' ? 'https://www.cylneumaticos.com.ar' : 'https://ideamosestudio.github.io',
  base: process.env.DEPLOY_TARGET === 'hosting' ? '/' : '/cylsa/',
  name: 'CYL Neumáticos',
  legalName: 'CYL S.A.',
  description: 'Venta de neumáticos para automóvil, camioneta, transporte y agro/vial. Asesoramiento multimarca y tres sucursales en Neuquén y Añelo.',
};
export const siteUrl = `${site.origin}${site.base}`;
