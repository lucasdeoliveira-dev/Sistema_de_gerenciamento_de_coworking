export default function TelaCarregando({ texto = 'Carregando…' }) {
  return (
    <div className="flex min-h-screen items-center justify-center gap-3 text-suave" role="status" aria-live="polite">
      <span
        className="size-5 animate-spin rounded-full border-2 border-marca border-t-transparent"
        aria-hidden="true"
      />
      <span>{texto}</span>
    </div>
  );
}
