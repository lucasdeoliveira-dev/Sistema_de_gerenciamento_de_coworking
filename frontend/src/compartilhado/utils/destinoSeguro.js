export function destinoSeguro(voltar) {
  if (typeof voltar !== 'string' || !voltar.startsWith('/')) return '/';
  try {
    const url = new URL(voltar, window.location.origin);
    const caminho = url.pathname + url.search + url.hash;
    if (url.origin !== window.location.origin || /^\/[/\\]/.test(caminho)) return '/';
    return caminho;
  } catch {
    return '/';
  }
}
