import { useState } from 'react';
import { useAuth } from '@/modulos/auth/AuthContext';
import { trocarSenha } from '@/modulos/auth/api';
import { errosPorCampo } from '@/compartilhado/api/cliente';
import { senhaForte } from '@/compartilhado/utils/formatos';
import Secao from '@/compartilhado/componentes/Secao';
import CampoSenha from '@/compartilhado/componentes/CampoSenha';
import Botao from '@/compartilhado/componentes/Botao';
import Alerta from '@/compartilhado/componentes/Alerta';

const VAZIO = { atual: '', nova: '', confirmacao: '' };

function validar(dados) {
  const erros = {};
  if (!dados.atual) erros.senhaAtual = 'Informe a senha atual.';
  if (!senhaForte(dados.nova)) erros.novaSenha = 'A nova senha ainda não atende a todos os requisitos.';
  else if (dados.nova === dados.atual) erros.novaSenha = 'A nova senha precisa ser diferente da atual.';
  if (dados.confirmacao !== dados.nova) erros.confirmacao = 'As senhas não são iguais.';
  return erros;
}

export default function SecaoTrocarSenha({ aoTrocar }) {
  const { usuario } = useAuth();
  const [dados, setDados] = useState(VAZIO);
  const [errosCampo, setErrosCampo] = useState({});
  const [retorno, setRetorno] = useState(null);
  const [salvando, setSalvando] = useState(false);

  function alterar(campo, valor) {
    setDados((atual) => ({ ...atual, [campo]: valor }));
    setRetorno(null);
  }

  async function salvar(evento) {
    evento.preventDefault();

    const erros = validar(dados);
    setErrosCampo(erros);
    if (Object.keys(erros).length > 0) return;

    setSalvando(true);
    try {
      await trocarSenha(dados.atual, dados.nova);
      setDados(VAZIO);
      setRetorno({
        tipo: 'sucesso',
        texto: 'Senha alterada. Você continua conectado aqui; os outros aparelhos precisarão entrar de novo.',
      });
      aoTrocar();
    } catch (falha) {
      const porCampo = errosPorCampo(falha);
      if (falha.codigo === 'SENHA_ATUAL_INCORRETA') porCampo.senhaAtual = falha.message;
      setErrosCampo(porCampo);
      if (Object.keys(porCampo).length === 0) setRetorno({ tipo: 'erro', texto: falha.message });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Secao
      titulo="Trocar senha"
      descricao="Ao trocar, os outros aparelhos conectados à sua conta saem automaticamente."
    >
      <form onSubmit={salvar} noValidate className="space-y-4">
        <input type="email" name="username" autoComplete="username" value={usuario.email} hidden readOnly />
        <CampoSenha
          rotulo="Senha atual"
          name="senha-atual"
          autoComplete="current-password"
          value={dados.atual}
          onChange={(e) => alterar('atual', e.target.value)}
          erro={errosCampo.senhaAtual}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoSenha
            rotulo="Nova senha"
            name="nova-senha"
            autoComplete="new-password"
            value={dados.nova}
            onChange={(e) => alterar('nova', e.target.value)}
            erro={errosCampo.novaSenha}
            mostrarRequisitos
          />
          <CampoSenha
            rotulo="Repita a nova senha"
            name="confirmacao"
            autoComplete="new-password"
            value={dados.confirmacao}
            onChange={(e) => alterar('confirmacao', e.target.value)}
            erro={errosCampo.confirmacao}
          />
        </div>
        {retorno && <Alerta tipo={retorno.tipo}>{retorno.texto}</Alerta>}
        <div className="flex justify-end">
          <Botao type="submit" carregando={salvando} textoCarregando="Trocando…">
            Trocar senha
          </Botao>
        </div>
      </form>
    </Secao>
  );
}
