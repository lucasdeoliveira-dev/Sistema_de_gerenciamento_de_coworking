import { useState } from 'react';
import { atualizarEspaco, criarEspaco } from '@/modulos/espacos/api';
import { DIAS_SEMANA, NOMES_TIPO_ESPACO, TIPOS_ESPACO } from '@/modulos/espacos/tipos';
import { errosPorCampo } from '@/compartilhado/api/cliente';
import Campo, { ESTILO_ENTRADA } from '@/compartilhado/componentes/Campo';
import CampoSelecao from '@/compartilhado/componentes/CampoSelecao';
import Modal from '@/compartilhado/componentes/Modal';
import Botao from '@/compartilhado/componentes/Botao';
import Alerta from '@/compartilhado/componentes/Alerta';

const OPCOES_TIPO = TIPOS_ESPACO.map((tipo) => ({ valor: tipo, rotulo: NOMES_TIPO_ESPACO[tipo] }));

function ordenar(horarios) {
  return [...horarios].sort((a, b) => a.diaSemana - b.diaSemana || a.horaInicio.localeCompare(b.horaInicio));
}

function gradeDoEspaco(espaco) {
  return (espaco?.horarios ?? []).map((faixa) => ({
    diaSemana: faixa.dia_semana,
    horaInicio: String(faixa.hora_inicio).slice(0, 5),
    horaFim: String(faixa.hora_fim).slice(0, 5),
  }));
}

function mesmaGrade(espaco, horarios) {
  return JSON.stringify(ordenar(gradeDoEspaco(espaco))) === JSON.stringify(ordenar(horarios));
}

function validarEspaco(dados) {
  const erros = {};
  const nome = dados.nome.trim();
  if (nome.length < 2) erros.nome = 'Nome muito curto.';
  else if (nome.length > 120) erros.nome = 'Nome muito longo.';
  if (!TIPOS_ESPACO.includes(dados.tipo)) erros.tipo = 'Escolha o tipo do espaço.';

  const capacidade = Number(dados.capacidade);
  if (!Number.isInteger(capacidade) || capacidade < 1 || capacidade > 500) {
    erros.capacidade = 'A capacidade deve ser um inteiro de 1 a 500.';
  }

  if (dados.horarios.length === 0) {
    erros.horarios = 'Informe ao menos um horário de funcionamento.';
  } else if (dados.horarios.some((faixa) => !faixa.horaInicio || !faixa.horaFim || faixa.horaFim <= faixa.horaInicio)) {
    erros.horarios = 'O fim de cada horário precisa ser depois do início.';
  } else {
    const ordenados = ordenar(dados.horarios);
    for (let i = 1; i < ordenados.length; i += 1) {
      const anterior = ordenados[i - 1];
      const atual = ordenados[i];
      if (anterior.diaSemana === atual.diaSemana && anterior.horaFim > atual.horaInicio) {
        erros.horarios = 'Há horários sobrepostos no mesmo dia.';
        break;
      }
    }
  }

  return erros;
}

