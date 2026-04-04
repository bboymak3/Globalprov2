// ============================================
// API: ASIGNAR ORDEN A TÉCNICO (ADMIN)
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

    // Verificar que la orden existe
    const orden = await env.DB.prepare(
      "SELECT id, tecnico_asignado_id FROM OrdenesTrabajo WHERE id = ?"
    ).bind(data.orden_id).first();

    if (!orden) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Orden no encontrada'
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
        error: 'Técnico no encontrado o inactivo'
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 404
      });
    }

    // Si ya tenía un técnico asignado, eliminar la asignación anterior
    if (orden.tecnico_asignado_id) {
      await env.DB.prepare(
        "DELETE FROM AsignacionesTecnico WHERE orden_id = ?"
      ).bind(data.orden_id).run();
    }

    // Crear nueva asignación
    await env.DB.prepare(`
      INSERT INTO AsignacionesTecnico (orden_id, tecnico_id, asignado_por)
      VALUES (?, ?, 'Admin')
    `).bind(data.orden_id, data.tecnico_id).run();

    // Actualizar orden
    await env.DB.prepare(`
      UPDATE OrdenesTrabajo
      SET tecnico_asignado_id = ?, estado_trabajo = 'Pendiente Visita'
      WHERE id = ?
    `).bind(data.tecnico_id, data.orden_id).run();

    // Registrar en seguimiento
    await env.DB.prepare(`
      INSERT INTO SeguimientoTrabajo (orden_id, tecnico_id, estado_anterior, estado_nuevo, observaciones)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      data.orden_id,
      data.tecnico_id,
      orden.estado_trabajo || 'Sin asignar',
      'Pendiente Visita',
      'Orden asignada a técnico: ' + tecnico.nombre
    ).run();

    return new Response(JSON.stringify({
      success: true,
      mensaje: 'Orden asignada correctamente'
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
