// ============================================
// APP.JS - Aplicación Móvil para Técnicos
// Global Pro Automotriz
// ============================================

const API_BASE = '/api/tecnico';
let tecnicoActual = null;
let ordenActual = null;
let ordenes = [];
let fotoTipoActual = null;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si hay sesión activa
    const sesionGuardada = localStorage.getItem('tecnico_sesion');
    if (sesionGuardada) {
        tecnicoActual = JSON.parse(sesionGuardada);
        mostrarApp();
    }

    // Configurar input de foto
    document.getElementById('foto-input').addEventListener('change', handleFotoSeleccionada);
});

// ============================================
// AUTENTICACIÓN
// ============================================

async function login() {
    const telefono = document.getElementById('telefono-login').value.trim();
    const pin = document.getElementById('pin-login').value.trim();
    const errorMsg = document.getElementById('login-error');

    if (!telefono || !pin) {
        mostrarErrorLogin('Ingrese teléfono y PIN');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telefono, pin })
        });

        const data = await response.json();

        if (data.success) {
            tecnicoActual = data.tecnico;
            localStorage.setItem('tecnico_sesion', JSON.stringify(tecnicoActual));
            mostrarApp();
        } else {
            mostrarErrorLogin(data.error || 'Credenciales incorrectas');
        }
    } catch (error) {
        console.error('Error en login:', error);
        mostrarErrorLogin('Error de conexión');
    }
}

function mostrarErrorLogin(mensaje) {
    const errorMsg = document.getElementById('login-error');
    errorMsg.textContent = mensaje;
    errorMsg.style.display = 'block';
}

function logout() {
    tecnicoActual = null;
    ordenActual = null;
    localStorage.removeItem('tecnico_sesion');
    document.getElementById('login-screen').style.display = 'block';
    document.getElementById('app-screen').style.display = 'none';
    document.getElementById('telefono-login').value = '';
    document.getElementById('pin-login').value = '';
}

function mostrarApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'block';
    document.getElementById('tecnico-nombre').textContent = tecnicoActual.nombre;
    cargarOrdenes();
}

// ============================================
// NAVEGACIÓN Y TABS
// ============================================

function showTab(tabName) {
    // Ocultar todos los tabs
    document.getElementById('tab-pendientes').style.display = 'none';
    document.getElementById('tab-en-curso').style.display = 'none';
    document.getElementById('tab-completadas').style.display = 'none';

    // Mostrar el tab seleccionado
    document.getElementById(`tab-${tabName}`).style.display = 'block';

    // Actualizar tabs superiores
    document.querySelectorAll('#main-tabs .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');

    // Actualizar navegación inferior
    document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.classList.add('active');
}

// ============================================
// CARGAR ÓRDENES
// ============================================

async function cargarOrdenes() {
    if (!tecnicoActual) return;

    try {
        const response = await fetch(`${API_BASE}/ordenes?tecnico_id=${tecnicoActual.id}`);
        const data = await response.json();

        if (data.success) {
            ordenes = data.ordenes;
            renderizarOrdenes();
        }
    } catch (error) {
        console.error('Error al cargar órdenes:', error);
        mostrarNotificacion('error', 'Error', 'No se pudieron cargar las órdenes');
    }
}

function renderizarOrdenes() {
    const pendientes = ordenes.filter(o =>
        ['Pendiente Visita', 'Pendiente Piezas'].includes(o.estado_trabajo)
    );

    const enCurso = ordenes.filter(o =>
        ['En Sitio', 'En Progreso'].includes(o.estado_trabajo)
    );

    const completadas = ordenes.filter(o =>
        ['Completada', 'Aprobada', 'Usuario Satisfecho', 'No Completada', 'Cerrada'].includes(o.estado_trabajo)
    );

    renderizarListaOrdenes('ordenes-pendientes', pendientes);
    renderizarListaOrdenes('ordenes-en-curso', enCurso);
    renderizarListaOrdenes('ordenes-completadas', completadas);
}

