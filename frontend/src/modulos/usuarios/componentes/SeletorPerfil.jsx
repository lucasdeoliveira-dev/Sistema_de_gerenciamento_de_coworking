import { DESCRICOES_PERFIS, LISTA_PERFIS, NOMES_PERFIS } from '@/compartilhado/config/perfis';
import CampoSelecao from '@/compartilhado/componentes/CampoSelecao';

const OPCOES_PERFIL = LISTA_PERFIS.map((perfil) => ({ valor: perfil, rotulo: NOMES_PERFIS[perfil] }));

export default function SeletorPerfil({ valor, aoMudar, erro, desabilitado, dica }) {
  return (
    <CampoSelecao
      rotulo="Perfil"
      opcoes={OPCOES_PERFIL}
      value={valor}
      onChange={(e) => aoMudar(e.target.value)}
      disabled={desabilitado}
      erro={erro}
      dica={dica ?? DESCRICOES_PERFIS[valor]}
    />
  );
}
