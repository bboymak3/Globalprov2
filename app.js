// ============================================
// APP.JS - Lógica del Panel Administrativo
// Global Pro Automotriz
// ============================================

// Configuración
const API_BASE = '/api';
let ordenActual = null;
let ordenesFiltradas = [];

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Establecer fecha y hora actual
    const ahora = new Date();
    document.getElementById('fecha-ingreso').value = ahora.toISOString().split('T')[0];
    document.getElementById('hora-ingreso').value = ahora.toTimeString().slice(0, 5);
    
    // Cargar próximo número de orden
    cargarProximoNumeroOrden();
});

// ============================================
// NAVEGACIÓN
// ============================================

function mostrarSeccion(seccion) {
    // Ocultar todas las secciones
    document.getElementById('seccion-crear').style.display = 'none';
    document.getElementById('seccion-buscar').style.display = 'none';
    document.getElementById('seccion-tecnicos').style.display = 'none';
    document.getElementById('seccion-resumen').style.display = 'none';
    
    // Mostrar la sección seleccionada
    document.getElementById('seccion-' + seccion).style.display = 'block';
    
    // Actualizar nav
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    event.target.classList.add('active');

    // Cargar datos específicos de la sección
    if (seccion === 'tecnicos') {
        cargarTecnicos();
    } else if (seccion === 'resumen') {
        cargarResumenTecnicos();
    }
}

// ============================================
// FUNCIONES DEL FORMULARIO
// ============================================

function toggleDetalle(trabajo) {
    const checkbox = document.getElementById('check-' + trabajo);
    const textarea = document.getElementById('detalle-' + trabajo);
    textarea.disabled = !checkbox.checked;
    if (checkbox.checked) {
        textarea.focus();
    }
}

function toggleAbono() {
    const tieneAbono = document.getElementById('tiene-abono').checked;
    const seccionAbono = document.getElementById('seccion-abono');
    seccionAbono.style.display = tieneAbono ? 'block' : 'none';
    
    if (!tieneAbono) {
        document.getElementById('monto-abono').value = '';
        document.getElementById('metodo-pago').value = 'Efectivo';
    }
    
    calcularRestante();
}

function calcularRestante() {
    const total = parseFloat(document.getElementById('monto-total').value) || 0;
    const tieneAbono = document.getElementById('tiene-abono').checked;
    const abono = tieneAbono ? (parseFloat(document.getElementById('monto-abono').value) || 0) : 0;
    const restante = total - abono;
    
    // Actualizar resumen
    document.getElementById('resumen-total').textContent = formatearMontoConSimbolo(total);
    document.getElementById('resumen-abono').textContent = formatearMontoConSimbolo(abono);
    document.getElementById('resumen-restante').textContent = formatearMontoConSimbolo(restante);
}

// ============================================
// BUSCAR VEHÍCULO POR PATENTE
// ============================================

async function buscarVehiculoPorPatente(patente) {
    if (!patente || patente.length < 3) return;

    // Limpiar espacios de la patente
    patente = patente.replace(/\s+/g, '').toUpperCase();

    try {
        const response = await fetch(`${API_BASE}/buscar-patente?patente=${encodeURIComponent(patente)}`);
        const data = await response.json();
        
        if (data.vehiculo) {
            // Autocompletar datos del vehículo
            document.getElementById('marca').value = data.vehiculo.marca || '';
            document.getElementById('modelo').value = data.vehiculo.modelo || '';
            document.getElementById('anio').value = data.vehiculo.anio || '';
            document.getElementById('cilindrada').value = data.vehiculo.cilindrada || '';
            document.getElementById('combustible').value = data.vehiculo.combustible || '';
            document.getElementById('kilometraje').value = data.vehiculo.kilometraje || '';
            
            // Si hay cliente asociado
            if (data.cliente) {
                document.getElementById('cliente').value = data.cliente.nombre || '';
                document.getElementById('rut').value = data.cliente.rut || '';
                document.getElementById('telefono').value = data.cliente.telefono || '';
            }
            
            mostrarNotificacion('success', 'Vehículo encontrado', 'Datos cargados automáticamente');
        }
    } catch (error) {
        console.error('Error al buscar vehículo:', error);
    }
}

// ============================================
// CARGAR PRÓXIMO NÚMERO DE ORDEN
// ============================================

async function cargarProximoNumeroOrden() {
    try {
        const response = await fetch(`${API_BASE}/proximo-numero-orden`);
        const data = await response.json();
        
        if (data.numero) {
            const numeroFormateado = String(data.numero).padStart(6, '0');
            document.getElementById('num-orden').textContent = numeroFormateado;
        }
    } catch (error) {
        console.error('Error al cargar número de orden:', error);
    }
}

// ============================================
// GUARDAR ORDEN
// ============================================