function renderizarListaOrdenes(containerId, ordenesLista) {
    const container = document.getElementById(containerId);

    if (ordenesLista.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5 text-white">
                <i class="fas fa-inbox fa-3x mb-3"></i>
                <p>No hay órdenes en esta categoría</p>
            </div>
        `;
        return;
    }

    let html = '';
    ordenesLista.forEach(orden => {
        const estadoClass = obtenerClaseEstado(orden.estado_trabajo);
        const numeroFormateado = String(orden.numero_orden).padStart(6, '0');

        html += `
            <div class="orden-card" onclick="verOrden(${orden.id})">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <h6 class="mb-1 fw-bold">#${numeroFormateado}</h6>
                        <span class="estado-badge ${estadoClass}">${orden.estado_trabajo}</span>
                    </div>
                    <i class="fas fa-chevron-right text-muted"></i>
                </div>
                <div class="detail-row mb-0">
                    <i class="fas fa-car"></i>
                    <span>${orden.marca} ${orden.modelo} <strong>${orden.patente_placa}</strong></span>
                </div>
                <div class="detail-row mb-0">
                    <i class="fas fa-user"></i>
                    <span>${orden.cliente_nombre}</span>
                </div>
                <div class="detail-row mb-0">
                    <i class="fas fa-map-marker-alt"></i>
                    <span class="text-truncate" style="max-width: 200px;">${orden.direccion || 'Sin dirección'}</span>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// ============================================
// VER DETALLE DE ORDEN
// ============================================

async function verOrden(ordenId) {
    try {
        const response = await fetch(`${API_BASE}/orden?id=${ordenId}&tecnico_id=${tecnicoActual.id}`);
        const data = await response.json();

        if (data.success) {
            ordenActual = data.orden;
            mostrarOrdenEnModal(ordenActual);
        } else {
            mostrarNotificacion('error', 'Error', data.error || 'No se pudo cargar la orden');
        }
    } catch (error) {
        console.error('Error al ver orden:', error);
        mostrarNotificacion('error', 'Error', 'Error de conexión');
    }
}

function mostrarOrdenEnModal(orden) {
    const numeroFormateado = String(orden.numero_orden).padStart(6, '0');
    const estadoClass = obtenerClaseEstado(orden.estado_trabajo);

    // Información básica
    document.getElementById('modal-numero-orden').textContent = numeroFormateado;
    document.getElementById('modal-cliente').textContent = orden.cliente_nombre || 'N/A';
    document.getElementById('modal-direccion').textContent = orden.direccion || orden.referencia_direccion || 'Sin dirección';
    document.getElementById('modal-vehiculo').textContent = `${orden.marca || ''} ${orden.modelo || ''} ${orden.anio || ''}`;
    document.getElementById('modal-patente').textContent = orden.patente_placa || 'N/A';
    document.getElementById('modal-estado').textContent = orden.estado_trabajo;
    document.getElementById('modal-estado').className = `estado-badge ${estadoClass}`;

    // Configurar mapa
    if (orden.direccion) {
        const query = encodeURIComponent(orden.direccion + ', Chile');
        document.getElementById('map-frame').src =
            `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${query}`;
        document.getElementById('map-container').style.display = 'block';
    } else {
        document.getElementById('map-container').style.display = 'none';
    }

    // Renderizar trabajos
    let trabajosHtml = '';
    if (orden.trabajo_frenos) trabajosHtml += `<p>✓ Frenos: ${orden.detalle_frenos || 'Sin detalle'}</p>`;
    if (orden.trabajo_luces) trabajosHtml += `<p>✓ Luces: ${orden.detalle_luces || 'Sin detalle'}</p>`;
    if (orden.trabajo_tren_delantero) trabajosHtml += `<p>✓ Tren Delantero: ${orden.detalle_tren_delantero || 'Sin detalle'}</p>`;
    if (orden.trabajo_correas) trabajosHtml += `<p>✓ Correas: ${orden.detalle_correas || 'Sin detalle'}</p>`;
    if (orden.trabajo_componentes) trabajosHtml += `<p>✓ Componentes: ${orden.detalle_componentes || 'Sin detalle'}</p>`;
    document.getElementById('modal-trabajos').innerHTML = trabajosHtml || '<p class="text-muted">Sin trabajos</p>';

    // Mostrar notas de cierre si existen
    document.getElementById('modal-notas').innerHTML = orden.notas ? `<p>${orden.notas.replace(/\n/g, '<br>')}</p>` : '<p class="text-muted">Sin notas de cierre</p>';

    // Mostrar flag de orden cerrada según estado_trabajo
    const estaCerrada = orden.estado_trabajo === 'Cerrada';
    const checkboxCerrada = document.getElementById('modal-orden-cerrada');
    if (checkboxCerrada) {
        checkboxCerrada.checked = estaCerrada;
    }

    // Renderizar acciones según estado
    renderizarAcciones(orden);

    // Cargar fotos, notas y historial
    cargarFotos(orden.id);
    cargarNotas(orden.id);
    cargarHistorial(orden.id);

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalOrden'));
    modal.show();
}

function renderizarAcciones(orden) {
    const container = document.getElementById('acciones-container');
    let html = '';

    switch (orden.estado_trabajo) {
        case 'Pendiente Visita':
            html = `
                <button class="btn btn-gps action-btn" onclick="navegarGPS()">
                    <i class="fas fa-map-marked-alt me-2"></i>Navegar al Lugar
                </button>
                <button class="btn btn-iniciar action-btn" onclick="llegarAlSitio()">
                    <i class="fas fa-map-pin me-2"></i>Llegué al Sitio
                </button>
            `;
            break;
        case 'En Sitio':
            html = `
                <button class="btn btn-iniciar action-btn" onclick="iniciarTrabajo()">
                    <i class="fas fa-play me-2"></i>Iniciar Trabajo
                </button>
            `;
            break;
        case 'En Progreso':
            html = `
                <button class="btn btn-completar action-btn" onclick="mostrarConfirmacionCompletar()">
                    <i class="fas fa-check me-2"></i>Completar Trabajo
                </button>
                <button class="btn btn-no-completar action-btn" onclick="abrirModalNoCompletada()">
                    <i class="fas fa-times me-2"></i>No Completado
                </button>
            `;
            break;
        case 'Pendiente Piezas':
            html = `
                <button class="btn btn-iniciar action-btn" onclick="retomarTrabajo()">
                    <i class="fas fa-play me-2"></i>Retomar Trabajo
                </button>
            `;
            break;
        case 'Completada':
            html = `
                <div class="text-center">
                    <p class="text-success"><i class="fas fa-check-circle me-2"></i>Trabajo completado</p>
                    <button class="btn btn-success action-btn" onclick="aceptarYCerrarOrden()">
                        <i class="fas fa-check me-2"></i>Aceptar y Cerrar Orden
                    </button>
                </div>
            `;
            break;
        case 'Usuario Satisfecho':
            html = `
                <div class="text-center">
                    <p class="text-success"><i class="fas fa-check-double me-2"></i>Cliente satisfecho con el trabajo</p>
                    <button class="btn btn-success action-btn" onclick="cerrarOrden()">
                        <i class="fas fa-lock me-2"></i>Cerrar Orden
                    </button>
                </div>
            `;
            break;
        case 'Cerrada':
            html = `
                <div class="text-center">
                    <p class="text-success"><i class="fas fa-check-circle me-2"></i>Orden ya cerrada</p>
                    <button class="btn btn-secondary action-btn" disabled>
                        <i class="fas fa-lock me-2"></i>Ya cerrada
                    </button>
                </div>
            `;
            break;
        case 'No Completada':
            html = `<p class="text-center text-warning"><i class="fas fa-exclamation-triangle me-2"></i>Orden No Completada</p>`;
            break;
    }

    container.innerHTML = html;
}

// ============================================
// ACCIONES DE TRABAJO
// ============================================

function navegarGPS() {
    if (!ordenActual || !ordenActual.direccion) {
        mostrarNotificacion('warning', 'Sin Dirección', 'Esta orden no tiene dirección registrada');
        return;
    }

    const query = encodeURIComponent(ordenActual.direccion);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
}

async function llegarAlSitio() {
    try {
        const posicion = await obtenerPosicionGPS();

        const response = await fetch(`${API_BASE}/cambiar-estado`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orden_id: ordenActual.id,
                tecnico_id: tecnicoActual.id,
                nuevo_estado: 'En Sitio',
                latitud: posicion.lat,
                longitud: posicion.lng
            })
        });

        const data = await response.json();

        if (data.success) {
            ordenActual.estado_trabajo = 'En Sitio';
            mostrarNotificacion('success', '¡Bien!', 'Has marcado que llegaste al sitio');
            mostrarOrdenEnModal(ordenActual);
            cargarOrdenes();
        } else {
            mostrarNotificacion('error', 'Error', data.error || 'Error al actualizar estado');
        }
    } catch (error) {
        console.error('Error al llegar al sitio:', error);
        mostrarNotificacion('error', 'Error', 'No se pudo actualizar el estado');
    }
}

