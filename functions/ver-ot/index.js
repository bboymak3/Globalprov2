export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return getHTMLResponse('Token no proporcionado', 'Debe proporcionar un token para ver la orden.', false);
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
      WHERE o.token = ?
    `).bind(token).first();

    if (!orden) {
      return getHTMLResponse('Orden no encontrada', 'El link no es válido o la orden no existe.', false);
    }

    const numeroFormateado = String(orden.numero_orden).padStart(6, '0');
    const html = generateOTViewerPage(orden, numeroFormateado, token);

    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });

  } catch (error) {
    console.error('Error al ver orden:', error);
    return new Response('Error interno del servidor', { status: 500 });
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
    '<title>' + titulo + ' - Global Pro Automotriz</title>' +
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

function generateOTViewerPage(orden, numeroFormateado, token) {
  const estadoClass = obtenerClaseEstado(orden.estado);

  // Construir HTML de trabajos
  let trabajosHtml = '';
  if (orden.trabajo_frenos) trabajosHtml += '<li><strong>Frenos:</strong> ' + (orden.detalle_frenos || 'Sin detalle') + '</li>';
  if (orden.trabajo_luces) trabajosHtml += '<li><strong>Luces:</strong> ' + (orden.detalle_luces || 'Sin detalle') + '</li>';
  if (orden.trabajo_tren_delantero) trabajosHtml += '<li><strong>Tren Delantero:</strong> ' + (orden.detalle_tren_delantero || 'Sin detalle') + '</li>';
  if (orden.trabajo_correas) trabajosHtml += '<li><strong>Correas:</strong> ' + (orden.detalle_correas || 'Sin detalle') + '</li>';
  if (orden.trabajo_componentes) trabajosHtml += '<li><strong>Componentes:</strong> ' + (orden.detalle_componentes || 'Sin detalle') + '</li>';

  if (!trabajosHtml) trabajosHtml = '<li>No hay trabajos seleccionados</li>';

  // Construir HTML de checklist
  let checklistHtml = '' +
    '<p><strong>Nivel de Combustible:</strong> ' + (orden.nivel_combustible || 'No registrado') + '</p>' +
    '<p><strong>Estado de Carrocería:</strong></p>' +
    '<ul>';

  if (orden.check_paragolfe_delantero_der) checklistHtml += '<li>✓ Parachoques delantero derecho</li>';
  if (orden.check_puerta_delantera_der) checklistHtml += '<li>✓ Puerta delantera derecha</li>';
  if (orden.check_puerta_trasera_der) checklistHtml += '<li>✓ Puerta trasera derecha</li>';
  if (orden.check_paragolfe_trasero_izq) checklistHtml += '<li>✓ Parachoques trasero izquierdo</li>';
  if (orden.check_otros_carroceria) checklistHtml += '<li>' + orden.check_otros_carroceria + '</li>';

  checklistHtml += '</ul>';

  // Firma
  let firmaHtml = '';
  if (orden.firma_imagen) {
    firmaHtml = '' +
      '<div class="text-center mt-4 p-4 bg-light rounded">' +
      '<h6 class="fw-bold"><i class="fas fa-signature me-2"></i>Firma del Cliente</h6>' +
      '<img src="' + orden.firma_imagen + '" alt="Firma del cliente" style="max-width: 300px; border: 1px solid #ddd; border-radius: 5px;">' +
      '<p class="small text-muted mt-2">Fecha de aprobación: ' + (orden.fecha_aprobacion || 'N/A') + '</p>' +
      '</div>';
  } else {
    firmaHtml = '' +
      '<div class="alert alert-warning mt-4">' +
      '<i class="fas fa-exclamation-triangle me-2"></i>' +
      'Esta orden aún no ha sido firmada por el cliente.' +
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
    '@media print {' +
    '.no-print { display: none !important; }' +
    '.print-only { display: block !important; }' +
    'body { background: white !important; }' +
    '}' +
    'body { background: #f5f5f5; }' +
    '.ot-card { box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-radius: 15px; margin-bottom: 20px; }' +
    '</style>' +
    '</head>' +
    '<body>' +
    '<nav class="navbar navbar-dark no-print" style="background: #a80000;">' +
    '<div class="container">' +
    '<a class="navbar-brand fw-bold" href="#">' +
    '<i class="fas fa-wrench me-2"></i>GLOBAL PRO AUTOMOTRIZ' +
    '</a>' +
    '</div>' +
    '</nav>' +
    '<div class="container py-4">' +
    '<div class="d-flex justify-content-between align-items-center mb-4 no-print">' +
    '<h2 class="mb-0">Orden de Trabajo #' + numeroFormateado + '</h2>' +
    '<div class="d-flex gap-2">' +
    '<button class="btn btn-primary" onclick="descargarPDF()">' +
    '<i class="fas fa-download me-2"></i>Descargar PDF' +
    '</button>' +
    '<button class="btn btn-secondary" onclick="window.print()">' +
    '<i class="fas fa-print me-2"></i>Imprimir' +
    '</button>' +
    '</div>' +
    '</div>' +
    '<div class="ot-card card">' +
    '<div class="card-header bg-danger text-white">' +
    '<h5 class="mb-0"><i class="fas fa-file-alt me-2"></i>ORDEN DE TRABAJO #' + numeroFormateado + '</h5>' +
    '</div>' +
    '<div class="card-body">' +
    '<div class="row mb-4">' +
    '<div class="col-md-6">' +
    '<h6 class="fw-bold text-danger">INFORMACIÓN DEL TALLER</h6>' +
    '<p><strong>Empresa:</strong> Global Pro Automotriz</p>' +
    '<p><strong>Dirección:</strong> Padre Alberto Hurtado 3596, Pedro Aguirre Cerda</p>' +
    '<p><strong>Contactos:</strong> +56 9 8471 5405 / +56 9 3902 6185</p>' +
    '<p><strong>RRSS:</strong> @globalproautomotriz</p>' +
    '<hr>' +
    '<h6 class="fw-bold">DATOS DEL CLIENTE</h6>' +
    '<p><strong>Nombre:</strong> ' + (orden.cliente_nombre || 'N/A') + '</p>' +
    '<p><strong>RUT:</strong> ' + (orden.cliente_rut || 'N/A') + '</p>' +
    '<p><strong>Fecha Ingreso:</strong> ' + (orden.fecha_ingreso || 'N/A') + ' ' + (orden.hora_ingreso || '') + '</p>' +
    '<p><strong>Recepcionista:</strong> ' + (orden.recepcionista || 'N/A') + '</p>' +
    '</div>' +
    '<div class="col-md-6">' +
    '<h6 class="fw-bold text-danger">DATOS DEL VEHÍCULO</h6>' +
    '<p><strong>Patente:</strong> <span style="font-size: 1.2rem; font-weight: bold; color: #a80000;">' + (orden.patente_placa || 'N/A') + '</span></p>' +
    '<p><strong>Marca/Modelo:</strong> ' + (orden.marca || 'N/A') + ' ' + (orden.modelo || '') + ' (' + (orden.anio || 'N/A') + ')</p>' +
    '<p><strong>Cilindrada:</strong> ' + (orden.cilindrada || 'N/A') + '</p>' +
    '<p><strong>Combustible:</strong> ' + (orden.combustible || 'N/A') + '</p>' +
    '<p><strong>Kilometraje:</strong> ' + (orden.kilometraje || 'N/A') + '</p>' +
    '<hr>' +
    '<h6 class="fw-bold">ESTADO DE LA ORDEN</h6>' +
    '<p><span class="badge ' + estadoClass + ' fs-6">' + (orden.estado || 'N/A') + '</span></p>' +
    ((orden.estado_trabajo === 'Cerrada') ? '<p><span class="badge bg-success fs-6">Orden cerrada</span></p>' : '') +
    ((orden.fecha_completado) ? '<p><strong>Fecha de cierre:</strong> ' + orden.fecha_completado + '</p>' : '') +
    '</div>' +
    '</div>' +
    '<hr>' +
    '<div class="row">' +
    '<div class="col-md-6">' +
    '<h6 class="fw-bold text-danger">TRABAJOS A REALIZAR</h6>' +
    '<ul>' + trabajosHtml + '</ul>' +
    '</div>' +
    '<div class="col-md-6">' +
    '<h6 class="fw-bold text-danger">CHECKLIST DEL VEHÍCULO</h6>' +
    checklistHtml +
    '</div>' +
    '</div>' +
    '<hr>' +
    '<h6 class="fw-bold text-danger">VALORES</h6>' +
    '<div class="row text-center">' +
    '<div class="col-4">' +
    '<div class="p-3 bg-light rounded">' +
    '<small class="text-muted">Total</small>' +
    '<div class="h4">$' + ((orden.monto_total || 0).toLocaleString('es-CL')) + '</div>' +
    '</div>' +
    '</div>' +
    '<div class="col-4">' +
    '<div class="p-3 bg-light rounded">' +
    '<small class="text-muted">Abono</small>' +
    '<div class="h4">$' + ((orden.monto_abono || 0).toLocaleString('es-CL')) + '</div>' +
    '</div>' +
    '</div>' +
    '<div class="col-4">' +
    '<div class="p-3 bg-light rounded">' +
    '<small class="text-muted">Restante</small>' +
    '<div class="h4">$' + ((orden.monto_restante || 0).toLocaleString('es-CL')) + '</div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    (orden.metodo_pago ? '<p class="text-center mt-2"><strong>Método de Pago:</strong> ' + orden.metodo_pago + '</p>' : '') +
    '</div>' +
    firmaHtml +
    '<hr>' +
    '<div class="alert alert-info">' +
    '<small class="text-danger">' +
    '<strong>Validez y Responsabilidad:</strong><br>' +
    '• El cliente autoriza la intervención del vehículo<br>' +
    '• Se autorizan pruebas de carretera necesarias<br>' +
    '• La empresa no se hace responsable por objetos no declarados' +
    '</small>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '<footer class="text-center py-3 text-muted no-print">' +
    '<small>Generado el ' + new Date().toLocaleString('es-CL') + '</small>' +
    '</footer>' +
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"><\/script>' +
    '<script>' +
    'function descargarPDF() {' +
    '  const { jsPDF } = window.jspdf;' +
    '  const doc = new jsPDF("p", "mm", "a4");' +
    '  const ordenData = ' + JSON.stringify(orden) + ';' +
    '  const numeroFormateado = "' + numeroFormateado + '";' +
    '  const pageWidth = doc.internal.pageSize.getWidth();' +
    '  const pageHeight = doc.internal.pageSize.getHeight();' +
    '  const leftMargin = 10;' +
    '  let yPos = 15;' +
    '  doc.setFontSize(8);' +
    '  doc.setTextColor(128, 128, 128);' +
    '  doc.text("OT #" + numeroFormateado, pageWidth - 15, 10, { align: "right" });' +
    '  doc.setFontSize(16);' +
    '  doc.setTextColor(168, 0, 0);' +
    '  doc.text("ORDEN DE TRABAJO", pageWidth / 2, yPos, { align: "center" });' +
    '  yPos += 8;' +
    '  doc.setFontSize(10);' +
    '  doc.text("GLOBAL PRO AUTOMOTRIZ", pageWidth / 2, yPos, { align: "center" });' +
    '  yPos += 10;' +
    '  doc.setTextColor(0, 0, 0);' +
    '  doc.setFontSize(9);' +
    '  doc.setFont(undefined, "bold");' +
    '  doc.text("1. INFORMACIÓN DEL TALLER", leftMargin, yPos);' +
    '  yPos += 6;' +
    '  doc.setFont(undefined, "normal");' +
    '  doc.setFontSize(7);' +
    '  doc.text("Empresa: Global Pro Automotriz", leftMargin, yPos); yPos += 4;' +
    '  doc.text("Dirección: Padre Alberto Hurtado 3596, Pedro Aguirre Cerda", leftMargin, yPos); yPos += 4;' +
    '  doc.text("Contactos: +56 9 8471 5405 / +56 9 3902 6185", leftMargin, yPos); yPos += 10;' +
    '  doc.setFontSize(9);' +
    '  doc.setFont(undefined, "bold");' +
    '  doc.text("2. DATOS DEL CLIENTE", leftMargin, yPos);' +
    '  yPos += 6;' +
    '  doc.setFont(undefined, "normal");' +
    '  doc.setFontSize(7);' +
    '  doc.text("Cliente: " + (ordenData.cliente_nombre || "N/A"), leftMargin, yPos); yPos += 4;' +
    '  doc.text("RUT: " + (ordenData.cliente_rut || "N/A"), leftMargin, yPos); yPos += 4;' +
    '  doc.text("Fecha Ingreso: " + (ordenData.fecha_ingreso || "N/A"), leftMargin, yPos); yPos += 10;' +
    '  doc.setFontSize(9);' +
    '  doc.setFont(undefined, "bold");' +
    '  doc.text("3. DATOS DEL VEHÍCULO", leftMargin, yPos);' +
    '  yPos += 6;' +
    '  doc.setFont(undefined, "normal");' +
    '  doc.setFontSize(7);' +
    '  doc.text("Patente: " + (ordenData.patente_placa || "N/A"), leftMargin, yPos); yPos += 4;' +
    '  doc.text("Marca/Modelo: " + (ordenData.marca || "N/A") + " " + (ordenData.modelo || ""), leftMargin, yPos); yPos += 10;' +
    '  doc.setFontSize(9);' +
    '  doc.setFont(undefined, "bold");' +
    '  doc.text("4. VALORES", leftMargin, yPos);' +
    '  yPos += 6;' +
    '  doc.setFont(undefined, "normal");' +
    '  doc.setFontSize(7);' +
    '  doc.text("Total: $" + ((ordenData.monto_total || 0).toLocaleString("es-CL")), leftMargin, yPos); yPos += 4;' +
    '  doc.text("Abono: $" + ((ordenData.monto_abono || 0).toLocaleString("es-CL")), leftMargin, yPos); yPos += 4;' +
    '  doc.text("Restante: $" + ((ordenData.monto_restante || 0).toLocaleString("es-CL")), leftMargin, yPos); yPos += 10;' +
    '  if (ordenData.firma_imagen) {' +
    '    try {' +
    '      doc.text("Firma del Cliente:", leftMargin, yPos); yPos += 4;' +
    '      doc.addImage(ordenData.firma_imagen, "PNG", leftMargin, yPos, 40, 25);' +
    '    } catch(e) {}' +
    '  }' +
    '  doc.setFontSize(6);' +
    '  doc.setTextColor(128, 128, 128);' +
    '  doc.text("Generado: " + new Date().toLocaleString("es-CL"), pageWidth / 2, pageHeight - 10, { align: "center" });' +
    '  doc.save("OT-" + numeroFormateado + "-" + (ordenData.patente_placa || "N/A") + ".pdf");' +
    '}' +
    '<\/script>' +
    '</div>' +
    '</body>' +
    '</html>';

  return html;
}

function obtenerClaseEstado(estado) {
  const clases = {
    'Enviada': 'bg-warning',
    'Aprobada': 'bg-success',
    'Cancelada': 'bg-danger'
  };
  return clases[estado] || 'bg-secondary';
}
