// ============================================
// API: LOGIN DE TÉCNICOS
// Global Pro Automotriz
// ============================================

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const data = await request.json();

    if (!data.telefono || !data.pin) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Faltan datos: teléfono y PIN'
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Buscar técnico
    const tecnico = await env.DB.prepare(
      "SELECT id, nombre, telefono, email FROM Tecnicos WHERE telefono = ? AND codigo_acceso = ? AND activo = 1"
    ).bind(data.telefono, data.pin).first();

    if (!tecnico) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Credenciales incorrectas o técnico inactivo'
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 401
      });
    }

    return new Response(JSON.stringify({
      success: true,
      tecnico: tecnico
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error en login de técnico:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}
