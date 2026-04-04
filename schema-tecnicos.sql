-- ============================================
-- ESQUEMA DE BASE DE DATOS PARA SISTEMA DE TÉCNICOS
-- Global Pro Automotriz
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

-- Tabla de Asignaciones de Órdenes a Técnicos
CREATE TABLE IF NOT EXISTS AsignacionesTecnico (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orden_id INTEGER NOT NULL,
  tecnico_id INTEGER NOT NULL,
  fecha_asignacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  asignado_por TEXT,  -- Nombre del admin que asignó
  FOREIGN KEY (orden_id) REFERENCES OrdenesTrabajo(id),
  FOREIGN KEY (tecnico_id) REFERENCES Tecnicos(id),
  UNIQUE(orden_id)  -- Una orden solo puede estar asignada a un técnico
);

-- Tabla de Seguimiento de Trabajo (cambios de estado)
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
  FOREIGN KEY (orden_id) REFERENCES OrdenesTrabajo(id),
  FOREIGN KEY (tecnico_id) REFERENCES Tecnicos(id)
);

-- Tabla de Fotos de Trabajo
CREATE TABLE IF NOT EXISTS FotosTrabajo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orden_id INTEGER NOT NULL,
  tecnico_id INTEGER NOT NULL,
  tipo_foto TEXT NOT NULL,  -- 'antes', 'despues', 'evidencia'
  url_imagen TEXT NOT NULL,  -- URL en Cloudflare R2
  descripcion TEXT,
  fecha_subida DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (orden_id) REFERENCES OrdenesTrabajo(id),
  FOREIGN KEY (tecnico_id) REFERENCES Tecnicos(id)
);

-- Tabla de Notas de Trabajo
CREATE TABLE IF NOT EXISTS NotasTrabajo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orden_id INTEGER NOT NULL,
  tecnico_id INTEGER NOT NULL,
  nota TEXT NOT NULL,
  fecha_nota DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (orden_id) REFERENCES OrdenesTrabajo(id),
  FOREIGN KEY (tecnico_id) REFERENCES Tecnicos(id)
);

-- Actualizar tabla OrdenesTrabajo para agregar dirección y nuevos estados
-- (Agrega estos campos a la tabla existente si no existen)
ALTER TABLE OrdenesTrabajo ADD COLUMN direccion TEXT;
ALTER TABLE OrdenesTrabajo ADD COLUMN referencia_direccion TEXT;
ALTER TABLE OrdenesTrabajo ADD COLUMN tecnico_asignado_id INTEGER;
ALTER TABLE OrdenesTrabajo ADD COLUMN estado_trabajo TEXT DEFAULT 'Pendiente Visita';

-- Estados de trabajo válidos:
-- 'Pendiente Visita' - Orden creada, pendiente de visita del técnico
-- 'En Sitio' - Técnico llegó al lugar
-- 'En Progreso' - Técnico comenzó a trabajar
-- 'Pendiente Piezas' - Esperando repuestos
-- 'Completada' - Trabajo terminado, pendiente firma del cliente
-- 'Aprobada' - Trabajo terminado y firmado por cliente
-- 'No Completada' - No se pudo completar con justificación

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_asignaciones_orden ON AsignacionesTecnico(orden_id);
CREATE INDEX IF NOT EXISTS idx_asignaciones_tecnico ON AsignacionesTecnico(tecnico_id);
CREATE INDEX IF NOT EXISTS idx_seguimiento_orden ON SeguimientoTrabajo(orden_id);
CREATE INDEX IF NOT EXISTS idx_fotos_orden ON FotosTrabajo(orden_id);
CREATE INDEX IF NOT EXISTS idx_notas_orden ON NotasTrabajo(orden_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_estado ON OrdenesTrabajo(estado_trabajo);
CREATE INDEX IF NOT EXISTS idx_ordenes_tecnico ON OrdenesTrabajo(tecnico_asignado_id);

-- Técnico de ejemplo para pruebas (eliminar en producción)
-- PIN: 1234
INSERT OR IGNORE INTO Tecnicos (nombre, telefono, email, codigo_acceso)
VALUES ('Técnico Prueba', '+56900000000', 'tecnico@globalpro.cl', '1234');