async function guardarOrden() {
    // Validar formulario
    const form = document.getElementById('form-orden');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Recopilar datos
    const ordenData = {
        patente: document.getElementById('patente').value.toUpperCase().replace(/\s+/g, ''),
        marca: document.getElementById('marca').value,
        modelo: document.getElementById('modelo').value,
        anio: parseInt(document.getElementById('anio').value) || null,
        cilindrada: document.getElementById('cilindrada').value,
        combustible: document.getElementById('combustible').value,
        kilometraje: document.getElementById('kilometraje').value,
        
        cliente: document.getElementById('cliente').value,
        rut: document.getElementById('rut').value,
        telefono: document.getElementById('telefono').value,
        fecha_ingreso: document.getElementById('fecha-ingreso').value,
        hora_ingreso: document.getElementById('hora-ingreso').value,
        recepcionista: document.getElementById('recepcionista').value,
        
        // Trabajos
        trabajo_frenos: document.getElementById('check-frenos').checked ? 1 : 0,
        detalle_frenos: document.getElementById('detalle-frenos').value,
        
        trabajo_luces: document.getElementById('check-luces').checked ? 1 : 0,
        detalle_luces: document.getElementById('detalle-luces').value,
        
        trabajo_tren_delantero: document.getElementById('check-tren').checked ? 1 : 0,
        detalle_tren_delantero: document.getElementById('detalle-tren').value,
        
        trabajo_correas: document.getElementById('check-correas').checked ? 1 : 0,
        detalle_correas: document.getElementById('detalle-correas').value,
        
        trabajo_componentes: document.getElementById('check-componentes').checked ? 1 : 0,
        detalle_componentes: document.getElementById('detalle-componentes').value,
        
        // Checklist
        nivel_combustible: document.querySelector('input[name="combustible"]:checked')?.value || null,
        
        check_paragolfe_delantero_der: document.getElementById('check-paragolfe-del-der').checked ? 1 : 0,
        check_puerta_delantera_der: document.getElementById('check-puerta-del-der').checked ? 1 : 0,
        check_puerta_trasera_der: document.getElementById('check-puerta-tra-der').checked ? 1 : 0,
        check_paragolfe_trasero_izq: document.getElementById('check-paragolfe-tra-izq').checked ? 1 : 0,
        check_otros_carroceria: document.getElementById('check-otros').value,
        
        // Montos
        monto_total: parseFloat(document.getElementById('monto-total').value) || 0,
        monto_abono: document.getElementById('tiene-abono').checked ? (parseFloat(document.getElementById('monto-abono').value) || 0) : 0,
        metodo_pago: document.getElementById('tiene-abono').checked ? document.getElementById('metodo-pago').value : null
    };

    // Calcular restante
    ordenData.monto_restante = ordenData.monto_total - ordenData.monto_abono;
    
    try {
        mostrarLoading(true);
        
        const response = await fetch(`${API_BASE}/crear-orden`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ordenData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarNotificacion('success', 'Orden Creada', `Orden #${data.numero_orden} creada exitosamente`);
            
            // Mostrar link para compartir
            const linkAprobacion = `${window.location.origin}/aprobar?token=${data.token}`;
            
            const modalHtml = `
                <div class="text-center">
                    <div class="mb-4">
                        <i class="fas fa-check-circle text-success" style="font-size: 5rem;"></i>
                    </div>
                    <h3>¡Orden Creada Exitosamente!</h3>
                    <p class="lead">Orden N° ${String(data.numero_orden).padStart(6, '0')}</p>
                    
                    <div class="alert alert-info mt-4">
                        <h6><i class="fab fa-whatsapp me-2"></i>Enviar al Cliente</h6>
                        <p>Use este link para que el cliente apruebe la orden:</p>
                        <div class="input-group">
                            <input type="text" class="form-control" value="${linkAprobacion}" readonly id="link-compartir">
                            <button class="btn btn-primary" onclick="copiarLink('${linkAprobacion}')">
                                <i class="fas fa-copy me-2"></i>Copiar
                            </button>
                        </div>
                        <a href="https://wa.me/${ordenData.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola, tiene una orden de trabajo de Global Pro Automotriz. Para verla y aprobarla, ingrese a: ${linkAprobacion}`)}" 
                           target="_blank" class="btn btn-success mt-3">
                            <i class="fab fa-whatsapp me-2"></i>Enviar por WhatsApp
                        </a>
                    </div>
                </div>
            `;
            
            document.getElementById('modal-contenido').innerHTML = modalHtml;
            document.getElementById('modal-numero-orden').textContent = String(data.numero_orden).padStart(6, '0');
            
            const modal = new bootstrap.Modal(document.getElementById('modalVerOrden'));
            modal.show();
            
            // Limpiar formulario
            form.reset();
            cargarProximoNumeroOrden();
            
            // Establecer fecha y hora actual
            const ahora = new Date();
            document.getElementById('fecha-ingreso').value = ahora.toISOString().split('T')[0];
            document.getElementById('hora-ingreso').value = ahora.toTimeString().slice(0, 5);
            
        } else {
            mostrarNotificacion('error', 'Error', data.error || 'Error al crear la orden');
        }
    } catch (error) {
        console.error('Error al guardar orden:', error);
        mostrarNotificacion('error', 'Error', 'Error al conectar con el servidor');
    } finally {
        mostrarLoading(false);
    }
}

// ============================================
// BUSCAR ÓRDENES
// ============================================

async function buscarOrdenes() {
    let patente = document.getElementById('buscador-patente').value.toUpperCase().replace(/\s+/g, '');

    if (!patente) {
        mostrarNotificacion('warning', 'Advertencia', 'Ingrese una patente para buscar');
        return;
    }
    
    try {
        mostrarLoading(true);
        
        const response = await fetch(`${API_BASE}/buscar-ordenes?patente=${encodeURIComponent(patente)}`);
        const data = await response.json();
        
        if (data.ordenes && data.ordenes.length > 0) {
            ordenesFiltradas = data.ordenes;
            mostrarResultados(data.ordenes);
        } else {
            document.getElementById('resultados-busqueda').innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-search fa-3x mb-3 text-muted"></i>
                    <p class="text-muted">No se encontraron órdenes para la patente: ${patente}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error al buscar órdenes:', error);
        mostrarNotificacion('error', 'Error', 'Error al buscar órdenes');
    } finally {
        mostrarLoading(false);
    }
}

function mostrarResultados(ordenes) {
    let html = '';
    
    ordenes.forEach(orden => {
        const estadoClass = obtenerClaseEstado(orden.estado);
        const estadoIcon = obtenerIconoEstado(orden.estado);
        const numeroFormateado = String(orden.numero_orden).padStart(6, '0');
        
        html += `
            <div class="card orden-card mb-3" onclick="verOrden(${orden.id})">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <h5 class="card-title mb-2">
                                <span class="badge ${estadoClass}">${estadoIcon} ${orden.estado}</span>
                            </h5>
                            <h6 class="card-subtitle mb-2">
                                <strong>ORDEN #${numeroFormateado}</strong> | Patente: ${orden.patente_placa}
                            </h6>
                            <p class="card-text mb-1">
                                <i class="fas fa-user me-2"></i>${orden.cliente_nombre || 'N/A'}
                            </p>
                            <p class="card-text mb-1">
                                <i class="fas fa-calendar me-2"></i>${orden.fecha_ingreso || 'N/A'} 
                                <i class="fas fa-dollar-sign ms-3 me-2"></i>Total: ${formatearMontoConSimbolo(orden.monto_total)}
                            </p>
                        </div>
                        <div class="col-md-4 text-end">
                            <button class="btn btn-primary btn-sm">
                                <i class="fas fa-eye me-2"></i>Ver Detalles
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    document.getElementById('resultados-busqueda').innerHTML = html;
}

