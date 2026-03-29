// ============================================
// PÃGINA DE APROBACIÃ“N DE ORDEN
// Global Pro Automotriz
// ============================================

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response('Token no proporcionado', { status: 400 });
    }

    // Buscar orden
    const orden = await env.DB.prepare(
      'SELECT o.*, c.nombre as cliente_nombre, c.rut as cliente_rut, c.telefono as cliente_telefono FROM OrdenesTrabajo o LEFT JOIN Clientes c ON o.cliente_id = c.id WHERE o.token = ?'
    ).bind(token).first();

    if (!orden) {
      return new Response(getErrorPage('Orden no encontrada', 'El enlace no es vÃ¡lido'), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    if (orden.estado === 'Aprobada') {
      return new Response(getApprovedPage(orden), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    if (orden.estado === 'Cancelada') {
      return new Response(getCancelledPage(orden), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    return new Response(getApprovalPage(orden, token), {
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(getErrorPage('Error', error.message), {
      headers: { 'Content-Type': 'text/html' },
      status: 500
    });
  }
}

function getErrorPage(title, message) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Error</title></head>
<body style="font-family:Arial,sans-serif;text-align:center;padding:50px;">
<h1 style="color:red;">${title}</h1>
<p>${message}</p>
</body></html>`;
}

function getApprovedPage(orden) {
  const n = String(orden.numero_orden).padStart(6, '0');
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Orden Aprobada #${n}</title>
<script src="https://cdn.tailwindcss.com"><\/script></head>
<body class="bg-green-100 flex items-center justify-center min-h-screen p-4">
<div class="bg-white rounded-xl p-8 text-center max-w-md">
<div class="text-6xl mb-4">âœ…</div>
<h1 class="text-2xl font-bold text-green-700">Â¡Orden Aprobada!</h1>
<p class="mt-4">Orden NÂ° <strong>${n}</strong></p>
<p class="text-sm text-gray-500 mt-2">Fecha: ${orden.fecha_aprobacion || 'N/A'}</p>
${orden.firma_imagen ? '<img src="'+orden.firma_imagen+'" style="max-width:200px;margin-top:20px;">' : ''}
</div></body></html>`;
}

function getCancelledPage(orden) {
  const n = String(orden.numero_orden).padStart(6, '0');
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Orden Cancelada #${n}</title>
<script src="https://cdn.tailwindcss.com"><\/script></head>
<body class="bg-red-100 flex items-center justify-center min-h-screen p-4">
<div class="bg-white rounded-xl p-8 text-center max-w-md">
<div class="text-6xl mb-4">âŒ</div>
<h1 class="text-2xl font-bold text-red-700">Orden Cancelada</h1>
<p class="mt-4">Orden NÂ° <strong>${n}</strong></p>
<p class="text-sm text-gray-500 mt-2">Motivo: ${orden.motivo_cancelacion || 'No especificado'}</p>
</div></body></html>`;
}

function getApprovalPage(orden, token) {
  const n = String(orden.numero_orden).padStart(6, '0');
  const cliente = orden.cliente_nombre || 'Cliente';
  const total = (orden.monto_total || 0).toLocaleString('es-CL');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aprobar Orden #${n}</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    #canvas { touch-action:none; background:white; border:2px solid #ccc; border-radius:10px; cursor:crosshair; }
  </style>
</head>
<body class="bg-gradient-to-br from-blue-500 to-purple-600 min-h-screen p-4">
  <div class="max-w-lg mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
    <div class="bg-red-700 text-white p-4 text-center">
      <h1 class="text-xl font-bold">GLOBAL PRO AUTOMOTRIZ</h1>
      <p class="text-sm">Orden de Trabajo #${n}</p>
    </div>
    <div class="p-6">
      <p class="mb-4 text-lg"><strong>Hola ${cliente},</strong></p>
      <p class="mb-4">Por favor revise y firme esta orden de trabajo.</p>

      <div class="bg-gray-100 p-4 rounded-lg mb-4">
        <p><strong>Patente:</strong> ${orden.patente_placa}</p>
        <p><strong>Total:</strong> $${total}</p>
      </div>

      <div class="mb-4">
        <label class="block font-bold mb-2">âœï¸ Firma aquÃ­:</label>
        <div class="relative">
          <button type="button" onclick="clearCanvas()" class="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded text-sm">Borrar</button>
          <canvas id="canvas" height="200" width="100%"></canvas>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <button onclick="cancelOrder()" class="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg">âŒ Cancelar</button>
        <button onclick="approveOrder()" id="btnApprove" class="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg">âœ… Aceptar y Firmar</button>
      </div>
    </div>
  </div>

  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    const TOKEN = '${token}';

    function resizeCanvas() {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width - 20;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
    }
    window.onload = resizeCanvas;

    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
      return {x, y};
    }

    function startDraw(e) {
      e.preventDefault();
      isDrawing = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }

    function draw(e) {
      if (!isDrawing) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }

    function stopDraw() { isDrawing = false; }

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('touchstart', startDraw, {passive:false});
    canvas.addEventListener('touchmove', draw, {passive:false});
    canvas.addEventListener('touchend', stopDraw);

    function clearCanvas() { ctx.clearRect(0, 0, canvas.width, canvas.height); }

    async function approveOrder() {
      const dataURL = canvas.toDataURL();
      const blank = document.createElement('canvas');
      blank.width = canvas.width;
      blank.height = canvas.height;

      if (canvas.toDataURL() === blank.toDataURL()) {
        alert('Por favor firme antes de aceptar');
        return;
      }

      const btn = document.getElementById('btnApprove');
      btn.disabled = true;
      btn.textContent = 'Procesando...';

      try {
        console.log('Enviando...', {token: TOKEN, len: dataURL.length});
        const res = await fetch('/api/aprobar-orden', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({token: TOKEN, firma: dataURL})
        });
        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Data:', data);

        if (data.success) {
          showSuccess(data.orden);
        } else {
          alert('Error: ' + data.error);
          btn.disabled = false;
          btn.textContent = 'âœ… Aceptar y Firmar';
        }
      } catch (err) {
        console.error('Error:', err);
        alert('Error: ' + err.message);
        btn.disabled = false;
        btn.textContent = 'âœ… Aceptar y Firmar';
      }
    }

    async function cancelOrder() {
      const motivo = prompt('Motivo de cancelaciÃ³n:');
      if (!confirm('Â¿Cancelar esta orden?')) return;

      try {
        const res = await fetch('/api/cancelar-orden', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({token: TOKEN, motivo: motivo})
        });
        const data = await res.json();
        if (data.success) {
          showCancelled(data.orden);
        } else {
          alert('Error: ' + data.error);
        }
      } catch (err) {
        console.error('Error:', err);
        alert('Error de conexiÃ³n');
      }
    }

    function showSuccess(orden) {
      const n = String(orden.numero_orden).padStart(6, '0');
      document.body.innerHTML = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Aprobada</title><script src="https://cdn.tailwindcss.com"><\/script></head><body class="bg-green-100 flex items-center justify-center min-h-screen p-4"><div class="bg-white rounded-xl p-8 text-center"><div class="text-6xl mb-4">âœ…</div><h1 class="text-2xl font-bold text-green-700">Â¡Orden Aprobada!</h1><p class="mt-4">Orden NÂ° <strong>' + n + '</strong></p><p class="mt-2">Patente: <strong>' + orden.patente_placa + '</strong></p><a href="https://wa.me/56939026185?text=' + encodeURIComponent('Hola, aprobÃ© la orden #' + n + '. Patente: ' + orden.patente_placa) + '" target="_blank" class="inline-block mt-4 bg-green-500 text-white px-6 py-3 rounded-lg">ðŸ“± WhatsApp</a><button onclick="window.close()" class="block mt-3 mx-auto bg-blue-500 text-white px-6 py-3 rounded-lg">Cerrar</button></div></body></html>';
    }

    function showCancelled(orden) {
      const n = String(orden.numero_orden).padStart(6, '0');
      document.body.innerHTML = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Cancelada</title><script src="https://cdn.tailwindcss.com"><\/script></head><body class="bg-red-100 flex items-center justify-center min-h-screen p-4"><div class="bg-white rounded-xl p-8 text-center"><div class="text-6xl mb-4">âŒ</div><h1 class="text-2xl font-bold text-red-700">Orden Cancelada</h1><p class="mt-4">Orden NÂ° <strong>' + n + '</strong></p></div></body></html>';
    }
  <\/script>
</body>
</html>`;
}