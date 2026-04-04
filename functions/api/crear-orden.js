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

    // Obtener próximo número de orden
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

    // Función auxiliar para escapar strings
    const escapeSql = (str) => {
      if (str === null || str === undefined || str === '') return 'NULL';
      return "'" + String(str).replace(/'/g, "''").replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\r/g, '\\r') + "'";
    };

    // Insertar orden de trabajo
    const stmt = `INSERT INTO OrdenesTrabajo (numero_orden, token, cliente_id, vehiculo_id, patente_placa, fecha_ingreso, hora_ingreso, recepcionista, marca, modelo, anio, cilindrada, combustible, kilometraje, trabajo_frenos, detalle_frenos, trabajo_luces, detalle_luces, trabajo_tren_delantero, detalle_tren_delantero, trabajo_correas, detalle_correas, trabajo_componentes, detalle_componentes, nivel_combustible, check_paragolfe_delantero_der, check_puerta_delantera_der, check_puerta_trasera_der, check_paragolfe_trasero_izq, check_otros_carroceria, monto_total, monto_abono, monto_restante, metodo_pago, estado, fecha_creacion) VALUES (${nuevoNumero}, '${token}', ${clienteId}, ${vehiculoId}, '${data.patente}', ${escapeSql(data.fecha_ingreso)}, ${escapeSql(data.hora_ingreso)}, ${escapeSql(data.recepcionista)}, ${escapeSql(data.marca)}, ${escapeSql(data.modelo)}, ${data.anio || 'NULL'}, ${escapeSql(data.cilindrada)}, ${escapeSql(data.combustible)}, ${escapeSql(data.kilometraje)}, ${data.trabajo_frenos || 0}, ${escapeSql(data.detalle_frenos)}, ${data.trabajo_luces || 0}, ${escapeSql(data.detalle_luces)}, ${data.trabajo_tren_delantero || 0}, ${escapeSql(data.detalle_tren_delantero)}, ${data.trabajo_correas || 0}, ${escapeSql(data.detalle_correas)}, ${data.trabajo_componentes || 0}, ${escapeSql(data.detalle_componentes)}, ${escapeSql(data.nivel_combustible)}, ${data.check_paragolfe_delantero_der || 0}, ${data.check_puerta_delantera_der || 0}, ${data.check_puerta_trasera_der || 0}, ${data.check_paragolfe_trasero_izq || 0}, ${escapeSql(data.check_otros_carroceria)}, ${data.monto_total || 0}, ${data.monto_abono || 0}, ${data.monto_restante || 0}, ${escapeSql(data.metodo_pago)}, 'Enviada', datetime('now', 'localtime'))`;

    await env.DB.exec(stmt);

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
