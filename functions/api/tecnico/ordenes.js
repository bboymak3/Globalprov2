// ============================================
// API: OBTENER ÓRDENES DEL TÉCNICO
// Global Pro Automotriz
// ============================================

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const tecnicoId = url.searchParams.get('tecnico_id');

    if (!tecnicoId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Falta ID del técnico'
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Buscar órdenes asignadas a este técnico
    const ordenes = await env.DB.prepare(`
      SELECT
        o.id, o.numero_orden, o.patente_placa, o.marca, o.modelo, o.anio,
        o.direccion, o.estado_trabajo,
        c.nombre as cliente_nombre, c.telefono as cliente_telefono,
        o.trabajo_frenos, o.detalle_frenos,
        o.trabajo_luces, o.detalle_luces,
        o.trabajo_tren_delantero, o.detalle_tren_delantero,
        o.trabajo_correas, o.detalle_correas,
        o.trabajo_componentes, o.detalle_componentes,
        o.firma_imagen, o.fecha_aprobacion
      FROM OrdenesTrabajo o
      LEFT JOIN Clientes c ON o.cliente_id = c.id
      WHERE o.tecnico_asignado_id = ?
      ORDER BY o.fecha_creacion DESC
    `).bind(tecnicoId).all();

    return new Response(JSON.stringify({
      success: true,
      ordenes: ordenes.results || []
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error al obtener órdenes del técnico:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}
