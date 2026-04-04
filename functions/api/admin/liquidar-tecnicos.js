// ============================================
// API: LIQUIDACIÓN DE TÉCNICOS
// Global Pro Automotriz
// ============================================

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const tecnicoId = url.searchParams.get('tecnico_id');
  const filtroTecnicoId = url.searchParams.get('filtro_tecnico_id');
  const periodo = url.searchParams.get('periodo');
  const fechaInicio = url.searchParams.get('fecha_inicio');
  const fechaFin = url.searchParams.get('fecha_fin');

  try {
    const fechaField = 'o.fecha_aprobacion';
    let fechaCondiciones = '';
    const binds = [];

    if (periodo === 'hoy') {
      fechaCondiciones += ` AND date(${fechaField}) = date('now','localtime')`;
    } else if (periodo === 'mes') {
      fechaCondiciones += ` AND strftime('%Y-%m', ${fechaField}) = strftime('%Y-%m', 'now','localtime')`;
    } else if (periodo === 'ano') {
      fechaCondiciones += ` AND strftime('%Y', ${fechaField}) = strftime('%Y', 'now','localtime')`;
    }

    if (fechaInicio) {
      fechaCondiciones += ` AND date(${fechaField}) >= date(?)`;
      binds.push(fechaInicio);
    }

    if (fechaFin) {
      fechaCondiciones += ` AND date(${fechaField}) <= date(?)`;
      binds.push(fechaFin);
    }

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
        FROM OrdenesTrabajo o
        WHERE tecnico_asignado_id = ?
          AND o.estado = 'Aprobada'
          ${fechaCondiciones}
        ORDER BY fecha_creacion DESC
      `).bind(tecnicoId, ...binds).all();

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

    const whereTecnico = filtroTecnicoId ? 'WHERE t.id = ?' : '';
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
        ${fechaCondiciones}
      ${whereTecnico}
      GROUP BY t.id
      ORDER BY ordenes_realizadas DESC, monto_total DESC
    `).bind(...(filtroTecnicoId ? [filtroTecnicoId, ...binds] : binds)).all();

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
