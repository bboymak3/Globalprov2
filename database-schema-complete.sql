-- ============================================
-- ESQUEMA COMPLETO DE BASE DE DATOS
-- Global Pro Automotriz
-- Sistema de Órdenes de Trabajo y Gestión de Técnicos
-- ============================================
-- 
-- Este archivo contiene TODAS las tablas necesarias para el sistema.
-- Ejecutar este script en tu base de datos D1 de Cloudflare.
--
-- Ejemplo de ejecución:
-- npx wrangler d1 execute <nombre-de-tu-base> --file=database-schema-complete.sql
--
-- ============================================

-- ============================================
-- TABLA DE CONFIGURACIÓN
-- ============================================

CREATE TABLE IF NOT EXISTS Configuracion (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  ultimo_numero_orden INTEGER DEFAULT 0,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insertar configuración inicial si no existe
INSERT OR IGNORE INTO Configuracion (id, ultimo_numero_orden)
VALUES (1, 57);

-- ============================================
-- TABLA DE CLIENTES
-- ============================================

CREATE TABLE IF NOT EXISTS Clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  rut TEXT,
  telefono TEXT NOT NULL,
  email TEXT,
  fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON Clientes(telefono);
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON Clientes(nombre);

-- ============================================
-- TABLA DE VEHÍCULOS
-- ============================================

CREATE TABLE IF NOT EXISTS Vehiculos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER,
  patente_placa TEXT NOT NULL UNIQUE,
  marca TEXT,
  modelo TEXT,
  anio INTEGER,
  cilindrada TEXT,
  combustible TEXT,
  kilometraje TEXT,
  fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES Clientes(id) ON DELETE SET NULL
);

-- Índice para búsquedas por patente
CREATE INDEX IF NOT EXISTS idx_vehiculos_patente ON Vehiculos(patente_placa);
CREATE INDEX IF NOT EXISTS idx_vehiculos_cliente ON Vehiculos(cliente_id);

-- ============================================
-- TABLA DE ÓRDENES DE TRABAJO
-- ============================================

