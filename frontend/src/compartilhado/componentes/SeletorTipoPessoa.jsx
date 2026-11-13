import { useId } from 'react';
import { NOMES_TIPO_PESSOA, TIPOS_PESSOA } from '@/compartilhado/config/tiposPessoa';

export default function SeletorTipoPessoa({ valor, aoMudar }) {
  const grupo = useId();

  return (
    <fieldset>
      <legend className="mb-1 block text-sm font-bold">Tipo de conta</legend>
      <div className="grid grid-cols-2 gap-1 rounded-lg border border-borda bg-superficie p-1">
        {Object.values(TIPOS_PESSOA).map((tipo) => (
          <label
            key={tipo}
            className={`cursor-pointer rounded-md px-3 py-2 text-center text-sm font-bold has-focus-visible:ring-2 has-focus-visible:ring-marca/40 ${
              valor === tipo ? 'bg-marca text-contraste' : 'text-suave hover:bg-fundo hover:text-texto'
            }`}
          >
            <input
              type="radio"
              name={grupo}
              value={tipo}
              checked={valor === tipo}
              onChange={() => aoMudar(tipo)}
              className="sr-only"
            />
            {NOMES_TIPO_PESSOA[tipo]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