function filtrarOrdenes(estado) {
    // Actualizar botones de filtro
    document.querySelectorAll('.filtro-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    if (estado === 'todas') {
        mostrarResultados(ordenesFiltradas);
    } else {
        const filtradas = ordenesFiltradas.filter(o => o.estado === estado);
        mostrarResultados(filtradas);
    }
}

// ============================================
// VER ORDEN
// ============================================

async function verOrden(ordenId) {
    try {
        mostrarLoading(true);
        
        const response = await fetch(`${API_BASE}/ver-orden?id=${ordenId}`);
        const data = await response.json();
        
        if (data.orden) {
            ordenActual = data.orden;
            mostrarOrdenEnModal(data.orden);
        }
    } catch (error) {
        console.error('Error al ver orden:', error);
        mostrarNotificacion('error', 'Error', 'Error al cargar la orden');
    } finally {
        mostrarLoading(false);
    }
}

function mostrarOrdenEnModal(orden) {
    const numeroFormateado = String(orden.numero_orden).padStart(6, '0');
    const estadoClass = obtenerClaseEstado(orden.estado);
    
    // Construir HTML de trabajos
    let trabajosHtml = '';
    if (orden.trabajo_frenos) trabajosHtml += `<li><strong>Frenos:</strong> ${orden.detalle_frenos || 'Sin detalle'}</li>`;
    if (orden.trabajo_luces) trabajosHtml += `<li><strong>Luces:</strong> ${orden.detalle_luces || 'Sin detalle'}</li>`;
    if (orden.trabajo_tren_delantero) trabajosHtml += `<li><strong>Tren Delantero:</strong> ${orden.detalle_tren_delantero || 'Sin detalle'}</li>`;
    if (orden.trabajo_correas) trabajosHtml += `<li><strong>Correas:</strong> ${orden.detalle_correas || 'Sin detalle'}</li>`;
    if (orden.trabajo_componentes) trabajosHtml += `<li><strong>Componentes:</strong> ${orden.detalle_componentes || 'Sin detalle'}</li>`;
    
    if (!trabajosHtml) trabajosHtml = '<li>No hay trabajos seleccionados</li>';
    
    // Construir HTML de checklist
    let checklistHtml = `
        <p><strong>Nivel de Combustible:</strong> ${orden.nivel_combustible || 'No registrado'}</p>
        <p><strong>Estado de Carrocería:</strong></p>
        <ul>
            ${orden.check_paragolfe_delantero_der ? '<li>✓ Parachoques delantero derecho</li>' : ''}
            ${orden.check_puerta_delantera_der ? '<li>✓ Puerta delantera derecha</li>' : ''}
            ${orden.check_puerta_trasera_der ? '<li>✓ Puerta trasera derecha</li>' : ''}
            ${orden.check_paragolfe_trasero_izq ? '<li>✓ Parachoques trasero izquierdo</li>' : ''}
            ${orden.check_otros_carroceria ? `<li>${orden.check_otros_carroceria}</li>` : ''}
        </ul>
    `;
    
    // Firma
    let firmaHtml = '';
    if (orden.firma_imagen) {
        firmaHtml = `
            <div class="text-center mt-4">
                <h6><i class="fas fa-signature me-2"></i>Firma del Cliente</h6>
                <img src="${orden.firma_imagen}" alt="Firma del cliente" style="max-width: 300px; border: 1px solid #ddd; border-radius: 5px;">
                <p class="small text-muted mt-2">Fecha de aprobación: ${orden.fecha_aprobacion || 'N/A'}</p>
            </div>
        `;
    } else {
        firmaHtml = `
            <div class="alert alert-warning mt-4">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Esta orden aún no ha sido firmada por el cliente.
            </div>
        `;
    }
    
    const html = `
        <div class="row">
            <div class="col-md-6">
                <h6 class="fw-bold"><i class="fas fa-building me-2"></i>INFORMACIÓN DEL TALLER</h6>
                <p><strong>Empresa:</strong> Global Pro Automotriz</p>
                <p><strong>Dirección:</strong> Padre Alberto Hurtado 3596, Pedro Aguirre Cerda</p>
                <p><strong>Contactos:</strong> +56 9 8471 5405 / +56 9 3902 6185</p>
                <p><strong>RRSS:</strong> @globalproautomotriz</p>
                
                <hr>
                
                <h6 class="fw-bold"><i class="fas fa-user me-2"></i>DATOS DEL CLIENTE</h6>
                <p><strong>Nombre:</strong> ${orden.cliente_nombre || 'N/A'}</p>
                <p><strong>R.U.T.:</strong> ${orden.cliente_rut || 'N/A'}</p>
                <p><strong>Teléfono:</strong> ${orden.cliente_telefono || 'N/A'}</p>
                <p><strong>Fecha Ingreso:</strong> ${orden.fecha_ingreso || 'N/A'} ${orden.hora_ingreso || ''}</p>
                <p><strong>Recepcionista:</strong> ${orden.recepcionista || 'N/A'}</p>
            </div>
            
            <div class="col-md-6">
                <h6 class="fw-bold"><i class="fas fa-car me-2"></i>DATOS DEL VEHÍCULO</h6>
                <p><strong>Patente:</strong> <span style="font-size: 1.2rem; font-weight: bold; color: var(--gp-red);">${orden.patente_placa}</span></p>
                <p><strong>Marca/Modelo:</strong> ${orden.marca || 'N/A'} ${orden.modelo || ''} (${orden.anio || 'N/A'})</p>
                <p><strong>Cilindrada:</strong> ${orden.cilindrada || 'N/A'}</p>
                <p><strong>Combustible:</strong> ${orden.combustible || 'N/A'}</p>
                <p><strong>Kilometraje:</strong> ${orden.kilometraje || 'N/A'}</p>
                
                <hr>
                
                <h6 class="fw-bold"><i class="fas fa-info-circle me-2"></i>ESTADO DE LA ORDEN</h6>
                <p><span class="badge ${estadoClass} fs-6">${orden.estado}</span></p>
            </div>
        </div>
        
        <hr>
        
        <div class="row">
            <div class="col-md-6">
                <h6 class="fw-bold"><i class="fas fa-tools me-2"></i>TRABAJOS A REALIZAR</h6>
                <ul>${trabajosHtml}</ul>
            </div>
            
            <div class="col-md-6">
                <h6 class="fw-bold"><i class="fas fa-clipboard-check me-2"></i>CHECKLIST DEL VEHÍCULO</h6>
                ${checklistHtml}
            </div>
        </div>
        
        <hr>
        
        <div class="row">
            <div class="col-12">
                <h6 class="fw-bold"><i class="fas fa-dollar-sign me-2"></i>VALORES</h6>
                <div class="row text-center">
                    <div class="col-4">
                        <div class="p-3 bg-light rounded">
                            <small class="text-muted">Total</small>
                            <div class="h4">${formatearMontoConSimbolo(orden.monto_total)}</div>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="p-3 bg-light rounded">
                            <small class="text-muted">Abono</small>
                            <div class="h4">${formatearMontoConSimbolo(orden.monto_abono)}</div>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="p-3 bg-light rounded">
                            <small class="text-muted">Restante</small>
                            <div class="h4">${formatearMontoConSimbolo(orden.monto_restante)}</div>
                        </div>
                    </div>
                </div>
                ${orden.metodo_pago ? `<p class="text-center mt-2"><strong>Método de Pago:</strong> ${orden.metodo_pago}</p>` : ''}
            </div>
        </div>
        
        ${firmaHtml}
        
        <hr>
        
        <div class="alert alert-info">
            <small>
                <strong>Validez y Responsabilidad:</strong><br>
                • El cliente autoriza la intervención del vehículo<br>
                • Se autorizan pruebas de carretera necesarias<br>
                • La empresa no se hace responsable por objetos no declarados
            </small>
        </div>
    `;
    
    document.getElementById('modal-contenido').innerHTML = html;
    document.getElementById('modal-numero-orden').textContent = numeroFormateado;
    
    const modal = new bootstrap.Modal(document.getElementById('modalVerOrden'));
    modal.show();
}