function FormEspaco({ espaco, aoCancelar, aoSalvar, aoMudarOcupado }) {
  const editando = Boolean(espaco);
  const [dados, setDados] = useState({
    nome: espaco?.nome ?? '',
    tipo: espaco?.tipo ?? 'SALA',
    capacidade: espaco ? String(espaco.capacidade) : '',
    ativo: espaco?.ativo ?? true,
    horarios: editando ? gradeDoEspaco(espaco) : [{ diaSemana: 1, horaInicio: '08:00', horaFim: '18:00' }],
  });
  const [errosCampo, setErrosCampo] = useState({});
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const alterar = (campo, valor) => setDados((atual) => ({ ...atual, [campo]: valor }));

  function mudarFaixa(diaSemana, indice, campo, valor) {
    setDados((atual) => {
      let visto = -1;
      const horarios = atual.horarios.map((faixa) => {
        if (faixa.diaSemana !== diaSemana) return faixa;
        visto += 1;
        if (visto !== indice) return faixa;
        return { ...faixa, [campo]: valor.slice(0, 5) };
      });
      return { ...atual, horarios };
    });
  }

  function adicionarFaixa(diaSemana) {
    setDados((atual) => {
      if (atual.horarios.length >= 21) return atual;
      return {
        ...atual,
        horarios: [...atual.horarios, { diaSemana, horaInicio: '08:00', horaFim: '12:00' }],
      };
    });
  }

  function removerFaixa(diaSemana, indice) {
    setDados((atual) => {
      let visto = -1;
      return {
        ...atual,
        horarios: atual.horarios.filter((faixa) => {
          if (faixa.diaSemana !== diaSemana) return true;
          visto += 1;
          return visto !== indice;
        }),
      };
    });
  }

  function mudarSalvando(valor) {
    setSalvando(valor);
    aoMudarOcupado(valor);
  }

  async function salvar(evento) {
    evento.preventDefault();
    setErro(null);
    const erros = validarEspaco(dados);
    setErrosCampo(erros);
    if (Object.keys(erros).length > 0) return;

    const horarios = ordenar(dados.horarios);
    const corpo = {
      nome: dados.nome.trim(),
      tipo: dados.tipo,
      capacidade: Number(dados.capacidade),
    };
    if (!editando || !mesmaGrade(espaco, horarios)) corpo.horarios = horarios;
    if (editando) corpo.ativo = dados.ativo;

    mudarSalvando(true);
    try {
      const salvo = editando ? await atualizarEspaco(espaco.id, corpo) : await criarEspaco(corpo);
      mudarSalvando(false);
      aoSalvar(salvo);
    } catch (falha) {
      const porCampo = errosPorCampo(falha);
      if (falha.codigo === 'ESPACO_DUPLICADO') porCampo.nome = falha.message;
      if (falha.codigo === 'REGRA_DE_NEGOCIO' || falha.codigo === 'HORARIO_DUPLICADO')
        porCampo.horarios = falha.message;
      const detalheHorario = (falha.detalhes ?? []).find((item) => String(item.campo ?? '').startsWith('horarios'));
      if (detalheHorario && !porCampo.horarios) porCampo.horarios = detalheHorario.mensagem;
      setErrosCampo(porCampo);
      setErro(falha.message);
      mudarSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} noValidate className="space-y-4">
      {erro && <Alerta tipo="erro">{erro}</Alerta>}
      <Campo
        rotulo="Nome"
        maxLength={120}
        value={dados.nome}
        onChange={(e) => alterar('nome', e.target.value)}
        erro={errosCampo.nome}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoSelecao
          rotulo="Tipo"
          opcoes={OPCOES_TIPO}
          value={dados.tipo}
          onChange={(e) => alterar('tipo', e.target.value)}
          erro={errosCampo.tipo}
        />
        <Campo
          rotulo="Capacidade"
          type="number"
          min={1}
          max={500}
          inputMode="numeric"
          value={dados.capacidade}
          onChange={(e) => alterar('capacidade', e.target.value)}
          erro={errosCampo.capacidade}
          dica="Quantas pessoas cabem ao mesmo tempo."
        />
      </div>

      <fieldset className="space-y-1">
        <legend className="text-sm font-bold">Horários de funcionamento</legend>
        <p className="text-sm text-suave">Dia sem horário fica fechado. 1 é segunda-feira e 7 é domingo.</p>
        {errosCampo.horarios && <p className="text-sm text-erro">{errosCampo.horarios}</p>}
        <div className="divide-y divide-borda">
          {DIAS_SEMANA.map((dia) => {
            const faixas = dados.horarios.filter((faixa) => faixa.diaSemana === dia.valor);
            return (
              <div key={dia.valor} className="grid gap-2 py-3 sm:grid-cols-[9rem_1fr] sm:items-start">
                <span className="pt-2 text-sm font-bold">{dia.rotulo}</span>
                <div className="space-y-2">
                  {faixas.length === 0 && <p className="pt-2 text-sm text-suave">Fechado</p>}
                  {faixas.map((faixa, indice) => (
                    <div key={`${dia.valor}-${indice}`} className="flex flex-wrap items-center gap-2">
                      <input
                        type="time"
                        aria-label={`${dia.rotulo} início ${indice + 1}`}
                        className={`${ESTILO_ENTRADA} w-32`}
                        value={faixa.horaInicio}
                        onChange={(e) => mudarFaixa(dia.valor, indice, 'horaInicio', e.target.value)}
                      />
                      <span className="text-sm text-suave">às</span>
                      <input
                        type="time"
                        aria-label={`${dia.rotulo} fim ${indice + 1}`}
                        className={`${ESTILO_ENTRADA} w-32`}
                        value={faixa.horaFim}
                        onChange={(e) => mudarFaixa(dia.valor, indice, 'horaFim', e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removerFaixa(dia.valor, indice)}
                        className="rounded px-2 py-1 text-sm font-bold text-erro hover:bg-marca-clara"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                  {faixas.length < 3 && dados.horarios.length < 21 && (
                    <button
                      type="button"
                      onClick={() => adicionarFaixa(dia.valor)}
                      className="text-sm font-bold text-marca hover:underline"
                    >
                      Adicionar horário
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </fieldset>

      {editando && (
        <label className="flex items-center gap-2 text-sm font-bold">
          <input type="checkbox" checked={dados.ativo} onChange={(e) => alterar('ativo', e.target.checked)} />
          Espaço ativo
        </label>
      )}

      <div className="flex justify-end gap-3">
        <Botao variante="secundario" onClick={aoCancelar} disabled={salvando}>
          Cancelar
        </Botao>
        <Botao type="submit" carregando={salvando} textoCarregando="Salvando…">
          {editando ? 'Salvar' : 'Criar espaço'}
        </Botao>
      </div>
    </form>
  );
}

export default function ModalEspaco({ espaco, aberto, aoFechar, aoSalvar }) {
  const [ocupado, setOcupado] = useState(false);

  return (
    <Modal
      aberto={aberto}
      titulo={espaco ? 'Editar espaço' : 'Novo espaço'}
      descricao="A grade diz em quais dias e horários o espaço funciona."
      largura="grande"
      aoFechar={() => !ocupado && aoFechar()}
    >
      <FormEspaco espaco={espaco} aoCancelar={aoFechar} aoSalvar={aoSalvar} aoMudarOcupado={setOcupado} />
    </Modal>
  );
}
