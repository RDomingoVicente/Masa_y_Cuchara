/**
 * Payment Service - Gestión de Pagos con Stripe
 * 
 * Este servicio maneja la integración con Stripe para crear sesiones de pago
 * y procesar webhooks.
 * 
 * REGLAS CRÍTICAS:
 * - Los precios YA están en céntimos en nuestro modelo
 * - NO convertir precios, pasarlos directamente a Stripe
 * - SIEMPRE incluir order_id en metadata para conciliación
 * - Usar tipos estrictos de src/types/index.ts
 */

import Stripe from 'stripe';
import type { Order } from '@/types/index';

// ============================================================================
// INICIALIZACIÓN DE STRIPE
// ============================================================================

/**
 * Cliente de Stripe inicializado con la clave secreta
 * 
 * IMPORTANTE: La clave debe estar en .env.local como STRIPE_SECRET_KEY
 */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
  typescript: true
});

// ============================================================================
// TIPOS AUXILIARES
// ============================================================================

/**
 * Resultado de la creación de sesión de Stripe
 */
export interface CheckoutSessionResult {
  success: boolean;
  session_id: string;
  url: string;
  message: string;
}

/**
 * Error personalizado para operaciones de pago
 */
export class PaymentError extends Error {
  constructor(
    message: string,
    public code: 'STRIPE_SESSION_FAILED' | 'INVALID_ORDER' | 'WEBHOOK_VERIFICATION_FAILED',
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

// ============================================================================
// FUNCIÓN PRINCIPAL: CREATE CHECKOUT SESSION
// ============================================================================

/**
 * Crea una sesión de pago en Stripe para un pedido.
 * 
 * PROTOCOLO CRÍTICO (Sección 11.2 de ARQUITECTURA_DETALLADA.md):
 * 1. El pedido YA debe existir en Firestore con estado PENDING_PAYMENT
 * 2. Los precios están en céntimos y NO deben convertirse
 * 3. El order_id se guarda en metadata para conciliación en webhook
 * 
 * @param order - Pedido completo con order_id
 * @returns Resultado con URL de pago y session_id
 * 
 * @throws {PaymentError} Si falla la creación de la sesión
 * 
 * @example
 * const order = await getOrder('order-123');
 * const session = await createCheckoutSession(order);
 * // Redirigir al usuario a session.url
 */
export async function createCheckoutSession(
  order: Order
): Promise<CheckoutSessionResult> {
  // Validación 1: El pedido debe tener un ID
  if (!order.order_id) {
    throw new PaymentError(
      'El pedido debe tener un order_id válido',
      'INVALID_ORDER',
      { order }
    );
  }

  // Validación 2: El pedido debe tener items
  if (!order.items || order.items.length === 0) {
    throw new PaymentError(
      'El pedido debe contener al menos un item',
      'INVALID_ORDER',
      { orderId: order.order_id }
    );
  }

  // Validación 3: El total debe ser mayor a 0
  if (order.payment.total_amount <= 0) {
    throw new PaymentError(
      'El monto total debe ser mayor a 0',
      'INVALID_ORDER',
      { orderId: order.order_id, total: order.payment.total_amount }
    );
  }

  try {
    console.log('[PaymentService] Creando sesión de Stripe...', {
      orderId: order.order_id,
      totalAmount: order.payment.total_amount,
      itemCount: order.items.length
    });

    // Mapear items del pedido a line_items de Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = order.items.map(item => {
      // Construir descripción con modificadores si existen
      let description: string | undefined;
      if (item.modifiers && item.modifiers.length > 0) {
        const modifiersText = item.modifiers
          .map(mod => `${mod.type}: ${mod.value}`)
          .join(', ');
        description = `Modificadores: ${modifiersText}`;
      }

      return {
        price_data: {
          currency: 'eur',
          // CRÍTICO: unit_price YA está en céntimos, NO convertir
          unit_amount: item.unit_price,
          product_data: {
            name: item.name,
            description: description
          }
        },
        quantity: item.qty
      };
    });

    // Crear sesión de pago en Stripe
    const session = await stripe.checkout.sessions.create({
      // Modo de pago único
      mode: 'payment',

      // Items del pedido
      line_items: lineItems,

      // Métodos de pago permitidos
      payment_method_types: ['card'],

      // URLs de retorno
      success_url: `http://localhost:3000/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:3000/order/cancel`,

      // Metadata para conciliación (CRÍTICO)
      metadata: {
        order_id: order.order_id,
        order_date: order.logistics.order_date,
        slot_id: order.logistics.slot_id,
        customer_uid: order.customer.uid
      },

      // Información del cliente
      customer_email: undefined, // Podríamos agregarlo si tenemos email

      // Configuración regional
      locale: 'es',

      // Permitir códigos promocionales (opcional)
      allow_promotion_codes: false,

      // Expiración de la sesión (30 minutos)
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60)
    });