// ============================================
// GENERAR PDF
// ============================================

async function generarPDFDesdeModal() {
    if (!ordenActual) {
        mostrarNotificacion('error', 'Error', 'No hay orden seleccionada');
        return;
    }

    generarPDF(ordenActual);
}

function verPDFEnLinea() {
    if (!ordenActual || !ordenActual.token) {
        mostrarNotificacion('error', 'Error', 'No hay orden seleccionada o no tiene token');
        return;
    }

    const link = `${window.location.origin}/ver-ot?token=${ordenActual.token}`;
    window.open(link, '_blank');
}

async function generarPDF(orden) {
    const { jsPDF } = window.jspdf;
    // Usar portrait (vertical)
    const doc = new jsPDF('p', 'mm', 'a4');

    const numeroFormateado = String(orden.numero_orden).padStart(6, '0');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const leftMargin = 10;
    let yPos = 15;

    // Número de orden pequeño en esquina superior derecha
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`OT #${numeroFormateado}`, pageWidth - 15, 10, { align: 'right' });

    // Título
    doc.setFontSize(16);
    doc.setTextColor(168, 0, 0);
    doc.text('ORDEN DE TRABAJO', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    doc.setFontSize(10);
    doc.text('GLOBAL PRO AUTOMOTRIZ', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // Información del Taller
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('1. INFORMACIÓN DEL TALLER', leftMargin, yPos);
    yPos += 6;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(7);
    doc.text('Empresa: Global Pro Automotriz', leftMargin, yPos); yPos += 4;
    doc.text('Dirección: Padre Alberto Hurtado 3596, Pedro Aguirre Cerda', leftMargin, yPos); yPos += 4;
    doc.text('Contactos: +56 9 8471 5405 / +56 9 3902 6185', leftMargin, yPos); yPos += 4;
    doc.text('RRSS: @globalproautomotriz', leftMargin, yPos); yPos += 10;

    // Datos del Cliente
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('2. DATOS DEL CLIENTE', leftMargin, yPos);
    yPos += 6;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(7);
    doc.text(`Cliente: ${orden.cliente_nombre || 'N/A'}`, leftMargin, yPos); yPos += 4;
    doc.text(`R.U.T.: ${orden.cliente_rut || 'N/A'}`, leftMargin, yPos); yPos += 4;
    doc.text(`Teléfono: ${orden.cliente_telefono || 'N/A'}`, leftMargin, yPos); yPos += 4;
    doc.text(`Fecha Ingreso: ${orden.fecha_ingreso || 'N/A'} ${orden.hora_ingreso || ''}`, leftMargin, yPos); yPos += 4;
    doc.text(`Recepcionista: ${orden.recepcionista || 'N/A'}`, leftMargin, yPos); yPos += 10;

    // Datos del Vehículo
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('3. DATOS DEL VEHÍCULO', leftMargin, yPos);
    yPos += 6;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(7);
    doc.text(`Patente: ${orden.patente_placa}`, leftMargin, yPos); yPos += 4;
    doc.text(`Marca/Modelo: ${orden.marca || 'N/A'} ${orden.modelo || ''} (${orden.anio || 'N/A'})`, leftMargin, yPos); yPos += 4;
    doc.text(`Cilindrada: ${orden.cilindrada || 'N/A'}`, leftMargin, yPos); yPos += 4;
    doc.text(`Combustible: ${orden.combustible || 'N/A'}`, leftMargin, yPos); yPos += 4;
    doc.text(`Kilometraje: ${orden.kilometraje || 'N/A'}`, leftMargin, yPos); yPos += 10;

    // Trabajos
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('4. TRABAJOS A REALIZAR', leftMargin, yPos);
    yPos += 6;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(7);

    let trabajosList = [];
    if (orden.trabajo_frenos) trabajosList.push({ nombre: 'Frenos', detalle: orden.detalle_frenos });
    if (orden.trabajo_luces) trabajosList.push({ nombre: 'Luces', detalle: orden.detalle_luces });
    if (orden.trabajo_tren_delantero) trabajosList.push({ nombre: 'Tren Delantero', detalle: orden.detalle_tren_delantero });
    if (orden.trabajo_correas) trabajosList.push({ nombre: 'Correas', detalle: orden.detalle_correas });
    if (orden.trabajo_componentes) trabajosList.push({ nombre: 'Componentes', detalle: orden.detalle_componentes });

    if (trabajosList.length === 0) {
        doc.text('  Sin trabajos seleccionados', leftMargin, yPos); yPos += 6;
    } else {
        trabajosList.forEach(trabajo => {
            doc.text(`  ✓ ${trabajo.nombre}: ${trabajo.detalle || 'Sin detalle'}`, leftMargin, yPos); yPos += 4;
        });
    }
    yPos += 8;

    // Checklist
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('5. CHECKLIST DEL VEHÍCULO', leftMargin, yPos);
    yPos += 6;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(7);
    doc.text(`Nivel de Combustible: ${orden.nivel_combustible || 'No registrado'}`, leftMargin, yPos); yPos += 4;
    doc.text('Estado de Carrocería:', leftMargin, yPos); yPos += 4;

    let checklistItems = [];
    if (orden.check_paragolfe_delantero_der) checklistItems.push('Parachoques delantero derecho');
    if (orden.check_puerta_delantera_der) checklistItems.push('Puerta delantera derecha');
    if (orden.check_puerta_trasera_der) checklistItems.push('Puerta trasera derecha');
    if (orden.check_paragolfe_trasero_izq) checklistItems.push('Parachoques trasero izquierdo');
    if (orden.check_otros_carroceria) checklistItems.push(orden.check_otros_carroceria);

    if (checklistItems.length === 0) {
        doc.text('  Sin observaciones', leftMargin, yPos); yPos += 4;
    } else {
        checklistItems.forEach(item => {
            doc.text(`  ✓ ${item}`, leftMargin, yPos); yPos += 4;
        });
    }
    yPos += 8;

    // Valores
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('6. VALORES', leftMargin, yPos);
    yPos += 6;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(7);
    doc.text(`Total Estimado: ${formatearMontoConSimbolo(orden.monto_total)}`, leftMargin, yPos); yPos += 4;
    doc.text(`Abono Recibido: ${formatearMontoConSimbolo(orden.monto_abono)}`, leftMargin, yPos); yPos += 4;
    doc.text(`Restante: ${formatearMontoConSimbolo(orden.monto_restante)}`, leftMargin, yPos); yPos += 4;
    if (orden.metodo_pago) {
        doc.text(`Método de Pago: ${orden.metodo_pago}`, leftMargin, yPos); yPos += 4;
    }
    yPos += 8;

    // Estado y Firma
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('7. ESTADO Y FIRMA', leftMargin, yPos);
    yPos += 6;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(7);
    doc.text(`Estado: ${orden.estado}`, leftMargin, yPos); yPos += 4;
    if (orden.fecha_aprobacion) {
        doc.text(`Fecha de Aprobación: ${orden.fecha_aprobacion}`, leftMargin, yPos); yPos += 4;
    }

    // Agregar imagen de firma si existe
    if (orden.firma_imagen) {
        try {
            doc.text('Firma del Cliente:', leftMargin, yPos); yPos += 4;
            doc.addImage(orden.firma_imagen, 'PNG', leftMargin, yPos, 40, 25);
            yPos += 28;
            doc.text(`Firma: ${orden.cliente_nombre || 'N/A'} (${orden.cliente_rut || 'N/A'})`, leftMargin, yPos); yPos += 4;
        } catch (e) {
            console.error('Error al agregar firma:', e);
        }
    }

    // Validez
    yPos += 6;
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('8. VALIDEZ Y RESPONSABILIDAD', leftMargin, yPos);
    yPos += 6;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(6);
    doc.text('• El cliente autoriza la intervención del vehículo', leftMargin, yPos); yPos += 4;
    doc.text('• Se autorizan pruebas de carretera necesarias', leftMargin, yPos); yPos += 4;
    doc.text('• La empresa no se hace responsable por objetos no declarados', leftMargin, yPos); yPos += 4;

    // Footer
    doc.setFontSize(6);
    doc.setTextColor(128, 128, 128);
    doc.text(`Generado: ${new Date().toLocaleString('es-CL')}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Guardar
    doc.save(`OT-${numeroFormateado}-${orden.patente_placa}.pdf`);

    mostrarNotificacion('success', 'PDF Generado', 'El PDF se ha descargado exitosamente');
}

// ============================================
// COMPARTIR LINK
// ============================================

function compartirLink() {
    if (!ordenActual || !ordenActual.token) {
        mostrarNotificacion('error', 'Error', 'No hay orden seleccionada');
        return;
    }
    
    const link = `${window.location.origin}/aprobar?token=${ordenActual.token}`;
    
    if (navigator.share) {
        navigator.share({
            title: `Orden de Trabajo #${String(ordenActual.numero_orden).padStart(6, '0')}`,
            text: `Tiene una orden de trabajo de Global Pro Automotriz`,
            url: link
        });
    } else {
        copiarLink(link);
    }
}

