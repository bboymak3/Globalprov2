// ============================================
// API: OBTENER ÓRDENES APROBADAS PARA TÉCNICOS
// Global Pro Automotriz
// ============================================

export async function onRequestGet(context) {
  const { env } = context;

  try {
    // Obtener todas las órdenes aprobadas
    const ordenes = await env.DB.prepare(`
      SELECT
        id,
        numero_orden,
        token,
        patente_placa,
        marca,
        modelo,
        cliente_nombre,
        fecha_aprobacion,
        tecnico_asignado_id
      FROM OrdenesTrabajo
      WHERE estado = 'Aprobada'
      ORDER BY fecha_aprobacion DESC
    `).all();

    // Formatear número de orden a 6 dígitos
    const ordenesFormateadas = (ordenes.results || []).map(orden => ({
      ...orden,
      numero_orden_formateado: String(orden.numero_orden).padStart(6, '0'),
      asignada: orden.tecnico_asignado_id !== null
    }));

    return new Response(JSON.stringify({
      success: true,
      ordenes: ordenesFormateadas
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error al obtener órdenes aprobadas:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}
