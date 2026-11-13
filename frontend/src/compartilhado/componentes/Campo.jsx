import { useId } from 'react';

export const ESTILO_ENTRADA =
  'w-full rounded-lg border border-borda bg-superficie px-3 py-2.5 text-texto ' +
  'placeholder:text-suave/70 focus:border-marca focus:outline-none focus:ring-2 focus:ring-marca/25 ' +
  'aria-[invalid=true]:border-erro aria-[invalid=true]:ring-erro/20 disabled:bg-fundo';

export function MensagemCampo({ id, tipo, children }) {
  return (
    <p id={id} className={`mt-1 text-sm ${tipo === 'erro' ? 'text-erro' : 'text-suave'}`}>
      {children}
    </p>
  );
}

export default function Campo({ rotulo, erro, dica, opcional, id, className = '', children, ...props }) {
  const idGerado = useId();
  const idCampo = id ?? idGerado;
  const idDica = dica ? `${idCampo}-dica` : undefined;
  const idErro = erro ? `${idCampo}-erro` : undefined;
  const descritores = [idErro, idDica].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      <label htmlFor={idCampo} className="mb-1 block text-sm font-bold">
        {rotulo}
        {opcional && <span className="font-normal text-suave"> (opcional)</span>}
      </label>

      {children ? (
        children({
          id: idCampo,
          'aria-invalid': erro ? true : undefined,
          'aria-describedby': descritores,
        })
      ) : (
        <input
          id={idCampo}
          className={ESTILO_ENTRADA}
          aria-invalid={erro ? true : undefined}
          aria-describedby={descritores}
          {...props}
        />
      )}

      {erro && (
        <MensagemCampo id={idErro} tipo="erro">
          {erro}
        </MensagemCampo>
      )}
      {dica && !erro && <MensagemCampo id={idDica}>{dica}</MensagemCampo>}
    </div>
  );
}
