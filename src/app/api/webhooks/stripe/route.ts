/**
 * Stripe Webhook Handler - Masa & Cuchara
 * 
 * Este endpoint recibe eventos de Stripe cuando ocurren cambios en los pagos.
 * Específicamente maneja el evento checkout.session.completed para actualizar
 * el estado del pedido a PAID.
 * 
 * Endpoint: POST /api/webhooks/stripe
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { OrderStatus } from '@/types/index';

// Inicializar Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

// Webhook secret para verificar la firma
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * POST handler para webhooks de Stripe
 */
export async function POST(req: NextRequest) {
  try {
    // Leer el body como texto
    const body = await req.text();
    
    // Obtener la firma del header
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      console.error('❌ Webhook error: No signature header');
      return NextResponse.json(
        { error: 'No signature header' },
        { status: 400 }
      );
    }

    // Verificar la firma del webhook
    let event: Stripe.Event;
    
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        endpointSecret
      );
    } catch (err) {
      const error = err as Error;
      console.error('❌ Webhook signature verification failed:', error.message);
      return NextResponse.json(
        { error: `Webhook Error: ${error.message}` },
        { status: 400 }
      );
    }

    // Manejar el evento
    const logMessage = `[${new Date().toISOString()}] Webhook recibido: ${event.type} (${event.id})`;
    console.log(`📨 ${logMessage}`);
    
    // Log a archivo para debugging
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const logDir = path.join(process.cwd(), 'logs');
      await fs.mkdir(logDir, { recursive: true });
      const logFile = path.join(logDir, 'webhook.log');
      await fs.appendFile(logFile, logMessage + '\n', 'utf-8');
    } catch (logError) {
      console.error('Error writing to log file:', logError);
    }

    console.log(`🔍 Event ID: ${event.id}`);
    console.log(`🔍 Event data object type: ${(event.data.object as any).object}`);

    // Procesar solo el evento checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      console.log('✅ Procesando checkout.session.completed...');
      
      // Log a archivo
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const logFile = path.join(process.cwd(), 'logs', 'webhook.log');
        await fs.appendFile(logFile, `[${new Date().toISOString()}] ✅ Procesando checkout.session.completed\n`, 'utf-8');
      } catch {}
      
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Obtener el order_id del metadata
      const orderId = session.metadata?.order_id;
      
      if (!orderId) {
        console.error('❌ No se encontró order_id en metadata del webhook');
        return NextResponse.json(
          { error: 'No order_id in metadata' },
          { status: 400 }
        );
      }

      console.log(`🔔 Pago confirmado para el pedido: ${orderId}`);

      // Actualizar el estado del pedido a PAID
      try {
        // Importar updateDoc para actualizar directamente
        const { doc, updateDoc, serverTimestamp, getDoc } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase/config');
        
        const orderRef = doc(db, 'ORDERS', orderId);
        
        await updateDoc(orderRef, {
          'workflow.status': OrderStatus.PAID,
          'workflow.updated_at': serverTimestamp(),
          'payment.stripe_session_id': session.id,
          'payment.stripe_payment_intent': session.payment_intent as string,
        });

        console.log(`✅ Pedido ${orderId} actualizado a PAID`);

        // Generar ticket de cocina
        try {
          console.log(`🖨️ Intentando generar ticket para ${orderId}...`);
          
          // Log a archivo
          try {
            const fs = await import('fs/promises');
            const path = await import('path');
            const logFile = path.join(process.cwd(), 'logs', 'webhook.log');
            await fs.appendFile(logFile, `[${new Date().toISOString()}] 🖨️ Generando ticket para ${orderId}\n`, 'utf-8');
          } catch {}
          
          // Obtener el pedido completo para generar el ticket
          const orderSnap = await getDoc(orderRef);
          
          if (orderSnap.exists()) {
            const orderData = orderSnap.data();
            const order = {
              ...orderData,
              order_id: orderId,
            };

            // Importar y ejecutar el servicio de tickets
            const { createKitchenTicket } = await import('@/services/ticketService');
            await createKitchenTicket(order as any);
            
            console.log(`🖨️ Ticket de cocina generado para pedido ${orderId}`);
            
            // Log a archivo
            try {
              const fs = await import('fs/promises');
              const path = await import('path');
              const logFile = path.join(process.cwd(), 'logs', 'webhook.log');
              await fs.appendFile(logFile, `[${new Date().toISOString()}] ✅ Ticket generado exitosamente para ${orderId}\n`, 'utf-8');
            } catch {}
          } else {
            console.error(`❌ No se pudo obtener el pedido ${orderId} para generar ticket`);
            
            // Log a archivo
            try {
              const fs = await import('fs/promises');
              const path = await import('path');
              const logFile = path.join(process.cwd(), 'logs', 'webhook.log');
              await fs.appendFile(logFile, `[${new Date().toISOString()}] ❌ Pedido ${orderId} no existe\n`, 'utf-8');
            } catch {}
          }
        } catch (ticketError) {
          // No fallar el webhook si el ticket falla
          console.error(`⚠️ Error al generar ticket para ${orderId}:`, ticketError);
          console.error('Stack:', (ticketError as Error).stack);
          
          // Log a archivo
          try {
            const fs = await import('fs/promises');
            const path = await import('path');
            const logFile = path.join(process.cwd(), 'logs', 'webhook.log');
            await fs.appendFile(logFile, `[${new Date().toISOString()}] ❌ ERROR: ${(ticketError as Error).message}\n${(ticketError as Error).stack}\n`, 'utf-8');
          } catch {}
        }

      } catch (error) {
        console.error(`❌ Error al actualizar pedido ${orderId}:`, error);
        return NextResponse.json(
          { error: 'Error updating order status' },
          { status: 500 }
        );
      }
    } else {
      console.log(`ℹ️  Evento ${event.type} ignorado (no es checkout.session.completed)`);
    }

    // Responder a Stripe que el webhook fue recibido
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error('❌ Error general en webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
