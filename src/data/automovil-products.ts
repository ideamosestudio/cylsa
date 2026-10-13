export interface ProductGalleryImage {
  src: string;
  alt: string;
  label: string;
}

export interface ProductSize {
  measure: string;
  speed: string;
}

export interface AutomovilProduct {
  slug: string;
  title: string;
  model: string;
  variant: string;
  cardVariant: string;
  brand: string;
  brandLogo: string;
  series: string;
  description: string;
  coverIntro: string;
  storyTitle: string;
  storyAccent: string;
  claim: string;
  micro: string;
  segment: string;
  surface?: string;
  maxSpeed: string;
  heroImage: string;
  cardImage?: string;
  heroImageAlt: string;
  gallery: ProductGalleryImage[];
  performance: string[];
  uses: string[];
  speeds: string[];
  recommendations: string[];
  sizes: ProductSize[];
}

const fateLogo = 'images/products/eximia-pininfarina-hp/fate-logo-white.png';

export const automovilProducts: AutomovilProduct[] = [
  {
    slug: 'eximia-by-pininfarina-hp',
    title: 'Eximia by Pininfarina HP',
    model: 'EXIMIA',
    variant: 'BY PININFARINA HP',
    cardVariant: 'BY PININFARINA HP',
    brand: 'FATE',
    brandLogo: fateLogo,
    series: 'PREMIUM SERIES',
    description: 'Diseño italiano en plena evolución. Eximia by Pininfarina HP mejora el consumo de combustible, la seguridad y el confort de marcha, reduciendo además peso y demanda de energía durante su fabricación.',
    coverIntro: 'Diseño italiano, eficiencia premium y control preciso para una conducción más segura y confortable.',
    storyTitle: 'DISEÑO ITALIANO.',
    storyAccent: 'EVOLUCIÓN REAL.',
    claim: 'HECHA PARA AVANZAR.',
    micro: 'FATE / EXIMIA / PAVIMENTO / HASTA 270 KM/H',
    segment: 'PREMIUM',
    maxSpeed: '270 KM/H',
    heroImage: 'images/products/eximia-pininfarina-hp/eximia-01.png',
    heroImageAlt: 'Neumático Eximia by Pininfarina HP en vista tres cuartos',
    gallery: [
      { src: 'images/products/eximia-pininfarina-hp/eximia-01.png', alt: 'Vista en perspectiva del neumático Eximia by Pininfarina HP', label: 'PERSPECTIVA / PERFORMANCE' },
      { src: 'images/products/eximia-pininfarina-hp/eximia-03.png', alt: 'Vista lateral del neumático Eximia by Pininfarina HP', label: 'PERFIL / CONTROL' },
      { src: 'images/products/eximia-pininfarina-hp/eximia-04.png', alt: 'Vista frontal de la banda de rodamiento Eximia by Pininfarina HP', label: 'PISADA / ADHERENCIA' },
    ],
    performance: ['Baja resistencia a la rodadura, mayor seguridad y mejor confort.', 'Mejores prestaciones de manejo.'],
    uses: ['Pavimento.'],
    speeds: ['Rango V: hasta 240 km/h.', 'Rango W: hasta 270 km/h.'],
    recommendations: ['Revisá periódicamente la presión de inflado y respetá los valores indicados por el fabricante.', 'Al realizar el recambio, respetá sin excepciones el índice de carga y el rango de velocidad.'],
    sizes: [{ measure: '205/55 R16', speed: 'V / 240 KM/H' }, { measure: '215/50 R17', speed: 'W / 270 KM/H' }, { measure: '225/45 R17', speed: 'W / 270 KM/H' }],
  },
  {
    slug: 'eximia-by-pininfarina-sport',
    title: 'Eximia by Pininfarina Sport',
    model: 'EXIMIA', variant: 'BY PININFARINA SPORT', cardVariant: 'BY PININFARINA SPORT', brand: 'FATE', brandLogo: fateLogo, series: 'SPORT SERIES',
    description: 'Diseñado para responder a las más altas exigencias en seguridad, confort y manejabilidad. Su equilibrio transmite confianza en todas las circunstancias y está orientado a vehículos de altas prestaciones.',
    coverIntro: 'Respuesta deportiva, gran adherencia y seguridad para automóviles de altas prestaciones.',
    storyTitle: 'CONTROL DEPORTIVO.', storyAccent: 'RESPUESTA TOTAL.', claim: 'NACIDA PARA RENDIR.', micro: 'FATE / EXIMIA SPORT / PAVIMENTO / HASTA 300 KM/H', segment: 'SPORT', maxSpeed: '300 KM/H',
    heroImage: 'images/products/eximia-pininfarina-sport/sport-01.png', heroImageAlt: 'Neumático Eximia by Pininfarina Sport en perspectiva',
    gallery: [
      { src: 'images/products/eximia-pininfarina-sport/sport-01.png', alt: 'Vista en perspectiva del Eximia by Pininfarina Sport', label: 'PERSPECTIVA / SPORT' },
      { src: 'images/products/eximia-pininfarina-sport/sport-02.png', alt: 'Vista lateral del Eximia by Pininfarina Sport', label: 'PERFIL / PRECISIÓN' },
      { src: 'images/products/eximia-pininfarina-sport/sport-03.png', alt: 'Vista frontal del Eximia by Pininfarina Sport', label: 'PISADA / ADHERENCIA' },
    ],
    performance: ['Seguridad de marcha.', 'Excelente adherencia sobre suelos secos y mojados.', 'Robustez ante las exigencias de nuestros caminos.', 'Diseño asimétrico.'],
    uses: ['Pavimento.'], speeds: ['Rango W: hasta 270 km/h.', 'Rango Y: hasta 300 km/h.'],
    recommendations: ['Revisá periódicamente la presión de inflado y respetá los valores indicados por el fabricante.', 'Al realizar el recambio, respetá sin excepciones el índice de carga y el rango de velocidad.'],
    sizes: ['205/40 R17','215/45 R17','215/50 R17','225/40 R18','225/45 R17','225/50 R17','235/45 R17','235/40 R18'].map((measure) => ({ measure, speed: 'W / Y' })),
  },
  {
    slug: 'eximia-by-pininfarina-green',
    title: 'Eximia by Pininfarina Green',
    model: 'EXIMIA', variant: 'BY PININFARINA GREEN', cardVariant: 'BY PININFARINA GREEN', brand: 'FATE', brandLogo: fateLogo, series: 'GREEN SERIES',
    description: 'Eximia by Pininfarina Green suma la tecnología Green System a un diseño equilibrado y seguro. Su baja resistencia a la rodadura mejora la eficiencia sin resignar confort ni manejabilidad.',
    coverIntro: 'Tecnología Green System para avanzar con menor resistencia, seguridad y confort.',
    storyTitle: 'EFICIENCIA REAL.', storyAccent: 'MENOR RESISTENCIA.', claim: 'PENSADA PARA AHORRAR.', micro: 'FATE / EXIMIA GREEN / PAVIMENTO / HASTA 240 KM/H', segment: 'GREEN', maxSpeed: '240 KM/H',
    heroImage: 'images/products/eximia-pininfarina-green/green-01.png', heroImageAlt: 'Neumático Eximia by Pininfarina Green en perspectiva',
    gallery: [
      { src: 'images/products/eximia-pininfarina-green/green-01.png', alt: 'Vista en perspectiva del Eximia by Pininfarina Green', label: 'PERSPECTIVA / EFICIENCIA' },
      { src: 'images/products/eximia-pininfarina-green/green-02.png', alt: 'Vista lateral del Eximia by Pininfarina Green', label: 'PERFIL / CONTROL' },
      { src: 'images/products/eximia-pininfarina-green/green-03.png', alt: 'Vista frontal del Eximia by Pininfarina Green', label: 'PISADA / ADHERENCIA' },
    ],
    performance: ['Seguridad de marcha.', 'Excelente adherencia sobre suelos secos y mojados.', 'Robustez ante las exigencias de nuestros caminos.', 'Diseño asimétrico.'],
    uses: ['Pavimento.', 'Automóviles medianos y grandes.'], speeds: ['Rango H: hasta 210 km/h.', 'Rango V: hasta 240 km/h.'],
    recommendations: ['Revisá periódicamente la presión de inflado y respetá los valores indicados por el fabricante.', 'Al realizar el recambio, respetá sin excepciones el índice de carga y el rango de velocidad.'],
    sizes: ['185/60 R15','195/55 R15','195/65 R15','205/55 R16','205/60 R16','215/55 R16','185/55 R16','195/50 R16','195/55 R16'].map((measure) => ({ measure, speed: 'H / V' })),
  },
  {
    slug: 'sentiva-sport',
    title: 'Sentiva Sport',
    model: 'SENTIVA', variant: 'SPORT', cardVariant: 'SPORT', brand: 'FATE', brandLogo: fateLogo, series: 'SPORT SERIES',
    description: 'Su nuevo diseño asimétrico optimiza la eficiencia y reduce el consumo de combustible, cuidando la seguridad en cada maniobra y manteniendo un excelente confort de marcha.',
    coverIntro: 'Eficiencia, seguridad y confort reunidos en un diseño asimétrico de nueva generación.',
    storyTitle: 'EFICIENCIA Y CONTROL.', storyAccent: 'CONFORT EN MARCHA.', claim: 'LISTA PARA TU RITMO.', micro: 'FATE / SENTIVA SPORT / PAVIMENTO / HASTA 210 KM/H', segment: 'SPORT', maxSpeed: '210 KM/H',
    heroImage: 'images/products/sentiva-sport/sentiva-sport-01.png', heroImageAlt: 'Neumático Sentiva Sport en perspectiva',
    gallery: [
      { src: 'images/products/sentiva-sport/sentiva-sport-01.png', alt: 'Vista en perspectiva del Sentiva Sport', label: 'PERSPECTIVA / EFICIENCIA' },
      { src: 'images/products/sentiva-sport/sentiva-sport-02.png', alt: 'Vista lateral del Sentiva Sport', label: 'PERFIL / CONTROL' },
      { src: 'images/products/sentiva-sport/sentiva-sport-03.png', alt: 'Vista frontal del Sentiva Sport', label: 'PISADA / SEGURIDAD' },
    ],
    performance: ['Baja resistencia a la rodadura, mayor seguridad y mejor confort.'], uses: ['Pavimento.'], speeds: ['Rango H: hasta 210 km/h.'],
    recommendations: ['Revisá periódicamente la presión de inflado y respetá los valores indicados por el fabricante del vehículo.', 'La carga máxima se alcanza con una presión de 36 psi (2,5 bar).', 'La presión máxima de inflado nunca debe exceder 44 psi (3,0 bar).'],
    sizes: ['185/60 R15','195/55 R15','195/60 R15'].map((measure) => ({ measure, speed: 'H / 210 KM/H' })),
  },
  {
    slug: 'sentiva-ar-360',
    title: 'Sentiva AR-360',
    model: 'SENTIVA', variant: 'AR-360', cardVariant: 'AR-360', brand: 'FATE', brandLogo: fateLogo, series: 'TOURING SERIES',
    description: 'El equilibrio entre un andar confortable y un gran rendimiento kilométrico. Su tecnología Dual Traction System asigna una función específica a cada sector de la banda de rodamiento.',
    coverIntro: 'Andar confortable, rendimiento kilométrico y precisión gracias a Dual Traction System.',
    storyTitle: 'EQUILIBRIO PRECISO.', storyAccent: 'ANDAR PERFECTO.', claim: 'HECHA PARA DURAR.', micro: 'FATE / SENTIVA AR-360 / PAVIMENTO / HASTA 210 KM/H', segment: 'TOURING', maxSpeed: '210 KM/H',
    heroImage: 'images/products/sentiva-ar-360/ar360-01.png', heroImageAlt: 'Neumático Sentiva AR-360 en perspectiva',
    gallery: [
      { src: 'images/products/sentiva-ar-360/ar360-01.png', alt: 'Vista en perspectiva del Sentiva AR-360', label: 'PERSPECTIVA / CONFORT' },
      { src: 'images/products/sentiva-ar-360/ar360-02.png', alt: 'Vista lateral del Sentiva AR-360', label: 'PERFIL / CONTROL' },
      { src: 'images/products/sentiva-ar-360/ar360-03.png', alt: 'Vista frontal del Sentiva AR-360', label: 'PISADA / TRACCIÓN' },
    ],
    performance: ['Hombro exterior robusto para mayor agarre en curvas.', 'Hombro interior con mayor capacidad de evacuación de agua.', 'Tres amplios canales longitudinales optimizan la descarga del agua.', 'Costilla exterior sólida para un manejo preciso en rectas.'],
    uses: ['Pavimento.'], speeds: ['Rango H: hasta 210 km/h.', 'Rango T: hasta 190 km/h.'],
    recommendations: ['Revisá periódicamente la presión de inflado y respetá los valores indicados por el fabricante del vehículo.', 'La carga máxima se alcanza con una presión de 36 psi (2,5 bar).', 'La presión máxima de inflado nunca debe exceder 44 psi (3,0 bar).'],
    sizes: ['165/70 R13','175/65 R14','175/70 R13','175/70 R14','185/60 R14','185/65 R14','185/65 R15','195/65 R15','205/55 R16','185/55 R15'].map((measure) => ({ measure, speed: 'H / T' })),
  },
  {
    slug: 'prestiva',
    title: 'Prestiva',
    model: 'PRESTIVA', variant: '', cardVariant: 'SEGURIDAD Y CONFORT', brand: 'FATE', brandLogo: fateLogo, series: 'TOURING SERIES',
    description: 'Un neumático equilibrado que brinda máxima seguridad y confiabilidad, respondiendo a las necesidades de durabilidad y confort de marcha de los usuarios particulares.',
    coverIntro: 'Seguridad, confiabilidad y confort para acompañar el uso cotidiano.',
    storyTitle: 'SEGURIDAD DIARIA.', storyAccent: 'CONFORT DURADERO.', claim: 'CONFIANZA EN MARCHA.', micro: 'FATE / PRESTIVA / PAVIMENTO / HASTA 190 KM/H', segment: 'TOURING', maxSpeed: '190 KM/H',
    heroImage: 'images/products/prestiva/prestiva-01.png', heroImageAlt: 'Neumático Prestiva en perspectiva',
    gallery: [
      { src: 'images/products/prestiva/prestiva-01.png', alt: 'Vista en perspectiva del neumático Prestiva', label: 'PERSPECTIVA / DURABILIDAD' },
      { src: 'images/products/prestiva/prestiva-02.png', alt: 'Vista lateral del neumático Prestiva', label: 'PERFIL / CONFORT' },
      { src: 'images/products/prestiva/prestiva-03.png', alt: 'Vista frontal del neumático Prestiva', label: 'PISADA / SEGURIDAD' },
    ],
    performance: ['Excelente rendimiento kilométrico.', 'Doble cintura de cordones de acero.', 'Confort de marcha.'], uses: ['Pavimento.'], speeds: ['Rango T: hasta 190 km/h.'],
    recommendations: ['Revisá periódicamente la presión de inflado y respetá los valores indicados por el fabricante.', 'La carga soportada está directamente relacionada con la presión de inflado; la carga máxima se logra a presión máxima.', 'Los valores correspondientes figuran en la tabla de aplicación y en el lateral del neumático.'],
    sizes: ['165/70 R13','175/65 R14','175/70 R13','175/70 R14','185/70 R13','185/70 R14'].map((measure) => ({ measure, speed: 'T / 190 KM/H' })),
  },
  {
    slug: 'advance-ar-35',
    title: 'Advance AR 35',
    model: 'ADVANCE', variant: 'AR 35', cardVariant: 'AR 35', brand: 'FATE', brandLogo: fateLogo, series: 'ADVANCE SERIES',
    description: 'Diseñado con tecnología Advance® para lograr un balance de cualidades que asegura mayor confort, un andar confiable y silencioso y máximo rendimiento kilométrico.',
    coverIntro: 'Confort, respuesta y rendimiento kilométrico con tecnología Advance®.',
    storyTitle: 'RENDIMIENTO TOTAL.', storyAccent: 'RESPUESTA CONFIABLE.', claim: 'PREPARADO PARA TODO.', micro: 'FATE / ADVANCE AR 35 / PAVIMENTO / HASTA 240 KM/H', segment: 'ADVANCE', maxSpeed: '240 KM/H',
    heroImage: 'images/products/advance-ar-35/advance-01.png', heroImageAlt: 'Neumático Advance AR 35 en perspectiva',
    gallery: [
      { src: 'images/products/advance-ar-35/advance-01.png', alt: 'Vista en perspectiva del Advance AR 35', label: 'PERSPECTIVA / RENDIMIENTO' },
      { src: 'images/products/advance-ar-35/advance-02.png', alt: 'Vista lateral del Advance AR 35', label: 'PERFIL / CONFORT' },
      { src: 'images/products/advance-ar-35/advance-03.png', alt: 'Vista frontal del Advance AR 35', label: 'PISADA / DRENAJE' },
    ],
    performance: ['Excelente drenaje de agua que evita el aquaplaning.', 'Rendimiento en todas las temporadas.', 'Calificado como M+S para barro y nieve.', 'Óptima respuesta y tracción.'], uses: ['Pavimento.'], speeds: ['Rango H: hasta 210 km/h.', 'Rango V: hasta 240 km/h.', 'Rango T: hasta 190 km/h.'],
    recommendations: ['Revisá periódicamente la presión de inflado y respetá los valores indicados por el fabricante del vehículo.', 'La carga máxima se alcanza con una presión de 36 psi (2,5 bar).', 'La presión máxima de inflado nunca debe exceder 44 psi (3,0 bar).'],
    sizes: [{ measure: '205/60 R15', speed: 'H / V / T' }],
  },
  {
    slug: 'ar-300',
    title: 'AR-300',
    model: 'AR-300', variant: '', cardVariant: 'CONFORT Y ESTABILIDAD', brand: 'FATE', brandLogo: fateLogo, series: 'TOURING SERIES',
    description: 'Un diseño equilibrado que combina rendimiento kilométrico, manejabilidad y bajos niveles de ruido. AR-300 brinda un balance preciso entre confort y estabilidad.',
    coverIntro: 'Rendimiento, bajo nivel de ruido y estabilidad para una conducción confortable.',
    storyTitle: 'CONFORT Y ESTABILIDAD.', storyAccent: 'EQUILIBRIO REAL.', claim: 'TODO BAJO CONTROL.', micro: 'FATE / AR-300 / PAVIMENTO / HASTA 210 KM/H', segment: 'TOURING', maxSpeed: '210 KM/H',
    heroImage: 'images/products/ar-300/ar300-01.png', heroImageAlt: 'Neumático AR-300 en perspectiva',
    gallery: [
      { src: 'images/products/ar-300/ar300-01.png', alt: 'Vista en perspectiva del neumático AR-300', label: 'PERSPECTIVA / ESTABILIDAD' },
      { src: 'images/products/ar-300/ar300-02.png', alt: 'Vista lateral del neumático AR-300', label: 'PERFIL / CONFORT' },
      { src: 'images/products/ar-300/ar300-03.png', alt: 'Vista frontal del neumático AR-300', label: 'PISADA / TRACCIÓN' },
    ],
    performance: ['Calificado como M+S para barro y nieve.', 'Menor distancia de frenado sobre pavimento mojado.', 'Menores niveles de ruido.', 'Excelente respuesta y tracción en calzada seca y mojada.'], uses: ['Pavimento.'], speeds: ['Rango H: hasta 210 km/h.', 'Rango T: hasta 190 km/h.'],
    recommendations: ['Revisá periódicamente la presión de inflado y respetá los valores indicados por el fabricante del vehículo.', 'La carga máxima se alcanza con una presión de 36 psi (2,5 bar).', 'La presión máxima de inflado nunca debe exceder 44 psi (3,0 bar).'],
    sizes: [{ measure: '195/70 R14', speed: 'H / T' }],
  },
];

export const additionalAutomovilProducts = automovilProducts.filter((product) => product.slug !== 'eximia-by-pininfarina-hp');
