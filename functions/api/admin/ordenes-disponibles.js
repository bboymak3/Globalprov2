// ============================================
// API: ÓRDENES DISPONIBLES PARA ASIGNACIÓN
// Global Pro Automotriz
// ============================================

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const ordenes = await env.DB.prepare(
      `SELECT id, numero_orden, patente_placa, cliente_nombre, fecha_creacion
       FROM OrdenesTrabajo
       WHERE estado = 'Aprobada' AND (tecnico_asignado_id IS NULL OR tecnico_asignado_id = '')
       ORDER BY fecha_creacion DESC`
    ).all();

    return new Response(JSON.stringify({
      success: true,
      ordenes: ordenes.results || []
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error al obtener órdenes disponibles:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}