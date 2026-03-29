// ============================================
// PÁGINA DE APROBACIÓN DE ORDEN
// Global Pro Automotriz
// Cliente firma y aprueba la orden
// ============================================

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  
  if (!token) {
    return new Response('Enlace inválido. No se proporcionó token.', { status: 400 });
  }
  
  // Obtener orden
  const orden = await env.DB.prepare(`
    SELECT 
      o.*,
      c.nombre as cliente_nombre,
      c.rut as cliente_rut,
      c.telefono as cliente_telefono
    FROM OrdenesTrabajo o
    LEFT JOIN Clientes c ON o.cliente_id = c.id
    WHERE o.token = ?
  `).bind(token).first();
  
  if (!orden) {
    return new Response(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Orden No Encontrada - Global Pro</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-100 flex items-center justify-center min-h-screen p-4">
        <div class="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <div class="text-6xl mb-4">❌</div>
          <h1 class="text-2xl font-bold text-gray-800 mb-2">Orden No Encontrada</h1>
          <p class="text-gray-600">El enlace de la orden no es válido o ha expirado.</p>
          <p class="text-sm text-gray-500 mt-4">Contacte al taller para más información.</p>
        </div>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      status: 404
    });
  }
  
  // Si ya está aprobada
  if (orden.estado === 'Aprobada') {
    return new Response(generarHTMLAprobada(orden), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
  
  // Si ya está cancelada
  if (orden.estado === 'Cancelada') {
    return new Response(generarHTMLCancelada(orden), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
  
  // Generar HTML de aprobación
  return new Response(generarHTMLAprobacion(orden), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

// ============================================
// GENERAR HTML DE APROBACIÓN
// ============================================

function generarHTMLAprobacion(orden) {
  const numeroOrden = String(orden.numero_orden).padStart(6, '0');
  const fecha = orden.fecha_ingreso || 'N/A';
  const hora = orden.hora_ingreso || '';
  const tecnico = orden.recepcionista || 'No especificado';
  const total = (orden.monto_total || 0).toLocaleString('es-CL');
  const abono = (orden.monto_abono || 0).toLocaleString('es-CL');
  const restante = (orden.monto_restante || 0).toLocaleString('es-CL');
  const nombreCliente = orden.cliente_nombre || 'Cliente';
  
  // Construir lista de trabajos seleccionados
  let trabajosHtml = '';
  if (orden.trabajo_frenos) trabajosHtml += `<li class="flex items-start"><span class="text-green-500 mr-2">✓</span><span><strong>Frenos:</strong> ${orden.detalle_frenos || 'Sin detalle'}</span></li>`;
  if (orden.trabajo_luces) trabajosHtml += `<li class="flex items-start"><span class="text-green-500 mr-2">✓</span><span><strong>Luces:</strong> ${orden.detalle_luces || 'Sin detalle'}</span></li>`;
  if (orden.trabajo_tren_delantero) trabajosHtml += `<li class="flex items-start"><span class="text-green-500 mr-2">✓</span><span><strong>Tren Delantero:</strong> ${orden.detalle_tren_delantero || 'Sin detalle'}</span></li>`;
  if (orden.trabajo_correas) trabajosHtml += `<li class="flex items-start"><span class="text-green-500 mr-2">✓</span><span><strong>Correas:</strong> ${orden.detalle_correas || 'Sin detalle'}</span></li>`;
  if (orden.trabajo_componentes) trabajosHtml += `<li class="flex items-start"><span class="text-green-500 mr-2">✓</span><span><strong>Componentes:</strong> ${orden.detalle_componentes || 'Sin detalle'}</span></li>`;
  
  if (!trabajosHtml) trabajosHtml = '<li class="text-gray-500">No hay trabajos seleccionados</li>';
  
  return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Aprobar Orden #${numeroOrden} - Global Pro</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        #sig-canvas {
            touch-action: none;
            background: white;
            border-radius: 10px;
            cursor: crosshair;
        }
        
        .signature-container {
            position: relative;
        }
        
        .btn-clear {
            position: absolute;
            top: 10px;
            right: 10px;
            z-index: 50;
            background: white;
            border: 2px solid #ef4444;
            color: #ef4444;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        
        .work-item {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 8px;
            margin-bottom: 8px;
            border-left: 4px solid #a80000;
        }
    </style>
</head>
<body class="p-4">
    <div class="max-w-2xl mx-auto">
        <!-- Header -->
        <div class="bg-white rounded-t-2xl shadow-2xl overflow-hidden">
            <div class="bg-gradient-to-r from-red-800 to-red-600 p-4 text-center">
                <h1 class="text-white text-2xl font-black">GLOBAL PRO AUTOMOTRIZ</h1>
                <p class="text-red-200 text-sm">ORDEN DE TRABAJO #${numeroOrden}</p>
            </div>
        </div>
        
        <!-- Contenido Principal -->
        <div class="bg-white shadow-2xl p-4 md:p-6">
            <!-- Mensaje Personalizado -->
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
                <p class="text-blue-800">
                    <strong>Estimado/a ${nombreCliente}:</strong>
                </p>
                <p class="text-blue-700 mt-2">
                    Ha recibido una <strong>ORDEN DE TRABAJO</strong> de parte de 
                    <strong>GLOBAL PRO AUTOMOTRIZ</strong>
                </p>
            </div>
            
            <!-- Información de la Orden -->
            <div class="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 class="font-bold text-lg mb-3 text-gray-800">📋 Información de la Orden</h3>
                <div class="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <span class="text-gray-600">N° Orden:</span>
                        <p class="font-bold text-red-700">${numeroOrden}</p>
                    </div>
                    <div>
                        <span class="text-gray-600">Fecha:</span>
                        <p class="font-bold">${fecha} ${hora}</p>
                    </div>
                    <div>
                        <span class="text-gray-600">Técnico:</span>
                        <p class="font-bold">${tecnico}</p>
                    </div>
                    <div>
                        <span class="text-gray-600">Patente:</span>
                        <p class="font-bold text-red-700">${orden.patente_placa}</p>
                    </div>
                </div>
            </div>
            
            <!-- Valores -->
            <div class="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-4 mb-6 text-white">
                <h3 class="font-bold text-lg mb-3">💰 Valores</h3>
                <div class="grid grid-cols-3 gap-3 text-center">
                    <div class="bg-white/20 rounded-lg p-3">
                        <p class="text-xs opacity-80">Total</p>
                        <p class="font-bold text-xl">$${total}</p>
                    </div>
                    <div class="bg-white/20 rounded-lg p-3">
                        <p class="text-xs opacity-80">Abono</p>
                        <p class="font-bold text-xl">$${abono}</p>
                    </div>
                    <div class="bg-white/20 rounded-lg p-3">
                        <p class="text-xs opacity-80">Restante</p>
                        <p class="font-bold text-xl">$${restante}</p>
                    </div>
                </div>
            </div>
            
            <!-- Trabajos Seleccionados -->
            <div class="mb-6">
                <h3 class="font-bold text-lg mb-3 text-gray-800">🔧 Trabajos Seleccionados</h3>
                <ul class="space-y-2 text-sm">
                    ${trabajosHtml}
                </ul>
            </div>
            
            <!-- Datos del Vehículo -->
            <div class="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 class="font-bold text-lg mb-3 text-gray-800">🚗 Datos del Vehículo</h3>
                <div class="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <span class="text-gray-600">Marca/Modelo:</span>
                        <p class="font-bold">${orden.marca || 'N/A'} ${orden.modelo || ''} (${orden.anio || 'N/A'})</p>
                    </div>
                    <div>
                        <span class="text-gray-600">Patente:</span>
                        <p class="font-bold text-red-700">${orden.patente_placa}</p>
                    </div>
                </div>
            </div>
            
            <!-- Checklist -->
            <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <h3 class="font-bold text-lg mb-3 text-gray-800">✅ Checklist del Vehículo</h3>
                <div class="text-sm">
                    <p><strong>Nivel de Combustible:</strong> ${orden.nivel_combustible || 'No registrado'}</p>
                    <p class="mt-2"><strong>Estado de Carrocería:</strong></p>
                    <ul class="mt-1 ml-4">
                        ${orden.check_paragolfe_delantero_der ? '<li>✓ Parachoques delantero derecho</li>' : ''}
                        ${orden.check_puerta_delantera_der ? '<li>✓ Puerta delantera derecha</li>' : ''}
                        ${orden.check_puerta_trasera_der ? '<li>✓ Puerta trasera derecha</li>' : ''}
                        ${orden.check_paragolfe_trasero_izq ? '<li>✓ Parachoques trasero izquierdo</li>' : ''}
                        ${orden.check_otros_carroceria ? `<li>${orden.check_otros_carroceria}</li>` : ''}
                    </ul>
                </div>
            </div>
            
            <!-- Área de Firma -->
            <div class="mb-6">
                <h3 class="font-bold text-lg mb-3 text-gray-800">✍️ Firma para Aprobar</h3>
                <div class="signature-container">
                    <button onclick="limpiarFirma()" class="btn-clear">X Borrar</button>
                    <canvas id="sig-canvas" height="250"></canvas>
                </div>
                <p class="text-sm text-gray-600 mt-2 text-center">
                    Nombre: <strong>${nombreCliente}</strong> | RUT: <strong>${orden.cliente_rut || 'N/A'}</strong>
                </p>
            </div>
            
            <!-- Aviso Legal -->
            <div class="bg-gray-100 rounded-lg p-4 mb-6 text-sm text-gray-700">
                <p class="mb-2"><strong>Al firmar usted autoriza:</strong></p>
                <ul class="list-disc list-inside space-y-1">
                    <li>La intervención del vehículo</li>
                    <li>Pruebas de carretera necesarias</li>
                    <li>La empresa no se responsabiliza por objetos no declarados</li>
                </ul>
            </div>
            
            <!-- Botones de Acción -->
            <div class="grid grid-cols-2 gap-4">
                <button onclick="cancelarOrden()" class="bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 rounded-xl transition transform hover:scale-105">
                    ❌ Cancelar
                </button>
                <button onclick="aprobarOrden()" id="btnAprobar" class="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl transition transform hover:scale-105">
                    ✅ Aceptar y Firmar
                </button>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="bg-white rounded-b-2xl shadow-2xl p-4 text-center text-sm text-gray-600">
            <p>Global Pro Automotriz</p>
            <p class="text-xs">Padre Alberto Hurtado 3596, Pedro Aguirre Cerda</p>
            <p class="text-xs">+56 9 8471 5405 / +56 9 3902 6185</p>
        </div>
    </div>
    
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script>
        const canvas = document.getElementById('sig-canvas');
        const ctx = canvas.getContext('2d');
        let drawing = false;
        const TOKEN = '${token}';
        
        // Ajustar canvas al tamaño del contenedor
        function resizeCanvas() {
            const container = canvas.parentElement;
            const rect = container.getBoundingClientRect();
            canvas.width = rect.width - 24; // Restar padding
            canvas.height = 250;
            
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.strokeStyle = '#000000';
        }
        
        window.onload = resizeCanvas;
        window.onresize = resizeCanvas;
        
        // Funciones de dibujo
        function getPos(e) {
            const rect = canvas.getBoundingClientRect();
            let clientX = e.clientX;
            let clientY = e.clientY;
            
            if (e.touches && e.touches.length > 0) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            }
            
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        }
        
        function startDraw(e) {
            e.preventDefault();
            drawing = true;
            const pos = getPos(e);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
        }
        
        function moveDraw(e) {
            if (!drawing) return;
            e.preventDefault();
            const pos = getPos(e);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        }
        
        function endDraw() {
            drawing = false;
            ctx.beginPath();
        }
        
        // Event listeners para mouse
        canvas.addEventListener('mousedown', startDraw);
        canvas.addEventListener('mousemove', moveDraw);
        canvas.addEventListener('mouseup', endDraw);
        canvas.addEventListener('mouseout', endDraw);
        
        // Event listeners para touch (móvil)
        canvas.addEventListener('touchstart', startDraw, { passive: false });
        canvas.addEventListener('touchmove', moveDraw, { passive: false });
        canvas.addEventListener('touchend', endDraw);
        
        function limpiarFirma() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        
        async function aprobarOrden() {
            // Verificar que haya firma
            const imageData = canvas.toDataURL();
            
            // Verificar si el canvas está vacío (simplificado)
            const blank = document.createElement('canvas');
            blank.width = canvas.width;
            blank.height = canvas.height;
            if (canvas.toDataURL() === blank.toDataURL()) {
                alert('Por favor, firme antes de aceptar la orden.');
                return;
            }
            
            const btn = document.getElementById('btnAprobar');
            btn.innerHTML = 'Procesando...';
            btn.disabled = true;
            
            try {
                const response = await fetch('/api/aprobar-orden', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        token: TOKEN,
                        firma: imageData
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Mostrar pantalla de éxito
                    document.body.innerHTML = generarHTMLExito(data.orden);
                } else {
                    alert('Error al aprobar la orden: ' + data.error);
                    btn.innerHTML = '✅ Aceptar y Firmar';
                    btn.disabled = false;
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error de conexión. Intente nuevamente.');
                btn.innerHTML = '✅ Aceptar y Firmar';
                btn.disabled = false;
            }
        }
        
        async function cancelarOrden() {
            const motivo = prompt('¿Cuál es el motivo de la cancelación? (Opcional)');
            
            if (confirm('¿Está seguro de cancelar esta orden de trabajo?')) {
                try {
                    const response = await fetch('/api/cancelar-orden', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            token: TOKEN,
                            motivo: motivo
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        document.body.innerHTML = generarHTMLCancelada(data.orden);
                    } else {
                        alert('Error al cancelar la orden: ' + data.error);
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('Error de conexión. Intente nuevamente.');
                }
            }
        }
        
        function generarHTMLExito(orden) {
            const numeroOrden = String(orden.numero_orden).padStart(6, '0');
            const link = window.location.href;
            
            return \`
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Orden Aprobada #\${numeroOrden}</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                </head>
                <body class="bg-green-100 flex items-center justify-center min-h-screen p-4">
                    <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                        <div class="text-8xl mb-4">✅</div>
                        <h1 class="text-3xl font-black text-green-700 mb-2">¡Orden Aprobada!</h1>
                        <p class="text-gray-600 mb-6">Su firma ha sido guardada exitosamente.</p>
                        
                        <div class="bg-green-50 rounded-xl p-4 mb-6">
                            <p class="text-sm text-gray-600">Orden N°</p>
                            <p class="text-2xl font-bold text-green-700">\${numeroOrden}</p>
                        </div>
                        
                        <a href="https://wa.me/56939026185?text=\${encodeURIComponent('Hola, he aprobado la orden de trabajo #' + numeroOrden + '. Mi patente es: ' + '${orden.patente_placa}')}" 
                           target="_blank" 
                           class="block w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl mb-3 transition">
                            📱 Enviar Confirmación al Taller
                        </a>
                        
                        <button onclick="descargarPDF()" class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-xl mb-3 transition">
                            📥 Descargar PDF
                        </button>
                        
                        <p class="text-sm text-gray-500 mt-4">Será redirigido en 5 segundos...</p>
                    </div>
                    
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"><\/script>
                    <script>
                        setTimeout(() => {
                            window.location.href = 'https://mecanico247.com/';
                        }, 5000);
                        
                        function descargarPDF() {
                            // Aquí se generaría el PDF
                            alert('PDF descargado');
                        }
                    <\/script>
                </body>
                </html>
            \`;
        }
    </script>
</body>
</html>`;
}

// ============================================
// GENERAR HTML DE ORDEN APROBADA
// ============================================

function generarHTMLAprobada(orden) {
  const numeroOrden = String(orden.numero_orden).padStart(6, '0');
  
  return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Orden Aprobada #${numeroOrden}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-green-100 flex items-center justify-center min-h-screen p-4">
    <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <div class="text-8xl mb-4">✅</div>
        <h1 class="text-3xl font-black text-green-700 mb-2">¡Orden Aprobada!</h1>
        <p class="text-gray-600 mb-4">Esta orden ya fue aprobada y firmada anteriormente.</p>
        
        <div class="bg-green-50 rounded-xl p-4 mb-6">
            <p class="text-sm text-gray-600">Orden N°</p>
            <p class="text-2xl font-bold text-green-700">${numeroOrden}</p>
            <p class="text-xs text-gray-500 mt-2">Fecha de aprobación: ${orden.fecha_aprobacion || 'N/A'}</p>
        </div>
        
        <div class="border-t pt-4">
            <p class="text-sm text-gray-600 mb-2">Firma del cliente:</p>
            ${orden.firma_imagen ? `<img src="${orden.firma_imagen}" alt="Firma" class="mx-auto max-w-xs border rounded-lg">` : '<p class="text-gray-400">Firma no disponible</p>'}
        </div>
        
        <p class="text-sm text-gray-500 mt-6">Si tiene preguntas, contacte al taller.</p>
    </div>
</body>
</html>`;
}

// ============================================
// GENERAR HTML DE ORDEN CANCELADA
// ============================================

function generarHTMLCancelada(orden) {
  const numeroOrden = String(orden.numero_orden).padStart(6, '0');
  const motivo = orden.motivo_cancelacion || 'No especificado';
  
  return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Orden Cancelada #${numeroOrden}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-red-100 flex items-center justify-center min-h-screen p-4">
    <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <div class="text-8xl mb-4">❌</div>
        <h1 class="text-3xl font-black text-red-700 mb-2">Orden Cancelada</h1>
        <p class="text-gray-600 mb-4">Esta orden de trabajo ha sido cancelada.</p>
        
        <div class="bg-red-50 rounded-xl p-4 mb-6">
            <p class="text-sm text-gray-600">Orden N°</p>
            <p class="text-2xl font-bold text-red-700">${numeroOrden}</p>
            <p class="text-xs text-gray-500 mt-2">Fecha de cancelación: ${orden.fecha_cancelacion || 'N/A'}</p>
        </div>
        
        <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <p class="text-sm font-bold text-yellow-800">Motivo:</p>
            <p class="text-sm text-yellow-700">${motivo}</p>
        </div>
        
        <p class="text-sm text-gray-500">Si tiene preguntas, contacte al taller.</p>
    </div>
</body>
</html>`;
}
