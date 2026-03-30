-- ============================================
-- RECONSTRUIR TABLA OrdenesTrabajo
-- Global Pro Automotriz
-- ============================================
--
-- Este script elimina y recrea la tabla OrdenesTrabajo
-- con la estructura EXACTA que necesita el sistema.
-- ADVERTENCIA: Se borrarán todas las órdenes existentes.
--
-- Ejecutar con:
-- npx wrangler d1 execute <nombre-de-tu-base> --file=reconstruir-ordenes.sql
--
-- ============================================

-- ============================================
-- PASO 1: ELIMINAR TABLA EXISTENTE (con sus datos)
-- ============================================

DROP TABLE IF EXISTS OrdenesTrabajo;

-- ============================================
-- PASO 2: CREAR TABLA CON ESTRUCTURA CORRECTA (36 columnas)
-- ============================================

CREATE TABLE OrdenesTrabajo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Identificación
  numero_orden INTEGER NOT NULL UNIQUE,
  token TEXT NOT NULL UNIQUE,

  -- Relaciones
  cliente_id INTEGER,
  vehiculo_id INTEGER,

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

  -- Estado
  estado TEXT DEFAULT 'Enviada',

  -- Fecha de creación
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (cliente_id) REFERENCES Clientes(id) ON DELETE SET NULL,
  FOREIGN KEY (vehiculo_id) REFERENCES Vehiculos(id) ON DELETE SET NULL
);

-- ============================================
-- PASO 3: CREAR ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_ordenes_numero ON OrdenesTrabajo(numero_orden);
CREATE INDEX IF NOT EXISTS idx_ordenes_token ON OrdenesTrabajo(token);
CREATE INDEX IF NOT EXISTS idx_ordenes_patente ON OrdenesTrabajo(patente_placa);
CREATE INDEX IF NOT EXISTS idx_ordenes_cliente ON OrdenesTrabajo(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_vehiculo ON OrdenesTrabajo(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_estado ON OrdenesTrabajo(estado);
CREATE INDEX IF NOT EXISTS idx_ordenes_fecha ON OrdenesTrabajo(fecha_creacion);

-- ============================================
-- VERIFICACIÓN
-- ============================================

SELECT
    'Tabla OrdenesTrabajo recreada con ' ||
    (SELECT COUNT(*) FROM pragma_table_info('OrdenesTrabajo')) ||
    ' columnas (deberían ser 36)' as resultado;

-- Mostrar estructura de la tabla
SELECT
    sql
FROM sqlite_master
WHERE type = 'table'
  AND name = 'OrdenesTrabajo';

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
--
-- Después de ejecutar este script:
-- 1. La tabla tendrá exactamente 36 columnas
-- 2. Todas las órdenes existentes se borraron
-- 3. El sistema funcionará correctamente con los cambios en app.js
--
-- ============================================