    console.log('[PaymentService] Sesión de Stripe creada exitosamente:', {
      sessionId: session.id,
      url: session.url
    });

    // Validar que se generó la URL
    if (!session.url) {
      throw new PaymentError(
        'Stripe no generó una URL de pago',
        'STRIPE_SESSION_FAILED',
        { sessionId: session.id }
      );
    }

    return {
      success: true,
      session_id: session.id,
      url: session.url,
      message: 'Sesión de pago creada exitosamente'
    };

  } catch (error) {
    console.error('[PaymentService] Error al crear sesión de Stripe:', error);

    // Si es un error de Stripe, extraer información útil
    if (error instanceof Stripe.errors.StripeError) {
      throw new PaymentError(
        `Error de Stripe: ${error.message}`,
        'STRIPE_SESSION_FAILED',
        {
          stripeCode: error.code,
          stripeType: error.type,
          orderId: order.order_id
        }
      );
    }

    // Si es un PaymentError, re-lanzarlo
    if (error instanceof PaymentError) {
      throw error;
    }

    // Error genérico
    throw new PaymentError(
      'Error al crear la sesión de pago',
      'STRIPE_SESSION_FAILED',
      {
        orderId: order.order_id,
        originalError: error instanceof Error ? error.message : String(error)
      }
    );
  }
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Obtiene una sesión de Stripe por su ID
 * 
 * @param sessionId - ID de la sesión de Stripe
 * @returns Sesión de Stripe
 */
export async function getCheckoutSession(
  sessionId: string
): Promise<Stripe.Checkout.Session> {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session;
  } catch (error) {
    throw new PaymentError(
      'Error al obtener la sesión de Stripe',
      'STRIPE_SESSION_FAILED',
      {
        sessionId,
        originalError: error instanceof Error ? error.message : String(error)
      }
    );
  }
}

/**
 * Verifica la firma de un webhook de Stripe
 * 
 * Esta función se usará en el endpoint de webhook para validar
 * que los eventos provienen realmente de Stripe.
 * 
 * @param payload - Cuerpo de la petición (raw body)
 * @param signature - Header stripe-signature
 * @param webhookSecret - Secret del webhook (de Stripe Dashboard)
 * @returns Evento verificado de Stripe
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );
    return event;
  } catch (error) {
    throw new PaymentError(
      'Firma de webhook inválida',
      'WEBHOOK_VERIFICATION_FAILED',
      {
        originalError: error instanceof Error ? error.message : String(error)
      }
    );
  }
}

/**
 * Crea un reembolso para un pago
 * 
 * Se usa cuando un pedido es cancelado después de haber sido pagado.
 * 
 * @param paymentIntentId - ID del PaymentIntent de Stripe
 * @param amount - Monto a reembolsar en céntimos (opcional, por defecto reembolsa todo)
 * @returns Reembolso de Stripe
 */
export async function createRefund(
  paymentIntentId: string,
  amount?: number
): Promise<Stripe.Refund> {
  try {
    console.log('[PaymentService] Creando reembolso...', {
      paymentIntentId,
      amount
    });

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount // Si es undefined, reembolsa el monto completo
    });

    console.log('[PaymentService] Reembolso creado:', refund.id);
    return refund;

  } catch (error) {
    console.error('[PaymentService] Error al crear reembolso:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      throw new PaymentError(
        `Error al crear reembolso: ${error.message}`,
        'STRIPE_SESSION_FAILED',
        {
          stripeCode: error.code,
          paymentIntentId
        }
      );
    }

    throw new PaymentError(
      'Error al crear el reembolso',
      'STRIPE_SESSION_FAILED',
      {
        paymentIntentId,
        originalError: error instanceof Error ? error.message : String(error)
      }
    );
  }
}

// Exportar el cliente de Stripe por si se necesita en otros lugares
export { stripe };
