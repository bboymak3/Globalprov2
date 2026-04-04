# 🔧 Sistema de Órdenes de Trabajo
## Global Pro Automotriz

Sistema completo de gestión de órdenes de trabajo para taller mecánico, desplegado en Cloudflare Pages con base de datos D1.

---

## ✨ CARACTERÍSTICAS PRINCIPALES

### 🎯 Panel Administrativo
- ✅ Campo de **PATENTE/PLACA** como PRIMERA entrada (grande y claro)
- ✅ Búsqueda automática de vehículos por patente
- ✅ Autocompletado de datos de vehículos y clientes
- ✅ Formulario completo con todos los datos necesarios
- ✅ Numeración secuencial automática de órdenes
- ✅ Sistema de abonos con cálculo automático de saldo pendiente
- ✅ Buscador de órdenes por patente
- ✅ Filtros por estado (Enviada, Aprobada, Cancelada)
- ✅ Vista detallada de órdenes con firma estampada
- ✅ Generación de PDF con jsPDF (cliente)

### 📱 Página de Aprobación del Cliente
- ✅ Mensaje personalizado con nombre del cliente
- ✅ Muestra toda la información relevante:
  - Número de orden
  - Fecha y hora
  - Nombre del técnico
  - Valor total, abono y restante
  - Resumen de trabajos seleccionados
  - Datos del vehículo
  - Checklist del vehículo
- ✅ Canvas de firma optimizado para móvil (touch events)
- ✅ Botones **Aceptar** y **Cancelar** la orden
- ✅ Pantalla de confirmación después de aprobar
- ✅ Opción de descargar PDF
- ✅ Enlace para enviar confirmación por WhatsApp

### 🎨 Estados con Colores
- 🟠 **Enviada - En Firma** (Naranja): Orden creada, esperando firma del cliente
- 🟢 **Firmada - Aprobada** (Verde): Cliente firmó y aprobó
- 🔴 **Cancelada** (Rojo): Cliente canceló la orden

### 📄 PDF Generado
- ✅ Todos los datos de la orden
- ✅ Información del taller (empresa, dirección, contactos)
- ✅ Datos del cliente
- ✅ Datos del vehículo
- ✅ Trabajos a realizar
- ✅ Checklist del vehículo
- ✅ Valores (total, abono, restante)
- ✅ Firma del cliente (imagen incrustada)
- ✅ Fecha de aprobación
- ✅ Validez y responsabilidad

---

## 🚀 INICIO RÁPIDO

### Requisitos
- Cuenta de Cloudflare (gratuita)
- Git (opcional)

### Instalación en 5 minutos

1. **Subir a Cloudflare Pages**
   - Crea un proyecto en Cloudflare Pages
   - Sube todos los archivos del proyecto
   - Deploy automático

2. **Crear Base de Datos D1**
   - Ve a Settings > D1 databases
   - Crea una nueva base de datos
   - Ejecuta el contenido de `schema.sql` en la consola

3. **Vincular Base de Datos**
   - Ve a Settings > Functions > D1 database bindings
   - Agrega binding con nombre: `DB`
   - Selecciona tu base de datos

4. **¡Listo!**
   - Accede a la URL de tu sitio
   - Comienza a crear órdenes

**Para instrucciones detalladas, ver:** [docs/INSTALACION.md](docs/INSTALACION.md)

---

## 📁 ESTRUCTURA DEL PROYECTO

```
taller-cloudflare/
├── logo-ot/                    # Carpeta para el logo
│   └── logo.png               # Tu logo va aquí
├── functions/
│   ├── api/                   # Endpoints de la API
│   │   ├── crear-orden.js
│   │   ├── buscar-patente.js
│   │   ├── buscar-ordenes.js
│   │   ├── ver-orden.js
│   │   ├── proximo-numero-orden.js
│   │   ├── aprobar-orden.js
│   │   └── cancelar-orden.js
│   └── aprobar/               # Página de aprobación
│       ├── index.js
│       └── _middleware.js
├── docs/
│   └── INSTALACION.md         # Guía completa
├── index.html                 # Panel administrativo
├── app.js                     # Lógica del panel
├── schema.sql                 # Esquema de BD
└── package.json               # Dependencias
```

---

## 💡 USO DEL SISTEMA

### Para el Técnico

1. **Crear Nueva Orden**
   - Ingresa la **PATENTE** (campo principal, grande y claro)
   - El sistema busca automáticamente si existe el vehículo
   - Completa los datos del vehículo y cliente
   - Selecciona los trabajos a realizar
   - Completa el checklist del vehículo
   - Ingresa los montos y abonos (si aplica)
   - Guarda la orden
   - Copia el link y envíalo por WhatsApp al cliente

2. **Buscar Órdenes**
   - Ingresa la patente del vehículo
   - Filtra por estado (En Firma, Aprobadas, Canceladas)
   - Ve los detalles de cada orden
   - Descarga PDF o comparte el link

### Para el Cliente

1. **Recibir el Link**
   - Abre el link de WhatsApp
   - Ve toda la información de la orden
   - Firma en el canvas con el dedo (móvil)

2. **Aprobar o Cancelar**
   - **Aceptar**: Firma y aprueba la orden
   - **Cancelar**: Indica el motivo y cancela

3. **Después de Aprobar**
   - Descarga el PDF
   - Envía confirmación por WhatsApp al taller

---

## 🎨 CARACTERÍSTICAS TÉCNICAS

