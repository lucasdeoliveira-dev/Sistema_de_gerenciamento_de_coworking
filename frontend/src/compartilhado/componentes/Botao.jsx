const BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg font-bold transition-colors ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

const VARIANTES = {
  primario: 'bg-marca px-4 py-2.5 text-contraste hover:bg-marca-escura',
  secundario: 'border border-borda bg-superficie px-4 py-2.5 text-texto hover:bg-fundo',
  perigo: 'bg-erro px-4 py-2.5 text-contraste hover:opacity-90',
  link: 'p-0 text-marca underline-offset-4 hover:underline',
};

export default function Botao({
  variante = 'primario',
  carregando = false,
  textoCarregando,
  disabled,
  className = '',
  children,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={`${BASE} ${VARIANTES[variante]} ${className}`}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      {...props}
    >
      {carregando ? (textoCarregando ?? 'Aguarde…') : children}
    </button>
  );
}