function copiarLink(link) {
    navigator.clipboard.writeText(link).then(() => {
        mostrarNotificacion('success', 'Link Copiado', 'El link ha sido copiado al portapapeles');
    }).catch(() => {
        // Fallback para navegadores antiguos
        const input = document.createElement('input');
        input.value = link;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        mostrarNotificacion('success', 'Link Copiado', 'El link ha sido copiado al portapapeles');
    });
}

// ============================================
// UTILIDADES
// ============================================

function formatearMonto(monto) {
    // Redondear a entero y formatear sin decimales
    const montoEntero = Math.round(monto || 0);
    return montoEntero.toLocaleString('es-CL');
}

function formatearMontoConSimbolo(monto) {
    return '$' + formatearMonto(monto);
}

function obtenerClaseEstado(estado) {
    switch (estado) {
        case 'Enviada': return 'estado-enviada';
        case 'Aprobada': return 'estado-aprobada';
        case 'Cancelada': return 'estado-cancelada';
        default: return 'bg-secondary';
    }
}

function obtenerIconoEstado(estado) {
    switch (estado) {
        case 'Enviada': return '🟠';
        case 'Aprobada': return '🟢';
        case 'Cancelada': return '🔴';
        default: return '⚪';
    }
}

function mostrarLoading(mostrar) {
    const loading = document.getElementById('loading');
    if (mostrar) {
        loading.classList.add('show');
    } else {
        loading.classList.remove('show');
    }
}