async function iniciarTrabajo() {
    try {
        const posicion = await obtenerPosicionGPS();

        const response = await fetch(`${API_BASE}/cambiar-estado`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orden_id: ordenActual.id,
                tecnico_id: tecnicoActual.id,
                nuevo_estado: 'En Progreso',
                latitud: posicion.lat,
                longitud: posicion.lng
            })
        });

        const data = await response.json();

        if (data.success) {
            ordenActual.estado_trabajo = 'En Progreso';
            mostrarNotificacion('success', '¡Excelente!', 'Trabajo iniciado');
            mostrarOrdenEnModal(ordenActual);
            cargarOrdenes();
        } else {
            mostrarNotificacion('error', 'Error', data.error || 'Error al actualizar estado');
        }
    } catch (error) {
        console.error('Error al iniciar trabajo:', error);
        mostrarNotificacion('error', 'Error', 'No se pudo iniciar el trabajo');
    }
}

function retomarTrabajo() {
    cambiarEstadoSimple('En Progreso', 'Trabajo retomado');
}

function mostrarConfirmacionCompletar() {
    if (confirm('¿Estás seguro de que has completado el trabajo?')) {
        cambiarEstadoSimple('Completada', 'Trabajo completado exitosamente');
    }
}

function cambiarEstadoSimple(nuevoEstado, mensaje) {
    fetch(`${API_BASE}/cambiar-estado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            orden_id: ordenActual.id,
            tecnico_id: tecnicoActual.id,
            nuevo_estado: nuevoEstado
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            ordenActual.estado_trabajo = nuevoEstado;
            mostrarNotificacion('success', '¡Listo!', mensaje);
            mostrarOrdenEnModal(ordenActual);
            cargarOrdenes();
        } else {
            mostrarNotificacion('error', 'Error', data.error || 'Error al actualizar');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarNotificacion('error', 'Error', 'No se pudo actualizar el estado');
    });
}

// ============================================
// FOTOS
// ============================================

function tomarFoto(tipo) {
    fotoTipoActual = tipo;
    document.getElementById('foto-input').click();
}

function handleFotoSeleccionada(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        const base64 = e.target.result;

        try {
            const response = await fetch(`${API_BASE}/subir-foto`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orden_id: ordenActual.id,
                    tecnico_id: tecnicoActual.id,
                    tipo_foto: fotoTipoActual,
                    imagen: base64
                })
            });

            const data = await response.json();

            if (data.success) {
                mostrarNotificacion('success', '¡Foto Guardada!', 'La foto se ha subido exitosamente');
                cargarFotos(ordenActual.id);
            } else {
                mostrarNotificacion('error', 'Error', data.error || 'Error al subir foto');
            }
        } catch (error) {
            console.error('Error al subir foto:', error);
            mostrarNotificacion('error', 'Error', 'No se pudo subir la foto');
        }
    };

    reader.readAsDataURL(file);
    event.target.value = ''; // Reset input
}

async function cargarFotos(ordenId) {
    try {
        const response = await fetch(`${API_BASE}/fotos?orden_id=${ordenId}`);
        const data = await response.json();

        if (data.success && data.fotos.length > 0) {
            let html = '';
            data.fotos.forEach(foto => {
                html += `
                    <div class="photo-item">
                        <img src="${foto.url_imagen}" alt="${foto.tipo_foto}">
                        <div class="position-absolute top-0 start-0 m-1">
                            <span class="badge bg-dark">${foto.tipo_foto}</span>
                        </div>
                    </div>
                `;
            });
            document.getElementById('fotos-grid').innerHTML = html;
        } else {
            document.getElementById('fotos-grid').innerHTML = '<p class="text-muted text-center">Sin fotos</p>';
        }
    } catch (error) {
        console.error('Error al cargar fotos:', error);
    }
}

// ============================================
// NOTAS
// ============================================

async function agregarNota() {
    const notaInput = document.getElementById('nueva-nota');
    const nota = notaInput.value.trim();

    if (!nota) return;

    try {
        const response = await fetch(`${API_BASE}/agregar-nota`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orden_id: ordenActual.id,
                tecnico_id: tecnicoActual.id,
                nota: nota
            })
        });

        const data = await response.json();

        if (data.success) {
            notaInput.value = '';
            cargarNotas(ordenActual.id);
        } else {
            mostrarNotificacion('error', 'Error', data.error || 'Error al agregar nota');
        }
    } catch (error) {
        console.error('Error al agregar nota:', error);
        mostrarNotificacion('error', 'Error', 'No se pudo agregar la nota');
    }
}

async function cargarNotas(ordenId) {
    try {
        const response = await fetch(`${API_BASE}/notas?orden_id=${ordenId}`);
        const data = await response.json();

        if (data.success && data.notas.length > 0) {
            let html = '';
            data.notas.forEach(nota => {
                const fecha = new Date(nota.fecha_nota);
                const hora = fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
                html += `
                    <div class="note-item">
                        <div class="note-time">${hora}</div>
                        <div>${nota.nota}</div>
                    </div>
                `;
            });
            document.getElementById('notas-lista').innerHTML = html;
        } else {
            document.getElementById('notas-lista').innerHTML = '<p class="text-muted text-center">Sin notas</p>';
        }
    } catch (error) {
        console.error('Error al cargar notas:', error);
    }
}

// ============================================
// HISTORIAL
// ============================================

async function cargarHistorial(ordenId) {
    try {
        const response = await fetch(`${API_BASE}/historial?orden_id=${ordenId}`);
        const data = await response.json();

        if (data.success && data.historial.length > 0) {
            let html = '';
            data.historial.forEach(item => {
                const fecha = new Date(item.fecha_hora);
                const fechaFormateada = fecha.toLocaleString('es-CL');
                html += `
                    <div class="d-flex mb-2">
                        <div class="me-2">
                            <i class="fas fa-circle text-success" style="font-size: 8px;"></i>
                        </div>
                        <div>
                            <div class="fw-bold">${item.estado_nuevo}</div>
                            <div class="small text-muted">${fechaFormateada}</div>
                            ${item.observaciones ? `<div class="small text-info">${item.observaciones}</div>` : ''}
                        </div>
                    </div>
                `;
            });
            document.getElementById('historial-lista').innerHTML = html;
        } else {
            document.getElementById('historial-lista').innerHTML = '<p class="text-muted text-center">Sin historial</p>';
        }
    } catch (error) {
        console.error('Error al cargar historial:', error);
    }
}

// ============================================
// ENVIAR LINK DE FIRMA AL CLIENTE
// ============================================

async function generarTokenFirma() {
    try {
        const response = await fetch(`${API_BASE}/generar-token-firma`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orden_id: ordenActual.id,
                tecnico_id: tecnicoActual.id
            })
        });

        const data = await response.json();

        if (data.success) {
            return data.token;
        } else {
            mostrarNotificacion('error', 'Error', data.error || 'Error al generar token');
            return null;
        }
    } catch (error) {
        console.error('Error al generar token:', error);
        mostrarNotificacion('error', 'Error', 'No se pudo generar el link');
        return null;
    }
}

function enviarLinkFirma(notasCierre = null, pagoCompletado = null, metodoPago = null) {
    generarTokenFirma().then(token => {
        if (!token) return;

        let linkFirma = `${window.location.origin}/aprobar-tecnico?token=${token}`;
        if (notasCierre) linkFirma += `&notas=${encodeURIComponent(notasCierre)}`;
        if (pagoCompletado !== null) linkFirma += `&pago_completado=${pagoCompletado}`;
        if (metodoPago) linkFirma += `&metodo_pago=${encodeURIComponent(metodoPago)}`;

        let mensajeCompleto = `Hola, su orden de trabajo #${String(ordenActual.numero_orden).padStart(6,'0')} está lista para su aceptación final.\n` +
            `Resumen:\n` +
            `Cliente: ${ordenActual.cliente_nombre || 'N/A'}\n` +
            `Patente: ${ordenActual.patente_placa || 'N/A'}\n` +
            `Trabajo: ${ordenActual.trabajo_frenos ? 'Frenos ' : ''}${ordenActual.trabajo_luces ? 'Luces ' : ''}${ordenActual.trabajo_tren_delantero ? 'Tren delantero ' : ''}${ordenActual.trabajo_correas ? 'Correas ' : ''}${ordenActual.trabajo_componentes ? 'Componentes ' : ''}\n` +
            `Monto total: $${Number(ordenActual.monto_total || 0).toFixed(2)}\n` +
            `Restante: $${Number(ordenActual.monto_restante || 0).toFixed(2)}\n`;

        if (notasCierre) {
            mensajeCompleto += `Notas del técnico: ${notasCierre}\n`;
        }

        mensajeCompleto += `Por favor ingrese al siguiente link para revisar y firmar la aceptación:\n${linkFirma}`;

        // Abrir WhatsApp si teléfono cliente existe
        if (ordenActual && ordenActual.cliente_telefono) {
            const telefonoLimpio = ordenActual.cliente_telefono.replace(/\D/g, '');
            const whatsappUrl = `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(mensajeCompleto)}`;
            window.open(whatsappUrl, '_blank');
        }

        // Mostrar modal con link + opción para abrir la página de firma directamente
        mostrarModalLinkFirma(linkFirma, mensajeCompleto);
    });
}

