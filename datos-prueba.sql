-- Datos de prueba para técnicos y órdenes
INSERT INTO Tecnicos (nombre, telefono, pin, activo) VALUES
('Juan Pérez', '123456789', '1234', 1),
('María García', '987654321', '5678', 1);

INSERT INTO OrdenesTrabajo (numero_orden, token, patente_placa, fecha_ingreso, hora_ingreso, recepcionista, marca, modelo, anio, trabajo_frenos, monto_total, estado, tecnico_asignado_id, fecha_creacion, fecha_completado) VALUES
(1001, 'token1', 'ABC123', '2024-01-15', '09:00', 'Admin', 'Toyota', 'Corolla', 2020, 1, 50000, 'completada', 1, '2024-01-15 09:00:00', '2024-01-16 17:00:00'),
(1002, 'token2', 'DEF456', '2024-01-16', '10:00', 'Admin', 'Honda', 'Civic', 2019, 1, 75000, 'Cerrada', 1, '2024-01-16 10:00:00', '2024-01-17 16:00:00'),
(1003, 'token3', 'GHI789', '2024-01-17', '11:00', 'Admin', 'Ford', 'Focus', 2018, 0, 30000, 'en_proceso', 2, '2024-01-17 11:00:00', NULL),
(1004, 'token4', 'JKL012', '2024-01-18', '14:00', 'Admin', 'Chevrolet', 'Cruze', 2021, 1, 60000, 'Aprobada', NULL, '2024-01-18 14:00:00', NULL),
(1005, 'token5', 'MNO345', '2024-01-19', '15:00', 'Admin', 'Nissan', 'Sentra', 2017, 1, 45000, 'completada', NULL, '2024-01-19 15:00:00', '2024-01-20 18:00:00');