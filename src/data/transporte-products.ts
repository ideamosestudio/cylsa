import type { AutomovilProduct } from './automovil-products';

const fateLogo = 'images/products/eximia-pininfarina-hp/fate-logo-white.png';
const recommendation = ['Consultá las tablas de presión en relación con la carga y respetá las indicaciones del fabricante.'];

type TransportSeed = {
  slug: string;
  model: string;
  variant?: string;
  series: string;
  segment: string;
  surface: string;
  speed: string;
  description: string;
  performance: string[];
  uses?: string[];
};

const makeProduct = ({ slug, model, variant = '', series, segment, surface, speed, description, performance, uses = ['Pavimento.'] }: TransportSeed): AutomovilProduct => {
  const productName = `${model} ${variant}`.trim();
  const isOffRoad = surface === 'FUERA DE CAMINO';
  const isTraction = segment === 'TRACCIÓN';
  const storyTitle = isOffRoad ? 'TRABAJO EXTREMO.' : isTraction ? 'TRACCIÓN REGIONAL.' : 'TRANSPORTE EFICIENTE.';
  const storyAccent = isOffRoad ? 'RESISTENCIA TOTAL.' : isTraction ? 'AGARRE SUPERIOR.' : 'RENDIMIENTO CONTINUO.';
  return {
    slug,
    title: productName,
    model,
    variant,
    cardVariant: variant,
    brand: 'FATE',
    brandLogo: fateLogo,
    series,
    segment,
    surface,
    maxSpeed: speed,
    description,
    coverIntro: `${series}. Rendimiento, seguridad y durabilidad para las exigencias del transporte profesional.`,
    storyTitle,
    storyAccent,
    claim: isOffRoad ? 'HECHO PARA LO MÁS DURO.' : 'MÁS KILÓMETROS. MÁS CONTROL.',
    micro: `FATE / ${productName} / ${surface} / ${speed}`,
    heroImage: `images/products/${slug}/01.png`,
    cardImage: `images/products/transporte-cards/${slug}.png`,
    heroImageAlt: `Neumático ${productName} para transporte`,
    gallery: [
      { src: `images/products/${slug}/01.png`, alt: `Vista en perspectiva del neumático ${productName}`, label: 'PERSPECTIVA / PRODUCTO' },
      { src: `images/products/${slug}/02.png`, alt: `Vista lateral del neumático ${productName}`, label: 'PERFIL / CONSTRUCCIÓN' },
      { src: `images/products/${slug}/03.png`, alt: `Vista frontal del neumático ${productName}`, label: 'PISADA / RENDIMIENTO' },
    ],
    performance,
    uses,
    speeds: [`Rango ${speed}.`],
    recommendations: recommendation,
    sizes: [{ measure: 'CONSULTAR DISPONIBILIDAD', speed }],
  };
};

