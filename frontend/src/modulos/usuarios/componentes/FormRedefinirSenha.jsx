import { useState } from 'react';
import { redefinirSenhaUsuario } from '@/modulos/usuarios/api';
import { errosPorCampo } from '@/compartilhado/api/cliente';
import { senhaForte } from '@/compartilhado/utils/formatos';
import CampoSenha from '@/compartilhado/componentes/CampoSenha';
import Botao from '@/compartilhado/componentes/Botao';

export default function FormRedefinirSenha({ usuario, desabilitado, aoMudarOcupado, aoDefinir }) {
  const [novaSenha, setNovaSenha] = useState('');
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);

  function mudarSalvando(valor) {
    setSalvando(valor);
    aoMudarOcupado(valor);
  }

  async function definir() {
    setErro(null);
    if (!senhaForte(novaSenha)) {
      setErro('A senha ainda não atende a todos os requisitos.');
      return;
    }

    mudarSalvando(true);
    try {
      await redefinirSenhaUsuario(usuario.id, novaSenha);
      mudarSalvando(false);
      aoDefinir(`Nova senha definida para ${usuario.nome}. As sessões abertas dessa conta foram encerradas.`);
    } catch (falha) {
      setErro(errosPorCampo(falha).novaSenha ?? falha.message);
      mudarSalvando(false);
    }
  }

  return (
    <div className="space-y-4 border-t border-borda pt-4">
      <div>
        <h3 className="font-bold">Definir nova senha</h3>
        <p className="text-sm text-suave">Use quando a pessoa não conseguir recuperar a senha pelo e-mail.</p>
      </div>
      <CampoSenha
        rotulo="Nova senha provisória"
        autoComplete="new-password"
        value={novaSenha}
        onChange={(e) => setNovaSenha(e.target.value)}
        erro={erro}
        mostrarRequisitos
      />
      <div className="flex justify-end">
        <Botao
          variante="secundario"
          onClick={definir}
          carregando={salvando}
          textoCarregando="Definindo…"
          disabled={desabilitado}
        >
          Definir senha
        </Botao>
      </div>
    </div>
  );
}
