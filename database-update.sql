-- ============================================
-- ACTUALIZACIÓN DE BASE DE DATOS EXISTENTE
-- Global Pro Automotriz
-- ============================================
--
-- Este script AGREGA las nuevas columnas y tablas necesarias
-- para el sistema actualizado, sin borrar datos existentes.
--
-- Ejecutar con:
-- npx wrangler d1 execute <nombre-de-tu-base> --file=database-update.sql
--
-- ============================================

-- ============================================
-- AGREGAR NUEVOS CAMPOS A TABLA EXISTENTE
-- ============================================

-- Agregar campo para token de firma generado por técnico
-- Si el campo ya existe, la consulta fallará pero el script continuará
ALTER TABLE OrdenesTrabajo ADD COLUMN token_firma_tecnico TEXT;

-- Agregar campo para dirección del cliente
ALTER TABLE OrdenesTrabajo ADD COLUMN direccion TEXT;

-- Agregar campo para referencia de dirección
ALTER TABLE OrdenesTrabajo ADD COLUMN referencia_direccion TEXT;

-- Agregar campo para técnico asignado
ALTER TABLE OrdenesTrabajo ADD COLUMN tecnico_asignado_id INTEGER;

-- Agregar campo para estado de trabajo
ALTER TABLE OrdenesTrabajo ADD COLUMN estado_trabajo TEXT DEFAULT 'Pendiente Visita';

-- ============================================
-- CREAR ÍNDICES PARA LOS NUEVOS CAMPOS
-- ============================================

-- Índice para token de firma de técnico
CREATE INDEX IF NOT EXISTS idx_ordenes_token_tecnico ON OrdenesTrabajo(token_firma_tecnico);

-- Índice para técnico asignado
CREATE INDEX IF NOT EXISTS idx_ordenes_tecnico ON OrdenesTrabajo(tecnico_asignado_id);

-- Índice para estado de trabajo
CREATE INDEX IF NOT EXISTS idx_ordenes_estado_trabajo ON OrdenesTrabajo(estado_trabajo);

-- ============================================
-- CREAR TABLAS NUEVAS (SINO EXISTEN)
-- ============================================

-- Tabla de Técnicos
CREATE TABLE IF NOT EXISTS Tecnicos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  telefono TEXT NOT NULL UNIQUE,
  email TEXT,
  codigo_acceso TEXT NOT NULL UNIQUE,  -- PIN de 4 dígitos para login
  activo INTEGER DEFAULT 1,  -- 1 = activo, 0 = inactivo
  fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices para técnicos
CREATE INDEX IF NOT EXISTS idx_tecnicos_telefono ON Tecnicos(telefono);
CREATE INDEX IF NOT EXISTS idx_tecnicos_codigo ON Tecnicos(codigo_acceso);
CREATE INDEX IF NOT EXISTS idx_tecnicos_activo ON Tecnicos(activo);

-- Técnico de ejemplo para pruebas (PIN: 1234)
INSERT OR IGNORE INTO Tecnicos (nombre, telefono, email, codigo_acceso)
VALUES ('Técnico Prueba', '+56900000000', 'tecnico@globalpro.cl', '1234');

-- Tabla de Asignaciones de Órdenes a Técnicos
CREATE TABLE IF NOT EXISTS AsignacionesTecnico (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orden_id INTEGER NOT NULL,
  tecnico_id INTEGER NOT NULL,
  fecha_asignacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  asignado_por TEXT,  -- Nombre del admin que asignó
  FOREIGN KEY (orden_id) REFERENCES OrdenesTrabajo(id) ON DELETE CASCADE,
  FOREIGN KEY (tecnico_id) REFERENCES Tecnicos(id) ON DELETE CASCADE,
  UNIQUE(orden_id)
);

-- Índices para asignaciones
CREATE INDEX IF NOT EXISTS idx_asignaciones_orden ON AsignacionesTecnico(orden_id);
CREATE INDEX IF NOT EXISTS idx_asignaciones_tecnico ON AsignacionesTecnico(tecnico_id);
CREATE INDEX IF NOT EXISTS idx_asignaciones_fecha ON AsignacionesTecnico(fecha_asignacion);

-- Tabla de Seguimiento de Trabajo
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

-- Índices para seguimiento
CREATE INDEX IF NOT EXISTS idx_seguimiento_orden ON SeguimientoTrabajo(orden_id);
CREATE INDEX IF NOT EXISTS idx_seguimiento_tecnico ON SeguimientoTrabajo(tecnico_id);
CREATE INDEX IF NOT EXISTS idx_seguimiento_fecha ON SeguimientoTrabajo(fecha_hora);

