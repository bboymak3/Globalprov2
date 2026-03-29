-- ============================================
-- TABLA DE PAGOS PARCIALES
-- Para registrar múltiples pagos por orden
-- ============================================

CREATE TABLE IF NOT EXISTS Pagos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orden_id INTEGER NOT NULL,
  monto REAL NOT NULL,
  metodo_pago TEXT NOT NULL, -- 'Efectivo', 'Transferencia', 'Tarjeta', 'Webpay', etc.
  fecha_pago DATETIME DEFAULT CURRENT_TIMESTAMP,
  observaciones TEXT,
  registrador TEXT, -- Nombre del técnico/recepcionista que registró el pago
  FOREIGN KEY (orden_id) REFERENCES OrdenesTrabajo(id)
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_pago_orden ON Pagos(orden_id);
CREATE INDEX IF NOT EXISTS idx_pago_fecha ON Pagos(fecha_pago);
