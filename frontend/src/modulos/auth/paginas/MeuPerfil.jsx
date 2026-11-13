import { useState } from 'react';
import CabecalhoPagina from '@/compartilhado/componentes/CabecalhoPagina';
import SecaoDadosPessoais from '@/modulos/auth/componentes/SecaoDadosPessoais';
import SecaoTrocarSenha from '@/modulos/auth/componentes/SecaoTrocarSenha';
import SecaoAparelhos from '@/modulos/auth/componentes/SecaoAparelhos';

export default function MeuPerfil() {
  const [versaoSessoes, setVersaoSessoes] = useState(0);

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        titulo="Meu perfil"
        descricao="Seus dados de contato, sua senha e os aparelhos conectados à sua conta."
      />
      <SecaoDadosPessoais />
      <SecaoTrocarSenha aoTrocar={() => setVersaoSessoes((versao) => versao + 1)} />
      <SecaoAparelhos versao={versaoSessoes} />
    </div>
  );
}
