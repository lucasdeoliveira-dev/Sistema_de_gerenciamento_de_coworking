import { NOMES_TIPO_ESPACO, resumoHorarios } from '@/modulos/espacos/tipos';

export default function TabelaEspacos({ espacos, aoEditar }) {
  return (
    <div className="relative overflow-x-auto rounded-xl border border-borda bg-superficie">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Lista de espaços</caption>
        <thead className="border-b border-borda bg-fundo text-suave">
          <tr>
            <th scope="col" className="px-4 py-3 font-bold">
              Nome
            </th>
            <th scope="col" className="px-4 py-3 font-bold">
              Tipo
            </th>
            <th scope="col" className="px-4 py-3 font-bold">
              Capacidade
            </th>
            <th scope="col" className="px-4 py-3 font-bold">
              Funcionamento
            </th>
            <th scope="col" className="px-4 py-3 font-bold">
              Situação
            </th>
            {aoEditar && (
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">Ações</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-borda">
          {espacos.map((espaco) => (
            <tr key={espaco.id} className={espaco.ativo ? '' : 'text-suave'}>
              <td className="px-4 py-3 font-bold">{espaco.nome}</td>
              <td className="px-4 py-3">{NOMES_TIPO_ESPACO[espaco.tipo] ?? espaco.tipo}</td>
              <td className="px-4 py-3 whitespace-nowrap">{espaco.capacidade} pessoas</td>
              <td className="px-4 py-3 text-suave">{resumoHorarios(espaco.horarios)}</td>
              <td className="px-4 py-3">
                <span className={`font-bold ${espaco.ativo ? 'text-sucesso' : 'text-erro'}`}>
                  {espaco.ativo ? 'Ativo' : 'Desativado'}
                </span>
              </td>
              {aoEditar && (
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => aoEditar(espaco)}
                    className="rounded px-2 py-1 font-bold text-marca hover:bg-marca-clara"
                  >
                    Editar<span className="sr-only"> {espaco.nome}</span>
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
