import html2canvas from 'html2canvas';


const ID_ESTILO = 'modo-impresion-pdf-informes';
const CLASE_ACTIVA = 'pdf-export-mode';

const asegurarEstiloInyectado = () => {
  if (document.getElementById(ID_ESTILO)) return;

  const style = document.createElement('style');
  style.id = ID_ESTILO;
  style.innerHTML = `
    /* Texto de ejes, leyendas y etiquetas: oscuro con halo blanco */
    /* AÑADIDO tspan AL SELECTOR */
    .${CLASE_ACTIVA} svg text,
    .${CLASE_ACTIVA} svg text tspan {
      fill: #18181b !important;
      stroke: #ffffff !important;
      stroke-width: 3px !important;
      paint-order: stroke !important;
    }

    /* Texto de la leyenda (se renderiza como <span>, no como SVG) */
    .${CLASE_ACTIVA} .recharts-legend-item-text {
      color: #18181b !important;
    }

    /* Líneas guía de las etiquetas de las tortas y grilla: gris oscuro
       visible sobre blanco (en vez del gris claro pensado para fondo oscuro) */
    .${CLASE_ACTIVA} svg polyline,
    .${CLASE_ACTIVA} .recharts-cartesian-grid line,
    .${CLASE_ACTIVA} .recharts-cartesian-axis-line,
    .${CLASE_ACTIVA} .recharts-cartesian-axis-tick-line {
      stroke: #71717a !important;
    }

    /* Oculta cualquier tooltip que haya quedado activo por el mouse: nunca
       queremos que el "cartel" de hover salga en la imagen del PDF. */
    .${CLASE_ACTIVA} .recharts-tooltip-wrapper {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
    }
  `;
  document.head.appendChild(style);
};
export const capturarElementoParaPdf = async (
  elementoOriginal: HTMLElement
): Promise<HTMLCanvasElement> => {
  asegurarEstiloInyectado();

  const rect = elementoOriginal.getBoundingClientRect();

  const clon = elementoOriginal.cloneNode(true) as HTMLElement;
  clon.style.width = `${rect.width}px`;
  clon.style.height = `${rect.height}px`;
  clon.classList.add(CLASE_ACTIVA);

  clon.querySelectorAll('.recharts-tooltip-wrapper').forEach((el) => el.remove());

  const contenedorOffscreen = document.createElement('div');
  contenedorOffscreen.style.position = 'fixed';
  contenedorOffscreen.style.top = '0';
  contenedorOffscreen.style.left = '-99999px';
  contenedorOffscreen.style.width = `${rect.width}px`;
  contenedorOffscreen.style.height = `${rect.height}px`;
  contenedorOffscreen.style.backgroundColor = '#ffffff';
  contenedorOffscreen.style.pointerEvents = 'none';

  contenedorOffscreen.appendChild(clon);
  document.body.appendChild(contenedorOffscreen);

  try {
    const canvas = await html2canvas(clon, {
      scale: 3,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    return canvas;
  } finally {
    document.body.removeChild(contenedorOffscreen);
  }
};