-- Tabla de Fotos de Trabajo
CREATE TABLE IF NOT EXISTS FotosTrabajo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orden_id INTEGER NOT NULL,
  tecnico_id INTEGER NOT NULL,
  tipo_foto TEXT NOT NULL,  -- 'antes', 'despues', 'evidencia'
  url_imagen TEXT NOT NULL,
  descripcion TEXT,
  fecha_subida DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (orden_id) REFERENCES OrdenesTrabajo(id) ON DELETE CASCADE,
  FOREIGN KEY (tecnico_id) REFERENCES Tecnicos(id) ON DELETE CASCADE
);

-- Índices para fotos
CREATE INDEX IF NOT EXISTS idx_fotos_orden ON FotosTrabajo(orden_id);
CREATE INDEX IF NOT EXISTS idx_fotos_tecnico ON FotosTrabajo(tecnico_id);
CREATE INDEX IF NOT EXISTS idx_fotos_tipo ON FotosTrabajo(tipo_foto);
CREATE INDEX IF NOT EXISTS idx_fotos_fecha ON FotosTrabajo(fecha_subida);

-- Tabla de Notas de Trabajo
CREATE TABLE IF NOT EXISTS NotasTrabajo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orden_id INTEGER NOT NULL,
  tecnico_id INTEGER NOT NULL,
  nota TEXT NOT NULL,
  fecha_nota DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (orden_id) REFERENCES OrdenesTrabajo(id) ON DELETE CASCADE,
  FOREIGN KEY (tecnico_id) REFERENCES Tecnicos(id) ON DELETE CASCADE
);

-- Índices para notas
CREATE INDEX IF NOT EXISTS idx_notas_orden ON NotasTrabajo(orden_id);
CREATE INDEX IF NOT EXISTS idx_notas_tecnico ON NotasTrabajo(tecnico_id);
CREATE INDEX IF NOT EXISTS idx_notas_fecha ON NotasTrabajo(fecha_nota);

-- Tabla de Pagos (si no existe)
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

-- Índices para pagos
CREATE INDEX IF NOT EXISTS idx_pagos_orden ON Pagos(orden_id);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha ON Pagos(fecha_pago);

-- ============================================
-- ACTUALIZAR ESTADO TRABAJO EN ÓRDENES EXISTENTES
-- ============================================

-- Para órdenes que ya están aprobadas, actualizar el estado_trabajo
UPDATE OrdenesTrabajo
SET estado_trabajo = 'Aprobada'
WHERE estado = 'Aprobada' AND (estado_trabajo IS NULL OR estado_trabajo = '');

-- Para órdenes que están enviadas pero sin técnico, dejar como Pendiente Visita
UPDATE OrdenesTrabajo
SET estado_trabajo = 'Pendiente Visita'
WHERE estado = 'Enviada' AND (estado_trabajo IS NULL OR estado_trabajo = '');

-- ============================================
-- VERIFICACIÓN DE LA ACTUALIZACIÓN
-- ============================================

-- Consulta para verificar que todo se actualizó correctamente
SELECT
    'Tablas creadas/actualizadas:' as info
UNION ALL
SELECT '  - Clientes: ' || COUNT(*) FROM Clientes
UNION ALL
SELECT '  - Vehiculos: ' || COUNT(*) FROM Vehiculos
UNION ALL
SELECT '  - OrdenesTrabajo: ' || COUNT(*) FROM OrdenesTrabajo
UNION ALL
SELECT '  - Tecnicos: ' || COUNT(*) FROM Tecnicos
UNION ALL
SELECT '  - AsignacionesTecnico: ' || COUNT(*) FROM AsignacionesTecnico
UNION ALL
SELECT '  - SeguimientoTrabajo: ' || COUNT(*) FROM SeguimientoTrabajo
UNION ALL
SELECT '  - FotosTrabajo: ' || COUNT(*) FROM FotosTrabajo
UNION ALL
SELECT '  - NotasTrabajo: ' || COUNT(*) FROM NotasTrabajo
UNION ALL
SELECT '  - Pagos: ' || COUNT(*) FROM Pagos;

-- ============================================
-- FIN DEL SCRIPT DE ACTUALIZACIÓN
-- ============================================
--
-- Ejecutar con:
-- npx wrangler d1 execute <nombre-de-tu-base> --file=database-update.sql
--
-- ============================================
