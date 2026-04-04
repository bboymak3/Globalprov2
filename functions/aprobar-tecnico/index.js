export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const notas = url.searchParams.get('notas');
  const pagoCompletado = url.searchParams.get('pago_completado') === 'true';
  const metodoPago = url.searchParams.get('metodo_pago');

  if (!token) {
    return new Response('Token no proporcionado', { status: 400 });
  }

  try {
    // Buscar orden por el token
    const orden = await env.DB.prepare(`
      SELECT
        o.*,
        c.nombre as cliente_nombre,
        c.telefono as cliente_telefono,
        c.rut as cliente_rut,
        t.nombre as tecnico_nombre
      FROM OrdenesTrabajo o
      LEFT JOIN Clientes c ON o.cliente_id = c.id
      LEFT JOIN Tecnicos t ON o.tecnico_asignado_id = t.id
      WHERE o.token_firma_tecnico = ?
    `).bind(token).first();

    if (!orden) {
      return getHTMLResponse('Token Inválido', 'El link de firma no es válido o ha expirado.', false);
    }

    const numeroFormateado = String(orden.numero_orden).padStart(6, '0');
    const tieneFirma = !!orden.firma_imagen;

    // Generar HTML con la información adicional
    const html = getApprovalPage(orden, numeroFormateado, token, tieneFirma, notas, pagoCompletado, metodoPago);

    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });

  } catch (error) {
    console.error('Error en aprobación de técnico:', error);
    return new Response('Error interno del servidor', { status: 500 });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const notas = url.searchParams.get('notas');
  const pagoCompletado = url.searchParams.get('pago_completado') === 'true';
  const metodoPago = url.searchParams.get('metodo_pago');

  if (!token) {
    return new Response(JSON.stringify({ success: false, error: 'Token no proporcionado' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400
    });
  }

  try {
    const data = await request.json();
    const firma = data.firma;

    if (!firma) {
      return new Response(JSON.stringify({ success: false, error: 'Firma no proporcionada' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Buscar orden y verificar token
    const orden = await env.DB.prepare(
      "SELECT id, estado, estado_trabajo, cliente_telefono, notas FROM OrdenesTrabajo WHERE token_firma_tecnico = ?"
    ).bind(token).first();

    if (!orden) {
      return new Response(JSON.stringify({ success: false, error: 'Orden no encontrada' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 404
      });
    }

    const esPrimeraVez = !orden.firma_imagen;

    // Aplicar notas de cierre si existen
    let notasActualizadas = orden.notas || '';
    if (notas) {
      notasActualizadas = notasActualizadas ? `${notasActualizadas}\nCierre: ${notas}` : `Cierre: ${notas}`;
    }

    // Guardar firma y cerrar la orden
    await env.DB.prepare(`
      UPDATE OrdenesTrabajo
      SET firma_imagen = ?, estado = 'Aprobada', estado_trabajo = 'Cerrada',
          fecha_aprobacion = datetime('now'), fecha_completado = datetime('now'),
          notas = ?, pagado = ?, metodo_pago = ?
      WHERE id = ?
    `).bind(firma, notasActualizadas, pagoCompletado ? 1 : 0, metodoPago || null, orden.id).run();

    // Registrar en seguimiento
    await env.DB.prepare(`
      INSERT INTO SeguimientoTrabajo (orden_id, tecnico_id, estado_anterior, estado_nuevo, observaciones)
      VALUES (?, (SELECT tecnico_asignado_id FROM OrdenesTrabajo WHERE id = ?), ?, ?, ?)
    `).bind(
      orden.id,
      orden.id,
      orden.estado_trabajo,
      'Cerrada',
      `Firma del cliente y cierre final. ${notas ? 'Notas: ' + notas : ''}`
    ).run();

    // Si es la primera vez que firma, enviar notificación
    if (esPrimeraVez) {
      console.log('PRIMERA FIRMA - Enviando notificación con PDF a:', orden.cliente_telefono);
      // Aquí se implementaría el envío automático del PDF por WhatsApp/Email
    }

    return new Response(JSON.stringify({
      success: true,
      es_primera_vez: esPrimeraVez,
      mensaje: 'Orden aceptada y cerrada correctamente'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error al aprobar orden:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}

function getHTMLResponse(titulo, mensaje, esExito) {
  const color = esExito ? '#28a745' : '#dc3545';
  const icono = esExito ? '✓' : '✗';

  const html = '' +
    '<!DOCTYPE html>' +
    '<html lang="es">' +
    '<head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>' + titulo + '</title>' +
    '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">' +
    '<style>' +
    'body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }' +
    '.card { border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-width: 500px; width: 90%; }' +
    '</style>' +
    '</head>' +
    '<body>' +
    '<div class="card">' +
    '<div class="card-body text-center py-5">' +
    '<div style="font-size: 5rem; color: ' + color + ';">' + icono + '</div>' +
    '<h3 class="mt-4">' + titulo + '</h3>' +
    '<p class="text-muted">' + mensaje + '</p>' +
    '</div>' +
    '</div>' +
    '</body>' +
    '</html>';

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

function getApprovalPage(orden, numeroFormateado, token, tieneFirma, notas = null, pagoCompletado = null, metodoPago = null) {
  const estadoClass = obtenerClaseEstado(orden.estado_trabajo);

  // Construir HTML de trabajos
  let trabajosHtml = '';
  if (orden.trabajo_frenos) trabajosHtml += '<li><strong>Frenos:</strong> ' + (orden.detalle_frenos || 'Sin detalle') + '</li>';
  if (orden.trabajo_luces) trabajosHtml += '<li><strong>Luces:</strong> ' + (orden.detalle_luces || 'Sin detalle') + '</li>';
  if (orden.trabajo_tren_delantero) trabajosHtml += '<li><strong>Tren Delantero:</strong> ' + (orden.detalle_tren_delantero || 'Sin detalle') + '</li>';
  if (orden.trabajo_correas) trabajosHtml += '<li><strong>Correas:</strong> ' + (orden.detalle_correas || 'Sin detalle') + '</li>';
  if (orden.trabajo_componentes) trabajosHtml += '<li><strong>Componentes:</strong> ' + (orden.detalle_componentes || 'Sin detalle') + '</li>';

  if (!trabajosHtml) trabajosHtml = '<li>No hay trabajos seleccionados</li>';

  let contenidoPrincipal = '';

  let firmaCerradaHtml = '';
  if (orden.firma_imagen) {
    firmaCerradaHtml = '' +
      '<div class="card mb-4">' +
      '<div class="card-header bg-light">' +
      '<h6 class="mb-0"><i class="fas fa-signature me-2"></i>Firma del Cliente</h6>' +
      '</div>' +
      '<div class="card-body text-center">' +
      '<img src="' + orden.firma_imagen + '" alt="Firma del cliente" style="max-width: 100%; max-height: 260px; border: 1px solid #ddd; border-radius: 10px;" />' +
      '</div>' +
      '</div>';
  }

  if (orden.estado_trabajo === 'Cerrada') {
    contenidoPrincipal = '' +
      '<div class="text-center py-5">' +
      '<div style="font-size: 5rem; color: #28a745;">✓</div>' +
      '<h3 class="mt-4">¡Orden Cerrada!</h3>' +
      '<p class="lead">Esta orden ya ha sido firmada y cerrada.</p>' +
      '<p class="text-muted">Número de Orden: ' + numeroFormateado + '</p>' +
      firmaCerradaHtml +
      '<p class="mt-4">' +
      '<a href="/ver-ot?token=' + token + '" class="text-decoration-none fw-bold">' +
      '<i class="fas fa-file-pdf me-2"></i>Ir a la OT para descargar el PDF</a>' +
      '</p>' +
      '</div>';
  } else {
    contenidoPrincipal = '' +
      '<div class="alert alert-info">' +
      '<h5><i class="fas fa-info-circle me-2"></i>Información Importante</h5>' +
      '<p>Por favor revise detalladamente la orden de trabajo antes de firmar. ' +
      'Al firmar, usted autoriza los trabajos indicados y sus montos.</p>' +
      '</div>' +
      '<div class="card mb-4">' +
      '<div class="card-header">' +
      '<h6 class="mb-0"><i class="fas fa-signature me-2"></i>Firma del Cliente</h6>' +
      '</div>' +
      '<div class="card-body">' +
      '<p class="text-muted">Utilice el mouse o toque la pantalla para firmar en el área a continuación:</p>' +
      '<canvas id="firma-canvas" style="width: 100%; height: 200px; border: 2px dashed #ccc; border-radius: 10px;"></canvas>' +
      '<button class="btn btn-outline-secondary btn-sm w-100 mt-2" onclick="limpiarFirma()">' +
      '<i class="fas fa-eraser me-2"></i>Limpiar Firma' +
      '</button>' +
      '</div>' +
      '</div>' +
      '<div class="d-grid gap-2">' +
      '<button class="btn btn-success btn-lg" onclick="guardarFirma()">' +
      '<i class="fas fa-check-circle me-2"></i>Aprobar y Firmar Orden' +
      '</button>' +
      '</div>';
  }

  const html = '' +
    '<!DOCTYPE html>' +
    '<html lang="es">' +
    '<head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>Orden de Trabajo #' + numeroFormateado + ' - Global Pro Automotriz</title>' +
    '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">' +
    '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">' +
    '<style>' +
    'body { background: #f5f5f5; }' +
    '.signature-canvas { touch-action: none; background: white; }' +
    '.orden-card { box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-radius: 15px; margin-bottom: 20px; }' +
    '</style>' +
    '</head>' +
    '<body>' +
    '<nav class="navbar navbar-dark" style="background: #a80000;">' +
    '<div class="container">' +
    '<a class="navbar-brand fw-bold" href="#">' +
    '<i class="fas fa-wrench me-2"></i>GLOBAL PRO AUTOMOTRIZ' +
    '</a>' +
    '</div>' +
    '</nav>' +
    '<div class="container py-4">' +
    '<div class="orden-card card">' +
    '<div class="card-header bg-danger text-white">' +
    '<h5 class="mb-0"><i class="fas fa-file-alt me-2"></i>ORDEN DE TRABAJO #' + numeroFormateado + '</h5>' +
    '</div>' +
    '<div class="card-body">' +
    '<div class="row mb-4">' +
    '<div class="col-md-6">' +
    '<h6 class="fw-bold">DATOS DEL CLIENTE</h6>' +
    '<p><strong>Nombre:</strong> ' + (orden.cliente_nombre || 'N/A') + '</p>' +
    '<p><strong>RUT:</strong> ' + (orden.cliente_rut || 'N/A') + '</p>' +
    '<p><strong>Técnico:</strong> ' + (orden.tecnico_nombre || 'N/A') + '</p>' +
    '</div>' +
    '<div class="col-md-6">' +
    '<h6 class="fw-bold">DATOS DEL VEHÍCULO</h6>' +
    '<p><strong>Patente:</strong> ' + (orden.patente_placa || 'N/A') + '</p>' +
    '<p><strong>Marca/Modelo:</strong> ' + (orden.marca || '') + ' ' + (orden.modelo || '') + ' (' + (orden.anio || 'N/A') + ')</p>' +
    '<p><strong>Estado:</strong> <span class="badge ' + estadoClass + '">' + (orden.estado_trabajo || 'N/A') + '</span></p>' +
    '</div>' +
    '</div>' +
    '<hr>' +
    '<h6 class="fw-bold">TRABAJOS A REALIZAR</h6>' +
    '<ul>' + trabajosHtml + '</ul>' +
    '<hr>' +
    '<h6 class="fw-bold">VALORES</h6>' +
    '<p><strong>Total:</strong> $' + ((orden.monto_total || 0).toLocaleString('es-CL')) + '</p>' +
    '<p><strong>Abono:</strong> $' + ((orden.monto_abono || 0).toLocaleString('es-CL')) + '</p>' +
    '<p><strong>Restante:</strong> $' + ((orden.monto_restante || 0).toLocaleString('es-CL')) + '</p>' +
    (notas ? '<hr><h6 class="fw-bold">NOTAS DEL TÉCNICO</h6><p>' + notas.replace(/\n/g, '<br>') + '</p>' : '') +
    (pagoCompletado !== null ? '<hr><h6 class="fw-bold">PAGO</h6><p>' + (pagoCompletado ? 'Pago completado' : 'Pago pendiente') + (metodoPago ? ' (' + metodoPago + ')' : '') + '</p>' : '') +
    '</div>' +
    '</div>' +
    contenidoPrincipal +
    '</div>' +
    '<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>' +
    '<script>' +
    'let canvas, ctx, drawing = false;' +
    '' +
    'document.addEventListener("DOMContentLoaded", function() {' +
    'canvas = document.getElementById("firma-canvas");' +
    'if (canvas) {' +
    'const rect = canvas.getBoundingClientRect();' +
    'canvas.width = rect.width;' +
    'canvas.height = 200;' +
    'ctx = canvas.getContext("2d");' +
    'ctx.strokeStyle = "#000";' +
    'ctx.lineWidth = 2;' +
    'ctx.lineCap = "round";' +
    '' +
    'canvas.addEventListener("mousedown", startDrawing);' +
    'canvas.addEventListener("mousemove", draw);' +
    'canvas.addEventListener("mouseup", stopDrawing);' +
    'canvas.addEventListener("mouseout", stopDrawing);' +
    'canvas.addEventListener("touchstart", function(e) { e.preventDefault(); startDrawing(e.touches[0]); });' +
    'canvas.addEventListener("touchmove", function(e) { e.preventDefault(); draw(e.touches[0]); });' +
    'canvas.addEventListener("touchend", stopDrawing);' +
    '}' +
    '});' +
    '' +
    'function startDrawing(e) {' +
    'drawing = true;' +
    'ctx.beginPath();' +
    'const rect = canvas.getBoundingClientRect();' +
    'const x = e.clientX || e.pageX;' +
    'const y = e.clientY || e.pageY;' +
    'ctx.moveTo(x - rect.left, y - rect.top);' +
    '}' +
    '' +
    'function draw(e) {' +
    'if (!drawing) return;' +
    'const rect = canvas.getBoundingClientRect();' +
    'const x = e.clientX || e.pageX;' +
    'const y = e.clientY || e.pageY;' +
    'ctx.lineTo(x - rect.left, y - rect.top);' +
    'ctx.stroke();' +
    '}' +
    '' +
    'function stopDrawing() { drawing = false; }' +
    '' +
    'function limpiarFirma() {' +
    'ctx.clearRect(0, 0, canvas.width, canvas.height);' +
    '}' +
    '' +
    'async function guardarFirma() {' +
    'const blank = document.createElement("canvas");' +
    'blank.width = canvas.width;' +
    'blank.height = canvas.height;' +
    '' +
    'if (canvas.toDataURL() === blank.toDataURL()) {' +
    'alert("Por favor, firme en el área designada");' +
    'return;' +
    '}' +
    '' +
    'const firmaData = canvas.toDataURL("image/png");' +
    '' +
    'try {' +
    'const response = await fetch(window.location.href, {' +
    'method: "POST",' +
    'headers: { "Content-Type": "application/json" },' +
    'body: JSON.stringify({ firma: firmaData })' +
    '});' +
    '' +
    'const data = await response.json();' +
    '' +
    'if (data.success) {' +
    'if (data.es_primera_vez) {' +
    'alert("¡Orden aprobada! Se ha enviado una copia del PDF a su correo/WhatsApp.");' +
    '} else {' +
    'alert("¡Orden aprobada correctamente!");' +
    '}' +
    'window.location.reload();' +
    '} else {' +
    'alert("Error: " + data.error);' +
    '}' +
    '} catch (error) {' +
    'console.error("Error:", error);' +
    'alert("Error al guardar la firma. Por favor, intente nuevamente.");' +
    '}' +
    '}' +
    '</script>' +
    '</body>' +
    '</html>';

  return html;
}

function obtenerClaseEstado(estado) {
  const clases = {
    'Pendiente Visita': 'bg-warning',
    'En Sitio': 'bg-info',
    'En Progreso': 'bg-primary',
    'Pendiente Piezas': 'bg-secondary',
    'Completada': 'bg-success',
    'Aprobada': 'bg-success',
    'No Completada': 'bg-danger'
  };
  return clases[estado] || 'bg-secondary';
}
