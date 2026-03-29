// ============================================
// API: APROBAR ORDEN (GUARDAR FIRMA)
// Global Pro Automotriz
// ============================================

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const data = await request.json();

    console.log('Datos recibidos en aprobar-orden:', {
      tieneToken: !!data.token,
      tokenLength: data.token ? data.token.length : 0,
      tieneFirma: !!data.firma,
      firmaLength: data.firma ? data.firma.length : 0
    });

    if (!data.token || !data.firma) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Faltan datos: token y firma'
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Verificar que la orden existe y está en estado "Enviada"
    const orden = await env.DB.prepare(
      "SELECT * FROM OrdenesTrabajo WHERE token = ?"
    ).bind(data.token).first();

    console.log('Orden encontrada:', !!orden, 'Estado:', orden?.estado);

    if (!orden) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Orden no encontrada'
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 404
      });
    }

    if (orden.estado !== 'Enviada') {
      return new Response(JSON.stringify({
        success: false,
        error: `La orden ya está en estado: ${orden.estado}`
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Actualizar orden con firma y cambiar estado
    const result = await env.DB.prepare(`
      UPDATE OrdenesTrabajo
      SET estado = 'Aprobada',
          firma_imagen = ?,
          fecha_aprobacion = datetime('now'),
          fecha_actualizacion = datetime('now')
      WHERE token = ?
    `).bind(data.firma, data.token).run();

    console.log('Resultado UPDATE:', result.meta, 'Filas afectadas:', result.meta?.changes || 0);

    // Obtener orden actualizada
    const ordenActualizada = await env.DB.prepare(`
      SELECT
        o.*,
        c.nombre as cliente_nombre,
        c.rut as cliente_rut,
        c.telefono as cliente_telefono
      FROM OrdenesTrabajo o
      LEFT JOIN Clientes c ON o.cliente_id = c.id
      WHERE o.token = ?
    `).bind(data.token).first();

    console.log('Orden actualizada estado:', ordenActualizada?.estado, 'Tiene firma:', !!ordenActualizada?.firma_imagen);

    return new Response(JSON.stringify({
      success: true,
      orden: ordenActualizada
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error al aprobar orden:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}