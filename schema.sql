-- ============================================
-- SISTEMA DE GESTIÓN DE ÓRDENES DE TRABAJO
-- GLOBAL PRO AUTOMOTRIZ
-- Base de Datos: Cloudflare D1 (SQLite)
-- ============================================

-- ============================================
-- TABLA DE CONFIGURACIÓN
-- ============================================
CREATE TABLE IF NOT EXISTS Configuracion (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  ultimo_numero_orden INTEGER DEFAULT 57,
  nombre_empresa TEXT DEFAULT 'Global Pro Automotriz',
  direccion TEXT DEFAULT 'Padre Alberto Hurtado 3596, Pedro Aguirre Cerda',
  telefono1 TEXT DEFAULT '+56 9 8471 5405',
  telefono2 TEXT DEFAULT '+56 9 3902 6185',
  red_social TEXT DEFAULT '@globalproautomotriz',
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
  telefono TEXT,
  fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA DE VEHÍCULOS
-- ============================================
CREATE TABLE IF NOT EXISTS Vehiculos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER,
  patente_placa TEXT UNIQUE NOT NULL,
  marca TEXT,
  modelo TEXT,
  anio INTEGER,
  cilindrada TEXT,
  combustible TEXT,
  kilometraje INTEGER,
  fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES Clientes(id)
);

-- ============================================
-- TABLA DE ÓRDENES DE TRABAJO
-- ============================================
CREATE TABLE IF NOT EXISTS OrdenesTrabajo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Número de orden secuencial
  numero_orden INTEGER NOT NULL UNIQUE,
  token TEXT UNIQUE NOT NULL,
  
  -- Cliente y Vehículo
  cliente_id INTEGER,
  vehiculo_id INTEGER,
  patente_placa TEXT NOT NULL,
  
  -- Información General
  fecha_ingreso TEXT,
  hora_ingreso TEXT,
  recepcionista TEXT,
  
  -- Datos del Vehículo (réplica)
  marca TEXT,
  modelo TEXT,
  anio INTEGER,
  cilindrada TEXT,
  combustible TEXT,
  kilometraje TEXT,
  
  -- Trabajos: Frenos
  trabajo_frenos INTEGER DEFAULT 0,
  detalle_frenos TEXT,
  
  -- Trabajos: Luces
  trabajo_luces INTEGER DEFAULT 0,
  detalle_luces TEXT,
  
  -- Trabajos: Tren Delantero
  trabajo_tren_delantero INTEGER DEFAULT 0,
  detalle_tren_delantero TEXT,
  
  -- Trabajos: Correas
  trabajo_correas INTEGER DEFAULT 0,
  detalle_correas TEXT,
  
  -- Trabajos: Componentes
  trabajo_componentes INTEGER DEFAULT 0,
  detalle_componentes TEXT,
  
  -- Checklist del Vehículo
  nivel_combustible TEXT, -- 'Lleno', '3/4', '1/2', '1/4', 'Bajo'
  
  check_paragolfe_delantero_der INTEGER DEFAULT 0,
  check_puerta_delantera_der INTEGER DEFAULT 0,
  check_puerta_trasera_der INTEGER DEFAULT 0,
  check_paragolfe_trasero_izq INTEGER DEFAULT 0,
  check_otros_carroceria TEXT,
  
  -- Montos y Pagos
  monto_total REAL,
  monto_abono REAL DEFAULT 0,
  monto_restante REAL,
  metodo_pago TEXT,
  
  -- Estado de la orden
  estado TEXT DEFAULT 'Enviada', -- 'Enviada', 'Aprobada', 'Cancelada'
  motivo_cancelacion TEXT,
  
  -- Firma
  firma_imagen TEXT,
  fecha_aprobacion DATETIME,
  fecha_cancelacion DATETIME,
  
  -- Timestamps
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (cliente_id) REFERENCES Clientes(id),
  FOREIGN KEY (vehiculo_id) REFERENCES Vehiculos(id)
);

-- ============================================
-- ÍNDICES PARA BÚSQUEDAS RÁPIDAS
-- ============================================
CREATE INDEX IF NOT EXISTS idx_patente ON OrdenesTrabajo(patente_placa);
CREATE INDEX IF NOT EXISTS idx_token ON OrdenesTrabajo(token);
CREATE INDEX IF NOT EXISTS idx_numero_orden ON OrdenesTrabajo(numero_orden);
CREATE INDEX IF NOT EXISTS idx_cliente ON OrdenesTrabajo(cliente_id);
CREATE INDEX IF NOT EXISTS idx_vehiculo ON OrdenesTrabajo(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_estado ON OrdenesTrabajo(estado);
CREATE INDEX IF NOT EXISTS idx_fecha_creacion ON OrdenesTrabajo(fecha_creacion);
