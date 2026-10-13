import type { AutomovilProduct } from './automovil-products';

const fateLogo = 'images/products/eximia-pininfarina-hp/fate-logo-white.png';
const commonGallery = {
  profile: 'images/products/agro-vial-common/02.png',
  tread: 'images/products/agro-vial-common/03.png',
};

type AgroSeed = {
  slug: string;
  model: string;
  variant?: string;
  segment: string;
  description: string;
  performance?: string[];
  uses?: string[];
  speed?: string;
  recommendations?: string[];
  sizes?: string[];
};

const defaultRecommendation = ['Consultá las tablas de presión en relación con la carga y respetá las indicaciones del fabricante.'];

const makeProduct = ({
  slug,
  model,
  variant = '',
  segment,
  description,
  performance = ['Construcción preparada para las exigencias del trabajo agropecuario y vial.'],
  uses = ['Tierra.', 'Fuera de camino.'],
  speed = 'CONSULTAR',
  recommendations = defaultRecommendation,
  sizes = ['CONSULTAR DISPONIBILIDAD'],
}: AgroSeed): AutomovilProduct => {
  const title = `${model} ${variant}`.trim();
  return {
    slug,
    title,
    model,
    variant,
    cardVariant: variant,
    brand: 'FATE',
    brandLogo: fateLogo,
    series: 'AGRO / VIAL',
    segment,
    surface: 'FUERA DE CAMINO',
    maxSpeed: speed,
    description,
    coverIntro: `${segment}. Tracción, resistencia y capacidad de trabajo para aplicaciones agropecuarias y viales.`,
    storyTitle: 'FUERZA EN EL TERRENO.',
    storyAccent: 'TRABAJO CONTINUO.',
    claim: 'HECHO PARA PRODUCIR.',
    micro: `FATE / ${title} / AGRO-VIAL / ${speed}`,
    heroImage: `images/products/${slug}/01.png`,
    cardImage: `images/products/agro-vial-cards/${slug}.png`,
    heroImageAlt: `Neumático ${title} para aplicación agropecuaria o vial`,
    gallery: [
      { src: `images/products/${slug}/01.png`, alt: `Vista del neumático ${title}`, label: 'PRODUCTO / APLICACIÓN' },
      { src: commonGallery.profile, alt: `Detalle constructivo del neumático ${title}`, label: 'PERFIL / CONSTRUCCIÓN' },
      { src: commonGallery.tread, alt: `Detalle de trabajo del neumático ${title}`, label: 'TERRENO / RENDIMIENTO' },
    ],
    performance,
    uses,
    speeds: speed === 'CONSULTAR' ? ['Consultá el rango correspondiente a la medida elegida.'] : [`Rango ${speed}.`],
    recommendations,
    sizes: sizes.map((measure) => ({ measure, speed })),
  };
};

