// ============================================
// API: CREAR ORDEN DE TRABAJO
// Global Pro Automotriz
// ============================================

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const data = await request.json();
    
    // Validaciones básicas
    if (!data.patente || !data.cliente || !data.telefono) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Faltan datos obligatorios: patente, cliente y teléfono' 
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }
    
    // Obtener próximo número de orden (transacción)
    const configResult = await env.DB.prepare(
      "SELECT ultimo_numero_orden FROM Configuracion WHERE id = 1"
    ).first();
    
    const ultimoNumero = configResult?.ultimo_numero_orden || 57;
    const nuevoNumero = ultimoNumero + 1;
    
    // Generar token único
    const token = crypto.randomUUID();
    
    // Crear o actualizar cliente
    let cliente = await env.DB.prepare(
      "SELECT id FROM Clientes WHERE nombre = ? AND telefono = ?"
    ).bind(data.cliente, data.telefono).first();
    
    let clienteId;
    if (cliente) {
      clienteId = cliente.id;
      // Actualizar RUT si se proporcionó
      if (data.rut) {
        await env.DB.prepare(
          "UPDATE Clientes SET rut = ? WHERE id = ?"
        ).bind(data.rut, clienteId).run();
      }
    } else {
      const result = await env.DB.prepare(
        "INSERT INTO Clientes (nombre, rut, telefono) VALUES (?, ?, ?)"
      ).bind(data.cliente, data.rut || null, data.telefono).run();
      clienteId = result.meta.last_row_id;
    }
    
    // Buscar o crear vehículo
    let vehiculo = await env.DB.prepare(
      "SELECT id FROM Vehiculos WHERE patente_placa = ?"
    ).bind(data.patente).first();
    
    let vehiculoId;
    if (vehiculo) {
      vehiculoId = vehiculo.id;
      // Actualizar datos del vehículo
      await env.DB.prepare(`
        UPDATE Vehiculos 
        SET marca = ?, modelo = ?, anio = ?, cilindrada = ?, 
            combustible = ?, kilometraje = ?, cliente_id = ?
        WHERE id = ?
      `).bind(
        data.marca || null,
        data.modelo || null,
        data.anio || null,
        data.cilindrada || null,
        data.combustible || null,
        data.kilometraje || null,
        clienteId,
        vehiculoId
      ).run();
    } else {
      const result = await env.DB.prepare(`
        INSERT INTO Vehiculos (cliente_id, patente_placa, marca, modelo, anio, 
                              cilindrada, combustible, kilometraje)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        clienteId,
        data.patente,
        data.marca || null,
        data.modelo || null,
        data.anio || null,
        data.cilindrada || null,
        data.combustible || null,
        data.kilometraje || null
      ).run();
      vehiculoId = result.meta.last_row_id;
    }
    
    // Insertar orden de trabajo
    await env.DB.prepare(`
      INSERT INTO OrdenesTrabajo (
        numero_orden, token, cliente_id, vehiculo_id, patente_placa,
        fecha_ingreso, hora_ingreso, recepcionista,
        marca, modelo, anio, cilindrada, combustible, kilometraje,
        trabajo_frenos, detalle_frenos,
        trabajo_luces, detalle_luces,
        trabajo_tren_delantero, detalle_tren_delantero,
        trabajo_correas, detalle_correas,
        trabajo_componentes, detalle_componentes,
        nivel_combustible,
        check_paragolfe_delantero_der, check_puerta_delantera_der,
        check_puerta_trasera_der, check_paragolfe_trasero_izq, check_otros_carroceria,
        monto_total, monto_abono, monto_restante, metodo_pago,
        estado, fecha_creacion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Enviada', datetime('now'))
    `).bind(
      nuevoNumero,
      token,
      clienteId,
      vehiculoId,
      data.patente,
      data.fecha_ingreso,
      data.hora_ingreso || null,
      data.recepcionista || null,
      data.marca || null,
      data.modelo || null,
      data.anio || null,
      data.cilindrada || null,
      data.combustible || null,
      data.kilometraje || null,
      data.trabajo_frenos || 0,
      data.detalle_frenos || null,
      data.trabajo_luces || 0,
      data.detalle_luces || null,
      data.trabajo_tren_delantero || 0,
      data.detalle_tren_delantero || null,
      data.trabajo_correas || 0,
      data.detalle_correas || null,
      data.trabajo_componentes || 0,
      data.detalle_componentes || null,
      data.nivel_combustible || null,
      data.check_paragolfe_delantero_der || 0,
      data.check_puerta_delantera_der || 0,
      data.check_puerta_trasera_der || 0,
      data.check_paragolfe_trasero_izq || 0,
      data.check_otros_carroceria || null,
      data.monto_total || 0,
      data.monto_abono || 0,
      data.monto_restante || 0,
      data.metodo_pago || null
    ).run();
    
    // Actualizar número de orden en configuración
    await env.DB.prepare(
      "UPDATE Configuracion SET ultimo_numero_orden = ? WHERE id = 1"
    ).bind(nuevoNumero).run();
    
    return new Response(JSON.stringify({
      success: true,
      numero_orden: nuevoNumero,
      token: token
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error al crear orden:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}
