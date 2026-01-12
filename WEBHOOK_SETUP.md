# Configuración del Webhook de Stripe

Este documento explica cómo configurar el webhook de Stripe para que funcione con el sistema de pagos de Masa & Cuchara.

## 🔑 Obtener el Webhook Secret

### Opción 1: Desarrollo Local con Stripe CLI (Recomendado)

1. **Instalar Stripe CLI** (si no lo tienes):

   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Linux
   wget https://github.com/stripe/stripe-cli/releases/download/v1.19.4/stripe_1.19.4_linux_x86_64.tar.gz
   tar -xvf stripe_1.19.4_linux_x86_64.tar.gz
   sudo mv stripe /usr/local/bin/
   ```

2. **Autenticarse con Stripe**:

   ```bash
   stripe login
   ```

3. **Iniciar el listener de webhooks**:

   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. **Copiar el webhook secret** que aparece en la consola:

   ```
   > Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
   ```

5. **Agregar a `.env.local`**:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

### Opción 2: Producción (Stripe Dashboard)

1. Ir a [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Hacer clic en "Add endpoint"
3. Configurar:
   - **Endpoint URL**: `https://tu-dominio.com/api/webhooks/stripe`
   - **Events to send**: Seleccionar `checkout.session.completed`
4. Copiar el **Signing secret** que aparece
5. Agregar a las variables de entorno de producción

## 📝 Variables de Entorno Requeridas

Asegúrate de tener estas variables en `.env.local`:

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 🧪 Probar el Webhook

### 1. Iniciar el servidor de desarrollo:

```bash
npm run dev
```

### 2. En otra terminal, iniciar Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### 3. Ejecutar el test de pago:

```bash
npm run test:payment
```

### 4. Completar el pago en Stripe

Cuando completes el pago, deberías ver en la consola:

```
📨 Webhook recibido: checkout.session.completed
🔔 Pago confirmado para el pedido: EYe7klYeZrtJ9idVKSiH
✅ Pedido EYe7klYeZrtJ9idVKSiH actualizado a PAID
```

## 🔍 Verificar el Pedido

Después de recibir el webhook, puedes verificar en Firestore que:

1. El documento `ORDERS/{order_id}` tiene:
   - `workflow.status = "PAID"`
   - `payment.stripe_session_id` con el ID de la sesión
   - `payment.stripe_payment_intent` con el ID del payment intent

## 🐛 Troubleshooting

### Error: "No signature header"

- Asegúrate de que Stripe CLI está corriendo
- Verifica que la URL del webhook es correcta

### Error: "Webhook signature verification failed"

- Verifica que `STRIPE_WEBHOOK_SECRET` está configurado correctamente
- Asegúrate de que el secret corresponde al endpoint correcto

### El webhook no se ejecuta

- Verifica que Next.js está corriendo en `localhost:3000`
- Revisa los logs de Stripe CLI para ver si hay errores
- Verifica que el endpoint `/api/webhooks/stripe` es accesible

## 📚 Eventos Soportados

Actualmente el webhook maneja:

- ✅ `checkout.session.completed` - Cuando el pago se completa exitosamente

Eventos futuros a implementar:

- `checkout.session.expired` - Cuando la sesión expira sin pago
- `payment_intent.payment_failed` - Cuando el pago falla
- `charge.refunded` - Cuando se hace un reembolso

## 🔒 Seguridad

El webhook implementa:

- ✅ Verificación de firma de Stripe
- ✅ Validación de metadata (order_id)
- ✅ Manejo de errores robusto
- ✅ Logging de todos los eventos

**IMPORTANTE**: Nunca compartas tu `STRIPE_WEBHOOK_SECRET` públicamente.
