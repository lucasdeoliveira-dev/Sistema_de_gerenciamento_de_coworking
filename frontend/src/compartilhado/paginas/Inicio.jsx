import { Link } from 'react-router-dom';
import { useAuth } from '@/modulos/auth/AuthContext';
import { DESCRICOES_PERFIS, NOMES_PERFIS } from '@/compartilhado/config/perfis';
import { AREAS_EM_CONSTRUCAO, itensVisiveis } from '@/compartilhado/config/navegacao';
import { primeiroNome } from '@/compartilhado/utils/formatos';
import CabecalhoPagina from '@/compartilhado/componentes/CabecalhoPagina';
import Secao from '@/compartilhado/componentes/Secao';

export default function Inicio() {
  const { usuario } = useAuth();
  const atalhos = itensVisiveis(usuario.perfil).filter((item) => item.descricao);

  return (
    <div className="space-y-8">
      <CabecalhoPagina
        titulo={`Olá, ${primeiroNome(usuario.nome)}`}
        descricao={
          <>
            Você entrou como <strong className="text-texto">{NOMES_PERFIS[usuario.perfil]}</strong>.{' '}
            {DESCRICOES_PERFIS[usuario.perfil]}
          </>
        }
      />

      <Secao titulo="O que você pode fazer agora">
        <ul className="grid gap-4 sm:grid-cols-2">
          {atalhos.map((item) => (
            <li key={item.para}>
              <Link
                to={item.para}
                className="block h-full rounded-lg border border-borda p-4 transition-colors hover:border-marca hover:bg-marca-clara"
              >
                <span className="block font-bold text-marca">{item.rotulo}</span>
                <span className="mt-1 block text-sm text-suave">{item.descricao}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Secao>

      <Secao
        titulo="Em construção pela equipe"
        descricao="Estas áreas entram no sistema conforme cada módulo do projeto for concluído."
      >
        <ul className="grid gap-4 sm:grid-cols-2">
          {AREAS_EM_CONSTRUCAO.map((area) => (
            <li key={area.rotulo} className="rounded-lg border border-dashed border-borda p-4">
              <span className="block font-bold">{area.rotulo}</span>
              <span className="mt-1 block text-sm text-suave">{area.descricao}</span>
              <span className="mt-2 block text-xs font-bold text-suave">Responsável: {area.responsavel}</span>
            </li>
          ))}
        </ul>
      </Secao>
    </div>
  );
}