function mostrarNotificacion(tipo, titulo, mensaje) {
    const toast = document.getElementById('toast');
    const toastHeader = document.getElementById('toast-header');
    const toastTitle = document.getElementById('toast-title');
    const toastBody = document.getElementById('toast-body');
    
    toastTitle.textContent = titulo;
    toastBody.textContent = mensaje;
    
    // Configurar colores según tipo
    toastHeader.className = 'toast-header';
    switch (tipo) {
        case 'success':
            toastHeader.classList.add('bg-success', 'text-white');
            break;
        case 'error':
            toastHeader.classList.add('bg-danger', 'text-white');
            break;
        case 'warning':
            toastHeader.classList.add('bg-warning');
            break;
        default:
            toastHeader.classList.add('bg-primary', 'text-white');
    }
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

// ============================================
// GESTIÓN DE TÉCNICOS
// ============================================

function mostrarSeccion(seccion) {
    // Ocultar todas las secciones
    document.getElementById('seccion-crear').style.display = 'none';
    document.getElementById('seccion-buscar').style.display = 'none';
    const seccionTecnicos = document.getElementById('seccion-tecnicos');
    if (seccionTecnicos) {
        seccionTecnicos.style.display = 'none';
    }

    // Mostrar la sección seleccionada
    document.getElementById('seccion-' + seccion).style.display = 'block';

    // Actualizar nav
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    if (event && event.target) {
        event.target.classList.add('active');
    }

    // Si es la sección de técnicos, cargar datos
    if (seccion === 'tecnicos') {
        cargarTecnicos();
    }
}

async function cargarTecnicos() {
    try {
        const response = await fetch(`${API_BASE}/admin/tecnicos`);
        const data = await response.json();

        if (data.success && data.tecnicos) {
            renderizarListaTecnicos(data.tecnicos);
            actualizarSelectTecnicos(data.tecnicos);
        } else {
            document.getElementById('lista-tecnicos').innerHTML = `
                <div class="text-center text-muted py-3">
                    <p>No hay técnicos registrados</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error al cargar técnicos:', error);
        document.getElementById('lista-tecnicos').innerHTML = `
            <div class="text-center text-danger py-3">
                <p>Error al cargar técnicos</p>
            </div>
        `;
    }
}

function renderizarListaTecnicos(tecnicos) {
    if (tecnicos.length === 0) {
        document.getElementById('lista-tecnicos').innerHTML = `
            <div class="text-center text-muted py-3">
                <p>No hay técnicos registrados</p>
            </div>
        `;
        return;
    }

    let html = '<div class="table-responsive"><table class="table table-hover">';
    html += '<thead><tr><th>Nombre</th><th>Teléfono</th><th>Email</th><th>Estado</th><th>Registro</th></tr></thead><tbody>';

    tecnicos.forEach(tecnico => {
        const estadoBadge = tecnico.activo
            ? '<span class="badge bg-success">Activo</span>'
            : '<span class="badge bg-secondary">Inactivo</span>';

        const fechaRegistro = tecnico.fecha_registro
            ? new Date(tecnico.fecha_registro).toLocaleDateString('es-CL')
            : 'N/A';

        html += `
            <tr>
                <td>${tecnico.nombre}</td>
                <td>${tecnico.telefono}</td>
                <td>${tecnico.email || 'N/A'}</td>
                <td>${estadoBadge}</td>
                <td>${fechaRegistro}</td>
            </tr>
        `;
    });

    html += '</tbody></table></div>';
    document.getElementById('lista-tecnicos').innerHTML = html;
}

function actualizarSelectTecnicos(tecnicos) {
    const select = document.getElementById('asignar-tecnico-id');
    if (!select) return;

    // Mantener solo la primera opción
    select.innerHTML = '<option value="">Seleccione un técnico...</option>';

    tecnicos.forEach(tecnico => {
        if (tecnico.activo) {
            const option = document.createElement('option');
            option.value = tecnico.id;
            option.textContent = `${tecnico.nombre} (${tecnico.telefono})`;
            select.appendChild(option);
        }
    });
}

async function registrarTecnico(event) {
    event.preventDefault();

    const tecnicoData = {
        nombre: document.getElementById('tecnico-nombre').value,
        telefono: document.getElementById('tecnico-telefono').value,
        email: document.getElementById('tecnico-email').value || null,
        pin: document.getElementById('tecnico-pin').value
    };

    try {
        const response = await fetch(`${API_BASE}/admin/tecnicos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tecnicoData)
        });

        const data = await response.json();

        if (data.success) {
            mostrarNotificacion('success', 'Técnico Registrado', 'El técnico ha sido registrado exitosamente');
            document.getElementById('form-tecnico').reset();
            cargarTecnicos();
        } else {
            mostrarNotificacion('error', 'Error', data.error || 'Error al registrar técnico');
        }
    } catch (error) {
        console.error('Error al registrar técnico:', error);
        mostrarNotificacion('error', 'Error', 'Error de conexión');
    }
}

