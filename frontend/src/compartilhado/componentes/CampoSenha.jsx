import { useId, useState } from 'react';
import { REQUISITOS_SENHA } from '@/compartilhado/utils/formatos';
import { ESTILO_ENTRADA, MensagemCampo } from '@/compartilhado/componentes/Campo';

export default function CampoSenha({ rotulo, erro, mostrarRequisitos = false, value, id, ...props }) {
  const idGerado = useId();
  const idCampo = id ?? idGerado;
  const idErro = `${idCampo}-erro`;
  const idRequisitos = `${idCampo}-requisitos`;
  const [visivel, setVisivel] = useState(false);
  const senha = value ?? '';

  const descritores = [erro && idErro, mostrarRequisitos && idRequisitos].filter(Boolean).join(' ') || undefined;

  return (
    <div>
      <label htmlFor={idCampo} className="mb-1 block text-sm font-bold">
        {rotulo}
      </label>

      <div className="relative">
        <input
          id={idCampo}
          className={`${ESTILO_ENTRADA} pr-24`}
          type={visivel ? 'text' : 'password'}
          value={senha}
          maxLength={72}
          spellCheck={false}
          autoCapitalize="none"
          aria-invalid={erro ? true : undefined}
          aria-describedby={descritores}
          {...props}
        />
        <button
          type="button"
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded px-2 py-1 text-sm font-bold text-marca hover:bg-marca-clara"
          onClick={() => setVisivel((v) => !v)}
          aria-pressed={visivel}
          aria-controls={idCampo}
        >
          {visivel ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>

      {erro && (
        <MensagemCampo id={idErro} tipo="erro">
          {erro}
        </MensagemCampo>
      )}

      {mostrarRequisitos && (
        <ul id={idRequisitos} className="mt-2 space-y-1" aria-label="Requisitos da senha">
          {REQUISITOS_SENHA.map((r) => {
            const atendido = r.ok(senha);
            return (
              <li key={r.id} className={`flex items-center gap-2 text-sm ${atendido ? 'text-sucesso' : 'text-suave'}`}>
                <span aria-hidden="true" className={`size-2 rounded-full ${atendido ? 'bg-sucesso' : 'bg-borda'}`} />
                {r.texto}
                <span className="sr-only">{atendido ? ' (atendido)' : ' (pendente)'}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
