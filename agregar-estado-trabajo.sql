-- Agregar columna estado_trabajo a OrdenesTrabajo si no existe
ALTER TABLE OrdenesTrabajo ADD COLUMN estado_trabajo TEXT DEFAULT 'Pendiente Visita';

-- Actualizar órdenes existentes que estén en 'en_proceso' a 'Pendiente Visita'
UPDATE OrdenesTrabajo SET estado_trabajo = 'Pendiente Visita' WHERE estado = 'en_proceso';

-- Agregar CHECK constraint si es posible (SQLite limita ALTER TABLE)
-- Nota: SQLite no soporta agregar CHECK constraints con ALTER TABLE fácilmente.
-- Si necesitas constraint, recrea la tabla o usa triggers.

-- Verificación
SELECT 'Columna estado_trabajo agregada exitosamente' AS mensaje,
       estado_trabajo,
       COUNT(*) as total_ordenes
FROM OrdenesTrabajo
GROUP BY estado_trabajo;