async function asignarOrden() {
    const ordenId = document.getElementById('asignar-orden-id').value;
    const tecnicoId = document.getElementById('asignar-tecnico-id').value;

    if (!ordenId || !tecnicoId) {
        mostrarNotificacion('warning', 'Faltan Datos', 'Ingrese el número de orden y seleccione un técnico');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/admin/asignar-orden`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orden_id: ordenId,
                tecnico_id: tecnicoId
            })
        });

        const data = await response.json();

        if (data.success) {
            mostrarNotificacion('success', 'Orden Asignada', 'La orden ha sido asignada exitosamente');
            document.getElementById('asignar-orden-id').value = '';
            document.getElementById('asignar-tecnico-id').value = '';
        } else {
            mostrarNotificacion('error', 'Error', data.error || 'Error al asignar orden');
        }
    } catch (error) {
        console.error('Error al asignar orden:', error);
        mostrarNotificacion('error', 'Error', 'Error de conexión');
    }
}

// ============================================
// RESUMEN DE TÉCNICOS
// ============================================

async function cargarResumenTecnicos() {
    const periodo = document.getElementById('filtro-periodo').value;
    const tecnicoId = document.getElementById('filtro-tecnico').value;

    try {
        let url = `${API_BASE}/admin/resumen-tecnicos?periodo=${periodo}`;
        if (tecnicoId) {
            url += `&tecnico_id=${tecnicoId}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            mostrarResumenTecnicos(data);
        } else {
            mostrarNotificacion('error', 'Error', data.error || 'Error al cargar resumen');
        }
    } catch (error) {
        console.error('Error al cargar resumen técnicos:', error);
        mostrarNotificacion('error', 'Error', 'Error de conexión');
    }
}

