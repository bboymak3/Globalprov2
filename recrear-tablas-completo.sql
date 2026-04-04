-- ============================================
-- RECREACIÓN COMPLETA DE LA BASE DE DATOS
-- Taller V2 - Global Pro Automotriz
-- ============================================
-- Este script ELIMINA y RECREA todas las tablas necesarias
-- Ejecutar con cuidado - SE PERDERÁN TODOS LOS DATOS EXISTENTES
--
-- Comando:
-- npx wrangler d1 execute tallerv2_db --file=recrear-tablas-completo.sql
--
-- ============================================

-- ============================================
-- ELIMINAR TABLAS EXISTENTES (en orden inverso de dependencias)
-- ============================================

DROP TABLE IF EXISTS Pagos;
DROP TABLE IF EXISTS NotasTrabajo;
DROP TABLE IF EXISTS FotosTrabajo;
DROP TABLE IF EXISTS SeguimientoTrabajo;
DROP TABLE IF EXISTS AsignacionesTecnico;
DROP TABLE IF EXISTS Tecnicos;
DROP TABLE IF EXISTS OrdenesTrabajo;
DROP TABLE IF EXISTS Vehiculos;
DROP TABLE IF EXISTS Clientes;
DROP TABLE IF EXISTS Configuracion;

-- ============================================
-- TABLA DE CONFIGURACIÓN
-- ============================================

CREATE TABLE Configuracion (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  ultimo_numero_orden INTEGER DEFAULT 0,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO Configuracion (id, ultimo_numero_orden)
VALUES (1, 57);

-- ============================================
-- TABLA DE CLIENTES
-- ============================================

CREATE TABLE Clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  rut TEXT,
  telefono TEXT NOT NULL,
  email TEXT,
  fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON Clientes(telefono);
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON Clientes(nombre);

-- ============================================
-- TABLA DE VEHÍCULOS
-- ============================================

CREATE TABLE Vehiculos (
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

CREATE INDEX IF NOT EXISTS idx_vehiculos_patente ON Vehiculos(patente_placa);
CREATE INDEX IF NOT EXISTS idx_vehiculos_cliente ON Vehiculos(cliente_id);

-- ============================================
-- TABLA DE ÓRDENES DE TRABAJO
-- ============================================

CREATE TABLE OrdenesTrabajo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_orden INTEGER NOT NULL UNIQUE,
    token TEXT UNIQUE NOT NULL,
    cliente_id INTEGER,
    vehiculo_id INTEGER,
    patente_placa TEXT NOT NULL,
    fecha_ingreso TEXT,
    hora_ingreso TEXT,
    recepcionista TEXT,
    marca TEXT,
    modelo TEXT,
    anio INTEGER,
    cilindrada TEXT,
    combustible TEXT,
    kilometraje TEXT,
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
    nivel_combustible TEXT,
    check_paragolfe_delantero_der INTEGER DEFAULT 0,
    check_puerta_delantera_der INTEGER DEFAULT 0,
    check_puerta_trasera_der INTEGER DEFAULT 0,
    check_paragolfe_trasero_izq INTEGER DEFAULT 0,
    check_otros_carroceria TEXT,
    monto_total REAL DEFAULT 0,
    monto_abono REAL DEFAULT 0,
    monto_restante REAL DEFAULT 0,
    metodo_pago TEXT,
    estado TEXT DEFAULT 'Enviada' CHECK(estado IN ('Enviada', 'Aprobada', 'Cancelada', 'completada', 'en_proceso', 'Cerrada')),
    estado_trabajo TEXT DEFAULT 'Pendiente Visita',
    cliente_nombre TEXT,
    cliente_rut TEXT,
    cliente_telefono TEXT,
    firma_imagen TEXT,
    fecha_aprobacion TEXT,
    aprobado_por TEXT,
    pagado INTEGER DEFAULT 0,
    fecha_pago TEXT,
    requiere_abono INTEGER DEFAULT 0,
    tecnico_asignado_id INTEGER,
    token_firma_tecnico TEXT UNIQUE,
    direccion TEXT,
    notas TEXT,
    completo INTEGER DEFAULT 0,
    fecha_completado TEXT,
    fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES Clientes(id) ON DELETE SET NULL,
    FOREIGN KEY (vehiculo_id) REFERENCES Vehiculos(id) ON DELETE SET NULL,
    FOREIGN KEY (tecnico_asignado_id) REFERENCES Tecnicos(id) ON DELETE SET NULL
);

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

CREATE TABLE Tecnicos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    telefono TEXT NOT NULL UNIQUE,
    email TEXT,
    pin TEXT NOT NULL,
    activo INTEGER DEFAULT 1,
    fecha_registro TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_tecnicos_telefono ON Tecnicos(telefono);
CREATE INDEX IF NOT EXISTS idx_tecnicos_activo ON Tecnicos(activo);

-- Técnico de ejemplo
INSERT OR IGNORE INTO Tecnicos (nombre, telefono, email, pin)
VALUES ('Técnico Prueba', '+56900000000', 'tecnico@globalpro.cl', '1234');

-- ============================================
-- TABLA DE ASIGNACIONES DE ÓRDENES A TÉCNICOS
-- ============================================

CREATE TABLE AsignacionesTecnico (
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
CREATE INDEX IF NOT EXISTS idx_asignaciones_fecha ON AsignacionesTecnico(fecha_asignacion);

-- ============================================
-- TABLA DE SEGUIMIENTO DE TRABAJO
-- ============================================

CREATE TABLE SeguimientoTrabajo (
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
CREATE INDEX IF NOT EXISTS idx_seguimiento_fecha ON SeguimientoTrabajo(fecha_hora);

-- ============================================
-- TABLA DE FOTOS DE TRABAJO
-- ============================================

CREATE TABLE FotosTrabajo (
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
CREATE INDEX IF NOT EXISTS idx_fotos_tipo ON FotosTrabajo(tipo_foto);
CREATE INDEX IF NOT EXISTS idx_fotos_fecha ON FotosTrabajo(fecha_subida);

-- ============================================
-- TABLA DE NOTAS DE TRABAJO
-- ============================================

CREATE TABLE NotasTrabajo (
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
CREATE INDEX IF NOT EXISTS idx_notas_fecha ON NotasTrabajo(fecha_nota);

-- ============================================
-- TABLA DE PAGOS
-- ============================================

CREATE TABLE Pagos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orden_id INTEGER NOT NULL,
  monto REAL NOT NULL,
  metodo_pago TEXT NOT NULL,
  fecha_pago DATETIME DEFAULT CURRENT_TIMESTAMP,
  observaciones TEXT,
  FOREIGN KEY (orden_id) REFERENCES OrdenesTrabajo(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pagos_orden ON Pagos(orden_id);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha ON Pagos(fecha_pago);

-- ============================================
-- VERIFICACIÓN
-- ============================================

SELECT 'Base de datos recreada exitosamente' AS mensaje,
       (SELECT COUNT(*) FROM Tecnicos) AS tecnicos,
       (SELECT COUNT(*) FROM OrdenesTrabajo) AS ordenes,
       (SELECT COUNT(*) FROM Clientes) AS clientes;