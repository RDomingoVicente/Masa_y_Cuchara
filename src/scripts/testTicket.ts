/**
 * Script de prueba para generar un ticket de cocina
 * 
 * Uso: tsx src/scripts/testTicket.ts
 */

import { createKitchenTicket } from '../services/ticketService';
import type { Order } from '../types/index';

async function testTicketGeneration() {
  console.log('🧪 Iniciando prueba de generación de ticket...\n');

  // Crear un pedido de prueba
  const testOrder: Order = {
    order_id: 'test_' + Date.now(),
    customer: {
      display_name: 'Juan Pérez',
      phone: '+34600123456',
    },
    items: [
      {
        product_id: 'pizza_margarita',
        name: 'Pizza Margarita',
        qty: 2,
        unit_price_cents: 1200,
        modifiers: [
          { value: 'Mediana' },
          { value: 'Extra queso' },
        ],
      },
      {
        product_id: 'cerveza',
        name: 'Cerveza',
        qty: 1,
        unit_price_cents: 300,
        modifiers: [
          { value: 'Lager' },
        ],
      },
    ],
    pricing: {
      subtotal_cents: 2700,
      tax_cents: 270,
      total_cents: 2970,
    },
    logistics: {
      order_date: '2026-01-12',
      slot_id: '13:15',
      type: 'pickup',
    },
    workflow: {
      status: 'PAID' as any,
      created_at: new Date(),
      updated_at: new Date(),
      ready_at: null,
      delivered_at: null,
    },
    payment: {
      stripe_session_id: 'test_session_123',
      stripe_payment_intent: 'test_pi_123',
    },
  };

  try {
    // Generar el ticket
    const filepath = await createKitchenTicket(testOrder);
    
    console.log('\n✅ Ticket generado exitosamente!');
    console.log(`📁 Ubicación: ${filepath}`);
    console.log('\n📄 Para ver el contenido:');
    console.log(`   cat ${filepath}`);
    
  } catch (error) {
    console.error('\n❌ Error al generar ticket:', error);
    process.exit(1);
  }
}

// Ejecutar prueba
testTicketGeneration();