export const agroVialProducts: AutomovilProduct[] = [
  makeProduct({ slug:'gi80', model:'G180', segment:'MINICARGADORA', description:'Desarrollado para minicargadoras compactas y tareas de construcción. Su banda extra profunda brinda resistencia a cortes, desgarres y desgaste en terrenos exigentes.', performance:['Excelente tracción en ambos sentidos de avance.','Gran resistencia a la deformación, desgarre y agrietamiento.','Excelente durabilidad en condiciones severas.'], uses:['Pavimento.','Tierra.','Mixto.','Fuera de camino.'], sizes:['10 x 16.5','12 x 16.5'] }),
  makeProduct({ slug:'sdt-80', model:'SDT-80', segment:'IMPLEMENTOS', description:'Neumático de alta resistencia para ejes delanteros de retroexcavadoras e implementos agrícolas, diseñado para reducir la compactación del suelo.', performance:['Alta resistencia ante impactos y agresiones externas.','Gran capacidad de carga.','Máxima tracción.','Alta flotabilidad.'], sizes:['12.5/80-18 TL'] }),
  makeProduct({ slug:'gr850-r1-w', model:'GR850', variant:'R1-W', segment:'RADIAL AGRÍCOLA', description:'Neumático radial de tracción R-1W para maquinaria agrícola, con tacos a 45° y gran poder autolimpiante en distintos tipos de suelo.', performance:['Menor compactación del suelo.','Ahorro de combustible y tiempo de labor.','Mayor duración y menor costo por hora.'], speed:'A8 / 40 KM/H', sizes:['380/85 R24 TL','460/85 R34 TL'] }),
  makeProduct({ slug:'gd-800-r-1', model:'GD-800', variant:'R-1', segment:'TRACCIÓN', description:'Diseñado para trabajar en distintos suelos. Sus tacos a 45° reducen el patinamiento y la resistencia a la rodadura.', performance:['Excelente resistencia a cortes, desgarres y roturas.','Óptimo agarre y máxima autolimpieza.','Gran capacidad de carga.'], uses:['Tierra.','Barro.','Fuera de camino.'], speed:'A7 / 35 KM/H' }),
  makeProduct({ slug:'gd-700-r-2', model:'GD-700', variant:'R-2', segment:'TRACCIÓN HÚMEDA', description:'Tacos extra profundos para terrenos anegados o muy húmedos. Recomendado para arroz y caña de azúcar, con alta flotación y autolimpieza.', performance:['Muy buena tracción en terrenos húmedos.','Diseño autolimpiante.'], uses:['Tierra.','Pantano.','Barro.'], speed:'A7 / 35 KM/H' }),
  makeProduct({ slug:'gd-900-r-4', model:'GD-900', variant:'R-4', segment:'TRACTOR INDUSTRIAL', description:'Diseño R-4 para ruedas motrices de tractores industriales en terrenos accidentados y condiciones severas, con tacos anchos y profundos.', performance:['Alta resistencia a roturas, cortes y desgarres.','Construcción para trabajo industrial severo.'], speed:'A8 / 40 KM/H', sizes:['19.5 L-24'] }),
  makeProduct({ slug:'gd-800-twaron-r-1', model:'GD-800 TWARON', variant:'R-1', segment:'TRACCIÓN REFORZADA', description:'Versión reforzada para tareas agrícolas severas, con diseño autolimpiante y protección adicional frente a penetraciones y agresiones del terreno.', performance:['Carcasa reforzada.','Alta resistencia a cortes y desgarres.','Óptimo agarre y autolimpieza.'], speed:'A7 / 35 KM/H' }),
  makeProduct({ slug:'gd-79-r-1', model:'GD-79', variant:'R-1', segment:'TRACCIÓN', description:'Neumático agrícola R-1 con tacos a 45°, desarrollado para minimizar el patinamiento y reducir el consumo de combustible.', performance:['Excelente resistencia a cortes y roturas.','Óptimo agarre por su centro abierto.','Diseño autolimpiante.'], speed:'A7 / 35 KM/H' }),
  makeProduct({ slug:'gd-79-twaron-r-1', model:'GD-79 TWARON', variant:'R-1', segment:'TRACCIÓN REFORZADA', description:'Especialmente diseñado para campos recientemente desmontados, con carcasa reforzada y absorbedores de Twaron.', performance:['Excelente resistencia a cortes y roturas.','Carcasa reforzada con absorbedores de Twaron.','Diseño autolimpiante.'], uses:['Pavimento.','Barro.','Fuera de camino.'], speed:'A7 / 35 KM/H' }),
  makeProduct({ slug:'forestal-r-1', model:'FORESTAL', variant:'R-1', segment:'SERVICIO FORESTAL', description:'Producto para servicios severos forestales y de desmonte, con carcasa de nylon y absorbedores de Twaron en la banda de rodamiento.', performance:['Alta resistencia a cortes, desgarres y roturas.','Barrera de Twaron contra pinchaduras.','Talón protegido frente a elementos extraños.'], sizes:['18.4-34'] }),
  makeProduct({ slug:'gd-790-r-3', model:'GD-790', variant:'R-3', segment:'FLOTACIÓN', description:'Neumático agrícola para transporte de granos por arrastre. Su perfil R-3 ofrece una gran superficie de contacto y elevada flotación.', performance:['Muy buena tracción en caminos húmedos.','Óptima tracción y agarre.'], uses:['Tierra.','Barro.','Fuera de camino.'], sizes:['23.1-30'] }),
  makeProduct({ slug:'agraria-r-1', model:'AGRARIA', variant:'R-1', segment:'TRACCIÓN', description:'Neumático agrícola con tacos quebrados autolimpiantes, excelente resistencia a cortes y gran capacidad de tracción.', performance:['Carcasa diagonal de nylon de alta resistencia.','Compuestos robustos para mayor duración.'], speed:'A7 / 35 KM/H', sizes:['16.9-30'] }),
  makeProduct({ slug:'nt-r-1', model:'NT', variant:'R-1', segment:'TRACCIÓN', description:'Diseño R-1 con tacos reforzados en el centro, apto para servicios sobre suelos secos o semiduros.', performance:['Excelente resistencia a cortes y roturas.','Óptimo agarre.','Diseño autolimpiante.'], uses:['Tierra.','Barro.','Fuera de camino.'] }),
  makeProduct({ slug:'sp-arrocera-r-2', model:'SP ARROCERA', variant:'R-2', segment:'ARROCERA', description:'Tacos helicoidales extra profundos para terrenos anegados, plantaciones de arroz y caña de azúcar, con alta flotación y tracción.', performance:['Alta flotación.','Gran capacidad de tracción.','Diseño autolimpiante.'], uses:['Tierra húmeda.','Pantano.','Barro.'], sizes:['23.1-26'] }),
  makeProduct({ slug:'sd-f-3', model:'SD', variant:'F-3', segment:'SIEMBRA DIRECTA', description:'Diseñado para implementos de siembra directa y uso sin cámara. Su gran ancho de sección aporta excelentes cualidades de flotación.', performance:['Gran capacidad de carga.','Alta protección contra penetración de rastrojos.'] }),
  makeProduct({ slug:'sdt-i-3', model:'SDT', variant:'I-3', segment:'IMPLEMENTOS', description:'Neumático multiguía para ejes direccionales y no motrices, con gran flotación y estabilidad lateral.', performance:['Protección contra rastrojos.','Resistencia a agentes atmosféricos y fertilizantes.','Construcción resistente a impactos y pinchaduras.'], sizes:['10 x 16.5','12 x 16.5'] }),
  makeProduct({ slug:'sd-i-1', model:'SD', variant:'I-1', segment:'IMPLEMENTOS', description:'Diseño de cinco barras longitudinales para implementos agrícolas, con flotación y avance estable.', performance:['Protección contra rastrojos.','Resistencia al envejecimiento.','Construcción resistente a roturas y pinchaduras.'], sizes:['11 L-15 TL','12.5 L-15 TL'] }),
  makeProduct({ slug:'2-guias-f-2', model:'2-GUÍAS', variant:'F-2', segment:'DIRECCIONAL', description:'Para ejes delanteros de tractores de tracción simple y maquinaria agrícola de transporte. Brinda dirección suave y reduce la compactación.', performance:['Excelente resistencia a cortes y roturas.','Óptimo agarre.','Diseño autolimpiante.'], sizes:['5.00-15'] }),
  makeProduct({ slug:'3-guias-f-2', model:'3-GUÍAS', variant:'F-2', segment:'DIRECCIONAL', description:'Tres guías para ejes delanteros de tractores, con excelente dirigibilidad y profundas canaletas intermedias.', performance:['Protección contra rastrojos.','Carcasa diagonal de nylon.','Resistencia a agentes atmosféricos y fertilizantes.'], sizes:['6.50-16','6.50-20','7.50-16','7.50-18','7.50-20'] }),
  makeProduct({ slug:'4-guias-f-2m', model:'4-GUÍAS', variant:'F-2', segment:'DIRECCIONAL', description:'Cuatro barras longitudinales para evitar desplazamientos laterales y ofrecer buena flotación con menor compactación del terreno.', performance:['Protección contra rastrojos.','Carcasa diagonal de nylon.','Resistencia al envejecimiento.'], uses:['Tierra.','Barro.','Fuera de camino.'], sizes:['10.00-16','11.00-16'] }),
  makeProduct({ slug:'5-guias-i-1', model:'5-GUÍAS', variant:'I-1', segment:'IMPLEMENTOS', description:'Diseño multiguía para ejes direccionales y no motrices, con gran flotación y una línea de avance estable.', performance:['Protección contra rastrojos.','Carcasa diagonal de nylon.','Resistencia a agentes atmosféricos y fertilizantes.'], sizes:['7.50-16','7.50-18'] }),
  makeProduct({ slug:'sembradora-i-1', model:'SEMBRADORA', variant:'I-1', segment:'SIEMBRA', description:'Neumático para implementos de siembra, preparado para acompañar la labor agrícola con estabilidad, flotación y resistencia.', performance:['Rodado orientado a implementos agrícolas.','Construcción preparada para trabajo continuo.'] }),
  makeProduct({ slug:'trailer', model:'TRAILER', segment:'ARRASTRE AGRÍCOLA', description:'Desarrollado exclusivamente para ejes de arrastre en trailers destinados a tareas agrícolas.', performance:['Excelente adherencia sobre suelos secos y mojados.'], sizes:['6.50-16'] }),
  makeProduct({ slug:'vial-l-2-g-2', model:'VIAL', variant:'L-2 / G-2', segment:'MAQUINARIA VIAL', description:'Neumático de tracción con tacos anchos para motoniveladoras y palas cargadoras.', performance:['Construcción diagonal extra fuerte.','Rodado de gran espesor para reducir daños externos.'], uses:['Tierra.','Ripio.','Fuera de camino.'], sizes:['13.00-24','14.00-24','17.5-25'] }),
  makeProduct({ slug:'vial-l-3', model:'VIAL', variant:'L-3', segment:'MAQUINARIA VIAL', description:'Barras muy anchas y pocos espacios vacíos para gran tracción y resistencia a penetraciones en canteras y terrenos con piedras.', performance:['Carcasa de gran fortaleza.','Talones de acero de alta resistencia.','Apto para palas cargadoras.'], uses:['Ripio.','Fuera de camino.'], speed:'A2 / 10 KM/H', sizes:['17.5-25','20.5-25'] }),
  makeProduct({ slug:'aplanadora-c-1', model:'APLANADORA', variant:'C-1', segment:'COMPACTACIÓN', description:'Neumático extra reforzado para máquinas compactadoras, grandes cargas y bajas velocidades.', performance:['Rodado liso.','Construcción reforzada.'], uses:['Fuera de camino.'], sizes:['11.00-20'] }),
];