function mostrarResumenTecnicos(data) {
    // Actualizar totales generales
    document.getElementById('total-general-monto').textContent =
        formatearMontoConSimbolo(data.total_general.total_monto_sistema || 0);
    document.getElementById('total-general-ordenes').textContent =
        data.total_general.total_ordenes_sistema || 0;
    document.getElementById('total-general-promedio').textContent =
        formatearMontoConSimbolo(data.total_general.promedio_sistema || 0);

    // Mostrar estadísticas por técnico
    const tbody = document.getElementById('tabla-resumen-tecnicos');

    if (!data.estadisticas || data.estadisticas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted py-4">
                    <i class="fas fa-info-circle me-2"></i>No hay datos para mostrar en este período
                </td>
            </tr>
        `;
        return;
    }

    let html = '';
    data.estadisticas.forEach(tecnico => {
        const promedio = tecnico.promedio_monto || 0;
        const ultimaOrden = tecnico.ultima_orden ?
            new Date(tecnico.ultima_orden).toLocaleDateString('es-CL') : 'N/A';

        html += `
            <tr>
                <td>
                    <strong>${tecnico.nombre}</strong>
                </td>
                <td>${tecnico.telefono}</td>
                <td class="text-center">
                    <span class="badge bg-primary">${tecnico.total_ordenes || 0}</span>
                </td>
                <td class="text-center">
                    <span class="badge bg-success">${tecnico.ordenes_completadas || 0}</span>
                </td>
                <td class="text-center">
                    <span class="badge bg-warning">${tecnico.ordenes_en_proceso || 0}</span>
                </td>
                <td class="text-center">
                    <span class="badge bg-info">${tecnico.ordenes_aprobadas || 0}</span>
                </td>
                <td class="text-end">
                    <strong class="text-success">${formatearMontoConSimbolo(tecnico.total_monto || 0)}</strong>
                </td>
                <td class="text-end">
                    ${formatearMontoConSimbolo(promedio)}
                </td>
                <td class="text-center">
                    <small class="text-muted">${ultimaOrden}</small>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// Cargar técnicos para el filtro
async function cargarTecnicosParaFiltro() {
    try {
        const response = await fetch(`${API_BASE}/admin/tecnicos`);
        const data = await response.json();

        if (data.success && data.tecnicos) {
            const select = document.getElementById('filtro-tecnico');
            select.innerHTML = '<option value="">Todos los técnicos</option>';

            data.tecnicos.forEach(tecnico => {
                if (tecnico.activo) {
                    const option = document.createElement('option');
                    option.value = tecnico.id;
                    option.textContent = tecnico.nombre;
                    select.appendChild(option);
                }
            });
        }
    } catch (error) {
        console.error('Error al cargar técnicos para filtro:', error);
    }
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    // ... código existente ...

    // Cargar técnicos para el filtro del resumen
    cargarTecnicosParaFiltro();
});