### Frontend
- HTML5 + CSS3 + JavaScript Vanilla
- Bootstrap 5 para diseño responsivo
- jsPDF para generación de PDF (cliente)
- Font Awesome para iconos
- Canvas API para firma digital

### Backend
- Cloudflare Pages Functions
- Cloudflare D1 (SQLite)
- API RESTful
- Sin autenticación (según especificación)

### Base de Datos
- Tablas: Configuracion, Clientes, Vehiculos, OrdenesTrabajo
- Índices optimizados para búsquedas
- Numeración secuencial automática
- Relaciones entre tablas

---

## 📋 CAMPOS DEL FORMULARIO

### Información General
- Número de orden (automático, secuencial)
- Fecha de ingreso
- Hora
- Recepcionista

### Datos del Vehículo
- **Patente/Placa** (PRIMER CAMPO, grande y claro)
- Marca
- Modelo
- Año
- Cilindrada
- Combustible
- Kilometraje

### Datos del Cliente
- Nombre
- R.U.T.
- Teléfono

### Trabajos a Realizar (5 categorías)
1. Frenos (con detalle)
2. Luces (con detalle)
3. Tren Delantero (con detalle)
4. Correas (con detalle)
5. Componentes (con detalle)

### Checklist del Vehículo
- Nivel de combustible (Lleno, 3/4, 1/2, 1/4, Bajo)
- Estado de carrocería:
  - Parachoques delantero derecho
  - Puerta delantera derecha
  - Puerta trasera derecha
  - Parachoques trasero izquierdo
  - Otros

### Montos y Pagos
- Monto total estimado
- ¿Tiene abono? (checkbox)
- Monto del abono
- Método de pago (Efectivo, Transferencia, Tarjeta, Cheque)
- Restante (calculado automáticamente)

---

## 🔧 CONFIGURACIÓN

### Logo
- Coloca tu logo en: `logo-ot/logo.png`
- Formato: PNG (preferible) o JPG
- Tamaño recomendado: 500x500px o 800x300px
- El sistema lo lee automáticamente

### Número de Orden Inicial
- Por defecto comienza en: 000058
- Para cambiar, ejecuta: `UPDATE Configuracion SET ultimo_numero_orden = 57 WHERE id = 1;`

---

## 📄 EJEMPLO DE FLUJO COMPLETO

```
1. TÉCNICO
   ├─ Ingresa patente: GP LT 55
   ├─ Sistema busca vehículo automáticamente
   ├─ Completa datos del trabajo
   ├─ Ingresa montos: Total $150.000, Abono $50.000
   ├─ Sistema calcula: Restante $100.000
   ├─ Guarda orden → N° 000058
   ├─ Recibe link: tu-sitio.com/aprobar?token=abc123
   └─ Envía link al cliente por WhatsApp

2. CLIENTE (en su celular)
   ├─ Abre link
   ├─ Ve mensaje: "Estimado/a Denis Lehín..."
   ├─ Ve información completa:
   │  ├─ Orden #000058
   │  ├─ Fecha: 23-03-2024 15:30
   │  ├─ Técnico: Alberto
   │  ├─ Total: $150.000, Abono: $50.000, Restante: $100.000
   │  ├─ Trabajos: ✓ Frenos, ✓ Luces, ✓ Tren Delantero
   │  └─ Vehículo: Chevrolet Sail 2014, Patente GP LT 55
   ├─ Firma en canvas con el dedo
   ├─ Presiona "✅ Aceptar y Firmar"
   └─ Ve pantalla de confirmación

3. TÉCNICO
   ├─ Busca orden por patente: GP LT 55
   ├─ Ve estado: 🟢 Aprobada
   ├─ Ve firma estampada
   ├─ Descarga PDF con todos los datos y firma
   └─ Comparte link si es necesario
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Base de datos no funciona
- Verifica que D1 esté creada
- Ejecuta schema.sql
- Configura binding `DB`

### Canvas de firma no funciona en móvil
- Prueba en otro navegador
- Asegúrate de no tener zoom activo

### PDF no muestra logo
- Verifica que `logo-ot/logo.png` exista
- Verifica el nombre exacto (minúsculas)
- Redespliega el proyecto

### Número de orden no secuencial
- Verifica tabla Configuracion
- Ejecuta: `INSERT INTO Configuracion (id, ultimo_numero_orden) VALUES (1, 57);`

**Para más detalles, ver:** [docs/INSTALACION.md](docs/INSTALACION.md)

---

## 📞 SOPORTE

- **Documentación completa:** [docs/INSTALACION.md](docs/INSTALACION.md)
- **Cloudflare Pages Docs:** https://developers.cloudflare.com/pages/
- **Cloudflare D1 Docs:** https://developers.cloudflare.com/d1/

---

## 📝 LICENCIA

Este proyecto fue desarrollado para **Global Pro Automotriz**.

---

## ✅ CHECKLIST DE DESPLIEGUE

- [ ] Proyecto subido a Cloudflare Pages
- [ ] Base de datos D1 creada
- [ ] Schema SQL ejecutado
- [ ] Binding `DB` configurado
- [ ] Deploy exitoso
- [ ] Logo (opcional) en `logo-ot/logo.png`
- [ ] Probar: Crear orden
- [ ] Probar: Buscar vehículo
- [ ] Probar: Cliente firma y aprueba
- [ ] Probar: Generar PDF
- [ ] Probar: Estados con colores

---

**¡Sistema listo para producción! 🚀**
