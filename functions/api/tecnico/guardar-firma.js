// ============================================
// API: GUARDAR FIRMA DEL CLIENTE
// Global Pro Automotriz
// ============================================

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const data = await request.json();

    if (!data.orden_id || !data.tecnico_id || !data.firma) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Faltan datos: orden_id, tecnico_id y firma'
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

    // Guardar firma y cambiar estado a Aprobada
    await env.DB.prepare(`
      UPDATE OrdenesTrabajo
      SET firma_imagen = ?, estado = 'Aprobada', estado_trabajo = 'Aprobada',
          fecha_aprobacion = datetime('now')
      WHERE id = ?
    `).bind(data.firma, data.orden_id).run();

    // Registrar en seguimiento
    await env.DB.prepare(`
      INSERT INTO SeguimientoTrabajo (orden_id, tecnico_id, estado_anterior, estado_nuevo, observaciones)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      data.orden_id,
      data.tecnico_id,
      orden.estado_trabajo,
      'Aprobada',
      'Firma del cliente capturada en dispositivo del técnico'
    ).run();

    return new Response(JSON.stringify({
      success: true,
      mensaje: 'Firma guardada correctamente'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error al guardar firma:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}
