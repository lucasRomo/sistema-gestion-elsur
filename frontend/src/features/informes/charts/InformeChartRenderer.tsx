import React from 'react';
import type { TipoGraficoInforme } from '../types/informeTypes';
import { useTheme } from '../../../Context/ThemeContext';
import { RENDERERS_INFORME } from './renderers';

export interface InformeChartRendererProps {
  informe: TipoGraficoInforme | null;
  data: any;
  esAnterior?: boolean;
  esMismoDia?: boolean;
}

const useIsNarrow = (breakpoint = 480) => {
  const [isNarrow, setIsNarrow] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );
  React.useEffect(() => {
    const handler = () => setIsNarrow(window.innerWidth < breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return isNarrow;
};

export const InformeChartRenderer: React.FC<InformeChartRendererProps> = ({
  informe,
  data,
  esAnterior = false,
  esMismoDia = false,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isMobile = useIsNarrow(480);

  if (!data || !informe) return null;

  const Renderer = RENDERERS_INFORME[informe];
  if (!Renderer) return null;

  return (
    <Renderer
      data={data}
      esAnterior={esAnterior}
      esMismoDia={esMismoDia}
      isDark={isDark}
      isMobile={isMobile}
    />
  );
};

export default InformeChartRenderer;
