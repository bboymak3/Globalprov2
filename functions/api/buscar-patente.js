// ============================================
// API: BUSCAR VEHÍCULO POR PATENTE
// Global Pro Automotriz
// ============================================

export async function onRequestGet(context) {
  const { request, env } = context;
  
  try {
    const url = new URL(request.url);
    const patente = url.searchParams.get('patente');
    
    if (!patente) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Patente no proporcionada' 
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }
    
    // Buscar vehículo y cliente asociado
    const vehiculo = await env.DB.prepare(`
      SELECT v.*, c.nombre as cliente_nombre, c.rut as cliente_rut, c.telefono as cliente_telefono
      FROM Vehiculos v
      LEFT JOIN Clientes c ON v.cliente_id = c.id
      WHERE UPPER(v.patente_placa) = UPPER(?)
    `).bind(patente).first();
    
    if (!vehiculo) {
      return new Response(JSON.stringify({
        success: true,
        vehiculo: null
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Preparar respuesta
    const response = {
      success: true,
      vehiculo: {
        id: vehiculo.id,
        patente_placa: vehiculo.patente_placa,
        marca: vehiculo.marca,
        modelo: vehiculo.modelo,
        anio: vehiculo.anio,
        cilindrada: vehiculo.cilindrada,
        combustible: vehiculo.combustible,
        kilometraje: vehiculo.kilometraje
      },
      cliente: vehiculo.cliente_nombre ? {
        nombre: vehiculo.cliente_nombre,
        rut: vehiculo.cliente_rut,
        telefono: vehiculo.cliente_telefono
      } : null
    };
    
    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error al buscar vehículo:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}
