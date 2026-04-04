-- ============================================================
-- ESQUEMA COMPLETO DE BASE DE DATOS - GLOBAL PRO AUTOMOTRIZ
-- Cloudflare D1 (SQLite)
-- Versión con IF NOT EXISTS para evitar errores de tablas existentes
-- ============================================================

-- ============================================================
-- TABLA: Usuarios (Administradores y Técnicos)
-- ============================================================
CREATE TABLE IF NOT EXISTS Usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    rol TEXT NOT NULL CHECK(rol IN ('admin', 'tecnico')),
    activo INTEGER DEFAULT 1,
    creado_en TEXT DEFAULT (datetime('now', 'localtime'))
);

-- ============================================================
-- TABLA: Tecnicos (Sistema de técnicos móvil)
-- ============================================================
CREATE TABLE IF NOT EXISTS Tecnicos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    telefono TEXT NOT NULL UNIQUE,
    email TEXT,
    pin TEXT NOT NULL,
    activo INTEGER DEFAULT 1,
    fecha_registro TEXT DEFAULT (datetime('now', 'localtime'))
);

-- ============================================================
-- TABLA: Clientes
-- ============================================================
CREATE TABLE IF NOT EXISTS Clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    rut TEXT,
    telefono TEXT NOT NULL,
    email TEXT,
    direccion TEXT,
    creado_en TEXT DEFAULT (datetime('now', 'localtime'))
);

-- ============================================================
-- TABLA: Vehiculos
-- ============================================================
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
    creado_en TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (cliente_id) REFERENCES Clientes(id) ON DELETE SET NULL
);

-- ============================================================
-- TABLA: Configuracion
-- ============================================================
CREATE TABLE IF NOT EXISTS Configuracion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ultimo_numero_orden INTEGER DEFAULT 0,
    ultima_actualizacion TEXT DEFAULT (datetime('now', 'localtime'))
);

-- Insertar configuración inicial solo si no existe
INSERT OR IGNORE INTO Configuracion (id, ultimo_numero_orden) VALUES (1, 57);

-- ============================================================
-- TABLA: OrdenesTrabajo
-- ============================================================
CREATE TABLE IF NOT EXISTS OrdenesTrabajo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_orden INTEGER NOT NULL UNIQUE,
    token TEXT UNIQUE NOT NULL,
    cliente_id INTEGER,
    vehiculo_id INTEGER,
    patente_placa TEXT NOT NULL,
    fecha_ingreso TEXT,
    hora_ingreso TEXT,
    recepcionista TEXT,
    
    -- Datos del vehículo (redundantes para mejor rendimiento)
    marca TEXT,
    modelo TEXT,
    anio INTEGER,
    cilindrada TEXT,
    combustible TEXT,
    kilometraje TEXT,
    
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
    
    -- Montos
    monto_total REAL DEFAULT 0,
    monto_abono REAL DEFAULT 0,
    monto_restante REAL DEFAULT 0,
    metodo_pago TEXT,
    
    -- Estado
    estado TEXT DEFAULT 'Enviada' CHECK(estado IN ('Enviada', 'Aprobada', 'Cancelada', 'completada', 'en_proceso')),
    fecha_creacion TEXT DEFAULT (datetime('now', 'localtime')),
    
    -- Aprobación y firma
    cliente_nombre TEXT,
    cliente_rut TEXT,
    cliente_telefono TEXT,
    firma_imagen TEXT,
    fecha_aprobacion TEXT,
    aprobado_por TEXT,
    
    -- Pagos
    pagado INTEGER DEFAULT 0,
    fecha_pago TEXT,
    requiere_abono INTEGER DEFAULT 0,
    
    -- Técnico asignado
    tecnico_asignado_id INTEGER,
    
    -- Sistema de firma del técnico (nuevo)
    token_firma_tecnico TEXT UNIQUE,
    direccion TEXT,
    notas TEXT,
    completo INTEGER DEFAULT 0,
    fecha_completado TEXT,
    
    FOREIGN KEY (cliente_id) REFERENCES Clientes(id) ON DELETE SET NULL,
    FOREIGN KEY (vehiculo_id) REFERENCES Vehiculos(id) ON DELETE SET NULL,
    FOREIGN KEY (tecnico_asignado_id) REFERENCES Tecnicos(id) ON DELETE SET NULL
);

-- ============================================================
-- TABLA: Abonos
-- ============================================================
CREATE TABLE IF NOT EXISTS Abonos (
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
CREATE TABLE IF NOT EXISTS Pagos (
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
-- Índices de Usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON Usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON Usuarios(rol);

-- Índices de Tecnicos
CREATE INDEX IF NOT EXISTS idx_tecnicos_telefono ON Tecnicos(telefono);
CREATE INDEX IF NOT EXISTS idx_tecnicos_activo ON Tecnicos(activo);

-- Índices de Clientes
CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON Clientes(telefono);
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON Clientes(nombre);

-- Índices de Vehiculos
CREATE INDEX IF NOT EXISTS idx_vehiculos_patente ON Vehiculos(patente_placa);
CREATE INDEX IF NOT EXISTS idx_vehiculos_cliente ON Vehiculos(cliente_id);

-- Índices de OrdenesTrabajo
CREATE INDEX IF NOT EXISTS idx_ordenes_numero ON OrdenesTrabajo(numero_orden);
CREATE INDEX IF NOT EXISTS idx_ordenes_patente ON OrdenesTrabajo(patente_placa);
CREATE INDEX IF NOT EXISTS idx_ordenes_estado ON OrdenesTrabajo(estado);
CREATE INDEX IF NOT EXISTS idx_ordenes_cliente ON OrdenesTrabajo(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_vehiculo ON OrdenesTrabajo(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_token ON OrdenesTrabajo(token);
CREATE INDEX IF NOT EXISTS idx_ordenes_tecnico_asignado ON OrdenesTrabajo(tecnico_asignado_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_token_tecnico ON OrdenesTrabajo(token_firma_tecnico);

-- Índices de Abonos
CREATE INDEX IF NOT EXISTS idx_abonos_orden ON Abonos(orden_id);

-- Índices de Pagos
CREATE INDEX IF NOT EXISTS idx_pagos_orden ON Pagos(orden_id);

-- ============================================================
-- DATOS INICIALES (OPCIONAL - Usuario Admin por defecto)
-- ============================================================
-- Nota: La contraseña debe estar hasheada en producción
-- Este es un ejemplo con contraseña "admin123" (debe cambiarla)
-- INSERT OR IGNORE evita duplicados si ya existe
INSERT OR IGNORE INTO Usuarios (nombre, email, password, rol) VALUES
('Administrador', 'admin@globalpro.com', 'admin123', 'admin');

-- ============================================================
-- CONFIRMACIÓN DE CREACIÓN
-- ============================================================
SELECT 'Base de datos creada exitosamente' AS mensaje,
       (SELECT COUNT(*) FROM Usuarios) AS total_usuarios,
       (SELECT COUNT(*) FROM Tecnicos) AS total_tecnicos,
       (SELECT COUNT(*) FROM Clientes) AS total_clientes,
       (SELECT COUNT(*) FROM Vehiculos) AS total_vehiculos,
       (SELECT COUNT(*) FROM OrdenesTrabajo) AS total_ordenes,
       (SELECT ultimo_numero_orden FROM Configuracion WHERE id = 1) AS proximo_numero_orden;
