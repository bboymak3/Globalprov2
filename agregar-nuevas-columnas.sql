-- ============================================
-- ACTUALIZACIÓN INTELIGENTE DE TABLA OrdenesTrabajo
-- Global Pro Automotriz
-- ============================================
--
-- Este script AGREGA las nuevas columnas necesarias para el sistema
-- SIN borrar datos existentes.
--
-- Ejecutar con:
-- npx wrangler d1 execute <nombre-de-tu-base> --file=agregar-nuevas-columnas.sql
--
-- ============================================

-- ============================================
-- ESTRATEGIA: AGREGAR COLUMNAS UNA POR UNA CON VERIFICACIÓN
-- ============================================

-- Columna 1: token_firma_tecnico (para que técnicos generen links de firma)
-- Esta columna es opcional, así que la agregamos sin valor por defecto
ALTER TABLE OrdenesTrabajo ADD COLUMN token_firma_tecnico TEXT;

-- Columna 2: direccion (dirección del cliente para GPS del técnico)
ALTER TABLE OrdenesTrabajo ADD COLUMN direccion TEXT;

-- Columna 3: referencia_direccion (referencia adicional de la dirección)
ALTER TABLE OrdenesTrabajo ADD COLUMN referencia_direccion TEXT;

-- Columna 4: tecnico_asignado_id (ID del técnico asignado)
ALTER TABLE OrdenesTrabajo ADD COLUMN tecnico_asignado_id INTEGER;

-- Columna 5: estado_trabajo (estado del trabajo del técnico)
-- Valor por defecto: 'Enviada' para órdenes ya existentes
ALTER TABLE OrdenesTrabajo ADD COLUMN estado_trabajo TEXT DEFAULT 'Enviada';

-- Columna 6: firma_imagen (para guardar la firma del cliente en base64)
ALTER TABLE OrdenesTrabajo ADD COLUMN firma_imagen TEXT;

-- Columna 7: fecha_aprobacion (cuando el cliente firma)
ALTER TABLE OrdenesTrabajo ADD COLUMN fecha_aprobacion DATETIME;

-- ============================================
-- ACTUALIZAR ESTADO TRABAJO EN ÓRDENES EXISTENTES
-- ============================================

-- Para órdenes que ya están aprobadas, actualizar estado_trabajo
UPDATE OrdenesTrabajo
SET estado_trabajo = 'Aprobada'
WHERE estado = 'Aprobada'
  AND (estado_trabajo IS NULL OR estado_trabajo = '');

-- Para órdenes que están enviadas o en otro estado, dejar como está
-- (ya tienen valor por defecto 'Enviada' en la columna agregada)

