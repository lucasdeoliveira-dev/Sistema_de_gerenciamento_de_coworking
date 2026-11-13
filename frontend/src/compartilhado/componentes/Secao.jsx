import { useId } from 'react';

export default function Secao({ titulo, descricao, children }) {
  const idTitulo = useId();

  return (
    <section
      aria-labelledby={idTitulo}
      className="space-y-4 rounded-xl border border-borda bg-superficie p-6 shadow-sm"
    >
      <div>
        <h2 id={idTitulo} className="text-xl font-bold">
          {titulo}
        </h2>
        {descricao && <p className="mt-1 text-sm text-suave">{descricao}</p>}
      </div>
      {children}
    </section>
  );
}
