// ============================================
// API: BUSCAR ÓRDENES POR PATENTE
// Global Pro Automotriz
// ============================================

export async function onRequestGet(context) {
  const { request, env } = context;
  
  try {
    const url = new URL(request.url);
    const patente = url.searchParams.get('patente');
    
    if (!patente) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Patente no proporcionada' 
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }
    
    // Buscar órdenes con datos de cliente
    const { results } = await env.DB.prepare(`
      SELECT 
        o.*,
        c.nombre as cliente_nombre,
        c.rut as cliente_rut,
        c.telefono as cliente_telefono
      FROM OrdenesTrabajo o
      LEFT JOIN Clientes c ON o.cliente_id = c.id
      WHERE UPPER(o.patente_placa) = UPPER(?)
      ORDER BY o.fecha_creacion DESC
      LIMIT 20
    `).bind(patente).all();
    
    return new Response(JSON.stringify({
      success: true,
      ordenes: results
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error al buscar órdenes:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}