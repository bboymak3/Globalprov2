// ============================================
// API: ÓRDENES DE UN TÉCNICO ESPECÍFICO
// Global Pro Automotriz
// ============================================

export async function onRequestGet(context) {
  const { env, request } = context;

  try {
    const url = new URL(request.url);
    const tecnicoId = url.searchParams.get('tecnico_id');
    const periodo = url.searchParams.get('periodo') || 'mes';

    if (!tecnicoId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'ID de técnico requerido'
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

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

    // Obtener órdenes del técnico
    const ordenes = await env.DB.prepare(`
      SELECT
        ot.id,
        ot.numero_orden,
        ot.patente_placa,
        ot.marca,
        ot.modelo,
        ot.cliente_nombre,
        ot.fecha_creacion,
        ot.fecha_completado,
        ot.estado,
        ot.monto_total,
        ot.monto_abono,
        ot.monto_restante,
        ot.tecnico_asignado_id,
        t.nombre as tecnico_nombre
      FROM OrdenesTrabajo ot
      LEFT JOIN Tecnicos t ON ot.tecnico_asignado_id = t.id
      WHERE ot.tecnico_asignado_id = ?
        AND ot.fecha_creacion >= ?
        AND ot.estado IN ('Aprobada', 'completada', 'en_proceso')
      ORDER BY ot.fecha_creacion DESC
    `).bind(tecnicoId, fechaInicioStr).all();

    // Formatear las órdenes
    const ordenesFormateadas = (ordenes.results || []).map(orden => ({
      ...orden,
      numero_orden_formateado: String(orden.numero_orden).padStart(6, '0'),
      fecha_creacion_formateada: orden.fecha_creacion ?
        new Date(orden.fecha_creacion).toLocaleDateString('es-CL') : 'N/A',
      fecha_completado_formateada: orden.fecha_completado ?
        new Date(orden.fecha_completado).toLocaleDateString('es-CL') : 'N/A'
    }));

    return new Response(JSON.stringify({
      success: true,
      tecnico_id: tecnicoId,
      periodo: periodo,
      fecha_inicio: fechaInicioStr,
      ordenes: ordenesFormateadas
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