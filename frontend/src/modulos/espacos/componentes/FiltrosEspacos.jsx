import { NOMES_TIPO_ESPACO, TIPOS_ESPACO } from '@/modulos/espacos/tipos';
import Campo from '@/compartilhado/componentes/Campo';
import CampoSelecao from '@/compartilhado/componentes/CampoSelecao';

const OPCOES_TIPO = [
  { valor: '', rotulo: 'Todos' },
  ...TIPOS_ESPACO.map((tipo) => ({ valor: tipo, rotulo: NOMES_TIPO_ESPACO[tipo] })),
];

const OPCOES_SITUACAO = [
  { valor: '', rotulo: 'Todas' },
  { valor: 'true', rotulo: 'Ativos' },
  { valor: 'false', rotulo: 'Desativados' },
];

export default function FiltrosEspacos({ busca, tipo, ativo, mostrarSituacao, aoMudarBusca, aoMudarFiltro }) {
  return (
    <div
      role="search"
      className={`grid gap-4 rounded-xl border border-borda bg-superficie p-4 sm:grid-cols-2 ${
        mostrarSituacao ? 'lg:grid-cols-[2fr_1fr_1fr]' : 'lg:grid-cols-[2fr_1fr]'
      }`}
    >
      <Campo
        rotulo="Buscar"
        type="search"
        placeholder="Nome do espaço"
        value={busca}
        onChange={(e) => aoMudarBusca(e.target.value)}
      />
      <CampoSelecao
        rotulo="Tipo"
        opcoes={OPCOES_TIPO}
        value={tipo}
        onChange={(e) => aoMudarFiltro('tipo', e.target.value)}
      />
      {mostrarSituacao && (
        <CampoSelecao
          rotulo="Situação"
          opcoes={OPCOES_SITUACAO}
          value={ativo}
          onChange={(e) => aoMudarFiltro('ativo', e.target.value)}
        />
      )}
    </div>
  );
}
