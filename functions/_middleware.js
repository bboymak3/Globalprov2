// Middleware principal para Cloudflare Workers
export async function onRequest(context) {
  // Redirigir a la página principal si es una petición GET a la raíz
  if (context.request.method === 'GET' && new URL(context.request.url).pathname === '/') {
    return new Response('', {
      status: 302,
      headers: {
        'Location': '/index.html'
      }
    });
  }

  // Continuar con la petición normal
  return context.next();
}