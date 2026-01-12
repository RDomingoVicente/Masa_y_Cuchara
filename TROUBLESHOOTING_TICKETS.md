# 🔍 Diagnóstico de Tickets de Cocina

## Problema

Los tickets no se generan automáticamente cuando se ejecuta `npm run test:payment` y se confirma el pago.

## Pasos para Diagnosticar

### 1. Verificar que el servidor Next.js está corriendo

```bash
# En una terminal
npm run dev
```

Deberías ver:

```
▲ Next.js 16.1.1 (Turbopack)
- Local:         http://localhost:3000
✓ Ready in XXXms
```

### 2. Verificar que Stripe CLI está escuchando

```bash
# En OTRA terminal
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Deberías ver:

```
Ready! You are using Stripe API Version [...]
> Ready to forward events to localhost:3000/api/webhooks/stripe
```

**IMPORTANTE:** Copia el webhook secret que aparece (`whsec_...`) y actualiza `.env.local`:

```
STRIPE_WEBHOOK_SECRET=whsec_tu_secret_aqui
```

### 3. Ejecutar el test de pago

```bash
# En una TERCERA terminal
npm run test:payment
```

### 4. Verificar logs en CADA terminal

#### Terminal 1 (Next.js):

Busca estos logs:

```
📨 Webhook recibido: checkout.session.completed
🔔 Pago confirmado para el pedido: [orderId]
✅ Pedido [orderId] actualizado a PAID
🖨️ Generando ticket de cocina para pedido [orderId]...
🖨️ Ticket guardado: /path/to/ticket_[orderId].txt
✅ Ticket de cocina generado para pedido [orderId]
```

#### Terminal 2 (Stripe CLI):

Busca:

```
> payment_intent.succeeded [evt_...]
> checkout.session.completed [evt_...]
< 200 POST /api/webhooks/stripe [evt_...]
```

### 5. Verificar si el ticket se generó

```bash
ls -lah orders_archive/tickets/
cat orders_archive/tickets/ticket_*.txt | tail -50
```

## Problemas Comunes

### A. No aparece "checkout.session.completed" en Stripe CLI

**Causa:** El webhook secret no coincide

**Solución:**

1. Detén Stripe CLI (Ctrl+C)
2. Vuelve a ejecutar: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
3. Copia el NUEVO webhook secret
4. Actualiza `.env.local`
5. **REINICIA el servidor Next.js** (Ctrl+C y `npm run dev`)

### B. Aparece error en Next.js

**Busca errores como:**

```
❌ Error al actualizar pedido [orderId]: [error]
⚠️ Error al generar ticket para [orderId]: [error]
```

**Solución:**

- Copia el error completo
- Verifica permisos de escritura: `mkdir -p orders_archive/tickets && chmod 755 orders_archive/tickets`

### C. El webhook responde 200 pero no genera ticket

**Causa:** Error silencioso en la generación del ticket

**Solución temporal:**
Agrega más logs al webhook. Edita `src/app/api/webhooks/stripe/route.ts`:

```typescript
// Después de línea 97
console.log("🔍 DEBUG: Intentando generar ticket...");

// Después de línea 100
console.log("🔍 DEBUG: orderSnap.exists():", orderSnap.exists());

// Después de línea 110
console.log("🔍 DEBUG: createKitchenTicket importado correctamente");

// En el catch (línea 119)
console.error(`⚠️ Error COMPLETO al generar ticket:`, ticketError);
console.error("Stack trace:", (ticketError as Error).stack);
```

Reinicia Next.js y vuelve a probar.

### D. Stripe CLI no está instalado

```bash
# Verificar
stripe --version

# Si no está instalado (Linux/Mac)
brew install stripe/stripe-cli/stripe

# O descarga desde
# https://stripe.com/docs/stripe-cli
```

### E. No tienes login en Stripe

```bash
stripe login
```

## Verificación Manual

Si todo lo anterior falla, prueba generar un ticket manualmente:

```bash
npm run test:ticket
```

Si esto funciona pero el webhook no, el problema está en:

1. La comunicación entre Stripe y Next.js
2. El webhook secret
3. Los logs del servidor

## Checklist de Verificación

- [ ] Servidor Next.js corriendo (`npm run dev`)
- [ ] Stripe CLI escuchando (`stripe listen...`)
- [ ] Webhook secret actualizado en `.env.local`
- [ ] Servidor Next.js reiniciado después de actualizar `.env.local`
- [ ] Test de pago ejecutado (`npm run test:payment`)
- [ ] Pago confirmado en Stripe
- [ ] Logs verificados en ambas terminales
- [ ] Directorio `orders_archive/tickets/` existe
- [ ] Permisos de escritura correctos

## Siguiente Paso

**¿Qué ves en los logs de Next.js cuando ejecutas el test de pago?**

Copia y pega los logs completos para diagnosticar el problema específico.
