// ============================================
// API: GESTIÓN DE TÉCNICOS (ADMIN)
// Global Pro Automotriz
// ============================================

export async function onRequestGet(context) {
  const { env } = context;

  try {
    // Obtener todos los técnicos
    const tecnicos = await env.DB.prepare(`
      SELECT id, nombre, telefono, email, activo, fecha_registro
      FROM Tecnicos
      ORDER BY nombre ASC
    `).all();

    return new Response(JSON.stringify({
      success: true,
      tecnicos: tecnicos.results || []
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error al obtener técnicos:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const data = await request.json();

    if (!data.nombre || !data.telefono || !data.pin) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Faltan datos: nombre, teléfono y PIN'
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Verificar que el teléfono no esté duplicado
    const existe = await env.DB.prepare(
      "SELECT id FROM Tecnicos WHERE telefono = ?"
    ).bind(data.telefono).first();

    if (existe) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Ya existe un técnico con ese teléfono'
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Crear técnico
    await env.DB.prepare(`
      INSERT INTO Tecnicos (nombre, telefono, email, codigo_acceso, activo)
      VALUES (?, ?, ?, ?, 1)
    `).bind(
      data.nombre,
      data.telefono,
      data.email || null,
      data.pin
    ).run();

    return new Response(JSON.stringify({
      success: true,
      mensaje: 'Técnico registrado correctamente'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error al crear técnico:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}
