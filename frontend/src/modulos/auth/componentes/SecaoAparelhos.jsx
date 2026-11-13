import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/modulos/auth/AuthContext';
import { minhasSessoes, sairDeTodos } from '@/modulos/auth/api';
import { dataHora, descreverAparelho, ipLegivel, tempoRelativo } from '@/compartilhado/utils/formatos';
import Secao from '@/compartilhado/componentes/Secao';
import Botao from '@/compartilhado/componentes/Botao';
import Alerta from '@/compartilhado/componentes/Alerta';
import Modal from '@/compartilhado/componentes/Modal';

export default function SecaoAparelhos({ versao }) {
  const { esquecerSessao } = useAuth();
  const [sessoes, setSessoes] = useState(null);
  const [erro, setErro] = useState(null);
  const [confirmando, setConfirmando] = useState(false);
  const [saindo, setSaindo] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setSessoes(await minhasSessoes());
      setErro(null);
    } catch (falha) {
      setErro(falha.message);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar, versao]);

  async function confirmarSaida() {
    setSaindo(true);
    try {
      await sairDeTodos();
      esquecerSessao('sessoes-encerradas');
    } catch (falha) {
      setErro(falha.message);
      setSaindo(false);
      setConfirmando(false);
    }
  }

  return (
    <Secao
      titulo="Aparelhos conectados"
      descricao="Não reconhece algum aparelho? Saia de todos e troque a sua senha. Cada acesso também termina sozinho depois de algumas horas, ou antes disso se ficar parado."
    >
      {erro && <Alerta tipo="erro">{erro}</Alerta>}
      {!sessoes && !erro && <p className="text-sm text-suave">Carregando…</p>}

      {sessoes && (
        <ul className="divide-y divide-borda rounded-lg border border-borda">
          {sessoes.map((sessao) => (
            <li key={sessao.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div>
                <p className="font-bold">
                  {descreverAparelho(sessao.user_agent)}
                  {sessao.atual && (
                    <span className="ml-2 rounded-full bg-sucesso-fundo px-2 py-0.5 text-xs font-bold text-sucesso">
                      Este aparelho
                    </span>
                  )}
                </p>
                <p className="text-sm text-suave">
                  IP {ipLegivel(sessao.ip)} · entrou em {dataHora(sessao.criada_em)}
                </p>
              </div>
              <p className="text-sm text-suave">Último uso: {tempoRelativo(sessao.ultimo_acesso_em)}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-end">
        <Botao variante="perigo" onClick={() => setConfirmando(true)}>
          Sair de todos os aparelhos
        </Botao>
      </div>

      <Modal
        aberto={confirmando}
        titulo="Sair de todos os aparelhos?"
        descricao="Todas as sessões da sua conta serão encerradas, inclusive esta. Você vai precisar entrar de novo."
        aoFechar={() => !saindo && setConfirmando(false)}
        largura="pequena"
      >
        <div className="flex justify-end gap-3">
          <Botao variante="secundario" onClick={() => setConfirmando(false)} disabled={saindo}>
            Cancelar
          </Botao>
          <Botao variante="perigo" onClick={confirmarSaida} carregando={saindo} textoCarregando="Saindo…">
            Sair de todos
          </Botao>
        </div>
      </Modal>
    </Secao>
  );
}
