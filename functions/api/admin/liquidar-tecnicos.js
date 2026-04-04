// ============================================
// API: LIQUIDACIÓN DE TÉCNICOS
// Global Pro Automotriz
// ============================================

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const tecnicoId = url.searchParams.get('tecnico_id');

  try {
    if (tecnicoId) {
      const ordenes = await env.DB.prepare(`
        SELECT
          id,
          numero_orden,
          cliente_nombre,
          estado,
          monto_total,
          fecha_creacion,
          fecha_aprobacion
        FROM OrdenesTrabajo
        WHERE tecnico_asignado_id = ?
        ORDER BY fecha_creacion DESC
      `).bind(tecnicoId).all();

      return new Response(JSON.stringify({
        success: true,
        ordenes: (ordenes.results || []).map(orden => ({
          ...orden,
          numero_orden: orden.numero_orden || 0
        }))
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const liquidaciones = await env.DB.prepare(`
      SELECT
        t.id,
        t.nombre,
        COUNT(o.id) AS ordenes_realizadas,
        COALESCE(SUM(o.monto_total), 0) AS monto_total,
        COALESCE(SUM(o.monto_total), 0) * 0.4 AS ganancia_tecnico
      FROM Tecnicos t
      LEFT JOIN OrdenesTrabajo o
        ON o.tecnico_asignado_id = t.id
        AND o.estado = 'Aprobada'
      GROUP BY t.id
      ORDER BY ordenes_realizadas DESC, monto_total DESC
    `).all();

    return new Response(JSON.stringify({
      success: true,
      liquidaciones: liquidaciones.results || []
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error al obtener liquidaciones de técnicos:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}
