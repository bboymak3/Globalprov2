-- ============================================
-- ACTUALIZACIÓN DE BASE DE DATOS - TOKEN DE FIRMA DE TÉCNICO
-- Global Pro Automotriz
-- ============================================

-- Agregar campo para token de firma generado por el técnico
ALTER TABLE OrdenesTrabajo ADD COLUMN token_firma_tecnico TEXT;

-- Agregar índice para búsquedas por token
CREATE INDEX IF NOT EXISTS idx_ordenes_token_firma_tecnico ON OrdenesTrabajo(token_firma_tecnico);
