import { LISTA_PERFIS, NOMES_PERFIS } from '@/compartilhado/config/perfis';
import { NOMES_TIPO_PESSOA, TIPOS_PESSOA } from '@/compartilhado/config/tiposPessoa';
import Campo from '@/compartilhado/componentes/Campo';
import CampoSelecao from '@/compartilhado/componentes/CampoSelecao';

const OPCOES_PERFIL = [
  { valor: '', rotulo: 'Todos' },
  ...LISTA_PERFIS.map((perfil) => ({ valor: perfil, rotulo: NOMES_PERFIS[perfil] })),
];

const OPCOES_TIPO = [
  { valor: '', rotulo: 'Todos' },
  ...Object.values(TIPOS_PESSOA).map((tipo) => ({ valor: tipo, rotulo: NOMES_TIPO_PESSOA[tipo] })),
];

const OPCOES_SITUACAO = [
  { valor: '', rotulo: 'Todas' },
  { valor: 'true', rotulo: 'Ativos' },
  { valor: 'false', rotulo: 'Desativados' },
];

export default function FiltrosUsuarios({ busca, perfil, tipoPessoa, ativo, aoMudarBusca, aoMudarFiltro }) {
  return (
    <div
      role="search"
      className="grid gap-4 rounded-xl border border-borda bg-superficie p-4 sm:grid-cols-3 lg:grid-cols-[2fr_1fr_1fr_1fr]"
    >
      <Campo
        rotulo="Buscar"
        type="search"
        placeholder="Nome, e-mail ou empresa"
        className="sm:col-span-3 lg:col-span-1"
        value={busca}
        onChange={(e) => aoMudarBusca(e.target.value)}
      />
      <CampoSelecao
        rotulo="Perfil"
        opcoes={OPCOES_PERFIL}
        value={perfil}
        onChange={(e) => aoMudarFiltro('perfil', e.target.value)}
      />
      <CampoSelecao
        rotulo="Tipo de conta"
        opcoes={OPCOES_TIPO}
        value={tipoPessoa}
        onChange={(e) => aoMudarFiltro('tipoPessoa', e.target.value)}
      />
      <CampoSelecao
        rotulo="Situação"
        opcoes={OPCOES_SITUACAO}
        value={ativo}
        onChange={(e) => aoMudarFiltro('ativo', e.target.value)}
      />
    </div>
  );
}