function copiarLinkFirma() {
    generarTokenFirma().then(token => {
        if (!token) return;

        const linkFirma = `${window.location.origin}/aprobar-tecnico?token=${token}`;

        navigator.clipboard.writeText(linkFirma).then(() => {
            mostrarNotificacion('success', 'Link Copiado', 'El link ha sido copiado al portapapeles');
        }).catch(() => {
            // Fallback para navegadores antiguos
            const input = document.createElement('input');
            input.value = linkFirma;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            mostrarNotificacion('success', 'Link Copiado', 'El link ha sido copiado al portapapeles');
        });
    });
}

function mostrarModalLinkFirma(link, mensaje = null) {
    // Crear modal dinámicamente
    const modalHtml = `
        <div class="modal fade" id="modalLinkFirma" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title">Link de Firma Generado</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p class="text-muted">Envíe este link al cliente para que firme la orden y confirme el trabajo:</p>
                        <div class="input-group mb-3">
                            <input type="text" class="form-control" value="${link}" readonly id="link-firma-input">
                            <button class="btn btn-outline-success" onclick="copiarLinkFirmaModal('${link}')">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                        <div class="d-grid gap-2 mb-3">
                            <button class="btn btn-primary" onclick="window.open('${link}', '_blank')">
                                <i class="fas fa-external-link-alt me-2"></i>Abrir página de firma
                            </button>
                        </div>
                        ${mensaje ? `<p class="small text-muted">Mensaje prellenado WhatsApp:<br>${mensaje.replace(/\n/g,'<br>')}</p>` : ''}
                        <div class="alert alert-info small">
                            <i class="fas fa-info-circle me-2"></i>
                            El cliente tendrá un resumen de la orden + canvas de firma en la página.
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Eliminar modal existente si hay uno
    const modalExistente = document.getElementById('modalLinkFirma');
    if (modalExistente) {
        modalExistente.remove();
    }

    // Agregar nuevo modal
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalLinkFirma'));
    modal.show();
}

function copiarLinkFirmaModal(link) {
    navigator.clipboard.writeText(link).then(() => {
        mostrarNotificacion('success', 'Link Copiado', 'El link ha sido copiado al portapapeles');
    }).catch(() => {
        const input = document.createElement('input');
        input.value = link;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        mostrarNotificacion('success', 'Link Copiado', 'El link ha sido copiado al portapapeles');
    });
}

async function aceptarYCerrarOrden() {
    if (!ordenActual || !tecnicoActual) {
        mostrarNotificacion('error', 'Error', 'No se puede procesar la orden en este momento');
        return;
    }

    if (ordenActual.estado_trabajo === 'Cerrada') {
        mostrarNotificacion('warning', 'Orden cerrada', 'Esta orden ya está cerrada y no puede volver a procesarse.');
        return;
    }

    if (ordenActual.firma_imagen) {
        mostrarNotificacion('info', 'Firmado', 'La orden ya está firmada por el cliente. Se cerrará ahora.');
    }

    // Pedir información de cierre al técnico
    const notasCierre = prompt('Agregar notas de cierre (opcional)');

    const pagoCompletado = confirm('¿El cliente terminó de cancelar?');
    let metodoPago = null;
    let notaPago = '';

    if (pagoCompletado) {
        metodoPago = prompt('Método de pago (Efectivo / Transferencia)').trim();
        if (!metodoPago) {
            metodoPago = 'No especificado';
        }
        notaPago = `Pago completado. Método: ${metodoPago}`;
    } else {
        const motivoNoPago = prompt('Indica motivo por el cual no terminó de cancelar (opcional)');
        notaPago = motivoNoPago ? `Pago pendiente: ${motivoNoPago}` : 'Pago pendiente: no especificó motivo';
    }

    const restante = Number(ordenActual.monto_restante || 0);
    let notaSaldo = '';
    if (restante > 0) {
        notaSaldo = `Saldo pendiente: $${restante.toFixed(2)}`;
    } else if (restante < 0) {
        notaSaldo = `Saldo a favor del cliente: $${Math.abs(restante).toFixed(2)}`;
    } else {
        notaSaldo = 'Saldo cancelado completamente.';
    }

    const notasFinales = [notasCierre, notaPago, notaSaldo].filter(Boolean).join(' | ');

    // Guardar temporalmente las notas para usar en la firma
    ordenActual.notas_cierre_temp = notasFinales;
    ordenActual.pago_completado_temp = pagoCompletado;
    ordenActual.metodo_pago_temp = metodoPago;

    // Enviar link para firma con la información
    mostrarNotificacion('info', 'Enviando link', 'Enviando link de aceptación al cliente...');
    enviarLinkFirma(notasFinales, pagoCompletado, metodoPago);
}

function ordenarMontoRestante() {
    if (!ordenActual) return;
    if ( Number(ordenActual.monto_restante || 0) > 0 && confirm('¿Registrar el saldo pendiente como pagado?')) {
        ordenActual.monto_restante = 0;
    }
}

function enviarResumenWhatsApp() {
    if (!ordenActual) return;

    const tel = ordenActual.cliente_telefono.replace(/\D/g, '');
    const mensaje = encodeURIComponent(`Pedido #${String(ordenActual.numero_orden).padStart(6, '0')} cerrado.\n` +
        `Cliente: ${ordenActual.cliente_nombre || 'N/A'}\n` +
        `Vehículo: ${ordenActual.marca || 'N/A'} ${ordenActual.modelo || ''} ${ordenActual.patente_placa || ''}\n` +
        `Estado final: ${ordenActual.estado_trabajo || ordenActual.estado}\n` +
        `Fecha cierre: ${new Date().toLocaleString('es-CL')}\n` +
        `Gracias por su confianza en Global Pro!`);

    const whatsappUrl = `https://wa.me/${tel}?text=${mensaje}`;
    window.open(whatsappUrl, '_blank');
}

