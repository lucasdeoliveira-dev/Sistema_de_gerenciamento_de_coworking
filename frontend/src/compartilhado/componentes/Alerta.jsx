const TIPOS = {
  info: 'border-marca/20 bg-marca-clara text-marca',
  sucesso: 'border-sucesso/30 bg-sucesso-fundo text-sucesso',
  aviso: 'border-aviso/30 bg-aviso-fundo text-aviso',
  erro: 'border-erro/30 bg-erro-fundo text-erro',
};

export default function Alerta({ tipo = 'info', titulo, children }) {
  if (!children && !titulo) return null;
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${TIPOS[tipo]}`} role={tipo === 'erro' ? 'alert' : 'status'}>
      {titulo && <p className="font-bold">{titulo}</p>}
      {children && <div className={titulo ? 'mt-1' : ''}>{children}</div>}
    </div>
  );
}
