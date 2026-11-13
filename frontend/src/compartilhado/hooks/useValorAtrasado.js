import { useEffect, useState } from 'react';

export function useValorAtrasado(valor, atraso = 350) {
  const [valorAtrasado, setValorAtrasado] = useState(valor);

  useEffect(() => {
    const espera = setTimeout(() => setValorAtrasado(valor), atraso);
    return () => clearTimeout(espera);
  }, [valor, atraso]);

  return valorAtrasado;
}
