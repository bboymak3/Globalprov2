// ============================================
// API: ASIGNAR ORDEN A TÉCNICO
// Global Pro Automotriz
// ============================================

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const data = await request.json();

    if (!data.orden_id || !data.tecnico_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Faltan datos: orden_id y tecnico_id'
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Verificar que la orden existe y está aprobada (puede ser por ID o por numero_orden)
    let orden;
    if (typeof data.orden_id === 'number' || data.orden_id.length <= 6) {
      // Buscar por numero_orden
      orden = await env.DB.prepare(
        "SELECT id, numero_orden FROM OrdenesTrabajo WHERE numero_orden = ? AND estado = 'Aprobada'"
      ).bind(data.orden_id).first();
    } else {
      // Buscar por ID
      orden = await env.DB.prepare(
        "SELECT id, numero_orden FROM OrdenesTrabajo WHERE id = ? AND estado = 'Aprobada'"
      ).bind(data.orden_id).first();
    }

    if (!orden) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Orden no encontrada, no está aprobada o ya fue asignada'
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 404
      });
    }

    // Verificar que el técnico existe y está activo
    const tecnico = await env.DB.prepare(
      "SELECT id, nombre FROM Tecnicos WHERE id = ? AND activo = 1"
    ).bind(data.tecnico_id).first();

    if (!tecnico) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Técnico no encontrado o no está activo'
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 404
      });
    }

    // Asignar orden al técnico
    await env.DB.prepare(`
      UPDATE OrdenesTrabajo
      SET tecnico_asignado_id = ?,
          estado = 'en_proceso'
      WHERE id = ?
    `).bind(data.tecnico_id, orden.id).run();

    return new Response(JSON.stringify({
      success: true,
      mensaje: `Orden #${String(orden.numero_orden).padStart(6, '0')} asignada al técnico ${tecnico.nombre}`
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error al asignar orden:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}
