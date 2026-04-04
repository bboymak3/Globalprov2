// ============================================
// API: VER ORDEN DE TRABAJO
// Global Pro Automotriz
// ============================================

export async function onRequestGet(context) {
  const { request, env } = context;
  
  try {
    const url = new URL(request.url);
    const ordenId = url.searchParams.get('id');
    const token = url.searchParams.get('token');
    
    if (!ordenId && !token) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Se requiere ID o token de la orden' 
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }
    
    let orden;
    
    if (token) {
      // Buscar por token (para página de aprobación)
      orden = await env.DB.prepare(`
        SELECT 
          o.*,
          c.nombre as cliente_nombre,
          c.rut as cliente_rut,
          c.telefono as cliente_telefono
        FROM OrdenesTrabajo o
        LEFT JOIN Clientes c ON o.cliente_id = c.id
        WHERE o.token = ?
      `).bind(token).first();
    } else {
      // Buscar por ID (para panel admin)
      orden = await env.DB.prepare(`
        SELECT 
          o.*,
          c.nombre as cliente_nombre,
          c.rut as cliente_rut,
          c.telefono as cliente_telefono
        FROM OrdenesTrabajo o
        LEFT JOIN Clientes c ON o.cliente_id = c.id
        WHERE o.id = ?
      `).bind(ordenId).first();
    }
    
    if (!orden) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Orden no encontrada'
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 404
      });
    }
    
    return new Response(JSON.stringify({
      success: true,
      orden: orden
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error al ver orden:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}
