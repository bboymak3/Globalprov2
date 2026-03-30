// ============================================
// PÁGINA DE APROBACIÓN DE ORDEN
// Global Pro Automotriz
// ============================================

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response(getErrorPage('Token no proporcionado', 'No se proporcionó un token válido'), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // Buscar orden
    const orden = await env.DB.prepare(
      'SELECT o.*, c.nombre as cliente_nombre, c.rut as cliente_rut, c.telefono as cliente_telefono FROM OrdenesTrabajo o LEFT JOIN Clientes c ON o.cliente_id = c.id WHERE o.token = ?'
    ).bind(token).first();

    if (!orden) {
      return new Response(getErrorPage('Orden no encontrada', 'El enlace no es válido o ha expirado'), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    if (orden.estado === 'Aprobada') {
      return new Response(getApprovedPage(orden), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    if (orden.estado === 'Cancelada') {
      return new Response(getCancelledPage(orden), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    return new Response(getApprovalPage(orden, token), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });

  } catch (error) {
    console.error('Error en /aprobar:', error);
    return new Response(getErrorPage('Error del servidor', error.message), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      status: 500
    });
  }
}

function getErrorPage(title, message) {
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Error</title></head><body style="font-family:Arial,sans-serif;text-align:center;padding:50px;background:#f3f4f6;"><h1 style="color:#dc2626;">' + title + '</h1><p style="color:#4b5563;">' + message + '</p></body></html>';
}

function getApprovedPage(orden) {
  const n = String(orden.numero_orden).padStart(6, '0');
  const firmaImg = orden.firma_imagen ? '<img src="' + orden.firma_imagen + '" alt="Firma del cliente" style="max-width: 300px; border: 1px solid #ddd; border-radius: 5px;">' : '';

  // Datos para el PDF
  const cliente = orden.cliente_nombre || 'Cliente';
  const patente = orden.patente_placa || 'N/A';
  const marca = orden.marca || 'N/A';
  const modelo = orden.modelo || 'N/A';
  const trabajos = [];
  if (orden.trabajo_frenos) trabajos.push('Frenos: ' + (orden.detalle_frenos || 'Sin detalle'));
  if (orden.trabajo_luces) trabajos.push('Luces: ' + (orden.detalle_luces || 'Sin detalle'));
  if (orden.trabajo_tren_delantero) trabajos.push('Tren Delantero: ' + (orden.detalle_tren_delantero || 'Sin detalle'));
  if (orden.trabajo_correas) trabajos.push('Correas: ' + (orden.detalle_correas || 'Sin detalle'));
  if (orden.trabajo_componentes) trabajos.push('Componentes: ' + (orden.detalle_componentes || 'Sin detalle'));
  const trabajosStr = trabajos.join('; ') || 'No hay trabajos seleccionados';
  const total = (orden.monto_total || 0).toLocaleString('es-CL');
  const abono = (orden.monto_abono || 0).toLocaleString('es-CL');
  const restante = (orden.monto_restante || 0).toLocaleString('es-CL');

  return '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Orden Aprobada #' + n + ' - Global Pro Automotriz</title><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"><style>@media print { .no-print { display: none !important; } .print-only { display: block !important; } body { background: white !important; } } body { background: #f5f5f5; } .ot-card { box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-radius: 15px; margin-bottom: 20px; }</style></head><body><nav class="navbar navbar-dark no-print" style="background: #a80000;"><div class="container"><a class="navbar-brand fw-bold" href="#"><i class="fas fa-wrench me-2"></i>GLOBAL PRO AUTOMOTRIZ</a></div></nav><div class="container py-4"><div class="d-flex justify-content-between align-items-center mb-4 no-print"><h2 class="mb-0">Orden Aprobada #' + n + '</h2><div class="d-flex gap-2"><button class="btn btn-primary" onclick="descargarPDF()"><i class="fas fa-download me-2"></i>Descargar PDF</button><button class="btn btn-secondary" onclick="verPDFEnLinea()"><i class="fas fa-eye me-2"></i>Ver en Línea</button></div></div><div class="ot-card card"><div class="card-header bg-success text-white"><h5 class="mb-0"><i class="fas fa-check-circle me-2"></i>ORDEN APROBADA #' + n + '</h5></div><div class="card-body"><div class="alert alert-success text-center"><h4 class="alert-heading">¡Orden Aprobada!</h4><p>Su firma ha sido guardada exitosamente.</p><hr><p class="mb-0">Fecha de aprobación: ' + (orden.fecha_aprobacion || 'N/A') + '</p></div>' + (firmaImg ? '<div class="text-center mt-4 p-4 bg-light rounded"><h6 class="fw-bold"><i class="fas fa-signature me-2"></i>Firma del Cliente</h6>' + firmaImg + '</div>' : '') + '<div class="row mt-4"><div class="col-md-6"><h6 class="fw-bold text-danger">DATOS DEL CLIENTE</h6><p><strong>Nombre:</strong> ' + cliente + '</p><p><strong>Fecha Ingreso:</strong> ' + (orden.fecha_ingreso || 'N/A') + '</p></div><div class="col-md-6"><h6 class="fw-bold text-danger">DATOS DEL VEHÍCULO</h6><p><strong>Patente:</strong> <span style="font-size: 1.2rem; font-weight: bold; color: #a80000;">' + patente + '</span></p><p><strong>Marca/Modelo:</strong> ' + marca + ' ' + modelo + '</p></div></div><div class="row mt-3"><div class="col-md-6"><h6 class="fw-bold text-danger">TRABAJOS REALIZADOS</h6><p>' + trabajosStr + '</p></div><div class="col-md-6"><h6 class="fw-bold text-danger">VALORES</h6><div class="row text-center"><div class="col-4"><div class="p-3 bg-light rounded"><small class="text-muted">Total</small><div class="h5">$' + total + '</div></div></div><div class="col-4"><div class="p-3 bg-light rounded"><small class="text-muted">Abono</small><div class="h5">$' + abono + '</div></div></div><div class="col-4"><div class="p-3 bg-light rounded"><small class="text-muted">Restante</small><div class="h5">$' + restante + '</div></div></div></div></div></div></div></div><footer class="text-center py-3 text-muted no-print"><small>Generado el ' + new Date().toLocaleString('es-CL') + '</small></footer><script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script><script>const ordenData = ' + JSON.stringify(orden) + '; function descargarPDF() { const { jsPDF } = window.jspdf; const doc = new jsPDF("p", "mm", "a4"); const numeroFormateado = "' + n + '"; doc.setFontSize(20); doc.text("ORDEN APROBADA", 105, 20, { align: "center" }); doc.setFontSize(16); doc.text("Global Pro Automotriz", 105, 30, { align: "center" }); doc.setFontSize(12); doc.text("N° " + numeroFormateado, 20, 50); doc.text("Cliente: ' + cliente + '", 20, 60); doc.text("Patente: ' + patente + '", 20, 70); doc.text("Vehículo: ' + marca + ' ' + modelo + '", 20, 80); doc.text("Trabajos: ' + trabajosStr + '", 20, 90); doc.text("Total: $' + total + '", 20, 100); doc.text("Abono: $' + abono + '", 20, 110); doc.text("Restante: $' + restante + '", 20, 120); doc.save("OT-" + numeroFormateado + "-" + (ordenData.patente_placa || "N/A") + ".pdf"); } function verPDFEnLinea() { const { jsPDF } = window.jspdf; const doc = new jsPDF("p", "mm", "a4"); doc.setFontSize(20); doc.text("ORDEN APROBADA", 105, 20, { align: "center" }); doc.setFontSize(16); doc.text("Global Pro Automotriz", 105, 30, { align: "center" }); doc.setFontSize(12); doc.text("N° " + numeroFormateado, 20, 50); doc.text("Cliente: ' + cliente + '", 20, 60); doc.text("Patente: ' + patente + '", 20, 70); doc.text("Vehículo: ' + marca + ' ' + modelo + '", 20, 80); doc.text("Trabajos: ' + trabajosStr + '", 20, 90); doc.text("Total: $' + total + '", 20, 100); doc.text("Abono: $' + abono + '", 20, 110); doc.text("Restante: $' + restante + '", 20, 120); const pdfBlob = doc.output("blob"); const pdfUrl = URL.createObjectURL(pdfBlob); window.open(pdfUrl, "_blank"); }</script></body></html>';
}

function getCancelledPage(orden) {
  const n = String(orden.numero_orden).padStart(6, '0');
  const motivo = orden.motivo_cancelacion || 'No especificado';
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Orden Cancelada</title><script src="https://cdn.tailwindcss.com"><\/script></head><body class="bg-red-100 flex items-center justify-center min-h-screen p-4"><div class="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md"><div class="text-8xl mb-4">❌</div><h1 class="text-3xl font-black text-red-700 mb-2">Orden Cancelada</h1><p class="text-gray-600 mb-4">Esta orden de trabajo ha sido cancelada.</p><div class="bg-red-50 rounded-xl p-4 mb-6"><p class="text-sm text-gray-600">Orden N°</p><p class="text-2xl font-bold text-red-700">' + n + '</p><p class="text-xs text-gray-500 mt-2">Fecha: ' + (orden.fecha_cancelacion || 'N/A') + '</p></div><div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6"><p class="text-sm font-bold text-yellow-800">Motivo:</p><p class="text-sm text-yellow-700">' + motivo + '</p></div></div></body></html>';
}

function getApprovalPage(orden, token) {
  const n = String(orden.numero_orden).padStart(6, '0');
  const cliente = orden.cliente_nombre || 'Cliente';
  const total = (orden.monto_total || 0).toLocaleString('es-CL');
  const abono = (orden.monto_abono || 0).toLocaleString('es-CL');
  const restante = (orden.monto_restante || 0).toLocaleString('es-CL');

  // Construir lista de trabajos
  var trabajos = [];
  if (orden.trabajo_frenos) trabajos.push('<li><strong>Frenos:</strong> ' + (orden.detalle_frenos || 'Sin detalle') + '</li>');
  if (orden.trabajo_luces) trabajos.push('<li><strong>Luces:</strong> ' + (orden.detalle_luces || 'Sin detalle') + '</li>');
  if (orden.trabajo_tren_delantero) trabajos.push('<li><strong>Tren Delantero:</strong> ' + (orden.detalle_tren_delantero || 'Sin detalle') + '</li>');
  if (orden.trabajo_correas) trabajos.push('<li><strong>Correas:</strong> ' + (orden.detalle_correas || 'Sin detalle') + '</li>');
  if (orden.trabajo_componentes) trabajos.push('<li><strong>Componentes:</strong> ' + (orden.detalle_componentes || 'Sin detalle') + '</li>');
  var trabajosHtml = trabajos.length > 0 ? trabajos.join('') : '<li class="text-gray-500">No hay trabajos seleccionados</li>';

  var html = '<!DOCTYPE html>';
  html += '<html lang="es">';
  html += '<head>';
  html += '<meta charset="UTF-8">';
  html += '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">';
  html += '<title>Aprobar Orden #' + n + '</title>';
  html += '<script src="https://cdn.tailwindcss.com"><\/script>';
  html += '<style>';
  html += '#sig-canvas { touch-action: none; background: white; border-radius: 10px; cursor: crosshair; border: 2px solid #e5e7eb; }';
  html += '.btn-clear { position: absolute; top: 10px; right: 10px; z-index: 50; background: white; border: 2px solid #ef4444; color: #ef4444; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; }';
  html += '.signature-container { position: relative; }';
  html += '</style>';
  html += '</head>';
  html += '<body class="p-4" style="font-family: \'Segoe UI\', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">';
  html += '<div class="max-w-2xl mx-auto">';
  html += '<div class="bg-white rounded-t-2xl shadow-2xl overflow-hidden">';
  html += '<div class="bg-gradient-to-r from-red-800 to-red-600 p-4 text-center">';
  html += '<h1 class="text-white text-2xl font-black">GLOBAL PRO AUTOMOTRIZ</h1>';
  html += '<p class="text-red-200 text-sm">ORDEN DE TRABAJO #' + n + '</p>';
  html += '</div>';
  html += '</div>';
  html += '<div class="bg-white shadow-2xl p-4 md:p-6">';
  html += '<div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">';
  html += '<p class="text-blue-800"><strong>Estimado/a ' + cliente + ':</strong></p>';
  html += '<p class="text-blue-700 mt-2">Ha recibido una <strong>ORDEN DE TRABAJO</strong> de parte de <strong>GLOBAL PRO AUTOMOTRIZ</strong></p>';
  html += '</div>';
  html += '<div class="bg-gray-50 rounded-xl p-4 mb-6">';
  html += '<h3 class="font-bold text-lg mb-3 text-gray-800">📋 Información de la Orden</h3>';
  html += '<div class="grid grid-cols-2 gap-3 text-sm">';
  html += '<div><span class="text-gray-600">N° Orden:</span><p class="font-bold text-red-700">' + n + '</p></div>';
  html += '<div><span class="text-gray-600">Patente:</span><p class="font-bold text-red-700">' + orden.patente_placa + '</p></div>';
  html += '<div><span class="text-gray-600">Fecha:</span><p class="font-bold">' + (orden.fecha_ingreso || 'N/A') + ' ' + (orden.hora_ingreso || '') + '</p></div>';
  html += '<div><span class="text-gray-600">Técnico:</span><p class="font-bold">' + (orden.recepcionista || 'N/A') + '</p></div>';
  html += '</div>';
  html += '</div>';
  html += '<div class="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-4 mb-6 text-white">';
  html += '<h3 class="font-bold text-lg mb-3">💰 Valores</h3>';
  html += '<div class="grid grid-cols-3 gap-3 text-center">';
  html += '<div class="bg-white/20 rounded-lg p-3">';
  html += '<p class="text-xs opacity-80">Total</p>';
  html += '<p class="font-bold text-xl">$' + total + '</p>';
  html += '</div>';
  html += '<div class="bg-white/20 rounded-lg p-3">';
  html += '<p class="text-xs opacity-80">Abono</p>';
  html += '<p class="font-bold text-xl">$' + abono + '</p>';
  html += '</div>';
  html += '<div class="bg-white/20 rounded-lg p-3">';
  html += '<p class="text-xs opacity-80">Restante</p>';
  html += '<p class="font-bold text-xl">$' + restante + '</p>';
  html += '</div>';
  html += '</div>';
  html += '</div>';
  html += '<div class="mb-6">';
  html += '<h3 class="font-bold text-lg mb-3 text-gray-800">🔧 Trabajos Seleccionados</h3>';
  html += '<ul class="space-y-2 text-sm">' + trabajosHtml + '</ul>';
  html += '</div>';
  html += '<div class="mb-6">';
  html += '<h3 class="font-bold text-lg mb-3 text-gray-800">✍️ Firma para Aprobar</h3>';
  html += '<div class="signature-container">';
  html += '<button type="button" onclick="limpiarFirma()" class="btn-clear">X Borrar</button>';
  html += '<canvas id="sig-canvas" height="250"></canvas>';
  html += '</div>';
  html += '<p class="text-sm text-gray-600 mt-2 text-center">Nombre: <strong>' + cliente + '</strong> | RUT: <strong>' + (orden.cliente_rut || 'N/A') + '</strong></p>';
  html += '</div>';
  html += '<div class="bg-gray-100 rounded-lg p-4 mb-6 text-sm text-gray-700">';
  html += '<p class="mb-2"><strong>Al firmar usted autoriza:</strong></p>';
  html += '<ul class="list-disc list-inside space-y-1">';
  html += '<li>La intervención del vehículo</li>';
  html += '<li>Pruebas de carretera necesarias</li>';
  html += '<li>La empresa no se responsabiliza por objetos no declarados</li>';
  html += '</ul>';
  html += '</div>';
  html += '<div class="grid grid-cols-2 gap-4">';
  html += '<button onclick="cancelarOrden()" class="bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 rounded-xl transition transform hover:scale-105">❌ Cancelar</button>';
  html += '<button onclick="aprobarOrden()" id="btnAprobar" class="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl transition transform hover:scale-105">✅ Aceptar y Firmar</button>';
  html += '</div>';
  html += '</div>';
  html += '<div class="bg-white rounded-b-2xl shadow-2xl p-4 text-center text-sm text-gray-600">';
  html += '<p>Global Pro Automotriz</p>';
  html += '<p class="text-xs">Padre Alberto Hurtado 3596, Pedro Aguirre Cerda</p>';
  html += '<p class="text-xs">+56 9 8471 5405 / +56 9 3902 6185</p>';
  html += '</div>';
  html += '</div>';
  html += '<script>';
  html += 'var canvas = document.getElementById("sig-canvas");';
  html += 'var ctx = canvas.getContext("2d");';
  html += 'var drawing = false;';
  html += 'var TOKEN = "' + token + '";';
  html += 'function resizeCanvas() {';
  html += '  var container = canvas.parentElement;';
  html += '  var rect = container.getBoundingClientRect();';
  html += '  canvas.width = rect.width - 24;';
  html += '  canvas.height = 250;';
  html += '  ctx.lineWidth = 4;';
  html += '  ctx.lineCap = "round";';
  html += '  ctx.strokeStyle = "#000000";';
  html += '}';
  html += 'window.onload = resizeCanvas;';
  html += 'window.onresize = resizeCanvas;';
  html += 'function getPos(e) {';
  html += '  var rect = canvas.getBoundingClientRect();';
  html += '  var clientX = e.clientX;';
  html += '  var clientY = e.clientY;';
  html += '  if (e.touches && e.touches.length > 0) {';
  html += '    clientX = e.touches[0].clientX;';
  html += '    clientY = e.touches[0].clientY;';
  html += '  }';
  html += '  return { x: clientX - rect.left, y: clientY - rect.top };';
  html += '}';
  html += 'function startDraw(e) {';
  html += '  e.preventDefault();';
  html += '  drawing = true;';
  html += '  var pos = getPos(e);';
  html += '  ctx.beginPath();';
  html += '  ctx.moveTo(pos.x, pos.y);';
  html += '}';
  html += 'function moveDraw(e) {';
  html += '  if (!drawing) return;';
  html += '  e.preventDefault();';
  html += '  var pos = getPos(e);';
  html += '  ctx.lineTo(pos.x, pos.y);';
  html += '  ctx.stroke();';
  html += '}';
  html += 'function endDraw() {';
  html += '  drawing = false;';
  html += '  ctx.beginPath();';
  html += '}';
  html += 'canvas.addEventListener("mousedown", startDraw);';
  html += 'canvas.addEventListener("mousemove", moveDraw);';
  html += 'canvas.addEventListener("mouseup", endDraw);';
  html += 'canvas.addEventListener("mouseout", endDraw);';
  html += 'canvas.addEventListener("touchstart", startDraw, { passive: false });';
  html += 'canvas.addEventListener("touchmove", moveDraw, { passive: false });';
  html += 'canvas.addEventListener("touchend", endDraw);';
  html += 'function limpiarFirma() {';
  html += '  ctx.clearRect(0, 0, canvas.width, canvas.height);';
  html += '}';
  html += 'async function aprobarOrden() {';
  html += '  var imageData = canvas.toDataURL();';
  html += '  var blank = document.createElement("canvas");';
  html += '  blank.width = canvas.width;';
  html += '  blank.height = canvas.height;';
  html += '  if (canvas.toDataURL() === blank.toDataURL()) {';
  html += '    alert("Por favor, firme antes de aceptar la orden.");';
  html += '    return;';
  html += '  }';
  html += '  var btn = document.getElementById("btnAprobar");';
  html += '  btn.innerHTML = "Procesando...";';
  html += '  btn.disabled = true;';
  html += '  try {';
  html += '    console.log("Enviando firma...");';
  html += '    console.log("Token:", TOKEN);';
  html += '    var response = await fetch("/api/aprobar-orden", {';
  html += '      method: "POST",';
  html += '      headers: { "Content-Type": "application/json" },';
  html += '      body: JSON.stringify({ token: TOKEN, firma: imageData })';
  html += '    });';
  html += '    console.log("Status:", response.status);';
  html += '    var data = await response.json();';
  html += '    console.log("Data:", data);';
  html += '    if (data.success) {';
  html += '      mostrarExito(data.orden);';
  html += '    } else {';
  html += '      alert("Error al aprobar: " + data.error);';
  html += '      btn.innerHTML = "✅ Aceptar y Firmar";';
  html += '      btn.disabled = false;';
  html += '    }';
  html += '  } catch (error) {';
  html += '    console.error("Error:", error);';
  html += '    alert("Error de conexión: " + error.message);';
  html += '    btn.innerHTML = "✅ Aceptar y Firmar";';
  html += '    btn.disabled = false;';
  html += '  }';
  html += '}';
  html += 'async function cancelarOrden() {';
  html += '  var motivo = prompt("¿Cuál es el motivo de la cancelación?");';
  html += '  if (!confirm("¿Está seguro de cancelar esta orden de trabajo?")) return;';
  html += '  try {';
  html += '    var response = await fetch("/api/cancelar-orden", {';
  html += '      method: "POST",';
  html += '      headers: { "Content-Type": "application/json" },';
  html += '      body: JSON.stringify({ token: TOKEN, motivo: motivo })';
  html += '    });';
  html += '    var data = await response.json();';
  html += '    if (data.success) {';
  html += '      mostrarCancelada(data.orden);';
  html += '    } else {';
  html += '      alert("Error al cancelar: " + data.error);';
  html += '    }';
  html += '  } catch (error) {';
  html += '    console.error("Error:", error);';
  html += '    alert("Error de conexión");';
  html += '  }';
  html += '}';
  html += 'function mostrarExito(orden) {';
  html += '  var numeroOrden = String(orden.numero_orden).padStart(6, "0");';
  html += '  var verFacturaUrl = window.location.origin + "/ver-ot?token=" + orden.token;';
  html += '  var mensajeWhatsapp = "Hola, he aprobado la orden de trabajo #" + numeroOrden + ".\\n\\nPuede ver y descargar su factura en línea aquí: " + verFacturaUrl;';
  html += '  var whatsappUrl = "https://wa.me/56939026185?text=" + encodeURIComponent(mensajeWhatsapp);';
  html += '  var successHTML = "";';
  html += '  successHTML += "<!DOCTYPE html>";';
  html += '  successHTML += "<html><head><meta charset=\\"UTF-8\\"><title>Orden Aprobada</title>";';
  html += '  successHTML += "<script src=\\"https://cdn.tailwindcss.com\\"><\\/script>";';
  html += '  successHTML += "</head>";';
  html += '  successHTML += "<body class=\\"bg-green-100 flex items-center justify-center min-h-screen p-4\\">";';
  html += '  successHTML += "<div class=\\"bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center\\">";';
  html += '  successHTML += "<div class=\\"text-8xl mb-4\\">✅</div>";';
  html += '  successHTML += "<h1 class=\\"text-3xl font-black text-green-700 mb-2\\">¡Orden Aprobada!</h1>";';
  html += '  successHTML += "<p class=\\"text-gray-600 mb-6\\">Su firma ha sido guardada exitosamente.</p>";';
  html += '  successHTML += "<div class=\\"bg-green-50 rounded-xl p-4 mb-6\\">";';
  html += '  successHTML += "<p class=\\"text-sm text-gray-600\\">Orden N°</p>";';
  html += '  successHTML += "<p class=\\"text-2xl font-bold text-green-700\\">" + numeroOrden + "</p>";';
  html += '  successHTML += "<p class=\\"text-sm text-gray-600 mt-2\\">Patente: <strong>" + orden.patente_placa + "</strong></p>";';
  html += '  successHTML += "</div>";';
  html += '  successHTML += "<a href=\\"" + verFacturaUrl + "\\" target=\\"_blank\\" class=\\"block w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-xl mb-3 transition\\">📄 Ver Factura en Línea</a>";';
  html += '  successHTML += "<a href=\\"" + whatsappUrl + "\\" target=\\"_blank\\" class=\\"block w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl mb-3 transition\\">📱 Enviar Factura por WhatsApp</a>";';
  html += '  successHTML += "<button onclick=\\"cerrarPagina()\\" class=\\"w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-xl mb-3 transition\\">✅ Finalizar</button>";';
  html += '  successHTML += "<p class=\\"text-sm text-gray-500 mt-4\\">¡Gracias por confiar en Global Pro Automotriz!</p>";';
  html += '  successHTML += "</div>";';
  html += '  successHTML += "<script>";';
  html += '  successHTML += "function cerrarPagina() {";';
  html += '  successHTML += "  try { window.close(); } catch(e) {}";';
  html += '  successHTML += "  setTimeout(function() { alert(\\"Puede cerrar esta ventana ahora.\\"); }, 100);";';
  html += '  successHTML += "}";';
  html += '  successHTML += "<\\/script>";';
  html += '  successHTML += "</body></html>";';
  html += '  document.body.innerHTML = successHTML;';
  html += '}';
  html += 'function mostrarCancelada(orden) {';
  html += '  var numeroOrden = String(orden.numero_orden).padStart(6, "0");';
  html += '  var motivo = orden.motivo_cancelacion || "No especificado";';
  html += '  var cancelHTML = "";';
  html += '  cancelHTML += "<!DOCTYPE html>";';
  html += '  cancelHTML += "<html><head><meta charset=\\"UTF-8\\"><title>Orden Cancelada</title>";';
  html += '  cancelHTML += "<script src=\\"https://cdn.tailwindcss.com\\"><\\/script>";';
  html += '  cancelHTML += "</head>";';
  html += '  cancelHTML += "<body class=\\"bg-red-100 flex items-center justify-center min-h-screen p-4\\">";';
  html += '  cancelHTML += "<div class=\\"bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center\\">";';
  html += '  cancelHTML += "<div class=\\"text-8xl mb-4\\">❌</div>";';
  html += '  cancelHTML += "<h1 class=\\"text-3xl font-black text-red-700 mb-2\\">Orden Cancelada</h1>";';
  html += '  cancelHTML += "<p class=\\"text-gray-600 mb-4\\">Esta orden de trabajo ha sido cancelada.</p>";';
  html += '  cancelHTML += "<div class=\\"bg-red-50 rounded-xl p-4 mb-6\\">";';
  html += '  cancelHTML += "<p class=\\"text-sm text-gray-600\\">Orden N°</p>";';
  html += '  cancelHTML += "<p class=\\"text-2xl font-bold text-red-700\\">" + numeroOrden + "</p>";';
  html += '  cancelHTML += "<p class=\\"text-xs text-gray-500 mt-2\\">Fecha: " + (orden.fecha_cancelacion || "N/A") + "</p>";';
  html += '  cancelHTML += "</div>";';
  html += '  cancelHTML += "<div class=\\"bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6\\">";';
  html += '  cancelHTML += "<p class=\\"text-sm font-bold text-yellow-800\\">Motivo:</p>";';
  html += '  cancelHTML += "<p class=\\"text-sm text-yellow-700\\">" + motivo + "</p>";';
  html += '  cancelHTML += "</div>";';
  html += '  cancelHTML += "</div>";';
  html += '  cancelHTML += "</body></html>";';
  html += '  document.body.innerHTML = cancelHTML;';
  html += '}';
  html += '<\/script>';
  html += '</body>';
  html += '</html>';

  return html;
}
