// ============================================
// API: CAMBIAR ESTADO DE ORDEN DE TRABAJO
// Global Pro Automotriz
// ============================================

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const data = await request.json();

    if (!data.orden_id || !data.tecnico_id || !data.nuevo_estado) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Faltan datos: orden_id, tecnico_id y nuevo_estado'
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Verificar que la orden está asignada a este técnico
    const orden = await env.DB.prepare(
      "SELECT id, estado_trabajo FROM OrdenesTrabajo WHERE id = ? AND tecnico_asignado_id = ?"
    ).bind(data.orden_id, data.tecnico_id).first();

    if (!orden) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Orden no encontrada o no asignada a este técnico'
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 404
      });
    }

    // Actualizar estado
    await env.DB.prepare(`
      UPDATE OrdenesTrabajo
      SET estado_trabajo = ?
      WHERE id = ?
    `).bind(data.nuevo_estado, data.orden_id).run();

    // Registrar en seguimiento
    await env.DB.prepare(`
      INSERT INTO SeguimientoTrabajo (
        orden_id, tecnico_id, estado_anterior, estado_nuevo,
        latitud, longitud, observaciones
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.orden_id,
      data.tecnico_id,
      orden.estado_trabajo,
      data.nuevo_estado,
      data.latitud || null,
      data.longitud || null,
      data.observaciones || null
    ).run();

    return new Response(JSON.stringify({
      success: true,
      mensaje: 'Estado actualizado correctamente'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error al cambiar estado:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}
