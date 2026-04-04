-- ============================================================
-- SCRIPT DE RECONSTRUCCIÓN COMPLETA DE BASE DE DATOS
-- Elimina todas las tablas y las recrea con la estructura correcta
-- ============================================================

-- Deshabilitar restricciones de clave foránea temporalmente
PRAGMA foreign_keys = OFF;

-- Eliminar TODAS las tablas existentes (orden inverso para evitar errores de claves foráneas)
DROP TABLE IF EXISTS Pagos;
DROP TABLE IF EXISTS Abonos;
DROP TABLE IF EXISTS OrdenesTrabajo;
DROP TABLE IF EXISTS Clientes;
DROP TABLE IF EXISTS Usuarios;

-- Volver a habilitar restricciones de clave foránea
PRAGMA foreign_keys = ON;

-- ============================================================
-- TABLA: Usuarios (Administradores y Técnicos)
-- ============================================================
CREATE TABLE Usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    rol TEXT NOT NULL CHECK(rol IN ('admin', 'tecnico')),
    activo INTEGER DEFAULT 1,
    creado_en TEXT DEFAULT (datetime('now', 'localtime'))
);

-- ============================================================
-- TABLA: Clientes
-- ============================================================
CREATE TABLE Clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    telefono TEXT,
    email TEXT,
    direccion TEXT,
    creado_en TEXT DEFAULT (datetime('now', 'localtime'))
);

-- ============================================================
-- TABLA: OrdenesTrabajo
-- 36 columnas exactas para coincidir con el INSERT statement
-- ============================================================
CREATE TABLE OrdenesTrabajo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patente TEXT NOT NULL,
    marca TEXT NOT NULL,
    modelo TEXT NOT NULL,
    anio INTEGER,
    kilometraje INTEGER,
    cliente_id INTEGER,
    cliente_nombre TEXT NOT NULL,
    cliente_telefono TEXT NOT NULL,
    vehiculo TEXT NOT NULL,
    servicio TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    precio REAL DEFAULT 0,
    estado TEXT DEFAULT 'pendiente' CHECK(estado IN ('pendiente', 'aprobada', 'en_proceso', 'completada', 'cancelada')),
    requiere_abono INTEGER DEFAULT 0,
    fecha_creacion TEXT DEFAULT (datetime('now', 'localtime')),
    fecha_aprobacion TEXT,
    fecha_completado TEXT,
    admin_id INTEGER,
    aprobado_por TEXT,
    tecnico_id INTEGER,
    tecnico_asignado TEXT,
    token_aprobacion TEXT UNIQUE,
    token_firma TEXT,
    firma_data TEXT,
    fecha_firma TEXT,
    notas TEXT,
    pagado INTEGER DEFAULT 0,
    completo INTEGER DEFAULT 0,
    fecha_pago TEXT,
    token_firma_tecnico TEXT,
    direccion TEXT,
    tecnico_asignado_id INTEGER,
    FOREIGN KEY (cliente_id) REFERENCES Clientes(id) ON DELETE SET NULL,
    FOREIGN KEY (admin_id) REFERENCES Usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (tecnico_id) REFERENCES Usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (tecnico_asignado_id) REFERENCES Usuarios(id) ON DELETE SET NULL
);

-- ============================================================
-- TABLA: Abonos
-- ============================================================
CREATE TABLE Abonos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orden_id INTEGER NOT NULL,
    monto REAL NOT NULL,
    fecha TEXT DEFAULT (datetime('now', 'localtime')),
    nota TEXT,
    FOREIGN KEY (orden_id) REFERENCES OrdenesTrabajo(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLA: Pagos
-- ============================================================
CREATE TABLE Pagos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orden_id INTEGER NOT NULL,
    monto REAL NOT NULL,
    metodo TEXT DEFAULT 'efectivo' CHECK(metodo IN ('efectivo', 'tarjeta', 'transferencia')),
    fecha TEXT DEFAULT (datetime('now', 'localtime')),
    referencia TEXT,
    procesado INTEGER DEFAULT 0,
    FOREIGN KEY (orden_id) REFERENCES OrdenesTrabajo(id) ON DELETE CASCADE
);

-- ============================================================
-- ÍNDICES para optimizar consultas
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_ordenes_patente ON OrdenesTrabajo(patente);
CREATE INDEX IF NOT EXISTS idx_ordenes_estado ON OrdenesTrabajo(estado);
CREATE INDEX IF NOT EXISTS idx_ordenes_cliente ON OrdenesTrabajo(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_tecnico ON OrdenesTrabajo(tecnico_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_tecnico_asignado ON OrdenesTrabajo(tecnico_asignado_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_token_aprobacion ON OrdenesTrabajo(token_aprobacion);
CREATE INDEX IF NOT EXISTS idx_ordenes_token_firma ON OrdenesTrabajo(token_firma);
CREATE INDEX IF NOT EXISTS idx_ordenes_token_tecnico ON OrdenesTrabajo(token_firma_tecnico);
CREATE INDEX IF NOT EXISTS idx_abonos_orden ON Abonos(orden_id);
CREATE INDEX IF NOT EXISTS idx_pagos_orden ON Pagos(orden_id);

-- ============================================================
-- CONFIRMACIÓN
-- ============================================================
SELECT 'Base de datos reconstruida exitosamente' as mensaje;
SELECT COUNT(*) as total_ordenes FROM OrdenesTrabajo;
SELECT COUNT(*) as total_clientes FROM Clientes;
SELECT COUNT(*) as total_usuarios FROM Usuarios;