// ============================================
// ORDEN NO COMPLETADA
// ============================================

function abrirModalNoCompletada() {
    const modal = new bootstrap.Modal(document.getElementById('modalNoCompletada'));
    modal.show();
}

async function guardarNoCompletada() {
    const motivo = document.getElementById('motivo-no-completada').value;
    const detalles = document.getElementById('detalles-no-completada').value.trim();

    if (!motivo) {
        mostrarNotificacion('warning', 'Falta Motivo', 'Seleccione el motivo por el cual no se completó');
        return;
    }

    try {
        let posicion = {};
        try {
            posicion = await obtenerPosicionGPS();
        } catch (e) {
            console.log('No se pudo obtener GPS');
        }

        const response = await fetch(`${API_BASE}/cambiar-estado`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orden_id: ordenActual.id,
                tecnico_id: tecnicoActual.id,
                nuevo_estado: 'No Completada',
                observaciones: `${motivo}. ${detalles}`,
                latitud: posicion.lat || null,
                longitud: posicion.lng || null
            })
        });

        const data = await response.json();

        if (data.success) {
            ordenActual.estado_trabajo = 'No Completada';
            mostrarNotificacion('warning', 'Reportado', 'La orden ha sido marcada como no completada');

            // Cerrar modal y actualizar
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalNoCompletada'));
            modal.hide();

            mostrarOrdenEnModal(ordenActual);
            cargarOrdenes();
        } else {
            mostrarNotificacion('error', 'Error', data.error || 'Error al reportar');
        }
    } catch (error) {
        console.error('Error al guardar no completada:', error);
        mostrarNotificacion('error', 'Error', 'No se pudo reportar');
    }
}

