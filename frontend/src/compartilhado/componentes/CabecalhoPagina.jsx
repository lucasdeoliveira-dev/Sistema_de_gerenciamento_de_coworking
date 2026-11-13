export default function CabecalhoPagina({ titulo, descricao, children }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">{titulo}</h1>
        {descricao && <p className="mt-2 max-w-3xl text-suave">{descricao}</p>}
      </div>
      {children}
    </header>
  );
}
