// ============================================
// API: REGISTRAR PAGO PARCIAL
// Global Pro Automotriz
// ============================================

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const data = await request.json();

    // Validaciones
    if (!data.orden_id || !data.monto || !data.metodo_pago) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Faltan datos obligatorios: orden_id, monto y metodo_pago'
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    if (data.monto <= 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'El monto debe ser mayor a 0'
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Obtener orden actual
    const orden = await env.DB.prepare(
      "SELECT * FROM OrdenesTrabajo WHERE id = ?"
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

    // Calcular pagos anteriores
    const pagosAnteriores = await env.DB.prepare(
      "SELECT COALESCE(SUM(monto), 0) as total FROM Pagos WHERE orden_id = ?"
    ).bind(data.orden_id).first();

    const totalPagado = (pagosAnteriores?.total || 0) + data.monto;
    const montoRestante = orden.monto_total - totalPagado;

    if (totalPagado > orden.monto_total) {
      return new Response(JSON.stringify({
        success: false,
        error: `El pago excede el monto total. Total: $${orden.monto_total.toLocaleString('es-CL')}, Ya pagado: $${(pagosAnteriores?.total || 0).toLocaleString('es-CL')}`
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Registrar el pago
    const result = await env.DB.prepare(`
      INSERT INTO Pagos (orden_id, monto, metodo_pago, observaciones, registrador)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      data.orden_id,
      data.monto,
      data.metodo_pago,
      data.observaciones || null,
      data.registrador || null
    ).run();

    // Actualizar orden con nuevos montos
    await env.DB.prepare(`
      UPDATE OrdenesTrabajo
      SET monto_abono = ?,
          monto_restante = ?,
          fecha_actualizacion = datetime('now')
      WHERE id = ?
    `).bind(totalPagado, montoRestante, data.orden_id).run();

    // Obtener orden actualizada
    const ordenActualizada = await env.DB.prepare(
      "SELECT * FROM OrdenesTrabajo WHERE id = ?"
    ).bind(data.orden_id).first();

    // Obtener historial de pagos
    const historialPagos = await env.DB.prepare(`
      SELECT * FROM Pagos
      WHERE orden_id = ?
      ORDER BY fecha_pago DESC
    `).bind(data.orden_id).all();

    return new Response(JSON.stringify({
      success: true,
      mensaje: 'Pago registrado exitosamente',
      orden: ordenActualizada,
      pago_id: result.meta.last_row_id,
      total_pagado: totalPagado,
      monto_restante: montoRestante,
      pagado_completamente: montoRestante <= 0,
      historial_pagos: historialPagos.results || historialPagos
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error al registrar pago:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}

// ============================================
// API: OBTENER HISTORIAL DE PAGOS
// ============================================

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const ordenId = url.searchParams.get('orden_id');

  if (!ordenId) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Falta el parámetro orden_id'
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400
    });
  }

  try {
    const pagos = await env.DB.prepare(`
      SELECT * FROM Pagos
      WHERE orden_id = ?
      ORDER BY fecha_pago DESC
    `).bind(ordenId).all();

    return new Response(JSON.stringify({
      success: true,
      pagos: pagos.results || pagos,
      total: pagos.results ? pagos.results.length : pagos.length
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error al obtener pagos:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}