// ============================================
// UTILIDADES
// ============================================

function obtenerPosicionGPS() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocalización no soportada'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            (error) => {
                reject(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
}

function obtenerClaseEstado(estado) {
    const clases = {
        'Pendiente Visita': 'estado-pendiente-visita',
        'En Sitio': 'estado-en-sitio',
        'En Progreso': 'estado-en-progreso',
        'Pendiente Piezas': 'estado-pendiente-piezas',
        'Completada': 'estado-completada',
        'Aprobada': 'estado-aprobada',
        'Usuario Satisfecho': 'estado-aprobada',
        'No Completada': 'estado-no-completada',
        'Cerrada': 'estado-cerrada'
    };
    return clases[estado] || 'bg-secondary';
}

function mostrarNotificacion(tipo, titulo, mensaje) {
    // Crear toast dinámicamente
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    toastContainer.style.zIndex = '9999';

    const bgClass = tipo === 'success' ? 'bg-success' :
                    tipo === 'error' ? 'bg-danger' :
                    tipo === 'warning' ? 'bg-warning' : 'bg-primary';

    toastContainer.innerHTML = `
        <div class="toast show" role="alert">
            <div class="toast-header ${bgClass} text-white">
                <strong class="me-auto">${titulo}</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${mensaje}
            </div>
        </div>
    `;

    document.body.appendChild(toastContainer);

    // Remover después de 3 segundos
    setTimeout(() => {
        toastContainer.remove();
    }, 3000);
}

// Actualizar órdenes cada 30 segundos
setInterval(() => {
    if (tecnicoActual && document.getElementById('app-screen').style.display !== 'none') {
        cargarOrdenes();
    }
}, 30000);