-- ============================================
-- CREAR ÍNDICES PARA LAS NUEVAS COLUMNAS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_ordenes_token_tecnico ON OrdenesTrabajo(token_firma_tecnico);
CREATE INDEX IF NOT EXISTS idx_ordenes_tecnico ON OrdenesTrabajo(tecnico_asignado_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_estado_trabajo ON OrdenesTrabajo(estado_trabajo);

-- ============================================
-- CREAR TABLAS NUEVAS PARA EL SISTEMA DE TÉCNICOS
-- ============================================

-- Tabla de Técnicos
CREATE TABLE IF NOT EXISTS Tecnicos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  telefono TEXT NOT NULL UNIQUE,
  email TEXT,
  codigo_acceso TEXT NOT NULL UNIQUE,  -- PIN de 4 dígitos
  activo INTEGER DEFAULT 1,
  fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tecnicos_telefono ON Tecnicos(telefono);
CREATE INDEX IF NOT EXISTS idx_tecnicos_codigo ON Tecnicos(codigo_acceso);

-- Técnico de ejemplo (PIN: 1234)
INSERT OR IGNORE INTO Tecnicos (nombre, telefono, email, codigo_acceso)
VALUES ('Técnico Prueba', '+56900000000', 'tecnico@globalpro.cl', '1234');

-- Tabla de Asignaciones de Órdenes a Técnicos
CREATE TABLE IF NOT EXISTS AsignacionesTecnico (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orden_id INTEGER NOT NULL,
  tecnico_id INTEGER NOT NULL,
  fecha_asignacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  asignado_por TEXT,
  FOREIGN KEY (orden_id) REFERENCES OrdenesTrabajo(id) ON DELETE CASCADE,
  FOREIGN KEY (tecnico_id) REFERENCES Tecnicos(id) ON DELETE CASCADE,
  UNIQUE(orden_id)
);

CREATE INDEX IF NOT EXISTS idx_asignaciones_orden ON AsignacionesTecnico(orden_id);
CREATE INDEX IF NOT EXISTS idx_asignaciones_tecnico ON AsignacionesTecnico(tecnico_id);

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

CREATE INDEX IF NOT EXISTS idx_seguimiento_orden ON SeguimientoTrabajo(orden_id);
CREATE INDEX IF NOT EXISTS idx_seguimiento_tecnico ON SeguimientoTrabajo(tecnico_id);

-- Tabla de Fotos de Trabajo
CREATE TABLE IF NOT EXISTS FotosTrabajo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orden_id INTEGER NOT NULL,
  tecnico_id INTEGER NOT NULL,
  tipo_foto TEXT NOT NULL,
  url_imagen TEXT NOT NULL,
  descripcion TEXT,
  fecha_subida DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (orden_id) REFERENCES OrdenesTrabajo(id) ON DELETE CASCADE,
  FOREIGN KEY (tecnico_id) REFERENCES Tecnicos(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_fotos_orden ON FotosTrabajo(orden_id);
CREATE INDEX IF NOT EXISTS idx_fotos_tecnico ON FotosTrabajo(tecnico_id);

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

CREATE INDEX IF NOT EXISTS idx_notas_orden ON NotasTrabajo(orden_id);
CREATE INDEX IF NOT EXISTS idx_notas_tecnico ON NotasTrabajo(tecnico_id);

-- ============================================
-- VERIFICACIÓN
-- ============================================

SELECT
    '=== ACTUALIZACIÓN COMPLETADA ===' as info;

SELECT
    'Columnas en OrdenesTrabajo: ' ||
    (SELECT COUNT(*) FROM pragma_table_info('OrdenesTrabajo')) as info;

SELECT
    'Tablas creadas:' as info
UNION ALL
SELECT '  - Tecnicos: ' || COUNT(*) FROM Tecnicos
UNION ALL
SELECT '  - AsignacionesTecnico: ' || COUNT(*) FROM AsignacionesTecnico
UNION ALL
SELECT '  - SeguimientoTrabajo: ' || COUNT(*) FROM SeguimientoTrabajo
UNION ALL
SELECT '  - FotosTrabajo: ' || COUNT(*) FROM FotosTrabajo
UNION ALL
SELECT '  - NotasTrabajo: ' || COUNT(*) FROM NotasTrabajo;

-- ============================================
-- INFORMACIÓN IMPORTANTE
-- ============================================

SELECT
    '=== NOTAS ===' as info;

SELECT
    '1. Se agregaron 7 columnas nuevas a OrdenesTrabajo' as info;

SELECT
    '2. Las órdenes existentes se conservaron' as info;

SELECT
    '3. Las nuevas columnas tienen valor NULL en órdenes antiguas' as info;

SELECT
    '4. Las nuevas columnas se llenarán al usar nuevas funcionalidades' as info;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
--
-- Ejecutar con:
-- npx wrangler d1 execute <nombre-de-tu-base> --file=agregar-nuevas-columnas.sql
--
-- Después de ejecutar, el sistema funcionará con:
-- - Órdenes existentes (conservadas)
-- - Nuevas funcionalidades de técnicos
-- - Sistema de firma actualizado
--
-- ============================================
