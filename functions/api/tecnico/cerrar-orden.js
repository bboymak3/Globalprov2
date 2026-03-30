// ============================================
// API: CERRAR ORDEN (TÉCNICO)
// Global Pro Automotriz
// ============================================

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const data = await request.json();
    if (!data.orden_id || !data.tecnico_id) {
      return new Response(JSON.stringify({ success: false, error: 'Faltan datos: orden_id y tecnico_id' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    const orden = await env.DB.prepare(
      'SELECT id, estado, estado_trabajo, firma_imagen, token, tecnico_asignado_id FROM OrdenesTrabajo WHERE id = ? AND tecnico_asignado_id = ?'
    ).bind(data.orden_id, data.tecnico_id).first();

    if (!orden) {
      return new Response(JSON.stringify({ success: false, error: 'Orden no encontrada o no asignada a este técnico' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 404
      });
    }

    if (!orden.firma_imagen) {
      return new Response(JSON.stringify({ success: false, error: 'No se puede cerrar la orden: cliente no ha firmado aún' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    if (orden.estado !== 'Aprobada' && orden.estado_trabajo !== 'Aprobada') {
      return new Response(JSON.stringify({ success: false, error: 'No se puede cerrar la orden porque no está aprobada' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    await env.DB.prepare(
      'UPDATE OrdenesTrabajo SET estado = ?, estado_trabajo = ?, fecha_completado = datetime("now") WHERE id = ?'
    ).bind('Aprobada', 'Cerrada', data.orden_id).run();

    return new Response(JSON.stringify({ success: true, mensaje: 'Orden cerrada correctamente', orden_id: data.orden_id }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error al cerrar orden:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}
