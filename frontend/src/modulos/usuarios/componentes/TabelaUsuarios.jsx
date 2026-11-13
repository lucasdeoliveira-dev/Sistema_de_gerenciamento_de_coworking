import { mascaraCnpj, tempoRelativo } from '@/compartilhado/utils/formatos';
import SeloPerfil from '@/compartilhado/componentes/SeloPerfil';

export default function TabelaUsuarios({ usuarios, idUsuarioLogado, aoEditar }) {
  return (
    <div className="relative overflow-x-auto rounded-xl border border-borda bg-superficie">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Lista de usuários</caption>
        <thead className="border-b border-borda bg-fundo text-suave">
          <tr>
            <th scope="col" className="px-4 py-3 font-bold">
              Nome
            </th>
            <th scope="col" className="px-4 py-3 font-bold">
              Perfil
            </th>
            <th scope="col" className="px-4 py-3 font-bold">
              Situação
            </th>
            <th scope="col" className="px-4 py-3 font-bold">
              Último acesso
            </th>
            <th scope="col" className="px-4 py-3">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-borda">
          {usuarios.map((usuario) => (
            <tr key={usuario.id} className={usuario.ativo ? '' : 'text-suave'}>
              <td className="px-4 py-3">
                <span className="block font-bold">
                  {usuario.nome}
                  {usuario.id === idUsuarioLogado && (
                    <span className="ml-2 rounded-full bg-marca-clara px-2 py-0.5 text-xs text-marca">Você</span>
                  )}
                </span>
                <span className="block break-all text-suave">{usuario.email}</span>
                {usuario.empresa && (
                  <span className="mt-1 block text-xs text-suave">
                    {usuario.empresa.nome_fantasia ?? usuario.empresa.razao_social} · CNPJ{' '}
                    {mascaraCnpj(usuario.empresa.cnpj)}
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                <SeloPerfil perfil={usuario.perfil} />
              </td>
              <td className="px-4 py-3">
                <span className={`font-bold ${usuario.ativo ? 'text-sucesso' : 'text-erro'}`}>
                  {usuario.ativo ? 'Ativo' : 'Desativado'}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{tempoRelativo(usuario.ultimo_login_em)}</td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => aoEditar(usuario)}
                  className="rounded px-2 py-1 font-bold text-marca hover:bg-marca-clara"
                >
                  Editar<span className="sr-only"> {usuario.nome}</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
