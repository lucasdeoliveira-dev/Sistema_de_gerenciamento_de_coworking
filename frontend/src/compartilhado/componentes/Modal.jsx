import { useEffect, useId, useRef } from 'react';

const LARGURAS = {
  pequena: 'max-w-md',
  media: 'max-w-lg',
  grande: 'max-w-2xl',
};

export default function Modal({ aberto, titulo, descricao, aoFechar, largura = 'media', children }) {
  const referencia = useRef(null);
  const idTitulo = useId();
  const idDescricao = useId();

  useEffect(() => {
    const dialogo = referencia.current;
    if (!dialogo) return;
    if (aberto && !dialogo.open) dialogo.showModal();
    if (!aberto && dialogo.open) dialogo.close();
  }, [aberto]);

  function fecharPeloFundo(evento) {
    if (evento.target === referencia.current) aoFechar();
  }

  function fecharPeloEsc(evento) {
    evento.preventDefault();
    aoFechar();
  }

  return (
    <dialog
      ref={referencia}
      aria-labelledby={idTitulo}
      aria-describedby={descricao ? idDescricao : undefined}
      onCancel={fecharPeloEsc}
      onClick={fecharPeloFundo}
      className={`m-auto w-[calc(100%-2rem)] ${LARGURAS[largura]} rounded-xl border border-borda bg-superficie p-0 text-texto shadow-xl backdrop:bg-black/60`}
    >
      {aberto && (
        <div className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id={idTitulo} className="text-xl font-bold">
              {titulo}
            </h2>
            <button
              type="button"
              onClick={aoFechar}
              aria-label="Fechar"
              className="rounded px-2 text-2xl leading-none text-suave hover:bg-fundo"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
          {descricao && (
            <p id={idDescricao} className="text-suave">
              {descricao}
            </p>
          )}
          {children}
        </div>
      )}
    </dialog>
  );
}
