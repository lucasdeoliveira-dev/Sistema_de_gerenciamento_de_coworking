export default function EstadoVazio({ titulo, texto }) {
  return (
    <div className="rounded-xl border border-dashed border-borda bg-superficie px-6 py-10 text-center">
      <p className="font-bold">{titulo}</p>
      {texto && <p className="mt-1 text-sm text-suave">{texto}</p>}
    </div>
  );
}