CREATE TABLE IF NOT EXISTS OrdenesTrabajo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Identificación
  numero_orden INTEGER NOT NULL UNIQUE,
  token TEXT NOT NULL UNIQUE,
  token_firma_tecnico TEXT UNIQUE,  -- Token generado por técnico para que cliente firme

  -- Relaciones
  cliente_id INTEGER,
  vehiculo_id INTEGER,
  tecnico_asignado_id INTEGER,

  -- Datos del cliente (copia para rendimiento)
  cliente_nombre TEXT,
  cliente_rut TEXT,
  cliente_telefono TEXT,

  -- Datos del vehículo (copia para rendimiento)
  patente_placa TEXT,
  marca TEXT,
  modelo TEXT,
  anio INTEGER,
  cilindrada TEXT,
  combustible TEXT,
  kilometraje TEXT,

  -- Datos de ingreso
  fecha_ingreso DATE,
  hora_ingreso TIME,
  recepcionista TEXT,
  direccion TEXT,
  referencia_direccion TEXT,

  -- Trabajos
  trabajo_frenos INTEGER DEFAULT 0,
  detalle_frenos TEXT,

  trabajo_luces INTEGER DEFAULT 0,
  detalle_luces TEXT,

  trabajo_tren_delantero INTEGER DEFAULT 0,
  detalle_tren_delantero TEXT,

  trabajo_correas INTEGER DEFAULT 0,
  detalle_correas TEXT,

  trabajo_componentes INTEGER DEFAULT 0,
  detalle_componentes TEXT,

  -- Checklist
  nivel_combustible TEXT,

  check_paragolfe_delantero_der INTEGER DEFAULT 0,
  check_puerta_delantera_der INTEGER DEFAULT 0,
  check_puerta_trasera_der INTEGER DEFAULT 0,
  check_paragolfe_trasero_izq INTEGER DEFAULT 0,
  check_otros_carroceria TEXT,

  -- Valores
  monto_total REAL DEFAULT 0,
  monto_abono REAL DEFAULT 0,
  monto_restante REAL DEFAULT 0,
  metodo_pago TEXT,

  -- Estados
  estado TEXT DEFAULT 'Enviada',  -- Enviada, Aprobada, Cancelada
  estado_trabajo TEXT DEFAULT 'Pendiente Visita',  -- Pendiente Visita, En Sitio, En Progreso, Pendiente Piezas, Completada, Aprobada, No Completada

  -- Firma
  firma_imagen TEXT,
  fecha_aprobacion DATETIME,

  -- Fechas
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (cliente_id) REFERENCES Clientes(id),
  FOREIGN KEY (vehiculo_id) REFERENCES Vehiculos(id) ON DELETE SET NULL,
  FOREIGN KEY (tecnico_asignado_id) REFERENCES Tecnicos(id) ON DELETE SET NULL
);

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_ordenes_numero ON OrdenesTrabajo(numero_orden);
CREATE INDEX IF NOT EXISTS idx_ordenes_token ON OrdenesTrabajo(token);
CREATE INDEX IF NOT EXISTS idx_ordenes_token_tecnico ON OrdenesTrabajo(token_firma_tecnico);
CREATE INDEX IF NOT EXISTS idx_ordenes_patente ON OrdenesTrabajo(patente_placa);
CREATE INDEX IF NOT EXISTS idx_ordenes_cliente ON OrdenesTrabajo(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_vehiculo ON OrdenesTrabajo(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_tecnico ON OrdenesTrabajo(tecnico_asignado_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_estado ON OrdenesTrabajo(estado);
CREATE INDEX IF NOT EXISTS idx_ordenes_fecha ON OrdenesTrabajo(fecha_creacion);

-- ============================================
-- TABLA DE TÉCNICOS
-- ============================================

CREATE TABLE IF NOT EXISTS Tecnicos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  telefono TEXT NOT NULL UNIQUE,
  email TEXT,
  codigo_acceso TEXT NOT NULL UNIQUE,  -- PIN de 4 dígitos para login
  activo INTEGER DEFAULT 1,  -- 1 = activo, 0 = inactivo
  fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_tecnicos_telefono ON Tecnicos(telefono);
CREATE INDEX IF NOT EXISTS idx_tecnicos_codigo ON Tecnicos(codigo_acceso);
CREATE INDEX IF NOT EXISTS idx_tecnicos_activo ON Tecnicos(activo);

-- Técnico de ejemplo para pruebas (PIN: 1234)
INSERT OR IGNORE INTO Tecnicos (nombre, telefono, email, codigo_acceso)
VALUES ('Técnico Prueba', '+56900000000', 'tecnico@globalpro.cl', '1234');

-- ============================================
-- TABLA DE ASIGNACIONES DE ÓRDENES A TÉCNICOS
-- ============================================

CREATE TABLE IF NOT EXISTS AsignacionesTecnico (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orden_id INTEGER NOT NULL,
  tecnico_id INTEGER NOT NULL,
  fecha_asignacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  asignado_por TEXT,  -- Nombre del admin que asignó
  FOREIGN KEY (orden_id) REFERENCES OrdenesTrabajo(id) ON DELETE CASCADE,
  FOREIGN KEY (tecnico_id) REFERENCES Tecnicos(id) ON DELETE CASCADE,
  UNIQUE(orden_id)  -- Una orden solo puede estar asignada a un técnico a la vez
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_asignaciones_orden ON AsignacionesTecnico(orden_id);
CREATE INDEX IF NOT EXISTS idx_asignaciones_tecnico ON AsignacionesTecnico(tecnico_id);
CREATE INDEX IF NOT EXISTS idx_asignaciones_fecha ON AsignacionesTecnico(fecha_asignacion);

-- ============================================
-- TABLA DE SEGUIMIENTO DE TRABAJO (Historial)
-- ============================================

CREATE TABLE IF NOT EXISTS SeguimientoTrabajo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orden_id INTEGER NOT NULL,
  tecnico_id INTEGER NOT NULL,
  estado_anterior TEXT,
  estado_nuevo TEXT NOT NULL,
  latitud REAL,
  longitud REAL,
  fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
  observaciones TEXT,
  FOREIGN KEY (orden_id) REFERENCES OrdenesTrabajo(id) ON DELETE CASCADE,
  FOREIGN KEY (tecnico_id) REFERENCES Tecnicos(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_seguimiento_orden ON SeguimientoTrabajo(orden_id);
CREATE INDEX IF NOT EXISTS idx_seguimiento_tecnico ON SeguimientoTrabajo(tecnico_id);
CREATE INDEX IF NOT EXISTS idx_seguimiento_fecha ON SeguimientoTrabajo(fecha_hora);

-- ============================================
-- TABLA DE FOTOS DE TRABAJO
-- ============================================

CREATE TABLE IF NOT EXISTS FotosTrabajo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orden_id INTEGER NOT NULL,
  tecnico_id INTEGER NOT NULL,
  tipo_foto TEXT NOT NULL,  -- 'antes', 'despues', 'evidencia'
  url_imagen TEXT NOT NULL,  -- URL en Cloudflare R2 o base64
  descripcion TEXT,
  fecha_subida DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (orden_id) REFERENCES OrdenesTrabajo(id) ON DELETE CASCADE,
  FOREIGN KEY (tecnico_id) REFERENCES Tecnicos(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_fotos_orden ON FotosTrabajo(orden_id);
CREATE INDEX IF NOT EXISTS idx_fotos_tecnico ON FotosTrabajo(tecnico_id);
CREATE INDEX IF NOT EXISTS idx_fotos_tipo ON FotosTrabajo(tipo_foto);
CREATE INDEX IF NOT EXISTS idx_fotos_fecha ON FotosTrabajo(fecha_subida);

-- ============================================
-- TABLA DE NOTAS DE TRABAJO
-- ============================================

CREATE TABLE IF NOT EXISTS NotasTrabajo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orden_id INTEGER NOT NULL,
  tecnico_id INTEGER NOT NULL,
  nota TEXT NOT NULL,
  fecha_nota DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (orden_id) REFERENCES OrdenesTrabajo(id) ON DELETE CASCADE,
  FOREIGN KEY (tecnico_id) REFERENCES Tecnicos(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_notas_orden ON NotasTrabajo(orden_id);
CREATE INDEX IF NOT EXISTS idx_notas_tecnico ON NotasTrabajo(tecnico_id);
CREATE INDEX IF NOT EXISTS idx_notas_fecha ON NotasTrabajo(fecha_nota);

-- ============================================
-- TABLA DE PAGOS
-- ============================================

CREATE TABLE IF NOT EXISTS Pagos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orden_id INTEGER NOT NULL,
  monto REAL NOT NULL,
  metodo_pago TEXT NOT NULL,
  fecha_pago DATETIME DEFAULT CURRENT_TIMESTAMP,
  observaciones TEXT,
  registrador TEXT,
  FOREIGN KEY (orden_id) REFERENCES OrdenesTrabajo(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pagos_orden ON Pagos(orden_id);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha ON Pagos(fecha_pago);

-- ============================================
-- VISTAS ÚTILES (Opcionales)
-- ============================================

-- Vista para ver órdenes con información completa
CREATE VIEW IF NOT EXISTS vista_ordenes_completas AS
SELECT
  o.id,
  o.numero_orden,
  o.token,
  o.estado,
  o.estado_trabajo,
  o.patente_placa,
  o.marca,
  o.modelo,
  o.anio,
  o.cliente_nombre,
  o.cliente_telefono,
  o.cliente_rut,
  o.fecha_ingreso,
  o.hora_ingreso,
  o.monto_total,
  o.monto_abono,
  o.monto_restante,
  o.firma_imagen,
  o.fecha_aprobacion,
  t.nombre as tecnico_nombre,
  t.telefono as tecnico_telefono,
  o.fecha_creacion
FROM OrdenesTrabajo o
LEFT JOIN Tecnicos t ON o.tecnico_asignado_id = t.id;

-- Vista para ver historial de seguimiento con nombres
CREATE VIEW IF NOT EXISTS vista_seguimiento_detalle AS
SELECT
  st.id,
  st.orden_id,
  o.numero_orden,
  st.tecnico_id,
  t.nombre as tecnico_nombre,
  st.estado_anterior,
  st.estado_nuevo,
  st.latitud,
  st.longitud,
  st.fecha_hora,
  st.observaciones
FROM SeguimientoTrabajo st
LEFT JOIN OrdenesTrabajo o ON st.orden_id = o.id
LEFT JOIN Tecnicos t ON st.tecnico_id = t.id;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
--
-- Ejecutar con:
-- npx wrangler d1 execute <nombre-de-tu-base> --file=database-schema-complete.sql
--
-- ============================================
