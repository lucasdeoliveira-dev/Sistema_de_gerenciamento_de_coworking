import Botao from '@/compartilhado/componentes/Botao';

export default function Paginacao({ pagina, porPagina, total, aoMudarPagina }) {
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const primeiro = total === 0 ? 0 : (pagina - 1) * porPagina + 1;
  const ultimo = Math.min(pagina * porPagina, total);

  return (
    <nav aria-label="Paginação" className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-suave" aria-live="polite">
        {primeiro}–{ultimo} de {total}
      </p>
      <div className="flex gap-2">
        <Botao variante="secundario" onClick={() => aoMudarPagina(pagina - 1)} disabled={pagina <= 1}>
          Anterior
        </Botao>
        <Botao variante="secundario" onClick={() => aoMudarPagina(pagina + 1)} disabled={pagina >= totalPaginas}>
          Próxima
        </Botao>
      </div>
    </nav>
  );
}
