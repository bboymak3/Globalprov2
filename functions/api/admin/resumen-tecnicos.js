// ============================================
// API: RESUMEN DE TÉCNICOS - ESTADÍSTICAS
// Global Pro Automotriz
// ============================================

export async function onRequestGet(context) {
  const { env, request } = context;

  try {
    const url = new URL(request.url);
    const periodo = url.searchParams.get('periodo') || 'mes'; // dia, semana, mes, año
    const tecnicoId = url.searchParams.get('tecnico_id'); // opcional, para filtrar por técnico específico

    // Calcular fechas según período
    const ahora = new Date();
    let fechaInicio;

    switch (periodo) {
      case 'dia':
        fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
        break;
      case 'semana':
        const diaSemana = ahora.getDay();
        fechaInicio = new Date(ahora);
        fechaInicio.setDate(ahora.getDate() - diaSemana);
        fechaInicio.setHours(0, 0, 0, 0);
        break;
      case 'mes':
        fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        break;
      case 'año':
        fechaInicio = new Date(ahora.getFullYear(), 0, 1);
        break;
      default:
        fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    }

    const fechaInicioStr = fechaInicio.toISOString().split('T')[0];

    // Obtener estadísticas por técnico
    let query = `
      SELECT
        t.id,
        t.nombre,
        t.telefono,
        COUNT(ot.id) as total_ordenes,
        SUM(ot.monto_total) as total_monto,
        SUM(CASE WHEN ot.estado IN ('completada', 'Cerrada') THEN 1 ELSE 0 END) as ordenes_completadas,
        SUM(CASE WHEN ot.estado = 'en_proceso' AND ot.fecha_creacion >= ? THEN 1 ELSE 0 END) as ordenes_en_proceso,
        SUM(CASE WHEN ot.estado = 'Aprobada' AND ot.fecha_creacion >= ? THEN 1 ELSE 0 END) as ordenes_aprobadas,
        AVG(CASE WHEN ot.estado IN ('completada', 'Cerrada') THEN ot.monto_total END) as promedio_monto,
        MAX(ot.fecha_completado) as ultima_orden
      FROM Tecnicos t
      LEFT JOIN OrdenesTrabajo ot ON t.id = ot.tecnico_asignado_id
        AND ot.estado IN ('Aprobada', 'completada', 'en_proceso', 'Cerrada')
      WHERE t.activo = 1
    `;

    const params = [fechaInicioStr, fechaInicioStr];

    if (tecnicoId) {
      query += ' AND t.id = ?';
      params.push(tecnicoId);
    }

    query += ' GROUP BY t.id, t.nombre, t.telefono ORDER BY total_monto DESC, total_ordenes DESC';

    const estadisticas = await env.DB.prepare(query).bind(...params).all();

    // Obtener total general
    const totalGeneral = await env.DB.prepare(`
      SELECT
        COUNT(*) as total_ordenes_sistema,
        SUM(monto_total) as total_monto_sistema,
        AVG(monto_total) as promedio_sistema,
        SUM(CASE WHEN estado IN ('completada', 'Cerrada') THEN 1 ELSE 0 END) as total_completadas_sistema
      FROM OrdenesTrabajo
      WHERE fecha_creacion >= ?
    `).bind(fechaInicioStr).first();

    const estadisticasData = estadisticas.results || estadisticas || [];

    return new Response(JSON.stringify({
      success: true,
      periodo: periodo,
      fecha_inicio: fechaInicioStr,
      estadisticas: estadisticasData,
      total_general: totalGeneral || {
        total_ordenes_sistema: 0,
        total_monto_sistema: 0,
        promedio_sistema: 0,
        total_completadas_sistema: 0
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error al obtener resumen de técnicos:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}