# 🖨️ Kitchen Ticket System - Guía

## Descripción

El **Sistema de Tickets de Cocina** genera automáticamente tickets en formato texto (80mm thermal printer) cuando un pedido es pagado exitosamente.

## 🎯 Funcionamiento

### Flujo Automático

```
1. Cliente paga pedido (Stripe)
   ↓
2. Webhook recibe confirmación
   ↓
3. Pedido actualizado a PAID
   ↓
4. Ticket generado automáticamente 🖨️
   ↓
5. Archivo guardado en /orders_archive/tickets/
```

## 📁 Ubicación de Tickets

```
/orders_archive/tickets/ticket_[orderId].txt
```

Ejemplo:

```
/orders_archive/tickets/ticket_abc123def456.txt
```

## 📄 Formato del Ticket

### Especificaciones

- **Ancho**: 48 caracteres (80mm thermal printer)
- **Formato**: ASCII text
- **Encoding**: UTF-8

### Estructura

```
================================================
            MASA & CUCHARA
           TICKET DE COCINA
================================================

PEDIDO:                              #ABC123
FECHA:                    11/01/2026 19:30

------------------------------------------------
CLIENTE:
  Juan Pérez
  Tel: +34600000000
------------------------------------------------

================================================
        *** HORA DE ENTREGA ***
                13:15
         Fecha: 2026-01-12
================================================

        *** PRODUCTOS ***

2x Pizza Margarita
   + Mediana
   + Extra queso

1x Cerveza
   + Lager

------------------------------------------------
TOTAL ITEMS:                                  3
================================================

            ¡Buen provecho!

================================================
```

## 🔧 Servicio de Tickets

### Archivo

`src/services/ticketService.ts`

### Funciones Principales

#### `generateKitchenTicket(order: Order): string`

Genera el contenido del ticket en formato texto.

**Parámetros:**

- `order`: Objeto Order completo

**Retorna:**

- String con el contenido del ticket formateado

#### `saveTicketToFile(orderId: string, ticketContent: string): string`

Guarda el ticket en el sistema de archivos.

**Parámetros:**

- `orderId`: ID del pedido
- `ticketContent`: Contenido del ticket

**Retorna:**

- Ruta completa del archivo guardado

#### `createKitchenTicket(order: Order): Promise<string>`

Función principal que genera y guarda el ticket.

**Parámetros:**

- `order`: Objeto Order completo

**Retorna:**

- Promise con la ruta del archivo guardado

## 🔗 Integración con Webhook

### Archivo

`src/app/api/webhooks/stripe/route.ts`

### Implementación

```typescript
// Después de actualizar el pedido a PAID
const orderSnap = await getDoc(orderRef);

if (orderSnap.exists()) {
  const order = {
    ...orderSnap.data(),
    order_id: orderId,
  };

  const { createKitchenTicket } = await import("@/services/ticketService");
  await createKitchenTicket(order);

  console.log(`🖨️ Ticket de cocina generado para pedido ${orderId}`);
}
```

### Manejo de Errores

El sistema está diseñado para **no fallar el webhook** si el ticket falla:

```typescript
try {
  await createKitchenTicket(order);
} catch (ticketError) {
  // No fallar el webhook
  console.error(`⚠️ Error al generar ticket:`, ticketError);
}
```

## 📊 Información Destacada

El ticket resalta la información más importante:

### 1. Hora de Entrega (DESTACADO)

```
================================================
        *** HORA DE ENTREGA ***
                13:15
         Fecha: 2026-01-12
================================================
```

### 2. Productos (DESTACADO)

```
        *** PRODUCTOS ***

2x Pizza Margarita
   + Mediana
1x Cerveza
```

### 3. Cliente

```
CLIENTE:
  Juan Pérez
  Tel: +34600000000
```

## 🧪 Testing

### Probar Generación de Ticket

```bash
npm run test:payment
```

Esto:

1. Crea un pedido de prueba
2. Genera sesión de Stripe
3. Simula pago exitoso
4. Webhook genera ticket automáticamente

### Verificar Ticket Generado

```bash
ls -la orders_archive/tickets/
cat orders_archive/tickets/ticket_*.txt
```

## 📝 Logs

### Logs de Éxito

```
🖨️ Generando ticket de cocina para pedido abc123...
🖨️ Ticket guardado: /path/to/orders_archive/tickets/ticket_abc123.txt
✅ Ticket de cocina generado para pedido abc123
```

### Logs de Error

```
⚠️ Error al generar ticket para abc123: [error details]
```

## 🎨 Personalización

### Cambiar Ancho del Ticket

Edita `src/services/ticketService.ts`:

```typescript
const TICKET_WIDTH = 48; // Cambiar a 32 para 58mm, 64 para 112mm
```

### Modificar Header

```typescript
lines.push(centerText("TU NOMBRE AQUÍ"));
lines.push(centerText("TICKET DE COCINA"));
```

### Agregar Información Extra

```typescript
// Después de los productos
lines.push("");
lines.push("INFORMACIÓN ADICIONAL:");
lines.push(`Método de pago: ${order.payment.method}`);
```

## 🔐 Seguridad

### Permisos de Archivos

Los tickets se guardan con permisos estándar del sistema.

### Datos Sensibles

Los tickets NO incluyen:

- ❌ Información de pago
- ❌ Dirección completa
- ❌ Email

Los tickets SÍ incluyen:

- ✅ Nombre del cliente
- ✅ Teléfono
- ✅ Productos
- ✅ Hora de entrega

## 📦 Almacenamiento

### Estructura de Directorios

```
proyecto/
├── orders_archive/
│   └── tickets/
│       ├── ticket_abc123.txt
│       ├── ticket_def456.txt
│       └── ticket_ghi789.txt
```

### Gestión de Archivos

Los tickets se acumulan en el directorio. Para limpiar:

```bash
# Eliminar tickets antiguos (más de 30 días)
find orders_archive/tickets/ -name "ticket_*.txt" -mtime +30 -delete
```

## 🐛 Troubleshooting

### El ticket no se genera

**Verificar:**

1. Directorio `/orders_archive/tickets/` existe
2. Permisos de escritura
3. Logs del webhook

**Solución:**

```bash
mkdir -p orders_archive/tickets
chmod 755 orders_archive/tickets
```

### Formato incorrecto

**Verificar:**

- Constante `TICKET_WIDTH` correcta
- Datos del pedido completos

### Caracteres especiales

El sistema usa UTF-8. Si hay problemas:

- Verificar encoding del archivo
- Revisar caracteres especiales en nombres

## 📞 Soporte

Documentación relacionada:

- `WEBHOOK_SETUP.md` - Configuración de webhooks
- `KDS_GUIDE.md` - Sistema de cocina
- `docs/walkthrough.md` - Documentación técnica
