-- ============================================================
-- ESQUEMA COMPLETO DE BASE DE DATOS - GLOBAL PRO AUTOMOTRIZ
-- Cloudflare D1 (SQLite)
-- ============================================================

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
-- ÍNDICES PARA OPTIMIZAR CONSULTAS
-- ============================================================
CREATE INDEX idx_ordenes_patente ON OrdenesTrabajo(patente);
CREATE INDEX idx_ordenes_estado ON OrdenesTrabajo(estado);
CREATE INDEX idx_ordenes_cliente ON OrdenesTrabajo(cliente_id);
CREATE INDEX idx_ordenes_tecnico ON OrdenesTrabajo(tecnico_id);
CREATE INDEX idx_ordenes_tecnico_asignado ON OrdenesTrabajo(tecnico_asignado_id);
CREATE INDEX idx_ordenes_token_aprobacion ON OrdenesTrabajo(token_aprobacion);
CREATE INDEX idx_ordenes_token_firma ON OrdenesTrabajo(token_firma);
CREATE INDEX idx_ordenes_token_tecnico ON OrdenesTrabajo(token_firma_tecnico);
CREATE INDEX idx_abonos_orden ON Abonos(orden_id);
CREATE INDEX idx_pagos_orden ON Pagos(orden_id);

-- ============================================================
-- DATOS INICIALES (OPCIONAL - Usuario Admin por defecto)
-- ============================================================
-- Nota: La contraseña debe estar hasheada en producción
-- Este es un ejemplo con contraseña "admin123" (debe cambiarla)
INSERT INTO Usuarios (nombre, email, password, rol) VALUES
('Administrador', 'admin@globalpro.com', 'admin123', 'admin');

-- ============================================================
-- CONFIRMACIÓN DE CREACIÓN
-- ============================================================
SELECT 'Base de datos creada exitosamente' AS mensaje,
       (SELECT COUNT(*) FROM Usuarios) AS total_usuarios,
       (SELECT COUNT(*) FROM Clientes) AS total_clientes,
       (SELECT COUNT(*) FROM OrdenesTrabajo) AS total_ordenes;
