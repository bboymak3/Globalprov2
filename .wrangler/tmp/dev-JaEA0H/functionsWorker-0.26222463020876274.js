var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-P8RYhC/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/pages-IxGhmE/functionsWorker-0.26222463020876274.mjs
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
var urls2 = /* @__PURE__ */ new Set();
function checkURL2(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls2.has(url.toString())) {
      urls2.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL2, "checkURL");
__name2(checkURL2, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL2(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});
async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const data = await request.json();
    if (!data.orden_id || !data.tecnico_id) {
      return new Response(JSON.stringify({
        success: false,
        error: "Faltan datos: orden_id y tecnico_id"
      }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }
    const orden = await env.DB.prepare(
      "SELECT id FROM OrdenesTrabajo WHERE id = ? AND estado = 'Aprobada'"
    ).bind(data.orden_id).first();
    if (!orden) {
      return new Response(JSON.stringify({
        success: false,
        error: "Orden no encontrada o no est\xE1 aprobada"
      }), {
        headers: { "Content-Type": "application/json" },
        status: 404
      });
    }
    const tecnico = await env.DB.prepare(
      "SELECT id, nombre FROM Tecnicos WHERE id = ? AND activo = 1"
    ).bind(data.tecnico_id).first();
    if (!tecnico) {
      return new Response(JSON.stringify({
        success: false,
        error: "T\xE9cnico no encontrado o no est\xE1 activo"
      }), {
        headers: { "Content-Type": "application/json" },
        status: 404
      });
    }
    const ordenActual = await env.DB.prepare(
      "SELECT tecnico_asignado_id FROM OrdenesTrabajo WHERE id = ?"
    ).bind(data.orden_id).first();
    if (ordenActual && ordenActual.tecnico_asignado_id) {
      return new Response(JSON.stringify({
        success: false,
        error: "La orden ya est\xE1 asignada a un t\xE9cnico"
      }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }
    await env.DB.prepare(`
      UPDATE OrdenesTrabajo
      SET tecnico_asignado_id = ?,
          estado_trabajo = 'Pendiente Visita'
      WHERE id = ?
    `).bind(data.tecnico_id, data.orden_id).run();
    return new Response(JSON.stringify({
      success: true,
      mensaje: `Orden asignada al t\xE9cnico ${tecnico.nombre}`
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error al asignar orden:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
}
__name(onRequestPost, "onRequestPost");
__name2(onRequestPost, "onRequestPost");
async function onRequestGet(context) {
  const { env } = context;
  try {
    const ordenes = await env.DB.prepare(`
      SELECT
        id,
        numero_orden,
        token,
        patente_placa,
        marca,
        modelo,
        cliente_nombre,
        fecha_aprobacion,
        fecha_completado,
        estado_trabajo,
        tecnico_asignado_id
      FROM OrdenesTrabajo
      WHERE estado = 'Aprobada' OR estado_trabajo = 'Cerrada'
      ORDER BY fecha_aprobacion DESC
    `).all();
    const ordenesFormateadas = (ordenes.results || []).map((orden) => ({
      ...orden,
      numero_orden_formateado: String(orden.numero_orden).padStart(6, "0"),
      asignada: orden.tecnico_asignado_id !== null,
      estado_cerrada: orden.estado_trabajo === "Cerrada",
      estado_resumen: orden.estado_trabajo === "Cerrada" ? "Cerrada" : orden.estado || "N/A"
    }));
    return new Response(JSON.stringify({
      success: true,
      ordenes: ordenesFormateadas
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error al obtener \xF3rdenes aprobadas:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
}
__name(onRequestGet, "onRequestGet");
__name2(onRequestGet, "onRequestGet");
async function onRequestGet2(context) {
  const { request, env } = context;
  try {
    const ordenes = await env.DB.prepare(
      `SELECT id, numero_orden, patente_placa, cliente_nombre, fecha_creacion
       FROM OrdenesTrabajo
       WHERE estado = 'Aprobada' AND (tecnico_asignado_id IS NULL OR tecnico_asignado_id = '')
       ORDER BY fecha_creacion DESC`
    ).all();
    return new Response(JSON.stringify({
      success: true,
      ordenes: ordenes.results || []
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error al obtener \xF3rdenes disponibles:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
}
__name(onRequestGet2, "onRequestGet2");
__name2(onRequestGet2, "onRequestGet");
async function onRequestGet3(context) {
  const { env, request } = context;
  try {
    const url = new URL(request.url);
    const tecnicoId = url.searchParams.get("tecnico_id");
    const periodo = url.searchParams.get("periodo") || "mes";
    if (!tecnicoId) {
      return new Response(JSON.stringify({
        success: false,
        error: "ID de t\xE9cnico requerido"
      }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }
    const ahora = /* @__PURE__ */ new Date();
    let fechaInicio;
    switch (periodo) {
      case "dia":
        fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
        break;
      case "semana":
        const diaSemana = ahora.getDay();
        fechaInicio = new Date(ahora);
        fechaInicio.setDate(ahora.getDate() - diaSemana);
        fechaInicio.setHours(0, 0, 0, 0);
        break;
      case "mes":
        fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        break;
      case "a\xF1o":
        fechaInicio = new Date(ahora.getFullYear(), 0, 1);
        break;
      default:
        fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    }
    const fechaInicioStr = fechaInicio.toISOString().split("T")[0];
    const ordenes = await env.DB.prepare(`
      SELECT
        ot.id,
        ot.numero_orden,
        ot.patente_placa,
        ot.marca,
        ot.modelo,
        ot.cliente_nombre,
        ot.fecha_creacion,
        ot.fecha_completado,
        ot.estado,
        ot.monto_total,
        ot.monto_abono,
        ot.monto_restante,
        ot.tecnico_asignado_id,
        t.nombre as tecnico_nombre
      FROM OrdenesTrabajo ot
      LEFT JOIN Tecnicos t ON ot.tecnico_asignado_id = t.id
      WHERE ot.tecnico_asignado_id = ?
        AND ot.fecha_creacion >= ?
        AND ot.estado IN ('Aprobada', 'completada', 'en_proceso')
      ORDER BY ot.fecha_creacion DESC
    `).bind(tecnicoId, fechaInicioStr).all();
    const ordenesFormateadas = (ordenes.results || []).map((orden) => ({
      ...orden,
      numero_orden_formateado: String(orden.numero_orden).padStart(6, "0"),
      fecha_creacion_formateada: orden.fecha_creacion ? new Date(orden.fecha_creacion).toLocaleDateString("es-CL") : "N/A",
      fecha_completado_formateada: orden.fecha_completado ? new Date(orden.fecha_completado).toLocaleDateString("es-CL") : "N/A"
    }));
    return new Response(JSON.stringify({
      success: true,
      tecnico_id: tecnicoId,
      periodo,
      fecha_inicio: fechaInicioStr,
      ordenes: ordenesFormateadas
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error al obtener \xF3rdenes del t\xE9cnico:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
}
__name(onRequestGet3, "onRequestGet3");
__name2(onRequestGet3, "onRequestGet");
async function onRequestGet4(context) {
  const { env, request } = context;
  try {
    const url = new URL(request.url);
    const periodo = url.searchParams.get("periodo") || "mes";
    const tecnicoId = url.searchParams.get("tecnico_id");
    const ahora = /* @__PURE__ */ new Date();
    let fechaInicio;
    switch (periodo) {
      case "dia":
        fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
        break;
      case "semana":
        const diaSemana = ahora.getDay();
        fechaInicio = new Date(ahora);
        fechaInicio.setDate(ahora.getDate() - diaSemana);
        fechaInicio.setHours(0, 0, 0, 0);
        break;
      case "mes":
        fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        break;
      case "a\xF1o":
        fechaInicio = new Date(ahora.getFullYear(), 0, 1);
        break;
      default:
        fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    }
    const fechaInicioStr = fechaInicio.toISOString().split("T")[0];
    let query = `
      SELECT
        t.id,
        t.nombre,
        t.telefono,
        COUNT(ot.id) as total_ordenes,
        SUM(ot.monto_total) as total_monto,
        SUM(CASE WHEN (ot.estado IN ('completada', 'Cerrada') OR ot.estado_trabajo IN ('Completada', 'Cerrada')) THEN 1 ELSE 0 END) as ordenes_completadas,
        SUM(CASE WHEN ot.estado = 'en_proceso' AND ot.fecha_creacion >= ? THEN 1 ELSE 0 END) as ordenes_en_proceso,
        SUM(CASE WHEN ot.estado = 'Aprobada' AND ot.fecha_creacion >= ? THEN 1 ELSE 0 END) as ordenes_aprobadas,
        AVG(CASE WHEN (ot.estado IN ('completada', 'Cerrada') OR ot.estado_trabajo IN ('Completada', 'Cerrada')) THEN ot.monto_total END) as promedio_monto,
        MAX(ot.fecha_completado) as ultima_orden
      FROM Tecnicos t
      LEFT JOIN OrdenesTrabajo ot ON t.id = ot.tecnico_asignado_id
        AND ot.estado IN ('Aprobada', 'completada', 'en_proceso', 'Cerrada')
      WHERE t.activo = 1
    `;
    const params = [fechaInicioStr, fechaInicioStr];
    if (tecnicoId) {
      query += " AND t.id = ?";
      params.push(tecnicoId);
    }
    query += " GROUP BY t.id, t.nombre, t.telefono ORDER BY total_monto DESC, total_ordenes DESC";
    const estadisticas = await env.DB.prepare(query).bind(...params).all();
    const totalGeneral = await env.DB.prepare(`
      SELECT
        COUNT(*) as total_ordenes_sistema,
        SUM(monto_total) as total_monto_sistema,
        AVG(monto_total) as promedio_sistema,
        SUM(CASE WHEN (estado IN ('completada', 'Cerrada') OR estado_trabajo IN ('Completada', 'Cerrada')) THEN 1 ELSE 0 END) as total_completadas_sistema
      FROM OrdenesTrabajo
      WHERE fecha_creacion >= ?
    `).bind(fechaInicioStr).first();
    const estadisticasData = estadisticas.results || estadisticas || [];
    return new Response(JSON.stringify({
      success: true,
      periodo,
      fecha_inicio: fechaInicioStr,
      estadisticas: estadisticasData,
      total_general: totalGeneral || {
        total_ordenes_sistema: 0,
        total_monto_sistema: 0,
        promedio_sistema: 0,
        total_completadas_sistema: 0
      }
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error al obtener resumen de t\xE9cnicos:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
}
__name(onRequestGet4, "onRequestGet4");
__name2(onRequestGet4, "onRequestGet");
async function onRequestGet5(context) {
  const { env } = context;
  try {
    const tecnicos = await env.DB.prepare(`
      SELECT id, nombre, telefono, email, activo, fecha_registro
      FROM Tecnicos
      ORDER BY nombre ASC
    `).all();
    return new Response(JSON.stringify({
      success: true,
      tecnicos: tecnicos.results || []
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error al obtener t\xE9cnicos:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
}
__name(onRequestGet5, "onRequestGet5");
__name2(onRequestGet5, "onRequestGet");
async function onRequestPost2(context) {
  const { request, env } = context;
  try {
    const data = await request.json();
    if (!data.nombre || !data.telefono || !data.pin) {
      return new Response(JSON.stringify({
        success: false,
        error: "Faltan datos: nombre, tel\xE9fono y PIN"
      }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }
    const existe = await env.DB.prepare(
      "SELECT id FROM Tecnicos WHERE telefono = ?"
    ).bind(data.telefono).first();
    if (existe) {
      return new Response(JSON.stringify({
        success: false,
        error: "Ya existe un t\xE9cnico con ese tel\xE9fono"
      }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }
    const tableInfo = await env.DB.prepare("PRAGMA table_info(Tecnicos)").all();
    const columnNames = (tableInfo.results || []).map((col) => col.name);
    const accessColumn = columnNames.includes("codigo_acceso") ? "codigo_acceso" : columnNames.includes("pin") ? "pin" : null;
    if (!accessColumn) {
      throw new Error("Tabla Tecnicos no tiene columna de acceso (codigo_acceso/pin)");
    }
    await env.DB.prepare(`
      INSERT INTO Tecnicos (nombre, telefono, email, ${accessColumn}, activo)
      VALUES (?, ?, ?, ?, 1)
    `).bind(
      data.nombre,
      data.telefono,
      data.email || null,
      data.pin
    ).run();
    return new Response(JSON.stringify({
      success: true,
      mensaje: "T\xE9cnico registrado correctamente"
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error al crear t\xE9cnico:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
}
__name(onRequestPost2, "onRequestPost2");
__name2(onRequestPost2, "onRequestPost");
async function onRequestPost3(context) {
  const { request, env } = context;
  try {
    const data = await request.json();
    if (!data.orden_id || !data.tecnico_id || !data.nota) {
      return new Response(JSON.stringify({
        success: false,
        error: "Faltan datos: orden_id, tecnico_id y nota"
      }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }
    const orden = await env.DB.prepare(
      "SELECT id FROM OrdenesTrabajo WHERE id = ? AND tecnico_asignado_id = ?"
    ).bind(data.orden_id, data.tecnico_id).first();
    if (!orden) {
      return new Response(JSON.stringify({
        success: false,
        error: "Orden no encontrada o no asignada a este t\xE9cnico"
      }), {
        headers: { "Content-Type": "application/json" },
        status: 404
      });
    }
    await env.DB.prepare(`
      INSERT INTO NotasTrabajo (orden_id, tecnico_id, nota)
      VALUES (?, ?, ?)
    `).bind(data.orden_id, data.tecnico_id, data.nota).run();
    return new Response(JSON.stringify({
      success: true,
      mensaje: "Nota agregada correctamente"
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error al agregar nota:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
}
__name(onRequestPost3, "onRequestPost3");
__name2(onRequestPost3, "onRequestPost");
async function onRequestPost4(context) {
  const { request, env } = context;
  try {
    const data = await request.json();
    if (!data.orden_id || !data.tecnico_id || !data.nuevo_estado) {
      return new Response(JSON.stringify({
        success: false,
        error: "Faltan datos: orden_id, tecnico_id y nuevo_estado"
      }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }
    const orden = await env.DB.prepare(
      "SELECT id, estado_trabajo FROM OrdenesTrabajo WHERE id = ? AND tecnico_asignado_id = ?"
    ).bind(data.orden_id, data.tecnico_id).first();
    if (!orden) {
      return new Response(JSON.stringify({
        success: false,
        error: "Orden no encontrada o no asignada a este t\xE9cnico"
      }), {
        headers: { "Content-Type": "application/json" },
        status: 404
      });
    }
    await env.DB.prepare(`
      UPDATE OrdenesTrabajo
      SET estado_trabajo = ?
      WHERE id = ?
    `).bind(data.nuevo_estado, data.orden_id).run();
    await env.DB.prepare(`
      INSERT INTO SeguimientoTrabajo (
        orden_id, tecnico_id, estado_anterior, estado_nuevo,
        latitud, longitud, observaciones
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.orden_id,
      data.tecnico_id,
      orden.estado_trabajo,
      data.nuevo_estado,
      data.latitud || null,
      data.longitud || null,
      data.observaciones || null
    ).run();
    return new Response(JSON.stringify({
      success: true,
      mensaje: "Estado actualizado correctamente"
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error al cambiar estado:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
}
__name(onRequestPost4, "onRequestPost4");
__name2(onRequestPost4, "onRequestPost");
async function onRequestPost5(context) {
  const { request, env } = context;
  try {
    const data = await request.json();
    if (!data.orden_id || !data.tecnico_id) {
      return new Response(JSON.stringify({ success: false, error: "Faltan datos: orden_id y tecnico_id" }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }
    const orden = await env.DB.prepare(
      "SELECT id, estado, estado_trabajo, firma_imagen, token, tecnico_asignado_id, notas FROM OrdenesTrabajo WHERE id = ? AND tecnico_asignado_id = ?"
    ).bind(data.orden_id, data.tecnico_id).first();
    if (!orden) {
      return new Response(JSON.stringify({ success: false, error: "Orden no encontrada o no asignada a este t\xE9cnico" }), {
        headers: { "Content-Type": "application/json" },
        status: 404
      });
    }
    if (!orden.firma_imagen) {
      return new Response(JSON.stringify({ success: false, error: "No se puede cerrar la orden: cliente no ha firmado a\xFAn" }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }
    if (orden.estado_trabajo === "Cerrada") {
      return new Response(JSON.stringify({ success: false, error: "La orden ya est\xE1 cerrada" }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }
    if (!orden.firma_imagen) {
      return new Response(JSON.stringify({ success: false, error: "No se puede cerrar la orden: cliente no ha firmado a\xFAn" }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }
    if (orden.estado !== "Aprobada" && orden.estado_trabajo !== "Aprobada") {
      return new Response(JSON.stringify({ success: false, error: "No se puede cerrar la orden porque no est\xE1 aprobada" }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }
    const notasCierre = (data.notas_cierre || "").trim();
    const notasActualizadas = notasCierre ? (orden.notas || "").trim() ? `${orden.notas.trim()}
Cierre: ${notasCierre}` : `Cierre: ${notasCierre}` : orden.notas || null;
    const pagoCompletado = !!data.pago_completado;
    const metodoPago = data.metodo_pago ? data.metodo_pago.trim() : null;
    const nuevoMontoRestante = pagoCompletado ? 0 : orden.monto_restante || 0;
    await env.DB.prepare(
      'UPDATE OrdenesTrabajo SET estado = ?, estado_trabajo = ?, fecha_completado = datetime("now"), notas = ?, pagado = ?, metodo_pago = ?, monto_restante = ? WHERE id = ?'
    ).bind("Aprobada", "Cerrada", notasActualizadas, pagoCompletado ? 1 : 0, metodoPago, nuevoMontoRestante, data.orden_id).run();
    await env.DB.prepare(`
      INSERT INTO SeguimientoTrabajo (orden_id, tecnico_id, estado_anterior, estado_nuevo, observaciones)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      data.orden_id,
      data.tecnico_id,
      orden.estado_trabajo,
      "Cerrada",
      notasCierre ? `Cierre: ${notasCierre}` : "Cierre sin notas"
    ).run();
    return new Response(JSON.stringify({
      success: true,
      mensaje: "Orden cerrada correctamente",
      orden_id: data.orden_id,
      notas: notasActualizadas
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error al cerrar orden:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
}
__name(onRequestPost5, "onRequestPost5");
__name2(onRequestPost5, "onRequestPost");
async function onRequestGet6(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const ordenId = url.searchParams.get("orden_id");
    if (!ordenId) {
      return new Response(JSON.stringify({
        success: false,
        error: "Falta ID de la orden"
      }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }
    const fotos = await env.DB.prepare(`
      SELECT id, tipo_foto, url_imagen, descripcion, fecha_subida
      FROM FotosTrabajo
      WHERE orden_id = ?
      ORDER BY fecha_subida ASC
    `).bind(ordenId).all();
    return new Response(JSON.stringify({
      success: true,
      fotos: fotos.results || []
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error al obtener fotos:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
}
__name(onRequestGet6, "onRequestGet6");
__name2(onRequestGet6, "onRequestGet");
async function onRequestPost6(context) {
  const { request, env } = context;
  try {
    const data = await request.json();
    if (!data.orden_id || !data.tecnico_id) {
      return new Response(JSON.stringify({
        success: false,
        error: "Faltan datos: orden_id y tecnico_id"
      }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }
    const orden = await env.DB.prepare(
      "SELECT id, cliente_telefono FROM OrdenesTrabajo WHERE id = ? AND tecnico_asignado_id = ?"
    ).bind(data.orden_id, data.tecnico_id).first();
    if (!orden) {
      return new Response(JSON.stringify({
        success: false,
        error: "Orden no encontrada o no asignada a este t\xE9cnico"
      }), {
        headers: { "Content-Type": "application/json" },
        status: 404
      });
    }
    const tokenExistente = await env.DB.prepare(
      "SELECT token_firma_tecnico FROM OrdenesTrabajo WHERE id = ? AND token_firma_tecnico IS NOT NULL"
    ).bind(data.orden_id).first();
    if (tokenExistente) {
      return new Response(JSON.stringify({
        success: true,
        token: tokenExistente.token_firma_tecnico
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    const nuevoToken = crypto.randomUUID();
    await env.DB.prepare(
      "UPDATE OrdenesTrabajo SET token_firma_tecnico = ? WHERE id = ?"
    ).bind(nuevoToken, data.orden_id).run();
    return new Response(JSON.stringify({
      success: true,
      token: nuevoToken
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error al generar token de firma:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
}
__name(onRequestPost6, "onRequestPost6");
__name2(onRequestPost6, "onRequestPost");
async function onRequestGet7(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const ordenId = url.searchParams.get("orden_id");
    if (!ordenId) {
      return new Response(JSON.stringify({
        success: false,
        error: "Falta ID de la orden"
      }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }
    const historial = await env.DB.prepare(`
      SELECT
        st.*,
        t.nombre as tecnico_nombre
      FROM SeguimientoTrabajo st
      LEFT JOIN Tecnicos t ON st.tecnico_id = t.id
      WHERE st.orden_id = ?
      ORDER BY st.fecha_hora ASC
    `).bind(ordenId).all();
    return new Response(JSON.stringify({
      success: true,
      historial: historial.results || []
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error al obtener historial:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
}
__name(onRequestGet7, "onRequestGet7");
__name2(onRequestGet7, "onRequestGet");
async function onRequestPost7(context) {
  const { request, env } = context;
  try {
    const data = await request.json();
    if (!data.telefono || !data.pin) {
      return new Response(JSON.stringify({
        success: false,
        error: "Faltan datos: tel\xE9fono y PIN"
      }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }
    const tecnico = await env.DB.prepare(
      `SELECT id, nombre, telefono, email FROM Tecnicos WHERE telefono = ? AND pin = ? AND activo = 1`
    ).bind(data.telefono, data.pin).first();
    if (!tecnico) {
      return new Response(JSON.stringify({
        success: false,
        error: "Credenciales incorrectas o t\xE9cnico inactivo"
      }), {
        headers: { "Content-Type": "application/json" },
        status: 401
      });
    }
    return new Response(JSON.stringify({
      success: true,
      tecnico
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error en login de t\xE9cnico:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
}
__name(onRequestPost7, "onRequestPost7");
__name2(onRequestPost7, "onRequestPost");
async function onRequestGet8(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const ordenId = url.searchParams.get("orden_id");
    if (!ordenId) {
      return new Response(JSON.stringify({
        success: false,
        error: "Falta ID de la orden"
      }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }
    const notas = await env.DB.prepare(`
      SELECT id, nota, fecha_nota
      FROM NotasTrabajo
      WHERE orden_id = ?
      ORDER BY fecha_nota ASC
    `).bind(ordenId).all();
    return new Response(JSON.stringify({
      success: true,
      notas: notas.results || []
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error al obtener notas:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
}
__name(onRequestGet8, "onRequestGet8");
__name2(onRequestGet8, "onRequestGet");
async function onRequestGet9(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const ordenId = url.searchParams.get("id");
    const tecnicoId = url.searchParams.get("tecnico_id");
    if (!ordenId || !tecnicoId) {
      return new Response(JSON.stringify({
        success: false,
        error: "Faltan par\xE1metros: id y tecnico_id"
      }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }
    const orden = await env.DB.prepare(`
      SELECT
        o.*,
        c.nombre as cliente_nombre,
        c.telefono as cliente_telefono,
        c.rut as cliente_rut
      FROM OrdenesTrabajo o
      LEFT JOIN Clientes c ON o.cliente_id = c.id
      WHERE o.id = ? AND o.tecnico_asignado_id = ?
    `).bind(ordenId, tecnicoId).first();
    if (!orden) {
      return new Response(JSON.stringify({
        success: false,
        error: "Orden no encontrada o no asignada a este t\xE9cnico"
      }), {
        headers: { "Content-Type": "application/json" },
        status: 404
      });
    }
    return new Response(JSON.stringify({
      success: true,
      orden
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error al obtener orden:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
}
__name(onRequestGet9, "onRequestGet9");
__name2(onRequestGet9, "onRequestGet");
async function onRequestGet10(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const tecnicoId = url.searchParams.get("tecnico_id");
    if (!tecnicoId) {
      return new Response(JSON.stringify({
        success: false,
        error: "Falta ID del t\xE9cnico"
      }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }
    const ordenes = await env.DB.prepare(`
      SELECT
        o.id, o.numero_orden, o.patente_placa, o.marca, o.modelo, o.anio,
        o.direccion, o.estado_trabajo,
        c.nombre as cliente_nombre, c.telefono as cliente_telefono,
        o.trabajo_frenos, o.detalle_frenos,
        o.trabajo_luces, o.detalle_luces,
        o.trabajo_tren_delantero, o.detalle_tren_delantero,
        o.trabajo_correas, o.detalle_correas,
        o.trabajo_componentes, o.detalle_componentes,
        o.firma_imagen, o.fecha_aprobacion
      FROM OrdenesTrabajo o
      LEFT JOIN Clientes c ON o.cliente_id = c.id
      WHERE o.tecnico_asignado_id = ?
      ORDER BY o.fecha_creacion DESC
    `).bind(tecnicoId).all();
    return new Response(JSON.stringify({
      success: true,
      ordenes: ordenes.results || []
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error al obtener \xF3rdenes del t\xE9cnico:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
}
__name(onRequestGet10, "onRequestGet10");
__name2(onRequestGet10, "onRequestGet");
async function onRequestPost8(context) {
  const { request, env } = context;
  try {
    const data = await request.json();
    if (!data.orden_id || !data.tecnico_id || !data.tipo_foto || !data.imagen) {
      return new Response(JSON.stringify({
        success: false,
        error: "Faltan datos: orden_id, tecnico_id, tipo_foto e imagen"
      }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }
    const orden = await env.DB.prepare(
      "SELECT id FROM OrdenesTrabajo WHERE id = ? AND tecnico_asignado_id = ?"
    ).bind(data.orden_id, data.tecnico_id).first();
    if (!orden) {
      return new Response(JSON.stringify({
        success: false,
        error: "Orden no encontrada o no asignada a este t\xE9cnico"
      }), {
        headers: { "Content-Type": "application/json" },
        status: 404
      });
    }
    const urlImagen = data.imagen;
    await env.DB.prepare(`
      INSERT INTO FotosTrabajo (orden_id, tecnico_id, tipo_foto, url_imagen, descripcion)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      data.orden_id,
      data.tecnico_id,
      data.tipo_foto,
      urlImagen,
      data.descripcion || null
    ).run();
    return new Response(JSON.stringify({
      success: true,
      mensaje: "Foto guardada correctamente"
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error al subir foto:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
}
__name(onRequestPost8, "onRequestPost8");
__name2(onRequestPost8, "onRequestPost");
async function onRequestPost9(context) {
  const { request, env } = context;
  try {
    const data = await request.json();
    if (!data.token || !data.firma) {
      return new Response(JSON.stringify({
        success: false,
        error: "Faltan datos: token y firma"
      }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }
    const orden = await env.DB.prepare(
      "SELECT * FROM OrdenesTrabajo WHERE token = ? AND estado = 'Enviada'"
    ).bind(data.token).first();
    if (!orden) {
      return new Response(JSON.stringify({
        success: false,
        error: "Orden no encontrada o ya procesada"
      }), {
        headers: { "Content-Type": "application/json" },
        status: 404
      });
    }
    await env.DB.prepare(`
      UPDATE OrdenesTrabajo
      SET estado = 'Aprobada',
          firma_imagen = ?,
          fecha_aprobacion = datetime('now', 'localtime'),
          aprobado_por = 'Cliente'
      WHERE token = ?
    `).bind(data.firma, data.token).run();
    const ordenActualizada = await env.DB.prepare(`
      SELECT
        o.*,
        c.nombre as cliente_nombre,
        c.rut as cliente_rut,
        c.telefono as cliente_telefono
      FROM OrdenesTrabajo o
      LEFT JOIN Clientes c ON o.cliente_id = c.id
      WHERE o.token = ?
    `).bind(data.token).first();
    return new Response(JSON.stringify({
      success: true,
      orden: ordenActualizada
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error al aprobar orden:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
}
__name(onRequestPost9, "onRequestPost9");
__name2(onRequestPost9, "onRequestPost");
async function onRequestGet11(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const patente = url.searchParams.get("patente");
    if (!patente) {
      return new Response(JSON.stringify({
        success: false,
        error: "Patente no proporcionada"
      }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }
    const { results } = await env.DB.prepare(`
      SELECT 
        o.*,
        c.nombre as cliente_nombre,
        c.rut as cliente_rut,
        c.telefono as cliente_telefono
      FROM OrdenesTrabajo o
      LEFT JOIN Clientes c ON o.cliente_id = c.id
      WHERE UPPER(o.patente_placa) = UPPER(?)
      ORDER BY o.fecha_creacion DESC
      LIMIT 20
    `).bind(patente).all();
    return new Response(JSON.stringify({
      success: true,
      ordenes: results
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error al buscar \xF3rdenes:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
}
__name(onRequestGet11, "onRequestGet11");
__name2(onRequestGet11, "onRequestGet");
async function onRequestGet12(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const patente = url.searchParams.get("patente");
    if (!patente) {
      return new Response(JSON.stringify({
        success: false,
        error: "Falta el par\xE1metro patente"
      }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }
    const patenteLimpia = patente.replace(/\s+/g, "").toUpperCase();
    const vehiculo = await env.DB.prepare(`
      SELECT v.*, c.nombre as cliente_nombre, c.rut as cliente_rut, c.telefono as cliente_telefono
      FROM Vehiculos v
      LEFT JOIN Clientes c ON v.cliente_id = c.id
      WHERE v.patente_placa = ?
    `).bind(patenteLimpia).first();
    if (vehiculo) {
      return new Response(JSON.stringify({
        success: true,
        vehiculo: {
          patente: vehiculo.patente_placa,
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
      }), {
        headers: { "Content-Type": "application/json" }
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        message: "Veh\xEDculo no encontrado"
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (error) {
    console.error("Error al buscar veh\xEDculo:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
}
__name(onRequestGet12, "onRequestGet12");
__name2(onRequestGet12, "onRequestGet");
async function onRequestPost10(context) {
  const { request, env } = context;
  try {
    const data = await request.json();
    if (!data.token) {
      return new Response(JSON.stringify({
        success: false,
        error: "Falta el token de la orden"
      }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }
    const orden = await env.DB.prepare(
      "SELECT * FROM OrdenesTrabajo WHERE token = ? AND estado = 'Enviada'"
    ).bind(data.token).first();
    if (!orden) {
      return new Response(JSON.stringify({
        success: false,
        error: "Orden no encontrada o ya procesada"
      }), {
        headers: { "Content-Type": "application/json" },
        status: 404
      });
    }
    const motivo = data.motivo || "Cancelado por el cliente";
    await env.DB.prepare(`
      UPDATE OrdenesTrabajo
      SET estado = 'Cancelada',
          notas = ?
      WHERE token = ?
    `).bind(motivo, data.token).run();
    const ordenActualizada = await env.DB.prepare(`
      SELECT
        o.*,
        c.nombre as cliente_nombre,
        c.rut as cliente_rut,
        c.telefono as cliente_telefono
      FROM OrdenesTrabajo o
      LEFT JOIN Clientes c ON o.cliente_id = c.id
      WHERE o.token = ?
    `).bind(data.token).first();
    return new Response(JSON.stringify({
      success: true,
      orden: ordenActualizada
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error al cancelar orden:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
}
__name(onRequestPost10, "onRequestPost10");
__name2(onRequestPost10, "onRequestPost");
async function onRequestPost11(context) {
  const { request, env } = context;
  try {
    const data = await request.json();
    if (!data.patente || !data.cliente || !data.telefono) {
      return new Response(JSON.stringify({
        success: false,
        error: "Faltan datos obligatorios: patente, cliente y tel\xE9fono"
      }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }
    const configResult = await env.DB.prepare(
      "SELECT ultimo_numero_orden FROM Configuracion WHERE id = 1"
    ).first();
    const ultimoNumero = configResult?.ultimo_numero_orden || 57;
    const nuevoNumero = ultimoNumero + 1;
    const token = crypto.randomUUID();
    let cliente = await env.DB.prepare(
      "SELECT id FROM Clientes WHERE nombre = ? AND telefono = ?"
    ).bind(data.cliente, data.telefono).first();
    let clienteId;
    if (cliente) {
      clienteId = cliente.id;
      if (data.rut) {
        await env.DB.prepare(
          "UPDATE Clientes SET rut = ? WHERE id = ?"
        ).bind(data.rut, clienteId).run();
      }
    } else {
      const result = await env.DB.prepare(
        "INSERT INTO Clientes (nombre, rut, telefono) VALUES (?, ?, ?)"
      ).bind(data.cliente, data.rut || null, data.telefono).run();
      clienteId = result.meta.last_row_id;
    }
    let vehiculo = await env.DB.prepare(
      "SELECT id FROM Vehiculos WHERE patente_placa = ?"
    ).bind(data.patente).first();
    let vehiculoId;
    if (vehiculo) {
      vehiculoId = vehiculo.id;
      await env.DB.prepare(`
        UPDATE Vehiculos
        SET marca = ?, modelo = ?, anio = ?, cilindrada = ?,
            combustible = ?, kilometraje = ?, cliente_id = ?
        WHERE id = ?
      `).bind(
        data.marca || null,
        data.modelo || null,
        data.anio || null,
        data.cilindrada || null,
        data.combustible || null,
        data.kilometraje || null,
        clienteId,
        vehiculoId
      ).run();
    } else {
      const result = await env.DB.prepare(`
        INSERT INTO Vehiculos (cliente_id, patente_placa, marca, modelo, anio,
                              cilindrada, combustible, kilometraje)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        clienteId,
        data.patente,
        data.marca || null,
        data.modelo || null,
        data.anio || null,
        data.cilindrada || null,
        data.combustible || null,
        data.kilometraje || null
      ).run();
      vehiculoId = result.meta.last_row_id;
    }
    const escapeSql = /* @__PURE__ */ __name2((str) => {
      if (str === null || str === void 0 || str === "") return "NULL";
      return "'" + String(str).replace(/'/g, "''").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/\r/g, "\\r") + "'";
    }, "escapeSql");
    const stmt = `INSERT INTO OrdenesTrabajo (numero_orden, token, cliente_id, vehiculo_id, patente_placa, fecha_ingreso, hora_ingreso, recepcionista, marca, modelo, anio, cilindrada, combustible, kilometraje, direccion, trabajo_frenos, detalle_frenos, trabajo_luces, detalle_luces, trabajo_tren_delantero, detalle_tren_delantero, trabajo_correas, detalle_correas, trabajo_componentes, detalle_componentes, nivel_combustible, check_paragolfe_delantero_der, check_puerta_delantera_der, check_puerta_trasera_der, check_paragolfe_trasero_izq, check_otros_carroceria, monto_total, monto_abono, monto_restante, metodo_pago, estado, fecha_creacion) VALUES (${nuevoNumero}, '${token}', ${clienteId}, ${vehiculoId}, '${data.patente}', ${escapeSql(data.fecha_ingreso)}, ${escapeSql(data.hora_ingreso)}, ${escapeSql(data.recepcionista)}, ${escapeSql(data.marca)}, ${escapeSql(data.modelo)}, ${data.anio || "NULL"}, ${escapeSql(data.cilindrada)}, ${escapeSql(data.combustible)}, ${escapeSql(data.kilometraje)}, ${escapeSql(data.direccion)}, ${data.trabajo_frenos || 0}, ${escapeSql(data.detalle_frenos)}, ${data.trabajo_luces || 0}, ${escapeSql(data.detalle_luces)}, ${data.trabajo_tren_delantero || 0}, ${escapeSql(data.detalle_tren_delantero)}, ${data.trabajo_correas || 0}, ${escapeSql(data.detalle_correas)}, ${data.trabajo_componentes || 0}, ${escapeSql(data.detalle_componentes)}, ${escapeSql(data.nivel_combustible)}, ${data.check_paragolfe_delantero_der || 0}, ${data.check_puerta_delantera_der || 0}, ${data.check_puerta_trasera_der || 0}, ${data.check_paragolfe_trasero_izq || 0}, ${escapeSql(data.check_otros_carroceria)}, ${data.monto_total || 0}, ${data.monto_abono || 0}, ${data.monto_restante || 0}, ${escapeSql(data.metodo_pago)}, 'Enviada', datetime('now', 'localtime'))`;
    await env.DB.exec(stmt);
    await env.DB.prepare(
      "UPDATE Configuracion SET ultimo_numero_orden = ? WHERE id = 1"
    ).bind(nuevoNumero).run();
    return new Response(JSON.stringify({
      success: true,
      numero_orden: nuevoNumero,
      token
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error al crear orden:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
}
__name(onRequestPost11, "onRequestPost11");
__name2(onRequestPost11, "onRequestPost");
async function onRequestGet13(context) {
  const { env } = context;
  try {
    const config = await env.DB.prepare(
      "SELECT ultimo_numero_orden FROM Configuracion WHERE id = 1"
    ).first();
    const ultimoNumero = config?.ultimo_numero_orden || 57;
    const proximoNumero = ultimoNumero + 1;
    return new Response(JSON.stringify({
      success: true,
      numero: proximoNumero
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error al obtener pr\xF3ximo n\xFAmero de orden:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
}
__name(onRequestGet13, "onRequestGet13");
__name2(onRequestGet13, "onRequestGet");
async function onRequestGet14(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const ordenId = url.searchParams.get("id");
    const token = url.searchParams.get("token");
    if (!ordenId && !token) {
      return new Response(JSON.stringify({
        success: false,
        error: "Se requiere ID o token de la orden"
      }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }
    let orden;
    if (token) {
      orden = await env.DB.prepare(`
        SELECT 
          o.*,
          c.nombre as cliente_nombre,
          c.rut as cliente_rut,
          c.telefono as cliente_telefono
        FROM OrdenesTrabajo o
        LEFT JOIN Clientes c ON o.cliente_id = c.id
        WHERE o.token = ?
      `).bind(token).first();
    } else {
      orden = await env.DB.prepare(`
        SELECT 
          o.*,
          c.nombre as cliente_nombre,
          c.rut as cliente_rut,
          c.telefono as cliente_telefono
        FROM OrdenesTrabajo o
        LEFT JOIN Clientes c ON o.cliente_id = c.id
        WHERE o.id = ?
      `).bind(ordenId).first();
    }
    if (!orden) {
      return new Response(JSON.stringify({
        success: false,
        error: "Orden no encontrada"
      }), {
        headers: { "Content-Type": "application/json" },
        status: 404
      });
    }
    return new Response(JSON.stringify({
      success: true,
      orden
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error al ver orden:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
}
__name(onRequestGet14, "onRequestGet14");
__name2(onRequestGet14, "onRequestGet");
async function onRequestGet15(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    if (!token) {
      return new Response(getErrorPage("Token no proporcionado", "No se proporcion\xF3 un token v\xE1lido"), {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }
    const orden = await env.DB.prepare(
      "SELECT o.*, c.nombre as cliente_nombre, c.rut as cliente_rut, c.telefono as cliente_telefono FROM OrdenesTrabajo o LEFT JOIN Clientes c ON o.cliente_id = c.id WHERE o.token = ?"
    ).bind(token).first();
    if (!orden) {
      return new Response(getErrorPage("Orden no encontrada", "El enlace no es v\xE1lido o ha expirado"), {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }
    if (orden.estado === "Aprobada") {
      return new Response(getApprovedPage(orden), {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }
    if (orden.estado === "Cancelada") {
      return new Response(getCancelledPage(orden), {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }
    return new Response(getApprovalPage(orden, token), {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  } catch (error) {
    console.error("Error en /aprobar:", error);
    return new Response(getErrorPage("Error del servidor", error.message), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
      status: 500
    });
  }
}
__name(onRequestGet15, "onRequestGet15");
__name2(onRequestGet15, "onRequestGet");
function getErrorPage(title, message) {
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Error</title></head><body style="font-family:Arial,sans-serif;text-align:center;padding:50px;background:#f3f4f6;"><h1 style="color:#dc2626;">' + title + '</h1><p style="color:#4b5563;">' + message + "</p></body></html>";
}
__name(getErrorPage, "getErrorPage");
__name2(getErrorPage, "getErrorPage");
function getApprovedPage(orden) {
  const n = String(orden.numero_orden).padStart(6, "0");
  const firmaImg = orden.firma_imagen ? '<img src="' + orden.firma_imagen + '" style="max-width:200px;margin-top:20px;border:1px solid #ddd;border-radius:8px;">' : "";
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Orden Aprobada</title><script src="https://cdn.tailwindcss.com"><\/script></head><body class="bg-green-100 flex items-center justify-center min-h-screen p-4"><div class="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md"><div class="text-6xl mb-4">\u2705</div><h1 class="text-3xl font-black text-green-700 mb-2">\xA1Orden Aprobada!</h1><p class="text-gray-600 mb-4">Su firma ha sido guardada exitosamente.</p><div class="bg-green-50 rounded-xl p-4 mb-6"><p class="text-sm text-gray-600">Orden N\xB0</p><p class="text-2xl font-bold text-green-700">' + n + '</p><p class="text-sm text-gray-500 mt-2">Fecha: ' + (orden.fecha_aprobacion || "N/A") + "</p></div>" + firmaImg + '<p class="text-sm text-gray-500 mt-6">\xA1Gracias por confiar en Global Pro Automotriz!</p></div></body></html>';
}
__name(getApprovedPage, "getApprovedPage");
__name2(getApprovedPage, "getApprovedPage");
function getCancelledPage(orden) {
  const n = String(orden.numero_orden).padStart(6, "0");
  const motivo = orden.motivo_cancelacion || "No especificado";
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Orden Cancelada</title><script src="https://cdn.tailwindcss.com"><\/script></head><body class="bg-red-100 flex items-center justify-center min-h-screen p-4"><div class="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md"><div class="text-8xl mb-4">\u274C</div><h1 class="text-3xl font-black text-red-700 mb-2">Orden Cancelada</h1><p class="text-gray-600 mb-4">Esta orden de trabajo ha sido cancelada.</p><div class="bg-red-50 rounded-xl p-4 mb-6"><p class="text-sm text-gray-600">Orden N\xB0</p><p class="text-2xl font-bold text-red-700">' + n + '</p><p class="text-xs text-gray-500 mt-2">Fecha: ' + (orden.fecha_cancelacion || "N/A") + '</p></div><div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6"><p class="text-sm font-bold text-yellow-800">Motivo:</p><p class="text-sm text-yellow-700">' + motivo + "</p></div></div></body></html>";
}
__name(getCancelledPage, "getCancelledPage");
__name2(getCancelledPage, "getCancelledPage");
function getApprovalPage(orden, token) {
  const n = String(orden.numero_orden).padStart(6, "0");
  const cliente = orden.cliente_nombre || "Cliente";
  const total = (orden.monto_total || 0).toLocaleString("es-CL");
  const abono = (orden.monto_abono || 0).toLocaleString("es-CL");
  const restante = (orden.monto_restante || 0).toLocaleString("es-CL");
  var trabajos = [];
  if (orden.trabajo_frenos) trabajos.push("<li><strong>Frenos:</strong> " + (orden.detalle_frenos || "Sin detalle") + "</li>");
  if (orden.trabajo_luces) trabajos.push("<li><strong>Luces:</strong> " + (orden.detalle_luces || "Sin detalle") + "</li>");
  if (orden.trabajo_tren_delantero) trabajos.push("<li><strong>Tren Delantero:</strong> " + (orden.detalle_tren_delantero || "Sin detalle") + "</li>");
  if (orden.trabajo_correas) trabajos.push("<li><strong>Correas:</strong> " + (orden.detalle_correas || "Sin detalle") + "</li>");
  if (orden.trabajo_componentes) trabajos.push("<li><strong>Componentes:</strong> " + (orden.detalle_componentes || "Sin detalle") + "</li>");
  var trabajosHtml = trabajos.length > 0 ? trabajos.join("") : '<li class="text-gray-500">No hay trabajos seleccionados</li>';
  var html = "<!DOCTYPE html>";
  html += '<html lang="es">';
  html += "<head>";
  html += '<meta charset="UTF-8">';
  html += '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">';
  html += "<title>Aprobar Orden #" + n + "</title>";
  html += '<script src="https://cdn.tailwindcss.com"><\/script>';
  html += "<style>";
  html += "#sig-canvas { touch-action: none; background: white; border-radius: 10px; cursor: crosshair; border: 2px solid #e5e7eb; }";
  html += ".btn-clear { position: absolute; top: 10px; right: 10px; z-index: 50; background: white; border: 2px solid #ef4444; color: #ef4444; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; }";
  html += ".signature-container { position: relative; }";
  html += "</style>";
  html += "</head>";
  html += `<body class="p-4" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">`;
  html += '<div class="max-w-2xl mx-auto">';
  html += '<div class="bg-white rounded-t-2xl shadow-2xl overflow-hidden">';
  html += '<div class="bg-gradient-to-r from-red-800 to-red-600 p-4 text-center">';
  html += '<h1 class="text-white text-2xl font-black">GLOBAL PRO AUTOMOTRIZ</h1>';
  html += '<p class="text-red-200 text-sm">ORDEN DE TRABAJO #' + n + "</p>";
  html += "</div>";
  html += "</div>";
  html += '<div class="bg-white shadow-2xl p-4 md:p-6">';
  html += '<div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">';
  html += '<p class="text-blue-800"><strong>Estimado/a ' + cliente + ":</strong></p>";
  html += '<p class="text-blue-700 mt-2">Ha recibido una <strong>ORDEN DE TRABAJO</strong> de parte de <strong>GLOBAL PRO AUTOMOTRIZ</strong></p>';
  html += "</div>";
  html += '<div class="bg-gray-50 rounded-xl p-4 mb-6">';
  html += '<h3 class="font-bold text-lg mb-3 text-gray-800">\u{1F4CB} Informaci\xF3n de la Orden</h3>';
  html += '<div class="grid grid-cols-2 gap-3 text-sm">';
  html += '<div><span class="text-gray-600">N\xB0 Orden:</span><p class="font-bold text-red-700">' + n + "</p></div>";
  html += '<div><span class="text-gray-600">Patente:</span><p class="font-bold text-red-700">' + orden.patente_placa + "</p></div>";
  html += '<div><span class="text-gray-600">Fecha:</span><p class="font-bold">' + (orden.fecha_ingreso || "N/A") + " " + (orden.hora_ingreso || "") + "</p></div>";
  html += '<div><span class="text-gray-600">T\xE9cnico:</span><p class="font-bold">' + (orden.recepcionista || "N/A") + "</p></div>";
  html += "</div>";
  html += "</div>";
  html += '<div class="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-4 mb-6 text-white">';
  html += '<h3 class="font-bold text-lg mb-3">\u{1F4B0} Valores</h3>';
  html += '<div class="grid grid-cols-3 gap-3 text-center">';
  html += '<div class="bg-white/20 rounded-lg p-3">';
  html += '<p class="text-xs opacity-80">Total</p>';
  html += '<p class="font-bold text-xl">$' + total + "</p>";
  html += "</div>";
  html += '<div class="bg-white/20 rounded-lg p-3">';
  html += '<p class="text-xs opacity-80">Abono</p>';
  html += '<p class="font-bold text-xl">$' + abono + "</p>";
  html += "</div>";
  html += '<div class="bg-white/20 rounded-lg p-3">';
  html += '<p class="text-xs opacity-80">Restante</p>';
  html += '<p class="font-bold text-xl">$' + restante + "</p>";
  html += "</div>";
  html += "</div>";
  html += "</div>";
  html += '<div class="mb-6">';
  html += '<h3 class="font-bold text-lg mb-3 text-gray-800">\u{1F527} Trabajos Seleccionados</h3>';
  html += '<ul class="space-y-2 text-sm">' + trabajosHtml + "</ul>";
  html += "</div>";
  html += '<div class="mb-6">';
  html += '<h3 class="font-bold text-lg mb-3 text-gray-800">\u270D\uFE0F Firma para Aprobar</h3>';
  html += '<div class="signature-container">';
  html += '<button type="button" onclick="limpiarFirma()" class="btn-clear">X Borrar</button>';
  html += '<canvas id="sig-canvas" height="250"></canvas>';
  html += "</div>";
  html += '<p class="text-sm text-gray-600 mt-2 text-center">Nombre: <strong>' + cliente + "</strong> | RUT: <strong>" + (orden.cliente_rut || "N/A") + "</strong></p>";
  html += "</div>";
  html += '<div class="bg-gray-100 rounded-lg p-4 mb-6 text-sm text-gray-700">';
  html += '<p class="mb-2"><strong>Al firmar usted autoriza:</strong></p>';
  html += '<ul class="list-disc list-inside space-y-1">';
  html += "<li>La intervenci\xF3n del veh\xEDculo</li>";
  html += "<li>Pruebas de carretera necesarias</li>";
  html += "<li>La empresa no se responsabiliza por objetos no declarados</li>";
  html += "</ul>";
  html += "</div>";
  html += '<div class="grid grid-cols-2 gap-4">';
  html += '<button onclick="cancelarOrden()" class="bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 rounded-xl transition transform hover:scale-105">\u274C Cancelar</button>';
  html += '<button onclick="aprobarOrden()" id="btnAprobar" class="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl transition transform hover:scale-105">\u2705 Aceptar y Firmar</button>';
  html += "</div>";
  html += "</div>";
  html += '<div class="bg-white rounded-b-2xl shadow-2xl p-4 text-center text-sm text-gray-600">';
  html += "<p>Global Pro Automotriz</p>";
  html += '<p class="text-xs">Padre Alberto Hurtado 3596, Pedro Aguirre Cerda</p>';
  html += '<p class="text-xs">+56 9 8471 5405 / +56 9 3902 6185</p>';
  html += "</div>";
  html += "</div>";
  html += "<script>";
  html += 'var canvas, ctx, drawing = false, TOKEN = "' + token + '";';
  html += "function initCanvas() {";
  html += '  canvas = document.getElementById("sig-canvas");';
  html += '  if (!canvas) { console.error("Canvas not found"); return; }';
  html += '  ctx = canvas.getContext("2d");';
  html += "  resizeCanvas();";
  html += '  canvas.addEventListener("mousedown", startDraw);';
  html += '  canvas.addEventListener("mousemove", moveDraw);';
  html += '  canvas.addEventListener("mouseup", endDraw);';
  html += '  canvas.addEventListener("mouseout", endDraw);';
  html += '  canvas.addEventListener("touchstart", startDraw, { passive: false });';
  html += '  canvas.addEventListener("touchmove", moveDraw, { passive: false });';
  html += '  canvas.addEventListener("touchend", endDraw);';
  html += '  console.log("Canvas initialized");';
  html += "}";
  html += "function resizeCanvas() {";
  html += "  if (!canvas || !ctx) return;";
  html += "  var container = canvas.parentElement;";
  html += "  var rect = container.getBoundingClientRect();";
  html += "  canvas.width = rect.width - 24;";
  html += "  canvas.height = 250;";
  html += "  ctx.lineWidth = 4;";
  html += '  ctx.lineCap = "round";';
  html += '  ctx.strokeStyle = "#000000";';
  html += '  console.log("Canvas resized to", canvas.width, "x", canvas.height);';
  html += "}";
  html += "function getPos(e) {";
  html += "  if (!canvas) return { x: 0, y: 0 };";
  html += "  var rect = canvas.getBoundingClientRect();";
  html += "  var clientX = e.clientX;";
  html += "  var clientY = e.clientY;";
  html += "  if (e.touches && e.touches.length > 0) {";
  html += "    clientX = e.touches[0].clientX;";
  html += "    clientY = e.touches[0].clientY;";
  html += "  }";
  html += "  return { x: clientX - rect.left, y: clientY - rect.top };";
  html += "}";
  html += "function startDraw(e) {";
  html += "  e.preventDefault();";
  html += "  drawing = true;";
  html += "  if (!ctx) return;";
  html += "  var pos = getPos(e);";
  html += "  ctx.beginPath();";
  html += "  ctx.moveTo(pos.x, pos.y);";
  html += '  console.log("Start drawing at", pos.x, pos.y);';
  html += "}";
  html += "function moveDraw(e) {";
  html += "  if (!drawing || !ctx) return;";
  html += "  e.preventDefault();";
  html += "  var pos = getPos(e);";
  html += "  ctx.lineTo(pos.x, pos.y);";
  html += "  ctx.stroke();";
  html += "}";
  html += "function endDraw() {";
  html += "  drawing = false;";
  html += "  if (ctx) ctx.beginPath();";
  html += "}";
  html += "function limpiarFirma() {";
  html += "  if (!ctx || !canvas) return;";
  html += "  ctx.clearRect(0, 0, canvas.width, canvas.height);";
  html += '  console.log("Signature cleared");';
  html += "}";
  html += 'window.addEventListener("load", function() {';
  html += '  console.log("Window loaded, initializing canvas");';
  html += "  initCanvas();";
  html += "});";
  html += 'window.addEventListener("resize", resizeCanvas);';
  html += "  var rect = canvas.getBoundingClientRect();";
  html += "  var clientX = e.clientX;";
  html += "  var clientY = e.clientY;";
  html += "  if (e.touches && e.touches.length > 0) {";
  html += "    clientX = e.touches[0].clientX;";
  html += "    clientY = e.touches[0].clientY;";
  html += "  }";
  html += "  return { x: clientX - rect.left, y: clientY - rect.top };";
  html += "}";
  html += "function startDraw(e) {";
  html += "  e.preventDefault();";
  html += "  drawing = true;";
  html += "  var pos = getPos(e);";
  html += "  ctx.beginPath();";
  html += "  ctx.moveTo(pos.x, pos.y);";
  html += "}";
  html += "function moveDraw(e) {";
  html += "  if (!drawing) return;";
  html += "  e.preventDefault();";
  html += "  var pos = getPos(e);";
  html += "  ctx.lineTo(pos.x, pos.y);";
  html += "  ctx.stroke();";
  html += "}";
  html += "function endDraw() {";
  html += "  drawing = false;";
  html += "  if (ctx) ctx.beginPath();";
  html += "}";
  html += "function limpiarFirma() {";
  html += "  if (!ctx || !canvas) return;";
  html += "  ctx.clearRect(0, 0, canvas.width, canvas.height);";
  html += '  console.log("Signature cleared");';
  html += "}";
  html += "async function aprobarOrden() {";
  html += '  if (!canvas) { alert("Error: Canvas no inicializado"); return; }';
  html += "  var imageData = canvas.toDataURL();";
  html += '  var blank = document.createElement("canvas");';
  html += "  blank.width = canvas.width;";
  html += "  blank.height = canvas.height;";
  html += "  if (canvas.toDataURL() === blank.toDataURL()) {";
  html += '    alert("Por favor, firme antes de aceptar la orden.");';
  html += "    return;";
  html += "  }";
  html += '  var btn = document.getElementById("btnAprobar");';
  html += '  btn.innerHTML = "Procesando...";';
  html += "  btn.disabled = true;";
  html += "  try {";
  html += '    console.log("Enviando firma... Token:", TOKEN);';
  html += '    var response = await fetch("/api/aprobar-orden", {';
  html += '      method: "POST",';
  html += '      headers: { "Content-Type": "application/json" },';
  html += "      body: JSON.stringify({ token: TOKEN, firma: imageData })";
  html += "    });";
  html += '    console.log("Response status:", response.status);';
  html += "    var data = await response.json();";
  html += '    console.log("Response data:", data);';
  html += "    if (data.success) {";
  html += "      mostrarExito(data.orden);";
  html += "    } else {";
  html += '      alert("Error al aprobar: " + data.error);';
  html += '      btn.innerHTML = "\u2705 Aceptar y Firmar";';
  html += "      btn.disabled = false;";
  html += "    }";
  html += "  } catch (error) {";
  html += '    console.error("Error:", error);';
  html += '    alert("Error de conexi\xF3n: " + error.message);';
  html += '    btn.innerHTML = "\u2705 Aceptar y Firmar";';
  html += "    btn.disabled = false;";
  html += "  }";
  html += "}";
  html += "async function cancelarOrden() {";
  html += '  var motivo = prompt("\xBFCu\xE1l es el motivo de la cancelaci\xF3n?");';
  html += '  if (!confirm("\xBFEst\xE1 seguro de cancelar esta orden de trabajo?")) return;';
  html += "  try {";
  html += '    var response = await fetch("/api/cancelar-orden", {';
  html += '      method: "POST",';
  html += '      headers: { "Content-Type": "application/json" },';
  html += "      body: JSON.stringify({ token: TOKEN, motivo: motivo })";
  html += "    });";
  html += "    var data = await response.json();";
  html += "    if (data.success) {";
  html += "      mostrarCancelada(data.orden);";
  html += "    } else {";
  html += '      alert("Error al cancelar: " + data.error);';
  html += "    }";
  html += "  } catch (error) {";
  html += '    console.error("Error:", error);';
  html += '    alert("Error de conexi\xF3n");';
  html += "  }";
  html += "}";
  html += "function mostrarExito(orden) {";
  html += '  var numeroOrden = String(orden.numero_orden).padStart(6, "0");';
  html += '  var verFacturaUrl = window.location.origin + "/ver-ot?token=" + orden.token;';
  html += '  var mensajeWhatsapp = "Hola, he aprobado la orden de trabajo #" + numeroOrden + ".\\n\\nPuede ver y descargar su factura en l\xEDnea aqu\xED: " + verFacturaUrl;';
  html += '  var whatsappUrl = "https://wa.me/56939026185?text=" + encodeURIComponent(mensajeWhatsapp);';
  html += '  var successHTML = "";';
  html += '  successHTML += "<!DOCTYPE html>";';
  html += '  successHTML += "<html><head><meta charset=\\"UTF-8\\"><title>Orden Aprobada</title>";';
  html += '  successHTML += "<script src=\\"https://cdn.tailwindcss.com\\"><\\/script>";';
  html += '  successHTML += "</head>";';
  html += '  successHTML += "<body class=\\"bg-green-100 flex items-center justify-center min-h-screen p-4\\">";';
  html += '  successHTML += "<div class=\\"bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center\\">";';
  html += '  successHTML += "<div class=\\"text-8xl mb-4\\">\u2705</div>";';
  html += '  successHTML += "<h1 class=\\"text-3xl font-black text-green-700 mb-2\\">\xA1Orden Aprobada!</h1>";';
  html += '  successHTML += "<p class=\\"text-gray-600 mb-6\\">Su firma ha sido guardada exitosamente.</p>";';
  html += '  successHTML += "<div class=\\"bg-green-50 rounded-xl p-4 mb-6\\">";';
  html += '  successHTML += "<p class=\\"text-sm text-gray-600\\">Orden N\xB0</p>";';
  html += '  successHTML += "<p class=\\"text-2xl font-bold text-green-700\\">" + numeroOrden + "</p>";';
  html += '  successHTML += "<p class=\\"text-sm text-gray-600 mt-2\\">Patente: <strong>" + orden.patente_placa + "</strong></p>";';
  html += '  successHTML += "</div>";';
  html += '  successHTML += "<a href="" + verFacturaUrl + "" target="_blank" class="block w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-xl mb-3 transition">\u{1F50D} Ver OT en l\xEDnea</a>";';
  html += '  successHTML += "<a href="" + verFacturaUrl + "&download=1" target="_blank" class="block w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-4 px-6 rounded-xl mb-3 transition">\u{1F4E5} Descargar PDF</a>";';
  html += '  successHTML += "<a href="" + whatsappUrl + "" target="_blank" class="block w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl mb-3 transition">\u{1F4F1} Enviar por WhatsApp</a>";';
  html += '  successHTML += "<button onclick=\\"cerrarPagina()\\" class=\\"w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-xl mb-3 transition\\">\u2705 Finalizar</button>";';
  html += '  successHTML += "<p class=\\"text-sm text-gray-500 mt-4\\">\xA1Gracias por confiar en Global Pro Automotriz!</p>";';
  html += '  successHTML += "</div>";';
  html += '  successHTML += "<script>";';
  html += '  successHTML += "function cerrarPagina() {";';
  html += '  successHTML += "  try { window.close(); } catch(e) {}";';
  html += '  successHTML += "  setTimeout(function() { alert(\\"Puede cerrar esta ventana ahora.\\"); }, 100);";';
  html += '  successHTML += "}";';
  html += '  successHTML += "<\\/script>";';
  html += '  successHTML += "</body></html>";';
  html += "  document.body.innerHTML = successHTML;";
  html += "}";
  html += "function mostrarCancelada(orden) {";
  html += '  var numeroOrden = String(orden.numero_orden).padStart(6, "0");';
  html += '  var motivo = orden.motivo_cancelacion || "No especificado";';
  html += '  var cancelHTML = "";';
  html += '  cancelHTML += "<!DOCTYPE html>";';
  html += '  cancelHTML += "<html><head><meta charset=\\"UTF-8\\"><title>Orden Cancelada</title>";';
  html += '  cancelHTML += "<script src=\\"https://cdn.tailwindcss.com\\"><\\/script>";';
  html += '  cancelHTML += "</head>";';
  html += '  cancelHTML += "<body class=\\"bg-red-100 flex items-center justify-center min-h-screen p-4\\">";';
  html += '  cancelHTML += "<div class=\\"bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center\\">";';
  html += '  cancelHTML += "<div class=\\"text-8xl mb-4\\">\u274C</div>";';
  html += '  cancelHTML += "<h1 class=\\"text-3xl font-black text-red-700 mb-2\\">Orden Cancelada</h1>";';
  html += '  cancelHTML += "<p class=\\"text-gray-600 mb-4\\">Esta orden de trabajo ha sido cancelada.</p>";';
  html += '  cancelHTML += "<div class=\\"bg-red-50 rounded-xl p-4 mb-6\\">";';
  html += '  cancelHTML += "<p class=\\"text-sm text-gray-600\\">Orden N\xB0</p>";';
  html += '  cancelHTML += "<p class=\\"text-2xl font-bold text-red-700\\">" + numeroOrden + "</p>";';
  html += '  cancelHTML += "<p class=\\"text-xs text-gray-500 mt-2\\">Fecha: " + (orden.fecha_cancelacion || "N/A") + "</p>";';
  html += '  cancelHTML += "</div>";';
  html += '  cancelHTML += "<div class=\\"bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6\\">";';
  html += '  cancelHTML += "<p class=\\"text-sm font-bold text-yellow-800\\">Motivo:</p>";';
  html += '  cancelHTML += "<p class=\\"text-sm text-yellow-700\\">" + motivo + "</p>";';
  html += '  cancelHTML += "</div>";';
  html += '  cancelHTML += "</div>";';
  html += '  cancelHTML += "</body></html>";';
  html += "  document.body.innerHTML = cancelHTML;";
  html += "}";
  html += "<\/script>";
  html += "</body>";
  html += "</html>";
  return html;
}
__name(getApprovalPage, "getApprovalPage");
__name2(getApprovalPage, "getApprovalPage");
async function onRequestGet16(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const notas = url.searchParams.get("notas");
  const pagoCompletado = url.searchParams.get("pago_completado") === "true";
  const metodoPago = url.searchParams.get("metodo_pago");
  if (!token) {
    return new Response("Token no proporcionado", { status: 400 });
  }
  try {
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
      return getHTMLResponse("Token Inv\xE1lido", "El link de firma no es v\xE1lido o ha expirado.", false);
    }
    const numeroFormateado = String(orden.numero_orden).padStart(6, "0");
    const tieneFirma = !!orden.firma_imagen;
    const html = getApprovalPage2(orden, numeroFormateado, token, tieneFirma, notas, pagoCompletado, metodoPago);
    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  } catch (error) {
    console.error("Error en aprobaci\xF3n de t\xE9cnico:", error);
    return new Response("Error interno del servidor", { status: 500 });
  }
}
__name(onRequestGet16, "onRequestGet16");
__name2(onRequestGet16, "onRequestGet");
async function onRequestPost12(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const notas = url.searchParams.get("notas");
  const pagoCompletado = url.searchParams.get("pago_completado") === "true";
  const metodoPago = url.searchParams.get("metodo_pago");
  if (!token) {
    return new Response(JSON.stringify({ success: false, error: "Token no proporcionado" }), {
      headers: { "Content-Type": "application/json" },
      status: 400
    });
  }
  try {
    const data = await request.json();
    const firma = data.firma;
    if (!firma) {
      return new Response(JSON.stringify({ success: false, error: "Firma no proporcionada" }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }
    const orden = await env.DB.prepare(
      "SELECT id, estado, estado_trabajo, cliente_telefono, notas FROM OrdenesTrabajo WHERE token_firma_tecnico = ?"
    ).bind(token).first();
    if (!orden) {
      return new Response(JSON.stringify({ success: false, error: "Orden no encontrada" }), {
        headers: { "Content-Type": "application/json" },
        status: 404
      });
    }
    const esPrimeraVez = !orden.firma_imagen;
    let notasActualizadas = orden.notas || "";
    if (notas) {
      notasActualizadas = notasActualizadas ? `${notasActualizadas}
Cierre: ${notas}` : `Cierre: ${notas}`;
    }
    await env.DB.prepare(`
      UPDATE OrdenesTrabajo
      SET firma_imagen = ?, estado = 'Aprobada', estado_trabajo = 'Cerrada',
          fecha_aprobacion = datetime('now'), fecha_completado = datetime('now'),
          notas = ?, pagado = ?, metodo_pago = ?
      WHERE id = ?
    `).bind(firma, notasActualizadas, pagoCompletado ? 1 : 0, metodoPago || null, orden.id).run();
    await env.DB.prepare(`
      INSERT INTO SeguimientoTrabajo (orden_id, tecnico_id, estado_anterior, estado_nuevo, observaciones)
      VALUES (?, (SELECT tecnico_asignado_id FROM OrdenesTrabajo WHERE id = ?), ?, ?, ?)
    `).bind(
      orden.id,
      orden.id,
      orden.estado_trabajo,
      "Cerrada",
      `Firma del cliente y cierre final. ${notas ? "Notas: " + notas : ""}`
    ).run();
    if (esPrimeraVez) {
      console.log("PRIMERA FIRMA - Enviando notificaci\xF3n con PDF a:", orden.cliente_telefono);
    }
    return new Response(JSON.stringify({
      success: true,
      es_primera_vez: esPrimeraVez,
      mensaje: "Orden aceptada y cerrada correctamente"
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error al aprobar orden:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
}
__name(onRequestPost12, "onRequestPost12");
__name2(onRequestPost12, "onRequestPost");
function getHTMLResponse(titulo, mensaje, esExito) {
  const color = esExito ? "#28a745" : "#dc3545";
  const icono = esExito ? "\u2713" : "\u2717";
  const html = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>' + titulo + '</title><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"><style>body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }.card { border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-width: 500px; width: 90%; }</style></head><body><div class="card"><div class="card-body text-center py-5"><div style="font-size: 5rem; color: ' + color + ';">' + icono + '</div><h3 class="mt-4">' + titulo + '</h3><p class="text-muted">' + mensaje + "</p></div></div></body></html>";
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}
__name(getHTMLResponse, "getHTMLResponse");
__name2(getHTMLResponse, "getHTMLResponse");
function getApprovalPage2(orden, numeroFormateado, token, tieneFirma, notas = null, pagoCompletado = null, metodoPago = null) {
  const estadoClass = obtenerClaseEstado(orden.estado_trabajo);
  let trabajosHtml = "";
  if (orden.trabajo_frenos) trabajosHtml += "<li><strong>Frenos:</strong> " + (orden.detalle_frenos || "Sin detalle") + "</li>";
  if (orden.trabajo_luces) trabajosHtml += "<li><strong>Luces:</strong> " + (orden.detalle_luces || "Sin detalle") + "</li>";
  if (orden.trabajo_tren_delantero) trabajosHtml += "<li><strong>Tren Delantero:</strong> " + (orden.detalle_tren_delantero || "Sin detalle") + "</li>";
  if (orden.trabajo_correas) trabajosHtml += "<li><strong>Correas:</strong> " + (orden.detalle_correas || "Sin detalle") + "</li>";
  if (orden.trabajo_componentes) trabajosHtml += "<li><strong>Componentes:</strong> " + (orden.detalle_componentes || "Sin detalle") + "</li>";
  if (!trabajosHtml) trabajosHtml = "<li>No hay trabajos seleccionados</li>";
  let contenidoPrincipal = "";
  if (orden.estado_trabajo === "Cerrada") {
    contenidoPrincipal = '<div class="text-center py-5"><div style="font-size: 5rem; color: #28a745;">\u2713</div><h3 class="mt-4">\xA1Orden Cerrada!</h3><p class="lead">Esta orden ya ha sido firmada y cerrada.</p><p class="text-muted">N\xFAmero de Orden: ' + numeroFormateado + '</p><a href="/ver-ot?token=' + token + '" class="btn btn-primary mt-3"><i class="fas fa-file-pdf me-2"></i>Ver Orden de Trabajo</a></div>';
  } else {
    contenidoPrincipal = '<div class="alert alert-info"><h5><i class="fas fa-info-circle me-2"></i>Informaci\xF3n Importante</h5><p>Por favor revise detalladamente la orden de trabajo antes de firmar. Al firmar, usted autoriza los trabajos indicados y sus montos.</p></div><div class="card mb-4"><div class="card-header"><h6 class="mb-0"><i class="fas fa-signature me-2"></i>Firma del Cliente</h6></div><div class="card-body"><p class="text-muted">Utilice el mouse o toque la pantalla para firmar en el \xE1rea a continuaci\xF3n:</p><canvas id="firma-canvas" style="width: 100%; height: 200px; border: 2px dashed #ccc; border-radius: 10px;"></canvas><button class="btn btn-outline-secondary btn-sm w-100 mt-2" onclick="limpiarFirma()"><i class="fas fa-eraser me-2"></i>Limpiar Firma</button></div></div><div class="d-grid gap-2"><button class="btn btn-success btn-lg" onclick="guardarFirma()"><i class="fas fa-check-circle me-2"></i>Aprobar y Firmar Orden</button></div>';
  }
  const html = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Orden de Trabajo #' + numeroFormateado + ' - Global Pro Automotriz</title><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"><style>body { background: #f5f5f5; }.signature-canvas { touch-action: none; background: white; }.orden-card { box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-radius: 15px; margin-bottom: 20px; }</style></head><body><nav class="navbar navbar-dark" style="background: #a80000;"><div class="container"><a class="navbar-brand fw-bold" href="#"><i class="fas fa-wrench me-2"></i>GLOBAL PRO AUTOMOTRIZ</a></div></nav><div class="container py-4"><div class="orden-card card"><div class="card-header bg-danger text-white"><h5 class="mb-0"><i class="fas fa-file-alt me-2"></i>ORDEN DE TRABAJO #' + numeroFormateado + '</h5></div><div class="card-body"><div class="row mb-4"><div class="col-md-6"><h6 class="fw-bold">DATOS DEL CLIENTE</h6><p><strong>Nombre:</strong> ' + (orden.cliente_nombre || "N/A") + "</p><p><strong>RUT:</strong> " + (orden.cliente_rut || "N/A") + "</p><p><strong>T\xE9cnico:</strong> " + (orden.tecnico_nombre || "N/A") + '</p></div><div class="col-md-6"><h6 class="fw-bold">DATOS DEL VEH\xCDCULO</h6><p><strong>Patente:</strong> ' + (orden.patente_placa || "N/A") + "</p><p><strong>Marca/Modelo:</strong> " + (orden.marca || "") + " " + (orden.modelo || "") + " (" + (orden.anio || "N/A") + ')</p><p><strong>Estado:</strong> <span class="badge ' + estadoClass + '">' + (orden.estado_trabajo || "N/A") + '</span></p></div></div><hr><h6 class="fw-bold">TRABAJOS A REALIZAR</h6><ul>' + trabajosHtml + '</ul><hr><h6 class="fw-bold">VALORES</h6><p><strong>Total:</strong> $' + (orden.monto_total || 0).toLocaleString("es-CL") + "</p><p><strong>Abono:</strong> $" + (orden.monto_abono || 0).toLocaleString("es-CL") + "</p><p><strong>Restante:</strong> $" + (orden.monto_restante || 0).toLocaleString("es-CL") + "</p>" + (notas ? '<hr><h6 class="fw-bold">NOTAS DEL T\xC9CNICO</h6><p>' + notas.replace(/\n/g, "<br>") + "</p>" : "") + (pagoCompletado !== null ? '<hr><h6 class="fw-bold">PAGO</h6><p>' + (pagoCompletado ? "Pago completado" : "Pago pendiente") + (metodoPago ? " (" + metodoPago + ")" : "") + "</p>" : "") + "</div></div>" + contenidoPrincipal + '</div><script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"><\/script><script>let canvas, ctx, drawing = false;document.addEventListener("DOMContentLoaded", function() {canvas = document.getElementById("firma-canvas");if (canvas) {const rect = canvas.getBoundingClientRect();canvas.width = rect.width;canvas.height = 200;ctx = canvas.getContext("2d");ctx.strokeStyle = "#000";ctx.lineWidth = 2;ctx.lineCap = "round";canvas.addEventListener("mousedown", startDrawing);canvas.addEventListener("mousemove", draw);canvas.addEventListener("mouseup", stopDrawing);canvas.addEventListener("mouseout", stopDrawing);canvas.addEventListener("touchstart", function(e) { e.preventDefault(); startDrawing(e.touches[0]); });canvas.addEventListener("touchmove", function(e) { e.preventDefault(); draw(e.touches[0]); });canvas.addEventListener("touchend", stopDrawing);}});function startDrawing(e) {drawing = true;ctx.beginPath();const rect = canvas.getBoundingClientRect();const x = e.clientX || e.pageX;const y = e.clientY || e.pageY;ctx.moveTo(x - rect.left, y - rect.top);}function draw(e) {if (!drawing) return;const rect = canvas.getBoundingClientRect();const x = e.clientX || e.pageX;const y = e.clientY || e.pageY;ctx.lineTo(x - rect.left, y - rect.top);ctx.stroke();}function stopDrawing() { drawing = false; }function limpiarFirma() {ctx.clearRect(0, 0, canvas.width, canvas.height);}async function guardarFirma() {const blank = document.createElement("canvas");blank.width = canvas.width;blank.height = canvas.height;if (canvas.toDataURL() === blank.toDataURL()) {alert("Por favor, firme en el \xE1rea designada");return;}const firmaData = canvas.toDataURL("image/png");try {const response = await fetch(window.location.href, {method: "POST",headers: { "Content-Type": "application/json" },body: JSON.stringify({ firma: firmaData })});const data = await response.json();if (data.success) {if (data.es_primera_vez) {alert("\xA1Orden aprobada! Se ha enviado una copia del PDF a su correo/WhatsApp.");} else {alert("\xA1Orden aprobada correctamente!");}window.location.reload();} else {alert("Error: " + data.error);}} catch (error) {console.error("Error:", error);alert("Error al guardar la firma. Por favor, intente nuevamente.");}}<\/script></body></html>';
  return html;
}
__name(getApprovalPage2, "getApprovalPage2");
__name2(getApprovalPage2, "getApprovalPage");
function obtenerClaseEstado(estado) {
  const clases = {
    "Pendiente Visita": "bg-warning",
    "En Sitio": "bg-info",
    "En Progreso": "bg-primary",
    "Pendiente Piezas": "bg-secondary",
    "Completada": "bg-success",
    "Aprobada": "bg-success",
    "No Completada": "bg-danger"
  };
  return clases[estado] || "bg-secondary";
}
__name(obtenerClaseEstado, "obtenerClaseEstado");
__name2(obtenerClaseEstado, "obtenerClaseEstado");
async function onRequestGet17(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return getHTMLResponse2("Token no proporcionado", "Debe proporcionar un token para ver la orden.", false);
  }
  try {
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
      return getHTMLResponse2("Orden no encontrada", "El link no es v\xE1lido o la orden no existe.", false);
    }
    const numeroFormateado = String(orden.numero_orden).padStart(6, "0");
    const html = generateOTViewerPage(orden, numeroFormateado, token);
    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  } catch (error) {
    console.error("Error al ver orden:", error);
    return new Response("Error interno del servidor", { status: 500 });
  }
}
__name(onRequestGet17, "onRequestGet17");
__name2(onRequestGet17, "onRequestGet");
function getHTMLResponse2(titulo, mensaje, esExito) {
  const color = esExito ? "#28a745" : "#dc3545";
  const icono = esExito ? "\u2713" : "\u2717";
  const html = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>' + titulo + ' - Global Pro Automotriz</title><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"><style>body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }.card { border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-width: 500px; width: 90%; }</style></head><body><div class="card"><div class="card-body text-center py-5"><div style="font-size: 5rem; color: ' + color + ';">' + icono + '</div><h3 class="mt-4">' + titulo + '</h3><p class="text-muted">' + mensaje + "</p></div></div></body></html>";
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}
__name(getHTMLResponse2, "getHTMLResponse2");
__name2(getHTMLResponse2, "getHTMLResponse");
function generateOTViewerPage(orden, numeroFormateado, token) {
  const estadoClass = obtenerClaseEstado2(orden.estado);
  let trabajosHtml = "";
  if (orden.trabajo_frenos) trabajosHtml += "<li><strong>Frenos:</strong> " + (orden.detalle_frenos || "Sin detalle") + "</li>";
  if (orden.trabajo_luces) trabajosHtml += "<li><strong>Luces:</strong> " + (orden.detalle_luces || "Sin detalle") + "</li>";
  if (orden.trabajo_tren_delantero) trabajosHtml += "<li><strong>Tren Delantero:</strong> " + (orden.detalle_tren_delantero || "Sin detalle") + "</li>";
  if (orden.trabajo_correas) trabajosHtml += "<li><strong>Correas:</strong> " + (orden.detalle_correas || "Sin detalle") + "</li>";
  if (orden.trabajo_componentes) trabajosHtml += "<li><strong>Componentes:</strong> " + (orden.detalle_componentes || "Sin detalle") + "</li>";
  if (!trabajosHtml) trabajosHtml = "<li>No hay trabajos seleccionados</li>";
  let checklistHtml = "<p><strong>Nivel de Combustible:</strong> " + (orden.nivel_combustible || "No registrado") + "</p><p><strong>Estado de Carrocer\xEDa:</strong></p><ul>";
  if (orden.check_paragolfe_delantero_der) checklistHtml += "<li>\u2713 Parachoques delantero derecho</li>";
  if (orden.check_puerta_delantera_der) checklistHtml += "<li>\u2713 Puerta delantera derecha</li>";
  if (orden.check_puerta_trasera_der) checklistHtml += "<li>\u2713 Puerta trasera derecha</li>";
  if (orden.check_paragolfe_trasero_izq) checklistHtml += "<li>\u2713 Parachoques trasero izquierdo</li>";
  if (orden.check_otros_carroceria) checklistHtml += "<li>" + orden.check_otros_carroceria + "</li>";
  checklistHtml += "</ul>";
  let firmaHtml = "";
  if (orden.firma_imagen) {
    firmaHtml = '<div class="text-center mt-4 p-4 bg-light rounded"><h6 class="fw-bold"><i class="fas fa-signature me-2"></i>Firma del Cliente</h6><img src="' + orden.firma_imagen + '" alt="Firma del cliente" style="max-width: 300px; border: 1px solid #ddd; border-radius: 5px;"><p class="small text-muted mt-2">Fecha de aprobaci\xF3n: ' + (orden.fecha_aprobacion || "N/A") + "</p></div>";
  } else {
    firmaHtml = '<div class="alert alert-warning mt-4"><i class="fas fa-exclamation-triangle me-2"></i>Esta orden a\xFAn no ha sido firmada por el cliente.</div>';
  }
  const html = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Orden de Trabajo #' + numeroFormateado + ' - Global Pro Automotriz</title><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"><style>@media print {.no-print { display: none !important; }.print-only { display: block !important; }body { background: white !important; }}body { background: #f5f5f5; }.ot-card { box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-radius: 15px; margin-bottom: 20px; }</style></head><body><nav class="navbar navbar-dark no-print" style="background: #a80000;"><div class="container"><a class="navbar-brand fw-bold" href="#"><i class="fas fa-wrench me-2"></i>GLOBAL PRO AUTOMOTRIZ</a></div></nav><div class="container py-4"><div class="d-flex justify-content-between align-items-center mb-4 no-print"><h2 class="mb-0">Orden de Trabajo #' + numeroFormateado + '</h2><div class="d-flex gap-2"><button class="btn btn-primary" onclick="descargarPDF()"><i class="fas fa-download me-2"></i>Descargar PDF</button><button class="btn btn-secondary" onclick="window.print()"><i class="fas fa-print me-2"></i>Imprimir</button></div></div><div class="ot-card card"><div class="card-header bg-danger text-white"><h5 class="mb-0"><i class="fas fa-file-alt me-2"></i>ORDEN DE TRABAJO #' + numeroFormateado + '</h5></div><div class="card-body"><div class="row mb-4"><div class="col-md-6"><h6 class="fw-bold text-danger">INFORMACI\xD3N DEL TALLER</h6><p><strong>Empresa:</strong> Global Pro Automotriz</p><p><strong>Direcci\xF3n:</strong> Padre Alberto Hurtado 3596, Pedro Aguirre Cerda</p><p><strong>Contactos:</strong> +56 9 8471 5405 / +56 9 3902 6185</p><p><strong>RRSS:</strong> @globalproautomotriz</p><hr><h6 class="fw-bold">DATOS DEL CLIENTE</h6><p><strong>Nombre:</strong> ' + (orden.cliente_nombre || "N/A") + "</p><p><strong>RUT:</strong> " + (orden.cliente_rut || "N/A") + "</p><p><strong>Fecha Ingreso:</strong> " + (orden.fecha_ingreso || "N/A") + " " + (orden.hora_ingreso || "") + "</p><p><strong>Recepcionista:</strong> " + (orden.recepcionista || "N/A") + '</p></div><div class="col-md-6"><h6 class="fw-bold text-danger">DATOS DEL VEH\xCDCULO</h6><p><strong>Patente:</strong> <span style="font-size: 1.2rem; font-weight: bold; color: #a80000;">' + (orden.patente_placa || "N/A") + "</span></p><p><strong>Marca/Modelo:</strong> " + (orden.marca || "N/A") + " " + (orden.modelo || "") + " (" + (orden.anio || "N/A") + ")</p><p><strong>Cilindrada:</strong> " + (orden.cilindrada || "N/A") + "</p><p><strong>Combustible:</strong> " + (orden.combustible || "N/A") + "</p><p><strong>Kilometraje:</strong> " + (orden.kilometraje || "N/A") + '</p><hr><h6 class="fw-bold">ESTADO DE LA ORDEN</h6><p><span class="badge ' + estadoClass + ' fs-6">' + (orden.estado || "N/A") + "</span></p>" + (orden.estado_trabajo === "Cerrada" ? '<p><span class="badge bg-success fs-6">Orden cerrada</span></p>' : "") + (orden.fecha_completado ? "<p><strong>Fecha de cierre:</strong> " + orden.fecha_completado + "</p>" : "") + '</div></div><hr><div class="row"><div class="col-md-6"><h6 class="fw-bold text-danger">TRABAJOS A REALIZAR</h6><ul>' + trabajosHtml + '</ul></div><div class="col-md-6"><h6 class="fw-bold text-danger">CHECKLIST DEL VEH\xCDCULO</h6>' + checklistHtml + '</div></div><hr><h6 class="fw-bold text-danger">VALORES</h6><div class="row text-center"><div class="col-4"><div class="p-3 bg-light rounded"><small class="text-muted">Total</small><div class="h4">$' + Math.round(orden.monto_total || 0).toLocaleString("es-CL") + '</div></div></div><div class="col-4"><div class="p-3 bg-light rounded"><small class="text-muted">Abono</small><div class="h4">$' + Math.round(orden.monto_abono || 0).toLocaleString("es-CL") + '</div></div></div><div class="col-4"><div class="p-3 bg-light rounded"><small class="text-muted">Restante</small><div class="h4">$' + Math.round(orden.monto_restante || 0).toLocaleString("es-CL") + "</div></div></div></div>" + (orden.metodo_pago ? '<p class="text-center mt-2"><strong>M\xE9todo de Pago:</strong> ' + orden.metodo_pago + "</p>" : "") + "</div>" + firmaHtml + '<hr><div class="alert alert-info"><small class="text-danger"><strong>Validez y Responsabilidad:</strong><br>\u2022 El cliente autoriza la intervenci\xF3n del veh\xEDculo<br>\u2022 Se autorizan pruebas de carretera necesarias<br>\u2022 La empresa no se hace responsable por objetos no declarados</small></div></div></div><footer class="text-center py-3 text-muted no-print"><small>Generado el ' + (/* @__PURE__ */ new Date()).toLocaleString("es-CL") + '</small></footer><script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"><\/script><script>function descargarPDF() {  const { jsPDF } = window.jspdf;  const doc = new jsPDF("p", "mm", "a4");  const ordenData = ' + JSON.stringify(orden) + ';  const numeroFormateado = "' + numeroFormateado + '";  const pageWidth = doc.internal.pageSize.getWidth();  const pageHeight = doc.internal.pageSize.getHeight();  const leftMargin = 10;  let yPos = 15;  doc.setFontSize(8);  doc.setTextColor(128, 128, 128);  doc.text("OT #" + numeroFormateado, pageWidth - 15, 10, { align: "right" });  doc.setFontSize(16);  doc.setTextColor(168, 0, 0);  doc.text("ORDEN DE TRABAJO", pageWidth / 2, yPos, { align: "center" });  yPos += 8;  doc.setFontSize(10);  doc.text("GLOBAL PRO AUTOMOTRIZ", pageWidth / 2, yPos, { align: "center" });  yPos += 10;  doc.setTextColor(0, 0, 0);  doc.setFontSize(9);  doc.setFont(undefined, "bold");  doc.text("1. INFORMACI\xD3N DEL TALLER", leftMargin, yPos);  yPos += 6;  doc.setFont(undefined, "normal");  doc.setFontSize(7);  doc.text("Empresa: Global Pro Automotriz", leftMargin, yPos); yPos += 4;  doc.text("Direcci\xF3n: Padre Alberto Hurtado 3596, Pedro Aguirre Cerda", leftMargin, yPos); yPos += 4;  doc.text("Contactos: +56 9 8471 5405 / +56 9 3902 6185", leftMargin, yPos); yPos += 10;  doc.setFontSize(9);  doc.setFont(undefined, "bold");  doc.text("2. DATOS DEL CLIENTE", leftMargin, yPos);  yPos += 6;  doc.setFont(undefined, "normal");  doc.setFontSize(7);  doc.text("Cliente: " + (ordenData.cliente_nombre || "N/A"), leftMargin, yPos); yPos += 4;  doc.text("RUT: " + (ordenData.cliente_rut || "N/A"), leftMargin, yPos); yPos += 4;  doc.text("Fecha Ingreso: " + (ordenData.fecha_ingreso || "N/A"), leftMargin, yPos); yPos += 10;  doc.setFontSize(9);  doc.setFont(undefined, "bold");  doc.text("3. DATOS DEL VEH\xCDCULO", leftMargin, yPos);  yPos += 6;  doc.setFont(undefined, "normal");  doc.setFontSize(7);  doc.text("Patente: " + (ordenData.patente_placa || "N/A"), leftMargin, yPos); yPos += 4;  doc.text("Marca/Modelo: " + (ordenData.marca || "N/A") + " " + (ordenData.modelo || ""), leftMargin, yPos); yPos += 10;  doc.setFontSize(9);  doc.setFont(undefined, "bold");  doc.text("4. VALORES", leftMargin, yPos);  yPos += 6;  doc.setFont(undefined, "normal");  doc.setFontSize(7);  doc.text("Total: $" + ((ordenData.monto_total || 0).toLocaleString("es-CL")), leftMargin, yPos); yPos += 4;  doc.text("Abono: $" + ((ordenData.monto_abono || 0).toLocaleString("es-CL")), leftMargin, yPos); yPos += 4;  doc.text("Restante: $" + ((ordenData.monto_restante || 0).toLocaleString("es-CL")), leftMargin, yPos); yPos += 10;  if (ordenData.firma_imagen) {    try {      doc.text("Firma del Cliente:", leftMargin, yPos); yPos += 4;      doc.addImage(ordenData.firma_imagen, "PNG", leftMargin, yPos, 40, 25);    } catch(e) {}  }  doc.setFontSize(6);  doc.setTextColor(128, 128, 128);  doc.text("Generado: " + new Date().toLocaleString("es-CL"), pageWidth / 2, pageHeight - 10, { align: "center" });  doc.save("OT-" + numeroFormateado + "-" + (ordenData.patente_placa || "N/A") + ".pdf");}window.addEventListener("load", function() {  var params = new URLSearchParams(window.location.search);  if (params.get("download") === "1") { descargarPDF(); }});<\/script></div></body></html>';
  return html;
}
__name(generateOTViewerPage, "generateOTViewerPage");
__name2(generateOTViewerPage, "generateOTViewerPage");
function obtenerClaseEstado2(estado) {
  const clases = {
    "Enviada": "bg-warning",
    "Aprobada": "bg-success",
    "Cancelada": "bg-danger"
  };
  return clases[estado] || "bg-secondary";
}
__name(obtenerClaseEstado2, "obtenerClaseEstado2");
__name2(obtenerClaseEstado2, "obtenerClaseEstado");
function onRequest(context) {
  return context.next();
}
__name(onRequest, "onRequest");
__name2(onRequest, "onRequest");
async function onRequest2(context) {
  if (context.request.method === "GET" && new URL(context.request.url).pathname === "/") {
    return new Response("", {
      status: 302,
      headers: {
        "Location": "/index.html"
      }
    });
  }
  return context.next();
}
__name(onRequest2, "onRequest2");
__name2(onRequest2, "onRequest");
var routes = [
  {
    routePath: "/api/admin/asignar-orden",
    mountPath: "/api/admin",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/admin/ordenes-aprobadas",
    mountPath: "/api/admin",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/admin/ordenes-disponibles",
    mountPath: "/api/admin",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/admin/ordenes-tecnico",
    mountPath: "/api/admin",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/api/admin/resumen-tecnicos",
    mountPath: "/api/admin",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet4]
  },
  {
    routePath: "/api/admin/tecnicos",
    mountPath: "/api/admin",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet5]
  },
  {
    routePath: "/api/admin/tecnicos",
    mountPath: "/api/admin",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/tecnico/agregar-nota",
    mountPath: "/api/tecnico",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/api/tecnico/cambiar-estado",
    mountPath: "/api/tecnico",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost4]
  },
  {
    routePath: "/api/tecnico/cerrar-orden",
    mountPath: "/api/tecnico",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost5]
  },
  {
    routePath: "/api/tecnico/fotos",
    mountPath: "/api/tecnico",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet6]
  },
  {
    routePath: "/api/tecnico/generar-token-firma",
    mountPath: "/api/tecnico",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost6]
  },
  {
    routePath: "/api/tecnico/historial",
    mountPath: "/api/tecnico",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet7]
  },
  {
    routePath: "/api/tecnico/login",
    mountPath: "/api/tecnico",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost7]
  },
  {
    routePath: "/api/tecnico/notas",
    mountPath: "/api/tecnico",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet8]
  },
  {
    routePath: "/api/tecnico/orden",
    mountPath: "/api/tecnico",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet9]
  },
  {
    routePath: "/api/tecnico/ordenes",
    mountPath: "/api/tecnico",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet10]
  },
  {
    routePath: "/api/tecnico/subir-foto",
    mountPath: "/api/tecnico",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost8]
  },
  {
    routePath: "/api/aprobar-orden",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost9]
  },
  {
    routePath: "/api/buscar-ordenes",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet11]
  },
  {
    routePath: "/api/buscar-patente",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet12]
  },
  {
    routePath: "/api/cancelar-orden",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost10]
  },
  {
    routePath: "/api/crear-orden",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost11]
  },
  {
    routePath: "/api/proximo-numero-orden",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet13]
  },
  {
    routePath: "/api/ver-orden",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet14]
  },
  {
    routePath: "/aprobar",
    mountPath: "/aprobar",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet15]
  },
  {
    routePath: "/aprobar-tecnico",
    mountPath: "/aprobar-tecnico",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet16]
  },
  {
    routePath: "/aprobar-tecnico",
    mountPath: "/aprobar-tecnico",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost12]
  },
  {
    routePath: "/ver-ot",
    mountPath: "/ver-ot",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet17]
  },
  {
    routePath: "/aprobar",
    mountPath: "/aprobar",
    method: "",
    middlewares: [onRequest],
    modules: []
  },
  {
    routePath: "/",
    mountPath: "/",
    method: "",
    middlewares: [onRequest2],
    modules: []
  }
];
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
__name2(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name2(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name2(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name2(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name2(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name2(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
__name2(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
__name2(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name2(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
__name2(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
__name2(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
__name2(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
__name2(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
__name2(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
__name2(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
__name2(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");
__name2(pathToRegexp, "pathToRegexp");
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
__name2(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name2(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name2(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name2((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
var drainBody = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
__name2(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
__name2(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
__name2(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");
__name2(__facade_invoke__, "__facade_invoke__");
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  static {
    __name(this, "___Facade_ScheduledController__");
  }
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name2(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name2(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name2(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
__name2(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name2((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name2((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
__name2(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;

// C:/Users/57300/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default2 = drainBody2;

// C:/Users/57300/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError2(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError2(e.cause)
  };
}
__name(reduceError2, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError2(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default2 = jsonError2;

// .wrangler/tmp/bundle-P8RYhC/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__2 = [
  middleware_ensure_req_body_drained_default2,
  middleware_miniflare3_json_error_default2
];
var middleware_insertion_facade_default2 = middleware_loader_entry_default;

// C:/Users/57300/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__2 = [];
function __facade_register__2(...args) {
  __facade_middleware__2.push(...args.flat());
}
__name(__facade_register__2, "__facade_register__");
function __facade_invokeChain__2(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__2(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__2, "__facade_invokeChain__");
function __facade_invoke__2(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__2(request, env, ctx, dispatch, [
    ...__facade_middleware__2,
    finalMiddleware
  ]);
}
__name(__facade_invoke__2, "__facade_invoke__");

// .wrangler/tmp/bundle-P8RYhC/middleware-loader.entry.ts
var __Facade_ScheduledController__2 = class ___Facade_ScheduledController__2 {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__2)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler2(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__2(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__2(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler2, "wrapExportedHandler");
function wrapWorkerEntrypoint2(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__2(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__2(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint2, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY2;
if (typeof middleware_insertion_facade_default2 === "object") {
  WRAPPED_ENTRY2 = wrapExportedHandler2(middleware_insertion_facade_default2);
} else if (typeof middleware_insertion_facade_default2 === "function") {
  WRAPPED_ENTRY2 = wrapWorkerEntrypoint2(middleware_insertion_facade_default2);
}
var middleware_loader_entry_default2 = WRAPPED_ENTRY2;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__2 as __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default2 as default
};
//# sourceMappingURL=functionsWorker-0.26222463020876274.js.map