export const transporteProducts: AutomovilProduct[] = [
  makeProduct({ slug:'fatecargo-sr-200', model:'FATECARGO', variant:'SR-200', series:'SERVICIO REGIONAL', segment:'DIRECCIONAL', surface:'PAVIMENTO', speed:'M / 130 KM/H', description:'Construcción radial con carcasa y cintura de cordones de acero, talones reforzados y compuestos desarrollados para distribución y transporte urbano de pasajeros.', performance:['Carcasa de última generación con mayor durabilidad y recapabilidad.','Gran adherencia en pisos secos y húmedos.','Óptima manejabilidad ante maniobras o frenadas bruscas.','Reduce el consumo de combustible y las emisiones.'] }),
  makeProduct({ slug:'fatecargo-sr-210', model:'FATECARGO', variant:'SR-210', series:'SERVICIO REGIONAL', segment:'DIRECCIONAL', surface:'PAVIMENTO', speed:'M / 130 KM/H', description:'Evolución radial para ejes direccionales en servicio regional, desarrollada para ofrecer una relación eficiente, segura y sustentable entre costo y kilómetro.', performance:['Carcasa radial de alta performance.','Mayor profundidad de dibujo.','Smart Pattern optimiza el desgaste y el kilometraje.','Tratamiento interno para mayor durabilidad y sucesivos recapados.'] }),
  makeProduct({ slug:'fatecargo-sr-260', model:'FATECARGO', variant:'SR-260', series:'SERVICIO REGIONAL', segment:'DIRECCIONAL', surface:'PAVIMENTO', speed:'M / 130 KM/H', description:'Neumático radial que incorpora prestaciones superiores en seguridad, rendimiento y confort para responder a las altas exigencias del transporte actual.', performance:['Carcasa radial de alta performance.','Optimiza el perfil de desgaste y reduce el consumo.','Compuesto de alta resistencia para mayor kilometraje.','Tratamiento interno que favorece sucesivos recapados.'] }),
  makeProduct({ slug:'fatecargo-dr-400', model:'FATECARGO', variant:'DR-400', series:'SERVICIO REGIONAL', segment:'TRACCIÓN', surface:'PAVIMENTO', speed:'L / M · 130 KM/H', description:'Construcción radial de acero, talones reforzados y compuestos de última generación para lograr excelentes prestaciones en servicio pesado.', performance:['Excelente rendimiento kilométrico.','Bloques facetados que evitan la retención de piedras.','Gran tracción y estabilidad ante distintas condiciones climáticas.','Banda de rodamiento súper ancha.'] }),
  makeProduct({ slug:'fatecargo-dr-410', model:'FATECARGO', variant:'DR-410', series:'SERVICIO REGIONAL', segment:'TRACCIÓN', surface:'PAVIMENTO', speed:'M / 130 KM/H', description:'Máxima tracción regional con seis costillas y tacos múltiples, mayor profundidad de dibujo y una carcasa preparada para las exigencias extremas del transporte moderno.', performance:['Carcasa radial de alta performance.','Seis costillas y tacos múltiples para tracción óptima.','Smart Pattern mejora el rendimiento kilométrico.','Menor temperatura de trabajo y mayor recapabilidad.'] }),
  makeProduct({ slug:'fatecargo-dr-460', model:'FATECARGO', variant:'DR-460', series:'SERVICIO REGIONAL', segment:'TRACCIÓN', surface:'PAVIMENTO', speed:'L / 120 KM/H', description:'Producto de elevadas prestaciones con seis costillas, tacos múltiples y geometría optimizada para tracción, kilometraje y menor consumo de combustible.', performance:['Carcasa radial de alta performance.','Perfil de desgaste optimizado.','Tracción eficaz en diversas condiciones de servicio.','Tratamiento interno para más durabilidad y recapabilidad.'] }),
  makeProduct({ slug:'fatecargo-dr-470', model:'FATECARGO', variant:'DR-470', series:'SERVICIO REGIONAL', segment:'TRACCIÓN', surface:'PAVIMENTO', speed:'M / 130 KM/H', description:'Diseñado para asegurar tracción superior en rutas pavimentadas con irregularidades geográficas y condiciones climáticas desfavorables.', performance:['Carcasa radial de alta performance.','Tracción óptima en condiciones adversas.','Compuesto de alta resistencia y máxima adherencia.','Geometría que optimiza el desgaste y reduce el consumo.'] }),
  makeProduct({ slug:'fatecargo-tr-500', model:'FATECARGO', variant:'TR-500', series:'SEMIRREMOLQUE Y ÓMNIBUS', segment:'ARRASTRE', surface:'PAVIMENTO', speed:'K / 110 KM/H', description:'Perfil bajo para semirremolques y ómnibus, con distribución uniforme de presiones, área de contacto amplia y menor resistencia a la rodadura.', performance:['Permite reemplazar el conjunto dual con menor tara.','Cinturones de acero resistentes al desgaste irregular.','Compuestos con sílice para gran kilometraje.','Área de contacto mayor que reduce el consumo.'] }),
  makeProduct({ slug:'fatecargo-tr-560', model:'FATECARGO', variant:'TR-560', series:'SERVICIO DE ARRASTRE', segment:'ARRASTRE', surface:'PAVIMENTO', speed:'J / 100 KM/H', description:'Construcción radial reforzada y compuestos diseñados para brindar una excelente prestación en servicio pesado de arrastre.', performance:['Excelente comportamiento en arrastre.','Perfil y compuesto específicos para el servicio.','Laterales y talones extra reforzados.','Mayor durabilidad y recapabilidad.'] }),
  makeProduct({ slug:'fatecargo-su-100', model:'FATECARGO', variant:'SU-100', series:'SERVICIO URBANO', segment:'URBANO', surface:'PAVIMENTO', speed:'J / 100 KM/H', description:'Diseñado para servicio urbano con fuertes frenadas, arranques bruscos y giros cerrados, sobre distintos tipos de pavimento.', performance:['Amplios canales para evacuar agua.','Excelente respuesta de frenado en seco y mojado.','Confort con bajo nivel de ruido y vibraciones.','Buen kilometraje y óptima manejabilidad.'], uses:['Pavimento.','Servicio urbano.'] }),
  makeProduct({ slug:'fatecargo-sc-240', model:'FATECARGO', variant:'SC-240', series:'SERVICIO MIXTO', segment:'DIRECCIONAL', surface:'MIXTO', speed:'K / 110 KM/H', description:'Construcción radial reforzada y compuestos para servicio pesado mixto, preparada frente a impactos, cortes y agresiones externas.', performance:['Alta resistencia ante impactos.','Carcasa robusta y recappable.','Diseño que minimiza el atrape de piedras.','Costillas centrales para mejor dirigibilidad.'], uses:['Pavimento.','Tierra.','Ripio.'] }),
  makeProduct({ slug:'fatecargo-dc-480', model:'FATECARGO', variant:'DC-480', series:'SERVICIO MIXTO', segment:'TRACCIÓN', surface:'MIXTO', speed:'K / 110 KM/H', description:'Neumático radial robusto con banda agresiva y más de 240 tacos transversales para máxima tracción en barro, ripio y usos penalizantes.', performance:['Alta resistencia ante impactos y agresiones.','Carcasa reforzada y recappable.','Más de 240 tacos para máxima tracción.','Banda agresiva para transmitir potencia.'], uses:['Pavimento.','Tierra.','Ripio.','Barro.'] }),
  makeProduct({ slug:'fatecargo-do-820', model:'FATECARGO', variant:'DO-820', series:'SERVICIO PROFESIONAL', segment:'TRACCIÓN', surface:'FUERA DE CAMINO', speed:'G / 90 KM/H', description:'Creado para vehículos que trabajan en terrenos adversos y vías no pavimentadas, con carcasa reforzada y máxima protección contra daños externos.', performance:['Compuestos de alta resistencia contra daños.','Máxima tracción en condiciones duras.','Autolimpieza que evita el empaste con barro.','Apto para servicios forestales, petroleros y mineros.'], uses:['Fuera de camino.','Barro.','Minería.','Servicio petrolero.'] }),
  makeProduct({ slug:'fatexpress-sr-200', model:'FATEXPRESS', variant:'SR-200', series:'SERVICIO REGIONAL', segment:'DIRECCIONAL', surface:'PAVIMENTO', speed:'M / 130 KM/H', description:'Solución radial para distribución y transporte regional, orientada a durabilidad, seguridad y rendimiento uniforme.', performance:['Diseño para servicio regional.','Desgaste uniforme.','Conducción estable sobre pavimento.','Construcción preparada para trabajo continuo.'] }),
  makeProduct({ slug:'fatexpress-dr-400', model:'FATEXPRESS', variant:'DR-400', series:'SERVICIO REGIONAL', segment:'TRACCIÓN', surface:'PAVIMENTO', speed:'M / 130 KM/H', description:'Construcción radial de acero y talones reforzados para distribución y transporte urbano de pasajeros en condiciones severas.', performance:['Carcasa durable y recappable.','Bloques que reducen la retención de piedras.','Gran tracción y estabilidad.','Óptimo control en maniobras y frenadas.'] }),
  makeProduct({ slug:'carretera-plus', model:'CARRETERA', variant:'PLUS', series:'CARGA Y PASAJEROS', segment:'DIRECCIONAL', surface:'MIXTO', speed:'K / 110 KM/H', description:'Neumático de carga para ejes de dirección y arrastre en camiones y transporte de pasajeros urbano y de media distancia.', performance:['Alta resistencia ante impactos.','Seguridad y rendimiento kilométrico superiores.','Mayor profundidad de dibujo.','Mayor capacidad de reconstrucción.'], uses:['Pavimento.','Tierra.'] }),
  makeProduct({ slug:'pcr', model:'PCR', series:'CARGA Y PASAJEROS', segment:'TRACCIÓN', surface:'MIXTO', speed:'K / G · 110 KM/H', description:'Diseñado para ejes de tracción en camiones y transporte de pasajeros, con canales transversales profundos para ripio y buen andar sobre pavimento.', performance:['Óptima tracción en pavimento, tierra o ripio.','Tacos que evitan el atrape de piedras.','Diseño especial para caminos de ripio.','Alto rendimiento kilométrico.'], uses:['Pavimento.','Tierra.','Ripio.','Mixto.'] }),
];
