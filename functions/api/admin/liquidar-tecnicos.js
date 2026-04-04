// ============================================
// API: LIQUIDACIÓN DE TÉCNICOS
// ============================================

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const tecnicoId = url.searchParams.get('tecnico_id');
    const periodo = url.searchParams.get('periodo') || 'mes';
    const valor = url.searchParams.get('valor');

    if (!tecnicoId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Se requiere el ID del técnico'
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    let fechaCondicion = '';
    const params = [tecnicoId];

    if (valor) {
      switch (periodo) {
        case 'dia':
          fechaCondicion = 'AND date(fecha_creacion) = ?';
          params.push(valor);
          break;
        case 'anio':
          fechaCondicion = 'AND strftime("%Y", fecha_creacion) = ?';
          params.push(valor);
          break;
        case 'mes':
        default:
          fechaCondicion = 'AND strftime("%Y-%m", fecha_creacion) = ?';
          params.push(valor);
          break;
      }
    }

    const ordenes = await env.DB.prepare(`
      SELECT
        id,
        numero_orden,
        cliente_nombre,
        direccion,
        fecha_creacion,
        fecha_completado,
        monto_total,
        monto_abono,
        monto_restante,
        estado,
        estado_trabajo
      FROM OrdenesTrabajo
      WHERE tecnico_asignado_id = ?
        AND (estado = 'Aprobada' OR estado_trabajo = 'Cerrada')
      ${fechaCondicion}
      ORDER BY fecha_creacion DESC
    `).bind(...params).all();

    const ordenesList = (ordenes.results || []).map(orden => ({
      ...orden,
      ganancia_tecnico: Math.round(Number(orden.monto_total || 0) * 0.4),
      estado_resumen: orden.estado_trabajo === 'Cerrada' ? 'Cerrada' : (orden.estado || 'N/A')
    }));

    const totalGenerado = ordenesList.reduce((sum, orden) => sum + Number(orden.monto_total || 0), 0);
    const totalTecnico = Math.round(totalGenerado * 0.4);

    return new Response(JSON.stringify({
      success: true,
      tecnico_id: tecnicoId,
      periodo,
      valor: valor || null,
      ordenes: ordenesList,
      totalOt: ordenesList.length,
      totalGenerado,
      totalTecnico
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error al obtener liquidación de técnicos:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}
